"""
JurisGPT Chatbot API Routes
Citation-Grounded Legal Research Assistant

Supports:
- Standard JSON responses (POST /message)
- Server-Sent Events streaming (POST /stream)
- Document generation assistance
"""

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.chatbot_service import (
    chatbot_service,
    ChatRequest,
    ChatResponse,
    ChatMessage as ChatMessageModel,
    CitationModel
)

router = APIRouter(tags=["Chatbot"])


class ChatMessageRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


class CitationResponse(BaseModel):
    """Citation in API response"""
    title: str
    content: str
    doc_type: str
    source: str
    relevance: float
    section: Optional[str] = None
    act: Optional[str] = None
    url: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """
    Response model for chat endpoint.

    The JurisGPT legal assistant returns citation-grounded answers
    with confidence indicators and source transparency.
    """
    success: bool
    answer: str  # Main response text
    citations: List[CitationResponse] = []  # Legal citations supporting the answer
    confidence: str = "medium"  # "high", "medium", "low", "insufficient"
    limitations: str = ""  # Caveats about the answer
    follow_up_questions: List[str] = []  # Suggested follow-up questions
    grounded: bool = True  # Whether answer is supported by citations
    error: Optional[str] = None
    model_used: Optional[str] = None  # Which model generated the answer

    # Legacy fields for backwards compatibility
    message: str = ""  # Alias for answer
    sources: List[Dict[str, Any]] = []  # Legacy sources format
    suggestions: List[str] = []  # Alias for follow_up_questions

    # Document generation fields
    is_document: bool = False
    document_type: Optional[str] = None


class DocumentAssistanceRequest(BaseModel):
    """Request for document generation assistance"""
    matter_type: str = Field(..., description="Type of legal document")
    company: Optional[Dict[str, Any]] = None
    founders: Optional[List[Dict[str, Any]]] = None


def _build_chat_request(request: ChatMessageRequest) -> ChatRequest:
    """Build a ChatRequest from the API request, including conversation history."""
    history = None
    if request.conversation_history:
        history = [
            ChatMessageModel(role=msg.get("role", "user"), content=msg.get("content", ""))
            for msg in request.conversation_history[-6:]  # Last 3 turns (6 messages)
        ]
    return ChatRequest(
        message=request.message,
        context=request.context,
        conversation_history=history,
    )


def _response_to_api(response: ChatResponse) -> ChatMessageResponse:
    """Convert internal ChatResponse to API response model."""
    return ChatMessageResponse(
        success=response.success,
        answer=response.answer,
        citations=[
            CitationResponse(
                title=c.title,
                content=c.content,
                doc_type=c.doc_type,
                source=c.source,
                relevance=c.relevance,
                section=c.section,
                act=c.act,
                url=c.url
            )
            for c in response.citations
        ],
        confidence=response.confidence,
        limitations=response.limitations,
        follow_up_questions=response.follow_up_questions,
        grounded=response.grounded,
        error=response.error,
        model_used=response.model_used,
        # Legacy fields
        message=response.answer,
        sources=response.sources,
        suggestions=response.follow_up_questions,
        is_document=response.is_document,
        document_type=response.document_type
    )


# ─── Standard JSON Endpoint ─────────────────────────────────────────

@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest):
    """
    Send a message to the JurisGPT legal research assistant.

    The chatbot uses RAG (Retrieval-Augmented Generation) to provide
    citation-grounded legal information based on Indian law.

    **Response includes:**
    - `answer`: The main response text with inline citations [1], [2], etc.
    - `citations`: List of legal sources supporting the answer
    - `confidence`: How confident the system is (high/medium/low/insufficient)
    - `limitations`: Important caveats about the response
    - `grounded`: Whether the answer is supported by retrieved citations

    **Document Generation:**
    When users request document drafting (NDAs, contracts, etc.),
    the response will have `is_document: true` with the generated document.
    """
    try:
        chat_request = _build_chat_request(request)
        response = chatbot_service.get_legal_response(chat_request)
        return _response_to_api(response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Error in chat endpoint")
        raise HTTPException(status_code=500, detail="Internal server error")


# ─── SSE Streaming Endpoint (Phase 4.1) ─────────────────────────────

@router.post("/stream")
async def stream_chat_message(request: ChatMessageRequest):
    """
    Stream a response from the JurisGPT legal research assistant via SSE.

    Streams token-by-token using Server-Sent Events:
    - `event: token` — individual tokens as they are generated
    - `event: citations` — citation data (sent after answer completes)
    - `event: metadata` — confidence, limitations, follow-ups
    - `event: done` — signals stream completion
    - `event: error` — error information

    Requires local LLM for true streaming. Falls back to sending
    the full response as a single event if streaming is not available.
    """
    async def event_stream():
        try:
            chat_request = _build_chat_request(request)

            # Document generation is not streamed token-by-token: use the same
            # service path as JSON responses so metadata and document markers
            # stay consistent.
            if chatbot_service._is_document_generation_request(chat_request.message):
                response = chatbot_service.get_legal_response(chat_request)
                yield f"event: token\ndata: {json.dumps({'token': response.answer})}\n\n"
                yield f"event: citations\ndata: {json.dumps([])}\n\n"
                metadata = {
                    "confidence": response.confidence,
                    "limitations": response.limitations,
                    "grounded": response.grounded,
                    "follow_up_questions": response.follow_up_questions,
                    "model_used": response.model_used,
                    "is_document": response.is_document,
                    "document_type": response.document_type,
                }
                yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
                yield f"event: done\ndata: {{}}\n\n"
                return

            chatbot_service._lazy_init()

            # If RAG pipeline has a local LLM, use streaming
            rag = chatbot_service.rag
            if rag and hasattr(rag, 'local_llm') and rag.local_llm is not None:
                # Retrieve citations using the same enhanced query path as
                # non-streaming JSON responses.
                enhanced_query = chatbot_service._build_enhanced_query(chat_request)
                citations = rag.retrieve(enhanced_query)
                confidence = rag._assess_confidence(enhanced_query, citations)
                limitations = rag._generate_limitations(enhanced_query, citations, confidence)

                # Stream tokens
                for token in rag.stream_answer(enhanced_query, citations):
                    payload = json.dumps({"token": token})
                    yield f"event: token\ndata: {payload}\n\n"

                # Send citations
                citations_data = [
                    {
                        "title": c.title,
                        "content": c.content[:300] + "..." if len(c.content) > 300 else c.content,
                        "doc_type": c.doc_type,
                        "source": c.source,
                        "relevance": c.relevance,
                        "section": c.section,
                        "act": c.act,
                        "url": c.url,
                    }
                    for c in citations
                ]
                yield f"event: citations\ndata: {json.dumps(citations_data)}\n\n"

                # Send metadata
                follow_ups = rag._generate_follow_ups(enhanced_query, citations)
                metadata = {
                    "confidence": confidence,
                    "limitations": limitations,
                    "grounded": confidence in ("high", "medium"),
                    "follow_up_questions": follow_ups,
                    "model_used": "local_legal_llama",
                    "is_document": False,
                    "document_type": None,
                }
                yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
                yield f"event: done\ndata: {{}}\n\n"
            else:
                # No streaming LLM — get full response and send as single event
                response = chatbot_service.get_legal_response(chat_request)

                # Send full answer as one token event
                yield f"event: token\ndata: {json.dumps({'token': response.answer})}\n\n"

                # Send citations
                citations_data = [
                    {
                        "title": c.title,
                        "content": c.content,
                        "doc_type": c.doc_type,
                        "source": c.source,
                        "relevance": c.relevance,
                        "section": c.section,
                        "act": c.act,
                        "url": c.url,
                    }
                    for c in response.citations
                ]
                yield f"event: citations\ndata: {json.dumps(citations_data)}\n\n"

                metadata = {
                    "confidence": response.confidence,
                    "limitations": response.limitations,
                    "grounded": response.grounded,
                    "follow_up_questions": response.follow_up_questions,
                    "model_used": getattr(response, "model_used", None),
                    "is_document": response.is_document,
                    "document_type": response.document_type,
                }
                yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
                yield f"event: done\ndata: {{}}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Document Assistance ────────────────────────────────────────────

@router.post("/document-assistance", response_model=ChatMessageResponse)
async def get_document_assistance(request: DocumentAssistanceRequest):
    """
    Get AI assistance for document generation.

    This is a separate workflow from legal Q&A.
    Provides guidance on clauses, considerations, and best practices
    for the specific document type being generated.

    **Note:** Generated documents should be reviewed by legal professionals.
    """
    try:
        context = {
            "company": request.company or {},
            "founders": request.founders or []
        }

        response = chatbot_service.get_document_assistance(
            matter_type=request.matter_type,
            context=context
        )
        return _response_to_api(response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Error in document assistance endpoint")
        raise HTTPException(status_code=500, detail="Internal server error")


# ─── Suggestions & Status ───────────────────────────────────────────

@router.get("/suggestions")
async def get_initial_suggestions():
    """
    Get initial conversation suggestions.

    Returns a curated list of common legal questions to help users
    get started with the JurisGPT assistant.
    """
    return {
        "suggestions": [
            {
                "category": "Company Formation",
                "questions": [
                    "How do I incorporate a Private Limited company in India?",
                    "What is the difference between Private Limited and LLP?",
                    "What are the compliance requirements after incorporation?"
                ]
            },
            {
                "category": "Founder Agreements",
                "questions": [
                    "What clauses should be in a founder agreement?",
                    "How should founders split equity?",
                    "What is a typical vesting schedule?"
                ]
            },
            {
                "category": "Legal Clauses",
                "questions": [
                    "Are non-compete clauses enforceable in India?",
                    "What should be in an IP assignment clause?",
                    "How does dispute resolution work?"
                ]
            },
            {
                "category": "Compliance & Tax",
                "questions": [
                    "What are the annual filing requirements?",
                    "What are the GST registration requirements?",
                    "What tax benefits are available under Section 80-IAC?"
                ]
            }
        ]
    }


@router.get("/status")
async def get_chatbot_status():
    """
    Check the status of the chatbot and RAG pipeline.

    Returns information about:
    - Whether the RAG pipeline is initialized
    - Available features (including new capabilities)
    - Any initialization errors
    """
    chatbot_service._lazy_init()

    rag = chatbot_service.rag
    rag_info = {}
    if rag:
        rag_info = {
            "corpus_source": getattr(rag, "corpus_source", None),
            "corpus_size": len(getattr(rag, "local_corpus", [])),
            "corpus_error": getattr(rag, "corpus_error", None),
            "vector_store": getattr(rag, "vector_store", None),
            "llm_type": getattr(rag, "llm_type", None),
            "hybrid_search": getattr(rag, "hybrid_search", False),
            "use_reranker": getattr(rag, "use_reranker", False),
            "local_llm_available": getattr(rag, "local_llm", None) is not None,
        }

    return {
        "product": "JurisGPT",
        "version": "2.0",
        "description": "Research-Level Citation-Grounded Legal AI for Indian Law",
        "initialized": chatbot_service._initialized,
        "rag_available": rag is not None,
        "error": chatbot_service._initialization_error,
        **rag_info,
        "features": {
            "legal_qa": True,
            "citation_grounding": chatbot_service._initialized,
            "confidence_scoring": chatbot_service._initialized,
            "document_generation": True,
            "case_law_search": chatbot_service._initialized,
            "statute_lookup": chatbot_service._initialized,
            "streaming_sse": True,
            "hybrid_retrieval": rag_info.get("hybrid_search", False),
            "cross_encoder_reranking": rag_info.get("use_reranker", False),
            "local_llm": rag_info.get("local_llm_available", False),
            "query_preprocessing": True,
        }
    }
