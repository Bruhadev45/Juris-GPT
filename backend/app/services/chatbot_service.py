"""
JurisGPT Chatbot Service
Citation-Grounded Legal Research Assistant for Indian Law

Integrates RAG pipeline with FastAPI backend.
Falls back to direct OpenAI when RAG is unavailable.
"""

import sys
import importlib.util
import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.config import settings

# Add data directory to path for RAG imports
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
SAMPLE_FAQS_PATH = DATA_DIR / "datasets" / "samples" / "legal_faqs.json"
FAQ_STOPWORDS = {
    "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
    "the", "and", "for", "with", "from", "into", "your", "their", "them",
    "this", "that", "these", "those", "there", "here", "about", "under",
    "after", "before", "shall", "would", "could", "should", "can", "does",
    "is", "are", "was", "were", "have", "has", "had", "get", "make", "need",
    "india", "indian", "startup", "company", "legal",
}


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    context: Optional[Dict[str, Any]] = None


class CitationModel(BaseModel):
    """Citation from the legal corpus"""
    title: str
    content: str
    doc_type: str
    source: str
    relevance: float
    section: Optional[str] = None
    act: Optional[str] = None
    url: Optional[str] = None


class ChatResponse(BaseModel):
    """
    Citation-grounded chat response model.

    This is the core response structure for JurisGPT legal Q&A.
    """
    success: bool
    answer: str  # Main answer text
    citations: List[CitationModel] = []  # Legal citations supporting the answer
    confidence: str = "medium"  # "high", "medium", "low", "insufficient"
    limitations: str = ""  # Caveats about the answer
    follow_up_questions: List[str] = []  # Suggested follow-ups
    grounded: bool = True  # Whether answer is supported by citations
    error: Optional[str] = None

    # Legacy fields for backwards compatibility
    message: str = ""  # Alias for answer
    sources: List[Dict[str, Any]] = []  # Alias for citations (old format)
    suggestions: List[str] = []  # Alias for follow_up_questions

    # Model provenance
    model_used: Optional[str] = None  # Which model generated the answer

    # Document generation (separate workflow)
    is_document: bool = False
    document_type: Optional[str] = None


class JurisGPTChatbotService:
    """
    Chatbot service for citation-grounded legal assistance.

    Uses RAG (Retrieval-Augmented Generation) for answering legal questions
    with proper citations from the indexed legal corpus.
    Falls back to direct OpenAI or hardcoded responses when RAG unavailable.
    """

    def __init__(self):
        self.rag = None
        self._initialized = False
        self._init_attempted = False
        self._initialization_error = None
        self._openai_client = None
        self._sample_faqs = None

    def _lazy_init(self):
        """Lazy initialization of RAG pipeline"""
        if self._initialized or self._init_attempted:
            return

        self._init_attempted = True

        try:
            # Dynamic import without sys.path pollution
            rag_pipeline_path = DATA_DIR / "rag_pipeline.py"
            spec = importlib.util.spec_from_file_location("rag_pipeline", rag_pipeline_path)
            if spec is None or spec.loader is None:
                raise ImportError(f"RAG pipeline not found at {rag_pipeline_path}")

            rag_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(rag_module)
            JurisGPTRAG = rag_module.JurisGPTRAG
            vector_store_type = os.getenv("JURISGPT_VECTOR_STORE", "lexical")
            llm_type = os.getenv("JURISGPT_LLM_TYPE", "local_legal_llama")
            hybrid_search = os.getenv("RAG_HYBRID_SEARCH", "false").lower() == "true"
            use_reranker = os.getenv("RAG_USE_RERANKER", "false").lower() == "true"
            self.rag = JurisGPTRAG(
                vector_store_type=vector_store_type,
                llm_type=llm_type,
                hybrid_search=hybrid_search,
                use_reranker=use_reranker,
            )
            self._initialized = True
            print("JurisGPT RAG Pipeline initialized")
        except ImportError as e:
            self._initialization_error = f"RAG dependencies not installed: {e}"
            print(f"RAG not available: {self._initialization_error}")
        except FileNotFoundError as e:
            self._initialization_error = f"Vector store not found: {e}"
            print(f"RAG not available: {self._initialization_error}")
        except Exception as e:
            self._initialization_error = f"RAG initialization failed: {e}"
            print(f"RAG not available: {self._initialization_error}")

    def _get_openai_client(self):
        """Get or create OpenAI client."""
        if self._openai_client is None:
            try:
                from openai import OpenAI
                api_key = settings.openai_api_key
                if api_key and not api_key.startswith("sk-placeholder"):
                    self._openai_client = OpenAI(api_key=api_key)
                    print("OpenAI client initialized successfully")
                else:
                    print("OpenAI API key not configured or is placeholder")
            except Exception as e:
                print(f"OpenAI client initialization failed: {e}")
                self._openai_client = None
        return self._openai_client

    def _load_sample_faqs(self) -> List[Dict[str, Any]]:
        """Load local sample FAQs for offline fallback responses."""
        if self._sample_faqs is not None:
            return self._sample_faqs

        try:
            with SAMPLE_FAQS_PATH.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                self._sample_faqs = data if isinstance(data, list) else []
        except Exception:
            self._sample_faqs = []

        return self._sample_faqs

    def _tokenize_query(self, text: str) -> List[str]:
        """Tokenize text for lightweight FAQ matching."""
        normalized = "".join(char.lower() if char.isalnum() else " " for char in text)
        return [
            token for token in normalized.split()
            if len(token) > 2 and token not in FAQ_STOPWORDS
        ]

    def _get_sample_faq_response(self, query: str) -> Optional[ChatResponse]:
        """Return the best local FAQ answer for offline use."""
        faqs = self._load_sample_faqs()
        if not faqs:
            return None

        query_tokens = set(self._tokenize_query(query))
        best_match = None
        best_score = 0

        for faq in faqs:
            question = faq.get("question", "")
            question_tokens = set(self._tokenize_query(question))
            overlap = len(query_tokens & question_tokens)
            if overlap > best_score:
                best_score = overlap
                best_match = faq

        if not best_match or best_score < 3:
            return None

        related_laws = best_match.get("related_laws", [])
        suggestions = self._generate_suggestions(query, [])
        answer = best_match.get("answer", "I found a related sample legal answer.")

        if related_laws:
            answer = (
                f"{answer}\n\n"
                f"**Related laws:** {', '.join(related_laws[:3])}\n\n"
                "> *This response comes from local sample legal data, not live corpus retrieval.*"
            )
        else:
            answer = (
                f"{answer}\n\n"
                "> *This response comes from local sample legal data, not live corpus retrieval.*"
            )

        return ChatResponse(
            success=True,
            answer=answer,
            citations=[],
            confidence="low",
            limitations="The live RAG/OpenAI path is unavailable, so this answer was served from local sample legal FAQs. Verify against current primary sources.",
            follow_up_questions=suggestions,
            grounded=False,
            message=answer,
            sources=[],
            suggestions=suggestions,
        )

    def _is_greeting(self, message: str) -> bool:
        """Check if the message is a greeting or casual conversation."""
        greetings = [
            "hi", "hello", "hey", "hii", "hiii", "yo", "sup",
            "good morning", "good afternoon", "good evening", "good night",
            "howdy", "greetings", "namaste", "namaskar",
            "what's up", "whats up", "wassup", "how are you",
            "how r u", "how do you do", "nice to meet you"
        ]
        message_lower = message.lower().strip()
        # Check exact match or if message starts with greeting
        return message_lower in greetings or any(message_lower.startswith(g) for g in greetings)

    def _get_greeting_response(self) -> ChatResponse:
        """Return a friendly greeting response."""
        import random
        greetings = [
            "Hello! I'm JurisGPT, your AI legal assistant for Indian startup and corporate law. How can I help you today?",
            "Hi there! I'm JurisGPT, ready to assist you with legal questions about Indian business law, compliance, and more. What would you like to know?",
            "Hey! Welcome to JurisGPT. I can help you with company formation, legal agreements, compliance requirements, and other legal matters. What's on your mind?",
        ]
        answer = random.choice(greetings)
        suggestions = [
            "How do I incorporate a company in India?",
            "What is founder equity vesting?",
            "What are the compliance requirements for startups?",
            "Draft an NDA for my business",
        ]
        return ChatResponse(
            success=True,
            answer=answer,
            citations=[],
            confidence="high",
            limitations="",
            follow_up_questions=suggestions,
            grounded=False,
            model_used="greeting",
            message=answer,
            sources=[],
            suggestions=suggestions,
        )

    def get_legal_response(self, request: ChatRequest) -> ChatResponse:
        """
        Get citation-grounded legal response.

        Priority: Greetings → RAG+LocalLLM (primary) → RAG+OpenAI → OpenAI-only → Fallback
        """
        # Handle greetings first
        if self._is_greeting(request.message):
            return self._get_greeting_response()

        # Document drafting is a generation workflow, not a RAG Q&A workflow.
        # Detect it before RAG so an initialized retriever does not swallow
        # drafting requests.
        if self._is_document_generation_request(request.message):
            return self._generate_document_response(request)

        # 1. Primary: RAG pipeline (uses local LLM or OpenAI internally)
        self._lazy_init()
        if self._initialized and self.rag:
            return self._get_rag_response(request)

        # 2. Fallback: Direct OpenAI (no RAG citations)
        client = self._get_openai_client()
        if client and settings.openai_api_key and not settings.openai_api_key.startswith("sk-placeholder"):
            return self._get_openai_response(request)

        # 3. Final fallback to hardcoded responses
        return self._get_fallback_response(request.message)

    def _get_rag_response(self, request: ChatRequest) -> ChatResponse:
        """Get response using RAG pipeline with structured citations."""
        try:
            # Build enhanced query with context
            enhanced_query = self._build_enhanced_query(request)

            # Get RAG response
            rag_response = self.rag.query(enhanced_query)

            # Convert citations to response format
            citations = [
                CitationModel(
                    title=c.title,
                    content=c.content[:300] + "..." if len(c.content) > 300 else c.content,
                    doc_type=c.doc_type,
                    source=c.source,
                    relevance=c.relevance,
                    section=c.section,
                    act=c.act,
                    url=c.url
                )
                for c in rag_response.citations[:5]
            ]

            # Legacy sources format
            sources = [
                {
                    "title": c.title,
                    "content": c.content,
                    "doc_type": c.doc_type,
                    "source": c.source,
                    "relevance": f"{c.relevance:.0%}"
                }
                for c in citations
            ]

            return ChatResponse(
                success=True,
                answer=rag_response.answer,
                citations=citations,
                confidence=rag_response.confidence,
                limitations=rag_response.limitations,
                follow_up_questions=rag_response.follow_up_questions,
                grounded=rag_response.grounded,
                model_used=getattr(rag_response, "model_used", None),
                # Legacy fields
                message=rag_response.answer,
                sources=sources,
                suggestions=rag_response.follow_up_questions
            )
        except Exception as e:
            return ChatResponse(
                success=False,
                answer="I encountered an error processing your request.",
                message="I encountered an error processing your request.",
                confidence="insufficient",
                limitations="An error occurred during processing.",
                grounded=False,
                error=str(e)
            )

    def _build_enhanced_query(self, request: ChatRequest) -> str:
        """Build query with context information."""
        context_info = ""
        if request.context:
            if request.context.get("company_name"):
                context_info += f"\nCompany: {request.context['company_name']}"
            if request.context.get("founders"):
                context_info += f"\nFounders: {len(request.context['founders'])} founders"
            if request.context.get("matter_type"):
                context_info += f"\nDocument Type: {request.context['matter_type']}"

        enhanced_query = request.message
        if context_info:
            enhanced_query = f"{request.message}\n\nContext:{context_info}"

        return enhanced_query

    def _is_document_generation_request(self, message: str) -> bool:
        """Detect if the user is asking to generate/draft a legal document."""
        message_lower = message.lower()

        # Document generation trigger words
        generation_triggers = [
            "draft", "generate", "create", "write", "prepare", "make",
            "template", "sample", "format"
        ]

        # Document types
        document_types = [
            "nda", "non-disclosure", "confidentiality agreement",
            "contract", "agreement", "mou", "memorandum",
            "employment", "offer letter", "appointment letter",
            "founder agreement", "shareholders agreement",
            "term sheet", "investment agreement",
            "service agreement", "consulting agreement",
            "partnership deed", "lease agreement", "rental agreement",
            "power of attorney", "affidavit", "undertaking",
            "notice", "legal notice", "demand notice",
            "will", "trademark", "ip assignment",
            "privacy policy", "terms of service", "terms and conditions",
            "gdpr", "dpdpa", "data processing"
        ]

        has_trigger = any(trigger in message_lower for trigger in generation_triggers)
        has_doc_type = any(doc_type in message_lower for doc_type in document_types)

        return has_trigger and has_doc_type

    def _detect_document_type(self, message: str) -> str:
        """Detect the type of document being requested."""
        message_lower = message.lower()

        document_type_map = {
            "nda": ["nda", "non-disclosure", "confidentiality agreement"],
            "employment_letter": ["employment", "offer letter", "appointment letter", "job offer"],
            "service_agreement": ["service agreement", "service contract"],
            "consulting_agreement": ["consulting agreement", "consultant contract"],
            "founder_agreement": ["founder agreement", "co-founder agreement", "founders agreement"],
            "shareholders_agreement": ["shareholders agreement", "shareholder agreement"],
            "mou": ["mou", "memorandum of understanding"],
            "partnership_deed": ["partnership deed", "partnership agreement"],
            "legal_notice": ["legal notice", "demand notice", "cease and desist"],
            "power_of_attorney": ["power of attorney", "poa"],
            "privacy_policy": ["privacy policy", "data privacy"],
            "terms_of_service": ["terms of service", "terms and conditions", "tos"],
            "ip_assignment": ["ip assignment", "intellectual property assignment"],
            "lease_agreement": ["lease agreement", "rental agreement", "rent agreement"],
            "investment_agreement": ["investment agreement", "term sheet", "safe", "convertible note"],
            "affidavit": ["affidavit", "sworn statement"],
        }

        for doc_type, keywords in document_type_map.items():
            if any(keyword in message_lower for keyword in keywords):
                return doc_type

        return "legal_document"

    def _get_openai_response(self, request: ChatRequest) -> ChatResponse:
        """
        Get response using direct OpenAI GPT-4o.

        Note: This path doesn't have RAG citations, so confidence is downgraded.
        Document generation requests are handled separately with a specialized prompt.
        """
        client = self._get_openai_client()
        if not client:
            return self._get_fallback_response(request.message)

        is_document_request = self._is_document_generation_request(request.message)

        if is_document_request:
            return self._generate_document_response(request)

        # Legal QA system prompt (citation-focused when possible)
        system_prompt = """You are JurisGPT, an AI legal research assistant specializing in Indian law for startups and corporate matters.

IMPORTANT: You are currently operating WITHOUT access to the indexed legal corpus. Your answers are based on general legal knowledge, not retrieved citations.

YOUR ROLE:
- Answer legal research questions about Indian law
- Focus on Companies Act, Contract Act, labor laws, and startup regulations
- Be precise about legal terminology, sections, and acts
- Highlight when professional legal advice is needed

RESPONSE GUIDELINES:
1. Provide accurate information based on Indian law
2. Mention specific acts, sections, and legal provisions when relevant
3. Use clear formatting with bullet points
4. Note that this answer lacks RAG citations
5. Recommend consulting primary sources for important decisions

DO NOT:
- Draft legal documents in this mode (separate workflow)
- Provide definitive advice on complex matters
- Guarantee completeness without corpus access

Format responses in markdown for readability."""

        try:
            # Build conversation messages
            messages = [{"role": "system", "content": system_prompt}]

            # Add context if provided
            if request.context:
                context_parts = []
                if request.context.get("company_name"):
                    context_parts.append(f"Company: {request.context['company_name']}")
                if request.context.get("founders"):
                    context_parts.append(f"Founders: {len(request.context['founders'])} founders")
                if context_parts:
                    messages.append({
                        "role": "system",
                        "content": f"User context: {', '.join(context_parts)}"
                    })

            # Add conversation history if provided
            if request.conversation_history:
                for msg in request.conversation_history[-6:]:  # Last 6 messages
                    messages.append({"role": msg.role, "content": msg.content})

            messages.append({"role": "user", "content": request.message})

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
            )

            answer = response.choices[0].message.content
            suggestions = self._generate_smart_suggestions(request.message, answer)

            # Confidence is "low" without RAG citations
            return ChatResponse(
                success=True,
                answer=answer,
                citations=[],
                confidence="low",  # Downgraded since no RAG
                limitations="This response is based on general legal knowledge without corpus citations. Please verify with primary legal sources.",
                follow_up_questions=suggestions,
                grounded=False,  # Not grounded without citations
                model_used="openai-gpt4o",
                # Legacy fields
                message=answer,
                sources=[],
                suggestions=suggestions,
            )

        except Exception as e:
            error_msg = str(e)
            lower_error = error_msg.lower()
            if (
                "api_key" in lower_error
                or "authentication" in lower_error
                or "connection" in lower_error
                or "timeout" in lower_error
                or "dns" in lower_error
                or "nodename" in lower_error
            ):
                fallback = self._get_fallback_response(request.message)
                fallback.error = error_msg
                return fallback

            fallback = self._get_fallback_response(request.message)
            fallback.error = error_msg
            if "sample legal faqs" in fallback.limitations.lower():
                fallback.limitations = (
                    "The live OpenAI path failed, so this answer was served from local sample legal FAQs. "
                    "Verify against current primary sources."
                )
            return fallback

    def _generate_document_response(self, request: ChatRequest) -> ChatResponse:
        """
        Agentic document generation using Claude via PageGrid.

        This is a SEPARATE workflow from legal Q&A.
        The agent:
        1. Detects document type
        2. Checks if required information is provided
        3. Asks for missing information OR generates the document
        4. Returns professional legal document with explanations
        """
        doc_type = self._detect_document_type(request.message)

        # Check if we need to gather more information (agentic behavior)
        missing_info = self._check_missing_document_info(request.message, doc_type)
        if missing_info:
            return self._ask_for_document_info(doc_type, missing_info)

        # Try to use RAG pipeline's LLM (Claude via PageGrid)
        self._lazy_init()
        if self._initialized and self.rag and self.rag.llm is not None:
            return self._generate_document_with_claude(request, doc_type)

        # Fallback to OpenAI if PageGrid not available
        client = self._get_openai_client()
        if client:
            return self._generate_document_with_openai(request, doc_type)

        return self._get_fallback_response(request.message)

    def _check_missing_document_info(self, message: str, doc_type: str) -> List[str]:
        """Check what information is missing for document generation."""
        message_lower = message.lower()
        missing = []

        # Document-specific required information
        required_info = {
            "nda": ["parties", "confidential_info", "duration"],
            "employment_letter": ["employee_name", "designation", "salary", "start_date"],
            "service_agreement": ["service_provider", "client", "services", "payment"],
            "consulting_agreement": ["consultant", "client", "scope", "fees"],
            "founder_agreement": ["founders", "equity_split", "vesting"],
            "shareholders_agreement": ["shareholders", "company", "shares"],
            "mou": ["parties", "purpose", "terms"],
            "partnership_deed": ["partners", "business", "profit_sharing"],
            "lease_agreement": ["landlord", "tenant", "property", "rent", "duration"],
            "legal_notice": ["sender", "recipient", "subject", "demands"],
            "privacy_policy": ["company", "data_collected", "purpose"],
            "terms_of_service": ["company", "services", "user_obligations"],
        }

        # Check for party names (most documents need this)
        has_party_info = any(indicator in message_lower for indicator in [
            "between", "party", "name:", "company:", "mr.", "ms.", "m/s",
            "pvt ltd", "private limited", "llp", "partnership"
        ])

        # For simple drafts, don't ask for info - generate with placeholders
        simple_request = any(word in message_lower for word in [
            "simple", "basic", "template", "sample", "standard", "generic"
        ])

        if simple_request:
            return []  # Generate with placeholders

        # Only ask for critical missing info for complex documents
        if doc_type in ["founder_agreement", "shareholders_agreement", "investment_agreement"]:
            if not has_party_info and "founder" not in message_lower:
                missing.append("party_names")

        return missing

    def _ask_for_document_info(self, doc_type: str, missing_info: List[str]) -> ChatResponse:
        """Ask user for missing information before generating document."""
        doc_type_names = {
            "nda": "Non-Disclosure Agreement",
            "employment_letter": "Employment Offer Letter",
            "service_agreement": "Service Agreement",
            "consulting_agreement": "Consulting Agreement",
            "founder_agreement": "Founder Agreement",
            "shareholders_agreement": "Shareholders Agreement",
            "mou": "Memorandum of Understanding",
            "lease_agreement": "Lease Agreement",
            "legal_notice": "Legal Notice",
        }

        doc_name = doc_type_names.get(doc_type, "Legal Document")

        questions_map = {
            "party_names": "the names of the parties involved",
            "parties": "the names of both parties",
            "founders": "the names of all founders and their equity percentages",
            "equity_split": "how equity should be split among founders",
            "duration": "the duration/term of the agreement",
            "salary": "the salary/compensation details",
            "services": "the scope of services to be provided",
        }

        info_needed = [questions_map.get(info, info) for info in missing_info]

        answer = f"""I'll help you create a **{doc_name}**. To generate a customized document, please provide:

{chr(10).join(f"• {info.title()}" for info in info_needed)}

**Or**, if you'd like a standard template with placeholders, just say:
> "Generate a standard {doc_name.lower()} template"

I'll then create a complete, legally-compliant document for Indian law."""

        return ChatResponse(
            success=True,
            answer=answer,
            citations=[],
            confidence="high",
            limitations="",
            follow_up_questions=[
                f"Generate a standard {doc_name.lower()} template",
                "What clauses should I include?",
                "What are the legal requirements for this document?"
            ],
            grounded=False,
            model_used="agent",
            message=answer,
            sources=[],
            suggestions=[],
            is_document=False,
            document_type=doc_type,
        )

    def _generate_document_with_claude(self, request: ChatRequest, doc_type: str) -> ChatResponse:
        """Generate document using Claude via PageGrid."""
        system_prompt = """You are JurisGPT, an expert legal document drafting assistant for Indian law.

DOCUMENT GENERATION RULES:
1. Generate COMPLETE, professional legal documents compliant with Indian law
2. Use proper legal formatting with numbered clauses (1., 1.1, 1.2, etc.)
3. Include ALL standard clauses for the document type
4. Use placeholders like [PARTY A NAME], [DATE], [ADDRESS] for unspecified info
5. Follow Indian Contract Act, 1872 and relevant statutes
6. Include recitals (WHEREAS clauses), definitions, and boilerplate
7. Add jurisdiction, dispute resolution, and governing law clauses
8. Reference stamp duty and registration requirements at the end

DOCUMENT STRUCTURE:
1. **Title** in ALL CAPS
2. **Parties** section with full legal names and addresses
3. **Recitals** (WHEREAS clauses explaining background)
4. **Definitions** section for key terms
5. **Main clauses** with clear numbering
6. **Boilerplate clauses** (confidentiality, notices, amendments, etc.)
7. **Execution** section with signature blocks
8. **Schedule/Annexures** if needed

FORMAT:
- Use markdown formatting
- **Bold** for headings
- Numbered lists for clauses
- Clear paragraph separation

After the document, provide:
1. Key clauses explanation
2. Relevant Indian laws
3. Stamp duty requirements (state-wise if applicable)
4. Important considerations"""

        try:
            from langchain_core.prompts import ChatPromptTemplate

            # Build context
            context_info = ""
            if request.context:
                if request.context.get("company_name"):
                    context_info += f"\nCompany: {request.context['company_name']}"
                if request.context.get("founders"):
                    context_info += f"\nFounders: {request.context['founders']}"

            full_prompt = request.message
            if context_info:
                full_prompt = f"{request.message}\n\nContext:{context_info}"

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "{query}")
            ])

            chain = prompt | self.rag.llm
            response = chain.invoke({"query": full_prompt})
            answer = response.content

            return ChatResponse(
                success=True,
                answer=answer,
                citations=[],
                confidence="high",
                limitations="This document is AI-generated based on Indian law. Please have it reviewed by a qualified legal professional before execution.",
                follow_up_questions=[
                    "Would you like me to modify any clauses?",
                    "Should I add any specific provisions?",
                    "Do you need this document in a different format?",
                    "Should I explain any clause in detail?"
                ],
                grounded=False,
                model_used="anthropic",
                message=answer,
                sources=[],
                suggestions=[],
                is_document=True,
                document_type=doc_type,
            )

        except Exception as e:
            # Fallback to OpenAI
            client = self._get_openai_client()
            if client:
                return self._generate_document_with_openai(request, doc_type)

            return ChatResponse(
                success=False,
                answer=f"I encountered an error generating the document: {str(e)}",
                message="Document generation failed.",
                confidence="insufficient",
                limitations="Document generation failed.",
                grounded=False,
                error=str(e),
            )

    def _generate_document_with_openai(self, request: ChatRequest, doc_type: str) -> ChatResponse:
        """Fallback document generation using OpenAI."""
        client = self._get_openai_client()
        if not client:
            return self._get_fallback_response(request.message)

        system_prompt = """You are JurisGPT, a legal document generation assistant for Indian law.

DOCUMENT GENERATION GUIDELINES:
1. Generate complete, professional legal documents compliant with Indian law
2. Use proper legal formatting with numbered clauses and sections
3. Include all standard clauses appropriate for the document type
4. Use placeholders like [PARTY A NAME], [DATE], [ADDRESS] for user-specific info
5. Follow Indian legal standards, conventions, and stamp duty requirements
6. Include appropriate recitals, definitions, and boilerplate clauses
7. Reference relevant Indian laws and acts in the document

After the document, briefly explain key clauses, relevant law, and stamp duty requirements."""

        try:
            messages = [{"role": "system", "content": system_prompt}]

            if request.context:
                context_parts = []
                if request.context.get("company_name"):
                    context_parts.append(f"Company: {request.context['company_name']}")
                if request.context.get("founders"):
                    context_parts.append(f"Founders: {len(request.context['founders'])} founders")
                if context_parts:
                    messages.append({
                        "role": "system",
                        "content": f"Context: {', '.join(context_parts)}"
                    })

            messages.append({"role": "user", "content": request.message})

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.3,
                max_tokens=4000,
            )

            answer = response.choices[0].message.content

            return ChatResponse(
                success=True,
                answer=answer,
                citations=[],
                confidence="medium",
                limitations="This document is AI-generated and should be reviewed by a qualified legal professional before use.",
                follow_up_questions=[
                    "Would you like me to modify any clauses?",
                    "Do you need a different type of document?",
                    "Should I explain any specific clause in detail?"
                ],
                grounded=False,
                model_used="openai-gpt4o",
                message=answer,
                sources=[],
                suggestions=[],
                is_document=True,
                document_type=doc_type,
            )

        except Exception as e:
            return ChatResponse(
                success=False,
                answer="I encountered an error generating the document.",
                message="I encountered an error generating the document.",
                confidence="insufficient",
                limitations="Document generation failed.",
                grounded=False,
                error=str(e),
            )

    def _generate_smart_suggestions(self, query: str, answer: str) -> List[str]:
        """Generate context-aware follow-up suggestions based on the conversation."""
        client = self._get_openai_client()
        if not client:
            return self._generate_suggestions(query, [])

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "Generate exactly 3 follow-up questions a user might ask after receiving this legal advice. Return only a JSON array of 3 strings. Questions should be specific and actionable.",
                    },
                    {
                        "role": "user",
                        "content": f"User asked: {query}\n\nAssistant answered: {answer[:500]}",
                    },
                ],
                temperature=0.5,
                max_tokens=300,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            suggestions = result.get("questions", result.get("suggestions", []))
            if isinstance(suggestions, list) and len(suggestions) > 0:
                return suggestions[:3]
        except Exception:
            pass

        return self._generate_suggestions(query, [])

    def _get_fallback_response(self, query: str) -> ChatResponse:
        """Fallback response when neither RAG nor OpenAI is available."""
        query_lower = query.lower()

        fallback_responses = {
            "vesting": {
                "answer": """**Founder Equity Vesting** typically follows a 4-year schedule with 1-year cliff:

- **Vesting Period:** 48 months (4 years)
- **Cliff Period:** 12 months (1 year)
- **At Cliff:** 25% vests immediately
- **After Cliff:** Remaining 75% vests monthly over 36 months

This protects the company if a founder leaves early. The cliff ensures minimum commitment before any equity vests.

> *Note: Live AI retrieval is unavailable in the current environment. Verify against current primary legal sources.*""",
                "suggestions": ["What is reverse vesting?", "How does accelerated vesting work?", "What happens to unvested shares?"],
            },
            "incorporate": {
                "answer": """**Company Incorporation in India** under Companies Act, 2013:

**Steps:**
1. Obtain Digital Signature Certificate (DSC)
2. Apply for Director Identification Number (DIN)
3. Reserve company name on MCA portal
4. File SPICe+ form with MoA and AoA
5. Receive Certificate of Incorporation

**Key Requirements:**
- Minimum 2 directors for Private Limited
- Minimum 1 shareholder
- Registered office address in India

> *Note: Live AI retrieval is unavailable in the current environment. Verify against current primary legal sources.*""",
                "suggestions": ["What documents are needed?", "What is authorized capital?", "Pvt Ltd vs LLP?"],
            },
            "non-compete": {
                "answer": """**Non-Compete Clauses in India:**

Non-compete agreements during employment are generally enforceable. However, **post-employment non-compete** clauses have limited enforceability under **Section 27 of the Indian Contract Act, 1872**, which voids agreements in restraint of trade.

**Tip:** Focus on non-solicitation and confidentiality clauses which are more enforceable.

> *Note: Live AI retrieval is unavailable in the current environment. Verify against current primary legal sources.*""",
                "suggestions": ["Are non-solicitation clauses enforceable?", "What about confidentiality clauses?", "Garden leave provisions?"],
            },
            "founder agreement": {
                "answer": """**Key Clauses in a Founder Agreement:**

1. **Equity Split** — Clear percentage allocation
2. **Vesting Schedule** — 4-year with 1-year cliff
3. **Roles & Responsibilities** — Define each founder's role
4. **IP Assignment** — All IP belongs to the company
5. **Non-Compete** — During employment
6. **Decision Making** — Voting rights, deadlocks
7. **Exit Provisions** — Good leaver / bad leaver
8. **Dispute Resolution** — Arbitration preferred

> *Note: Live AI retrieval is unavailable in the current environment. Verify against current primary legal sources.*""",
                "suggestions": ["How should founders split equity?", "What is a shotgun clause?", "How to handle founder disputes?"],
            },
        }

        for keyword, response in fallback_responses.items():
            if keyword in query_lower:
                return ChatResponse(
                    success=True,
                    answer=response["answer"],
                    citations=[],
                    confidence="low",
                    limitations="This is a pre-configured response. Set up the RAG pipeline for citation-grounded answers.",
                    follow_up_questions=response["suggestions"],
                    grounded=False,
                    model_used="hardcoded-fallback",
                    # Legacy fields
                    message=response["answer"],
                    sources=[],
                    suggestions=response["suggestions"],
                )

        sample_faq_response = self._get_sample_faq_response(query)
        if sample_faq_response:
            return sample_faq_response

        # Generic fallback
        return ChatResponse(
            success=True,
            answer=f"""I understand you're asking about: **{query}**

I'm JurisGPT, your AI legal research assistant for Indian startup law. I can help with:

- **Company Formation** — Incorporation, compliance, MCA filings
- **Founder Agreements** — Equity split, vesting, roles
- **Legal Clauses** — Non-compete, IP assignment, confidentiality
- **Indian Law** — Companies Act, Contract Act, relevant case law
- **Compliance** — GST, TDS, ROC filings, PF/ESI

> *For citation-grounded responses, restore the RAG/OpenAI runtime and verify against current primary legal sources.*""",
            citations=[],
            confidence="insufficient",
            limitations="RAG pipeline not available. Run setup scripts for full functionality.",
            follow_up_questions=[
                "How do I incorporate a company in India?",
                "What is a typical founder vesting schedule?",
                "What should be in a founder agreement?",
            ],
            grounded=False,
            # Legacy fields
            message=f"I understand you're asking about: **{query}**...",
            sources=[],
            suggestions=[
                "How do I incorporate a company in India?",
                "What is a typical founder vesting schedule?",
                "What should be in a founder agreement?",
            ],
            error=self._initialization_error,
        )

    def _generate_suggestions(self, query: str, sources=None) -> List[str]:
        """Generate follow-up question suggestions based on keywords."""
        query_lower = query.lower()

        suggestions_map = {
            "vesting": [
                "What happens to unvested shares if a founder leaves?",
                "Can vesting be accelerated?",
                "What is single vs double trigger acceleration?",
            ],
            "incorporat": [
                "What is the difference between Private Limited and LLP?",
                "How much does incorporation cost?",
                "What are the compliance requirements after incorporation?",
            ],
            "founder agreement": [
                "What clauses should be in a founder agreement?",
                "How to handle founder disputes?",
                "What is a shotgun clause?",
            ],
            "equity": [
                "How should founders split equity?",
                "What is ESOP and how does it work?",
                "How does dilution work in funding rounds?",
            ],
            "non-compete": [
                "Are non-compete clauses enforceable in India?",
                "What is a non-solicitation clause?",
                "How long can a non-compete last?",
            ],
            "gst": [
                "What are GST return filing deadlines?",
                "What is the GST registration threshold?",
                "How does input tax credit work?",
            ],
            "compliance": [
                "What are annual ROC filing requirements?",
                "When are board meetings required?",
                "What are PF/ESI compliance deadlines?",
            ],
            "contract": [
                "What makes a contract legally valid in India?",
                "What are essential clauses in a service agreement?",
                "How to handle contract disputes?",
            ],
        }

        for keyword, suggestions in suggestions_map.items():
            if keyword in query_lower:
                return suggestions[:3]

        return [
            "What are the key clauses in a founder agreement?",
            "How does vesting work for founders?",
            "What is the process to incorporate a company in India?",
        ]

    def get_document_assistance(self, matter_type: str, context: Dict[str, Any]) -> ChatResponse:
        """Get assistance for document generation."""
        self._lazy_init()

        if matter_type == "founder_agreement":
            founders = context.get("founders", [])
            company = context.get("company", {})

            prompt = f"""I need help generating a Founder Agreement for:
- Company: {company.get('name', 'Unknown')}
- State: {company.get('state', 'Unknown')}
- Number of Founders: {len(founders)}

Please provide guidance on key clauses, important considerations, and common pitfalls."""

            return self.get_legal_response(ChatRequest(message=prompt, context=context))

        return ChatResponse(
            success=True,
            answer=f"Document assistance for {matter_type} is available.",
            citations=[],
            confidence="medium",
            limitations="Document generation is a separate workflow from legal Q&A.",
            follow_up_questions=["What clauses should I include?", "What are common mistakes to avoid?"],
            grounded=False,
            # Legacy fields
            message=f"Document assistance for {matter_type} is available.",
            sources=[],
            suggestions=["What clauses should I include?", "What are common mistakes to avoid?"],
        )


# Singleton instance
chatbot_service = JurisGPTChatbotService()
