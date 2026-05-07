"""Unit tests for the JurisGPT RAG pipeline.

These tests focus on the retrieval and ranking logic, not the LLM generation
path — they run offline and finish in well under a second so they can sit on
the critical path of CI.
"""
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).resolve().parent.parent
RAG_PATH = DATA_DIR / "rag_pipeline.py"


def _load_rag_module():
    spec = importlib.util.spec_from_file_location("rag_pipeline_under_test", RAG_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def rag_module():
    # Disable cloud + keep the LLM offline.
    os.environ.pop("DO_SPACES_BUCKET", None)
    os.environ["RAG_USE_RERANKER"] = "false"
    return _load_rag_module()


@pytest.fixture
def tiny_corpus(rag_module):
    """Build a deterministic in-memory RAG instance with a tiny corpus."""
    rag = rag_module.JurisGPTRAG.__new__(rag_module.JurisGPTRAG)
    # Bypass _initialize so we can hand-craft state.
    rag.vector_store_type = "lexical"
    rag.embedding_type = "sentence_transformers"
    rag.llm_type = "none"
    rag.top_k = 5
    rag.use_reranker = False
    rag.hybrid_search = True
    rag.bm25_weight = 0.4
    rag.semantic_weight = 0.6
    rag.rerank_top_n = 5
    rag.relevance_threshold = 0.65
    rag.high_confidence_threshold = 0.80
    rag.medium_confidence_threshold = 0.60
    rag.low_confidence_threshold = 0.40
    rag.embeddings = None
    rag.vector_store = "lexical"
    rag.llm = None
    rag.local_llm = None
    rag.corpus_source = "test"
    rag.corpus_error = None
    rag.loaded_corpus_files = []
    rag._bm25_index = None
    rag._bm25_corpus_tokens = []
    rag._reranker = None

    rag.local_corpus = [
        rag._build_local_document(
            title="Companies Act, 2013 - Section 7: Incorporation of Company",
            content=(
                "There shall be filed with the Registrar within whose "
                "jurisdiction the registered office of a company is proposed "
                "to be situated, the following documents and information for "
                "registration."
            ),
            doc_type="statute",
            source="Companies Act, 2013",
            section="7",
            act="Companies Act, 2013",
        ),
        rag._build_local_document(
            title="Founder Agreement Clause - Vesting Schedule",
            content=(
                "The founders' equity shall vest over four years with a "
                "one-year cliff, with 25 percent vesting at the end of year "
                "one and the remaining 75 percent vesting monthly thereafter."
            ),
            doc_type="clause",
            source="Founder Agreement Clause Bank",
        ),
        rag._build_local_document(
            title="Indian Contract Act, 1872 - Section 27: Restraint of Trade",
            content=(
                "Every agreement by which any one is restrained from "
                "exercising a lawful profession, trade or business of any "
                "kind, is to that extent void."
            ),
            doc_type="statute",
            source="Indian Contract Act, 1872",
            section="27",
            act="Indian Contract Act, 1872",
        ),
    ]
    rag._build_bm25_index()
    return rag


# ── Query preprocessing ────────────────────────────────────────────────────


@pytest.mark.unit
def test_preprocess_expands_legal_abbreviations(rag_module):
    expanded = rag_module.JurisGPTRAG.preprocess_query("Tell me about NDA terms")
    assert "Non-Disclosure Agreement" in expanded
    assert "NDA" in expanded


@pytest.mark.unit
def test_preprocess_normalizes_section_references(rag_module):
    expanded = rag_module.JurisGPTRAG.preprocess_query("explain sec 27 ICA")
    assert "Section 27" in expanded


@pytest.mark.unit
def test_preprocess_is_idempotent_for_unchanged_text(rag_module):
    text = "What are the requirements for incorporating a private limited company?"
    assert rag_module.JurisGPTRAG.preprocess_query(text) == text


# ── BM25 fix regression test ───────────────────────────────────────────────


@pytest.mark.unit
def test_bm25_tokens_preserve_term_frequency(tiny_corpus):
    """If tokens are stored as a set BM25 collapses, returning identical
    scores for documents with very different term frequency. This guards the
    fix to use a list-of-tokens for the BM25 corpus.
    """
    bm25_corpus = tiny_corpus._bm25_corpus_tokens
    assert all(isinstance(tokens, list) for tokens in bm25_corpus)
    # The vesting clause says "vest" / "vesting" repeatedly; the word should
    # appear more than once if term frequency is preserved.
    vesting_doc = next(
        tokens for tokens in bm25_corpus if any("vest" in t for t in tokens)
    )
    assert sum(1 for t in vesting_doc if "vest" in t) >= 2


@pytest.mark.unit
def test_bm25_ranks_vesting_clause_first(tiny_corpus):
    citations = tiny_corpus._retrieve_bm25(
        "What is equity vesting and how does it work?", top_k=3
    )
    assert citations, "BM25 returned no results"
    assert "Vesting" in citations[0].title


# ── Inverted-index retrieval ───────────────────────────────────────────────


@pytest.mark.unit
def test_inverted_index_only_scans_candidates(tiny_corpus):
    candidates = tiny_corpus._candidate_doc_indices(["vesting"])
    # Only the vesting clause document contains "vesting".
    assert len(candidates) == 1
    title = tiny_corpus.local_corpus[candidates[0]]["title"]
    assert "Vesting" in title


@pytest.mark.unit
def test_lexical_retrieval_finds_section_7(tiny_corpus):
    citations = tiny_corpus._retrieve_from_local_corpus(
        "What is Section 7 of the Companies Act, 2013?", top_k=3
    )
    assert citations
    assert any("Section 7" in c.title for c in citations)


# ── RRF fusion ─────────────────────────────────────────────────────────────


@pytest.mark.unit
def test_rrf_fusion_dedupes_documents(rag_module, tiny_corpus):
    citations = tiny_corpus.retrieve(
        "What is equity vesting and how does it work?", top_k=3
    )
    # The vesting clause must appear at most once even though it scores in
    # both BM25 and lexical streams.
    titles = [c.title for c in citations]
    assert len(titles) == len(set(titles))


@pytest.mark.unit
def test_rrf_score_non_increasing(tiny_corpus):
    citations = tiny_corpus.retrieve(
        "What are the requirements for incorporating a private limited company?",
        top_k=3,
    )
    relevances = [c.relevance for c in citations]
    assert relevances == sorted(relevances, reverse=True)


# ── Confidence scoring ─────────────────────────────────────────────────────


@pytest.mark.unit
def test_confidence_insufficient_with_no_citations(tiny_corpus):
    assert tiny_corpus._assess_confidence("query", []) == "insufficient"


@pytest.mark.unit
def test_confidence_uses_topic_match(tiny_corpus, rag_module):
    citation = rag_module.Citation(
        title="X",
        content="Y",
        doc_type="statute",
        source="Z",
        relevance=0.9,
        section="7",
        act="Companies Act, 2013",
    )
    confidence = tiny_corpus._assess_confidence(
        "explain Section 7 of the Companies Act", [citation, citation, citation]
    )
    assert confidence in {"high", "medium"}


# ── End-to-end query ───────────────────────────────────────────────────────


@pytest.mark.integration
def test_query_returns_grounded_response(tiny_corpus):
    response = tiny_corpus.query(
        "What is equity vesting and how does it work?", top_k=3
    )
    assert response.citations
    assert response.confidence in {"high", "medium", "low", "insufficient"}
    assert response.query
    assert response.model_used


@pytest.mark.unit
def test_query_truncates_oversized_input(tiny_corpus):
    huge = "vest " * 1000
    response = tiny_corpus.query(huge)
    assert len(response.query) <= 2000
