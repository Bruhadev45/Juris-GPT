"""
Legal News API — with optional AI-generated summaries.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "datasets" / "samples"

CATEGORIES = [
    "Supreme Court",
    "High Courts",
    "Legislative Updates",
    "SEBI",
    "RBI",
    "MCA",
    "Tax",
    "DPDPA/Data Privacy",
]


def _load_news() -> list:
    file_path = DATA_DIR / "legal_news.json"
    if not file_path.exists():
        return []
    with open(file_path, "r") as f:
        return json.load(f)


@router.get("")
async def get_news(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search in title or content"),
):
    """Get legal news feed with optional category filtering and search."""
    news = _load_news()

    if category:
        news = [n for n in news if n.get("category", "").lower() == category.lower()]

    # Search filter
    if search:
        search_lower = search.lower()
        news = [
            n for n in news
            if search_lower in n.get("title", "").lower()
            or search_lower in n.get("content", "").lower()
            or search_lower in n.get("summary", "").lower()
        ]

    # Sort by published_at descending (newest first)
    news.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    total = len(news)
    news = news[offset:offset + limit]

    return {"data": news, "total": total}


@router.get("/categories")
async def get_categories():
    """Get all news categories with article counts."""
    news = _load_news()
    counts = {cat: 0 for cat in CATEGORIES}
    for n in news:
        cat = n.get("category", "")
        if cat in counts:
            counts[cat] += 1

    return {
        "categories": [{"name": k, "count": v} for k, v in counts.items()],
    }


@router.get("/{article_id}/summary")
async def get_article_summary(article_id: str):
    """Get an AI-generated summary for a specific news article."""
    news = _load_news()
    article = next((n for n in news if n.get("id") == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Check if summary already exists
    if article.get("ai_summary"):
        return {"summary": article["ai_summary"]}

    try:
        from app.services.ai_analyzer import summarize_news_article
        summary = summarize_news_article(
            article.get("title", ""),
            article.get("content", article.get("summary", "")),
        )
        return {"summary": summary if summary else article.get("summary", "No summary available.")}
    except Exception:
        return {"summary": article.get("summary", "No summary available.")}
