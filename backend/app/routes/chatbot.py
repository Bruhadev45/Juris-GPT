"""
JurisGPT Chatbot API Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.chatbot_service import (
    chatbot_service,
    ChatRequest,
    ChatResponse
)

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatMessageRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    """Response model for chat endpoint"""
    success: bool
    message: str
    sources: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    error: Optional[str] = None


class DocumentAssistanceRequest(BaseModel):
    """Request for document generation assistance"""
    matter_type: str = Field(..., description="Type of legal document")
    company: Optional[Dict[str, Any]] = None
    founders: Optional[List[Dict[str, Any]]] = None


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest):
    """
    Send a message to the JurisGPT legal assistant.

    The chatbot uses RAG (Retrieval-Augmented Generation) to provide
    accurate legal information based on Indian law, case precedents,
    and legal documents.
    """
    try:
        chat_request = ChatRequest(
            message=request.message,
            context=request.context
        )
        response = chatbot_service.get_legal_response(chat_request)

        return ChatMessageResponse(
            success=response.success,
            message=response.message,
            sources=response.sources,
            suggestions=response.suggestions,
            error=response.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/document-assistance", response_model=ChatMessageResponse)
async def get_document_assistance(request: DocumentAssistanceRequest):
    """
    Get AI assistance for document generation.

    Provides guidance on clauses, considerations, and best practices
    for the specific document type being generated.
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

        return ChatMessageResponse(
            success=response.success,
            message=response.message,
            sources=response.sources,
            suggestions=response.suggestions,
            error=response.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_initial_suggestions():
    """
    Get initial conversation suggestions.

    Returns a list of common questions users can ask the chatbot.
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
                "category": "Compliance",
                "questions": [
                    "What are the annual filing requirements?",
                    "When do I need board resolutions?",
                    "What is ROC compliance?"
                ]
            }
        ]
    }


@router.get("/status")
async def get_chatbot_status():
    """
    Check the status of the chatbot and RAG pipeline.
    """
    chatbot_service._lazy_init()

    return {
        "initialized": chatbot_service._initialized,
        "rag_available": chatbot_service.rag is not None,
        "error": chatbot_service._initialization_error,
        "features": {
            "legal_qa": True,
            "document_assistance": True,
            "case_law_search": chatbot_service._initialized,
            "statute_lookup": chatbot_service._initialized
        }
    }
