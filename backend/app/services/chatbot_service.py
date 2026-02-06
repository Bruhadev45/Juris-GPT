"""
NyayaSetu Chatbot Service
Integrates RAG pipeline with FastAPI backend
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

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
    context: Optional[Dict[str, Any]] = None  # e.g., company info, matter details


class ChatResponse(BaseModel):
    """Chat response model"""
    success: bool
    message: str
    sources: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    error: Optional[str] = None


class NyayaSetuChatbotService:
    """Chatbot service for legal assistance"""

    def __init__(self):
        self.rag = None
        self._initialized = False
        self._initialization_error = None

    def _lazy_init(self):
        """Lazy initialization of RAG pipeline"""
        if self._initialized:
            return

        try:
            from rag_pipeline import NyayaSetuRAG
            self.rag = NyayaSetuRAG()
            self._initialized = True
            print("✅ NyayaSetu RAG Pipeline initialized")
        except ImportError as e:
            self._initialization_error = f"RAG dependencies not installed: {e}"
            print(f"⚠️ {self._initialization_error}")
        except FileNotFoundError as e:
            self._initialization_error = f"Vector store not found. Run data setup scripts: {e}"
            print(f"⚠️ {self._initialization_error}")
        except Exception as e:
            self._initialization_error = f"RAG initialization failed: {e}"
            print(f"⚠️ {self._initialization_error}")

    def get_legal_response(self, request: ChatRequest) -> ChatResponse:
        """Get legal assistance response"""
        self._lazy_init()

        if not self._initialized or not self.rag:
            return self._get_fallback_response(request.message)

        try:
            # Build context from request
            context_info = ""
            if request.context:
                if request.context.get("company_name"):
                    context_info += f"\nCompany: {request.context['company_name']}"
                if request.context.get("founders"):
                    context_info += f"\nFounders: {len(request.context['founders'])} founders"
                if request.context.get("matter_type"):
                    context_info += f"\nDocument Type: {request.context['matter_type']}"

            # Enhance query with context
            enhanced_query = request.message
            if context_info:
                enhanced_query = f"{request.message}\n\nContext:{context_info}"

            # Get RAG response
            rag_response = self.rag.query(enhanced_query)

            # Format sources
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

            # Generate suggestions
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

    def _get_fallback_response(self, query: str) -> ChatResponse:
        """Fallback response when RAG is not available"""
        query_lower = query.lower()

        # Basic keyword-based responses
        fallback_responses = {
            "vesting": {
                "message": """**Founder Equity Vesting** typically follows a 4-year schedule with 1-year cliff:

• **Vesting Period:** 48 months (4 years)
• **Cliff Period:** 12 months (1 year)
• **At Cliff:** 25% vests immediately
• **After Cliff:** Remaining 75% vests monthly over 36 months

This protects the company if a founder leaves early. The cliff ensures minimum commitment before any equity vests.

⚠️ *RAG pipeline not initialized. For comprehensive legal information, please run the data setup scripts.*""",
                "suggestions": ["What is reverse vesting?", "How does accelerated vesting work?"]
            },
            "incorporate": {
                "message": """**Company Incorporation in India** under Companies Act, 2013:

**Steps:**
1. Obtain Digital Signature Certificate (DSC)
2. Apply for Director Identification Number (DIN)
3. Reserve company name on MCA portal
4. File SPICe+ form with:
   - Memorandum of Association (MoA)
   - Articles of Association (AoA)
   - Declaration by directors
5. Receive Certificate of Incorporation

**Key Requirements:**
• Minimum 2 directors for Private Limited
• Minimum 1 shareholder
• Registered office address in India

⚠️ *RAG pipeline not initialized. For comprehensive legal information, please run the data setup scripts.*""",
                "suggestions": ["What documents are needed for incorporation?", "What is authorized capital?"]
            },
            "non-compete": {
                "message": """**Non-Compete Clauses in India:**

Non-compete agreements during employment are generally enforceable. However, post-employment non-compete clauses have limited enforceability under Section 27 of the Indian Contract Act, 1872, which voids agreements in restraint of trade.

**Common Terms:**
• Duration: 12-24 months (enforceability varies)
• Geographic scope: Usually limited to India
• Industry scope: Should be narrowly defined

**Tip:** Focus on non-solicitation and confidentiality clauses which are more enforceable.

⚠️ *RAG pipeline not initialized. For comprehensive legal information, please run the data setup scripts.*""",
                "suggestions": ["Are non-solicitation clauses enforceable?", "What is confidentiality clause?"]
            }
        }

        # Find matching response
        for keyword, response in fallback_responses.items():
            if keyword in query_lower:
                return ChatResponse(
                    success=True,
                    message=response["message"],
                    suggestions=response["suggestions"],
                    sources=[]
                )

        # Default response
        return ChatResponse(
            success=True,
            message=f"""I understand you're asking about: **{query}**

I'm NyayaSetu, your AI legal assistant for Indian startup law. I can help with:

• **Company Formation** - Incorporation, compliance, MCA filings
• **Founder Agreements** - Equity split, vesting, roles
• **Legal Clauses** - Non-compete, IP assignment, confidentiality
• **Indian Law** - Companies Act, Contract Act, relevant case law

⚠️ *The RAG knowledge base is not initialized. Please run the setup scripts for comprehensive legal information.*

**To setup:** Run the following in the `data/` folder:
```
pip install -r requirements.txt
python download_datasets.py
python process_datasets.py
python build_vector_store.py
```""",
            suggestions=[
                "How do I incorporate a company in India?",
                "What is a typical founder vesting schedule?",
                "What should be in a founder agreement?"
            ],
            error=self._initialization_error
        )

    def _generate_suggestions(self, query: str, sources) -> List[str]:
        """Generate follow-up question suggestions"""
        query_lower = query.lower()

        suggestions_map = {
            "vesting": [
                "What happens to unvested shares if a founder leaves?",
                "Can vesting be accelerated?",
                "What is single vs double trigger acceleration?"
            ],
            "incorporat": [
                "What is the difference between Private Limited and LLP?",
                "How much does incorporation cost?",
                "What are the compliance requirements after incorporation?"
            ],
            "founder agreement": [
                "What clauses should be in a founder agreement?",
                "How to handle founder disputes?",
                "What is a shotgun clause?"
            ],
            "equity": [
                "How should founders split equity?",
                "What is ESOP and how does it work?",
                "How does dilution work in funding rounds?"
            ],
            "non-compete": [
                "Are non-compete clauses enforceable in India?",
                "What is a non-solicitation clause?",
                "How long can a non-compete last?"
            ]
        }

        for keyword, suggestions in suggestions_map.items():
            if keyword in query_lower:
                return suggestions[:3]

        # Default suggestions
        return [
            "What are the key clauses in a founder agreement?",
            "How does vesting work for founders?",
            "What is the process to incorporate a company in India?"
        ]

    def get_document_assistance(self, matter_type: str, context: Dict[str, Any]) -> ChatResponse:
        """Get assistance for document generation"""
        self._lazy_init()

        if matter_type == "founder_agreement":
            founders = context.get("founders", [])
            company = context.get("company", {})

            prompt = f"""
I need help generating a Founder Agreement for:
- Company: {company.get('name', 'Unknown')}
- State: {company.get('state', 'Unknown')}
- Number of Founders: {len(founders)}

Please provide guidance on:
1. Key clauses to include
2. Important considerations for this specific setup
3. Common pitfalls to avoid
"""
            return self.get_legal_response(ChatRequest(
                message=prompt,
                context=context
            ))

        return ChatResponse(
            success=True,
            message=f"Document assistance for {matter_type} is available.",
            suggestions=["What clauses should I include?", "What are common mistakes to avoid?"]
        )


# Singleton instance
chatbot_service = NyayaSetuChatbotService()
