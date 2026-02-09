"""
NyayaSetu Chatbot Service
Integrates RAG pipeline with FastAPI backend.
Falls back to direct OpenAI when RAG is unavailable.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.config import settings

# Add data directory to path for RAG imports
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
sys.path.insert(0, str(DATA_DIR))


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Chat response model"""
    success: bool
    message: str
    sources: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    error: Optional[str] = None


class NyayaSetuChatbotService:
    """Chatbot service for legal assistance — uses RAG or direct OpenAI."""

    def __init__(self):
        self.rag = None
        self._initialized = False
        self._initialization_error = None
        self._openai_client = None

    def _lazy_init(self):
        """Lazy initialization of RAG pipeline"""
        if self._initialized:
            return

        try:
            from rag_pipeline import NyayaSetuRAG
            self.rag = NyayaSetuRAG()
            self._initialized = True
            print("NyayaSetu RAG Pipeline initialized")
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
                self._openai_client = OpenAI(api_key=settings.openai_api_key)
            except Exception:
                self._openai_client = None
        return self._openai_client

    def get_legal_response(self, request: ChatRequest) -> ChatResponse:
        """Get legal assistance response — tries RAG first, then OpenAI, then fallback."""
        self._lazy_init()

        # Try RAG first
        if self._initialized and self.rag:
            return self._get_rag_response(request)

        # Try direct OpenAI
        client = self._get_openai_client()
        if client and settings.openai_api_key and not settings.openai_api_key.startswith("sk-placeholder"):
            return self._get_openai_response(request)

        # Fallback to hardcoded responses
        return self._get_fallback_response(request.message)

    def _get_rag_response(self, request: ChatRequest) -> ChatResponse:
        """Get response using RAG pipeline."""
        try:
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

            rag_response = self.rag.query(enhanced_query)

            sources = [
                {
                    "title": s.title,
                    "content": s.content[:300] + "..." if len(s.content) > 300 else s.content,
                    "doc_type": s.doc_type,
                    "source": s.source,
                    "relevance": f"{s.score:.0%}"
                }
                for s in rag_response.sources[:5]
            ]

            suggestions = self._generate_suggestions(request.message, rag_response.sources)

            return ChatResponse(
                success=True,
                message=rag_response.answer,
                sources=sources,
                suggestions=suggestions
            )
        except Exception as e:
            return ChatResponse(
                success=False,
                message="I encountered an error processing your request.",
                error=str(e)
            )

    def _get_openai_response(self, request: ChatRequest) -> ChatResponse:
        """Get response using direct OpenAI GPT-4o."""
        client = self._get_openai_client()
        if not client:
            return self._get_fallback_response(request.message)

        system_prompt = """You are NyayaSetu, an expert AI legal assistant specializing in Indian law. 
You help Indian startups, MSMEs, and entrepreneurs with legal questions.

Your expertise covers:
- Indian Companies Act, 2013
- Indian Contract Act, 1872
- Indian Penal Code (IPC / BNS)
- Code of Civil Procedure (CPC)
- Code of Criminal Procedure (CrPC / BNSS)
- Arbitration and Conciliation Act, 1996
- Information Technology Act, 2000
- Digital Personal Data Protection Act (DPDPA), 2023
- Labour laws, GST, TDS, and compliance requirements
- Startup India policies and DPIIT registration
- Founder agreements, NDAs, employment contracts

Guidelines:
1. Always cite relevant Indian laws and sections when applicable
2. Provide practical, actionable advice
3. Mention important caveats and when to consult a lawyer
4. Use clear formatting with bullet points and headers
5. Be concise but comprehensive
6. If you're unsure about something, say so clearly
7. Always note that your advice is informational and not a substitute for professional legal counsel

Format your responses in markdown for readability."""

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

            return ChatResponse(
                success=True,
                message=answer,
                sources=[],
                suggestions=suggestions,
            )

        except Exception as e:
            error_msg = str(e)
            if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                return self._get_fallback_response(request.message)
            return ChatResponse(
                success=False,
                message="I encountered an error. Please try again.",
                error=error_msg,
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
                "message": """**Founder Equity Vesting** typically follows a 4-year schedule with 1-year cliff:

- **Vesting Period:** 48 months (4 years)
- **Cliff Period:** 12 months (1 year)
- **At Cliff:** 25% vests immediately
- **After Cliff:** Remaining 75% vests monthly over 36 months

This protects the company if a founder leaves early. The cliff ensures minimum commitment before any equity vests.

> *Note: Configure your OpenAI API key for comprehensive AI-powered legal responses.*""",
                "suggestions": ["What is reverse vesting?", "How does accelerated vesting work?", "What happens to unvested shares?"],
            },
            "incorporate": {
                "message": """**Company Incorporation in India** under Companies Act, 2013:

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

> *Note: Configure your OpenAI API key for comprehensive AI-powered legal responses.*""",
                "suggestions": ["What documents are needed?", "What is authorized capital?", "Pvt Ltd vs LLP?"],
            },
            "non-compete": {
                "message": """**Non-Compete Clauses in India:**

Non-compete agreements during employment are generally enforceable. However, **post-employment non-compete** clauses have limited enforceability under **Section 27 of the Indian Contract Act, 1872**, which voids agreements in restraint of trade.

**Tip:** Focus on non-solicitation and confidentiality clauses which are more enforceable.

> *Note: Configure your OpenAI API key for comprehensive AI-powered legal responses.*""",
                "suggestions": ["Are non-solicitation clauses enforceable?", "What about confidentiality clauses?", "Garden leave provisions?"],
            },
            "founder agreement": {
                "message": """**Key Clauses in a Founder Agreement:**

1. **Equity Split** — Clear percentage allocation
2. **Vesting Schedule** — 4-year with 1-year cliff
3. **Roles & Responsibilities** — Define each founder's role
4. **IP Assignment** — All IP belongs to the company
5. **Non-Compete** — During employment
6. **Decision Making** — Voting rights, deadlocks
7. **Exit Provisions** — Good leaver / bad leaver
8. **Dispute Resolution** — Arbitration preferred

> *Note: Configure your OpenAI API key for comprehensive AI-powered legal responses.*""",
                "suggestions": ["How should founders split equity?", "What is a shotgun clause?", "How to handle founder disputes?"],
            },
        }

        for keyword, response in fallback_responses.items():
            if keyword in query_lower:
                return ChatResponse(
                    success=True,
                    message=response["message"],
                    suggestions=response["suggestions"],
                    sources=[],
                )

        return ChatResponse(
            success=True,
            message=f"""I understand you're asking about: **{query}**

I'm NyayaSetu, your AI legal assistant for Indian startup law. I can help with:

- **Company Formation** — Incorporation, compliance, MCA filings
- **Founder Agreements** — Equity split, vesting, roles
- **Legal Clauses** — Non-compete, IP assignment, confidentiality
- **Indian Law** — Companies Act, Contract Act, relevant case law
- **Compliance** — GST, TDS, ROC filings, PF/ESI

> *For comprehensive AI-powered responses, please configure your OpenAI API key in the backend `.env` file.*""",
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
            message=f"Document assistance for {matter_type} is available.",
            suggestions=["What clauses should I include?", "What are common mistakes to avoid?"],
        )


# Singleton instance
chatbot_service = NyayaSetuChatbotService()
