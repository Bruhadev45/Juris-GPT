#!/usr/bin/env python3
"""
JurisGPT RAG Pipeline
Citation-Grounded Legal Research Assistant for Indian Law

This module provides the core RAG (Retrieval-Augmented Generation) functionality
for answering legal questions with proper citations and confidence indicators.

Supports:
- Local Legal LLM (llama-cpp-python / GGUF) as primary generation engine
- OpenAI GPT as optional fallback
- Hybrid retrieval: BM25 + Semantic with Reciprocal Rank Fusion (RRF)
- Cross-encoder re-ranking (ms-marco-MiniLM)
- Domain-adapted embeddings (InLegalBERT)
- Query preprocessing with legal term expansion
"""

import json
import logging
import os
import re
import importlib.util
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")
from typing import List, Dict, Any, Optional, Iterator
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
VECTORS_DIR = BASE_DIR / "vectors"
PROCESSED_DIR = BASE_DIR / "processed"
SAMPLES_DIR = BASE_DIR / "datasets" / "samples"
CLOUD_CACHE_DIR = BASE_DIR / "cloud_cache"

# Obsidian integration
OBSIDIAN_ENABLED = os.getenv("OBSIDIAN_ENABLED", "true").lower() == "true"
OBSIDIAN_VAULT_PATH = os.getenv("OBSIDIAN_VAULT_PATH", os.path.expanduser("~/Documents/Obsidian Vault"))
STATUTE_SAMPLE_FILES = [
    "companies_act_sections.json",
    "patent_act_sections.json",
    "trademark_act_sections.json",
    "income_tax_act_sections.json",
    "gst_act_sections.json",
    "consumer_protection_act_sections.json",
    "industrial_disputes_act_sections.json",
    "sebi_regulations_sections.json",
    "shops_establishments_act_sections.json",
    # New comprehensive legal data
    "insolvency_bankruptcy_code.json",
    "information_technology_act.json",
    "fema_regulations.json",
    "competition_act.json",
    "llp_act.json",
]

CURATED_SAMPLE_FILES = [
    *STATUTE_SAMPLE_FILES,
    "case_summaries.json",
    "legal_faqs.json",
    "founder_agreement_clauses.json",
    "compliance_deadlines.json",
    "legal_news.json",
]

DEFAULT_CLOUD_CORPUS_FILES = [
    f"datasets/samples/{filename}" for filename in CURATED_SAMPLE_FILES
]
LOCAL_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "of", "on", "or", "that", "the", "their", "this",
    "to", "under", "what", "when", "where", "which", "who", "with", "your",
}

# ── Legal Term Expansion Dictionary (Phase 4.4) ─────────────────────
LEGAL_ABBREVIATIONS: Dict[str, str] = {
    "plc": "Private Limited Company",
    "pvt ltd": "Private Limited",
    "llp": "Limited Liability Partnership",
    "opc": "One Person Company",
    "moa": "Memorandum of Association",
    "aoa": "Articles of Association",
    "nda": "Non-Disclosure Agreement",
    "mou": "Memorandum of Understanding",
    "gst": "Goods and Services Tax",
    "cgst": "Central Goods and Services Tax",
    "sgst": "State Goods and Services Tax",
    "igst": "Integrated Goods and Services Tax",
    "tds": "Tax Deducted at Source",
    "pf": "Provident Fund",
    "esi": "Employees State Insurance",
    "roc": "Registrar of Companies",
    "mca": "Ministry of Corporate Affairs",
    "nclt": "National Company Law Tribunal",
    "nclat": "National Company Law Appellate Tribunal",
    "sebi": "Securities and Exchange Board of India",
    "rbi": "Reserve Bank of India",
    "ipo": "Initial Public Offering",
    "esop": "Employee Stock Option Plan",
    "ip": "Intellectual Property",
    "ipc": "Indian Penal Code",
    "crpc": "Code of Criminal Procedure",
    "cpc": "Code of Civil Procedure",
    "it act": "Income Tax Act",
    "rti": "Right to Information",
    "dpdpa": "Digital Personal Data Protection Act",
    # NOTE: "sec" is intentionally not here — it is normalised by
    # SECTION_REF_RE so that "sec 27" becomes "Section 27", not
    # "Section (SEC) 27".
}

# ── Section Reference Pattern ────────────────────────────────────────
SECTION_REF_RE = re.compile(
    r"\bsec(?:tion)?\.?\s*(\d+[a-z]?)\b", re.IGNORECASE
)


@dataclass
class Citation:
    """A citation from the legal corpus"""
    title: str
    content: str
    doc_type: str
    source: str
    relevance: float
    section: Optional[str] = None
    act: Optional[str] = None
    url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class CorpusStats:
    """Runtime corpus provenance used for research reporting and debugging."""
    source: str
    total_documents: int
    by_doc_type: Dict[str, int]
    loaded_files: List[str]
    cloud_error: Optional[str] = None


@dataclass
class RAGResponse:
    """Structured response from the RAG pipeline"""
    answer: str
    citations: List[Citation]
    confidence: str  # "high", "medium", "low", "insufficient"
    limitations: str
    follow_up_questions: List[str]
    query: str
    model_used: str
    grounded: bool  # Whether the answer is fully supported by citations


class JurisGPTRAG:
    """
    RAG Pipeline for JurisGPT Legal Research Assistant

    This class handles:
    - Document retrieval from the legal corpus (hybrid BM25 + semantic)
    - Cross-encoder re-ranking
    - Citation-grounded answer generation (local LLM primary, OpenAI fallback)
    - Confidence scoring based on retrieval quality
    - Structured output with limitations and follow-ups
    """

    def __init__(
        self,
        vector_store_type: str = "lexical",
        embedding_type: str = "sentence_transformers",
        llm_type: str = "local_legal_llama",
        top_k: int = 0,
        use_reranker: bool = False,
        hybrid_search: bool = False,
    ):
        self.vector_store_type = vector_store_type
        self.embedding_type = embedding_type
        self.llm_type = llm_type
        self.top_k = top_k or int(os.getenv("RAG_TOP_K", "5"))
        self.use_reranker = use_reranker or os.getenv("RAG_USE_RERANKER", "false").lower() == "true"
        self.hybrid_search = hybrid_search or os.getenv("RAG_HYBRID_SEARCH", "false").lower() == "true"

        self.bm25_weight = float(os.getenv("RAG_BM25_WEIGHT", "0.4"))
        self.semantic_weight = float(os.getenv("RAG_SEMANTIC_WEIGHT", "0.6"))
        self.rerank_top_n = int(os.getenv("RAG_RERANK_TOP_N", "20"))
        self.relevance_threshold = float(os.getenv("RAG_RELEVANCE_THRESHOLD", "0.65"))
        self.high_confidence_threshold = float(os.getenv("RAG_HIGH_CONFIDENCE_THRESHOLD", "0.80"))
        self.medium_confidence_threshold = float(os.getenv("RAG_MEDIUM_CONFIDENCE_THRESHOLD", "0.60"))
        self.low_confidence_threshold = float(os.getenv("RAG_LOW_CONFIDENCE_THRESHOLD", "0.40"))

        self.embeddings = None
        self.vector_store = None
        self.llm = None
        self.local_llm = None
        self.local_corpus: List[Dict[str, Any]] = []
        self.corpus_source = "uninitialized"
        self.corpus_error: Optional[str] = None
        self.loaded_corpus_files: List[str] = []

        # BM25 index (built lazily from local corpus)
        self._bm25_index = None
        self._bm25_corpus_tokens: List[List[str]] = []

        # Cross-encoder re-ranker (loaded lazily)
        self._reranker = None

        self._initialize()

    # ─── Initialization ──────────────────────────────────────────────

    def _initialize(self):
        """Initialize embeddings, vector store, and LLM"""
        logger.info("Initializing JurisGPT RAG Pipeline...")

        vector_ready = False
        if self.vector_store_type != "lexical":
            try:
                self._init_embeddings()
                if self.embeddings:
                    self._init_vector_store()
                    vector_ready = self.vector_store is not None
            except Exception as e:
                logger.warning("Vector retrieval unavailable: %s", e)

        if not vector_ready:
            self._init_local_corpus()
            self.vector_store = "lexical"
            logger.info("Using local lexical corpus (%d documents)", len(self.local_corpus))

        # Always build the inverted index for fast lexical scan, and BM25
        # whenever rank-bm25 is available (cheap to build, makes hybrid free).
        if self.local_corpus:
            self._build_bm25_index()

        # Initialize LLM
        self._init_llm()

        logger.info("RAG Pipeline initialized!")

    def _init_embeddings(self):
        """Initialize embedding model — prefer InLegalBERT, fall back to MiniLM."""
        embedding_model = os.getenv("EMBEDDING_MODEL", "law-ai/InLegalBERT")
        fallback_model = os.getenv("EMBEDDING_FALLBACK", "sentence-transformers/all-MiniLM-L6-v2")

        # Try InLegalBERT first
        if embedding_model == "law-ai/InLegalBERT":
            try:
                from transformers import AutoTokenizer, AutoModel
                import torch

                class InLegalBERTEmbeddings:
                    """Wrapper for law-ai/InLegalBERT embeddings."""
                    def __init__(self, model_name: str = "law-ai/InLegalBERT"):
                        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                        self.model = AutoModel.from_pretrained(model_name)
                        self.model.eval()

                    def _encode(self, texts: list) -> list:
                        encoded = self.tokenizer(
                            texts,
                            padding=True,
                            truncation=True,
                            max_length=512,
                            return_tensors="pt",
                        )
                        with torch.no_grad():
                            outputs = self.model(**encoded)
                        # Use CLS token embedding
                        embeddings = outputs.last_hidden_state[:, 0, :]
                        # Normalize
                        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
                        return embeddings.cpu().numpy().tolist()

                    def embed_query(self, text: str) -> list:
                        return self._encode([text])[0]

                    def embed_documents(self, texts: list) -> list:
                        return self._encode(texts)

                self.embeddings = InLegalBERTEmbeddings()
                logger.info("Using InLegalBERT embeddings (768d, legal-domain)")
                return
            except Exception as e:
                logger.warning("InLegalBERT unavailable (%s), trying fallback...", e)

        # Fallback to sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer

            class SentenceTransformerEmbeddings:
                """Simple wrapper for sentence-transformers embeddings."""
                def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
                    try:
                        self.model = SentenceTransformer(model_name, local_files_only=True)
                    except Exception:
                        self.model = SentenceTransformer(model_name)

                def embed_query(self, text: str) -> list:
                    return self.model.encode(text).tolist()

                def embed_documents(self, texts: list) -> list:
                    return self.model.encode(texts).tolist()

            self.embeddings = SentenceTransformerEmbeddings(fallback_model)
            logger.info("Using SentenceTransformer embeddings (%s)", fallback_model)
            return
        except Exception:
            pass

        if self.embedding_type == "openai":
            try:
                from langchain_openai import OpenAIEmbeddings
                if os.getenv("OPENAI_API_KEY"):
                    self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
                    logger.info("Using OpenAI embeddings")
                    return
            except ImportError:
                pass

        raise ImportError("No embedding model available")

    def _init_vector_store(self):
        """Initialize vector store"""
        if self.vector_store_type == "chroma":
            self._init_chroma()
        else:
            self._init_faiss()

    def _init_chroma(self):
        """Initialize ChromaDB"""
        try:
            import chromadb
            from chromadb.config import Settings

            chroma_path = VECTORS_DIR / "chroma_db"
            if not chroma_path.exists():
                raise FileNotFoundError(f"ChromaDB not found at {chroma_path}")

            client = chromadb.PersistentClient(
                path=str(chroma_path),
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = client.get_collection("jurisgpt_legal")
            self.vector_store = "chroma"
            logger.info("ChromaDB loaded (%d vectors)", self.collection.count())
        except Exception as e:
            logger.warning("ChromaDB error: %s", e)
            self._init_faiss()

    def _init_faiss(self):
        """Initialize FAISS"""
        try:
            from langchain_community.vectorstores import FAISS

            faiss_path = VECTORS_DIR / "faiss_index"
            if not faiss_path.exists():
                raise FileNotFoundError(f"FAISS index not found at {faiss_path}")

            self.faiss_store = FAISS.load_local(
                str(faiss_path),
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            self.vector_store = "faiss"
            logger.info("FAISS index loaded")
        except Exception as e:
            logger.warning("FAISS error: %s", e)
            self.vector_store = None

    def _init_llm(self):
        """Initialize LLM for generation — Anthropic primary, OpenAI fallback, local LLM last."""

        # 1. Try Anthropic Claude first (best quality for legal reasoning)
        # Supports direct Anthropic API or PageGrid proxy (https://pagegrid.in)
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        anthropic_base_url = os.getenv("ANTHROPIC_BASE_URL", "")

        if self.llm_type in ("anthropic", "claude", "pagegrid") or (anthropic_key and not anthropic_key.startswith("sk-placeholder")):
            if anthropic_key:
                try:
                    from langchain_anthropic import ChatAnthropic

                    # Build kwargs - add base_url if using PageGrid or custom endpoint
                    # PageGrid uses different model names: claude-sonnet-4-6, claude-haiku-4-5, claude-opus-4-6
                    is_pagegrid = anthropic_base_url and "pagegrid" in anthropic_base_url.lower()
                    model_name = "claude-sonnet-4-6" if is_pagegrid else "claude-sonnet-4-20250514"

                    llm_kwargs = {
                        "model": model_name,
                        "temperature": 0.3,
                        "max_tokens": 4000,
                        "api_key": anthropic_key
                    }

                    # PageGrid or custom base URL support
                    if anthropic_base_url:
                        llm_kwargs["base_url"] = anthropic_base_url
                        provider_name = "PageGrid" if is_pagegrid else "Custom Endpoint"
                    else:
                        provider_name = "Anthropic"

                    self.llm = ChatAnthropic(**llm_kwargs)
                    self.llm_type = "anthropic"
                    logger.info("Using %s Claude Sonnet 4 (primary)", provider_name)
                    return
                except ImportError:
                    logger.warning("langchain-anthropic not installed, trying OpenAI...")
                except Exception as e:
                    logger.warning("Anthropic initialization failed: %s", e)

        # 2. Try OpenAI
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if self.llm_type == "openai" or (openai_key and not openai_key.startswith("sk-placeholder")):
            if openai_key:
                try:
                    from langchain_openai import ChatOpenAI
                    self.llm = ChatOpenAI(
                        model="gpt-4o-mini",
                        temperature=0.3,
                        max_tokens=4000
                    )
                    self.llm_type = "openai"
                    logger.info("Using OpenAI GPT-4o-mini")
                    return
                except ImportError:
                    logger.warning("langchain-openai not installed, trying local LLM...")
                except Exception as e:
                    logger.warning("OpenAI initialization failed: %s", e)

        # 3. Try local Legal Llama
        if self.llm_type in ("local_legal_llama", "local"):
            try:
                # Import from the backend services package
                try:
                    from app.services.local_llm import LocalLegalLLM
                except ImportError:
                    # When running from data/ directory, use importlib
                    backend_dir = Path(__file__).parent.parent / "backend"
                    local_llm_path = backend_dir / "app" / "services" / "local_llm.py"

                    spec = importlib.util.spec_from_file_location("local_llm", local_llm_path)
                    if spec is None or spec.loader is None:
                        raise ImportError(f"LocalLegalLLM not found at {local_llm_path}")

                    local_llm_module = importlib.util.module_from_spec(spec)
                    added_backend_dir = False
                    if str(backend_dir) not in sys.path:
                        sys.path.insert(0, str(backend_dir))
                        added_backend_dir = True
                    try:
                        spec.loader.exec_module(local_llm_module)
                    finally:
                        if added_backend_dir:
                            try:
                                sys.path.remove(str(backend_dir))
                            except ValueError:
                                pass
                    LocalLegalLLM = local_llm_module.LocalLegalLLM

                self.local_llm = LocalLegalLLM()
                if self.local_llm.is_available:
                    self.llm = "local_legal_llama"
                    logger.info("Local Legal Llama model available (lazy-loaded)")
                    return
                else:
                    logger.warning("Local LLM model file not found...")
                    self.local_llm = None
            except ImportError as e:
                logger.warning("Local LLM import error: %s", e)
                self.local_llm = None

        # 4. No LLM — retrieval-only mode
        self.llm = None
        if self.vector_store == "lexical":
            logger.info("Local lexical mode enabled (no remote LLM required)")
        else:
            logger.info("No LLM configured (retrieval-only mode)")

    # ─── BM25 Index ──────────────────────────────────────────────────

    def _build_bm25_index(self):
        """Build BM25 index and an inverted index for fast lexical scan.

        BM25 needs a token *list* (with repetitions) per document so that term
        frequency is preserved. The inverted index ``token -> [doc_ids]`` lets
        the lexical retriever skip documents that share zero query terms,
        turning an O(corpus_size) scan into O(matched_docs).
        """
        if not self.local_corpus:
            return
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            logger.warning("rank-bm25 not installed, BM25 hybrid search disabled")
            self.hybrid_search = False
            return

        self._bm25_corpus_tokens = [
            list(doc.get("tokens", [])) for doc in self.local_corpus
        ]
        self._bm25_index = BM25Okapi(self._bm25_corpus_tokens)
        # Build inverted index for fast lexical candidate selection
        self._inverted_index: Dict[str, List[int]] = {}
        for doc_idx, tokens in enumerate(self._bm25_corpus_tokens):
            for token in set(tokens):
                self._inverted_index.setdefault(token, []).append(doc_idx)
        logger.info(
            "BM25 + inverted index built (%d documents, %d unique tokens)",
            len(self._bm25_corpus_tokens),
            len(self._inverted_index),
        )

    # ─── Cross-Encoder Re-ranker ─────────────────────────────────────

    def _get_reranker(self):
        """Lazily load the cross-encoder re-ranker."""
        if self._reranker is not None:
            return self._reranker
        if not self.use_reranker:
            return None
        try:
            from sentence_transformers import CrossEncoder
            self._reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            logger.info("Cross-encoder re-ranker loaded")
            return self._reranker
        except ImportError:
            logger.warning("Cross-encoder unavailable (sentence-transformers not installed)")
            self.use_reranker = False
            return None
        except Exception as e:
            logger.warning("Cross-encoder load error: %s", e)
            self.use_reranker = False
            return None

    def _rerank(self, query: str, citations: List[Citation], top_k: int) -> List[Citation]:
        """Re-rank citations using the cross-encoder model.

        Reranks even when ``len(citations) <= top_k`` because semantic
        re-ordering of the small set still improves precision-at-1.
        """
        reranker = self._get_reranker()
        if reranker is None or not citations:
            return citations[:top_k]

        pairs = [(query, c.content) for c in citations]
        scores = reranker.predict(pairs)

        scored = list(zip(scores, citations))
        scored.sort(key=lambda x: x[0], reverse=True)

        reranked = []
        for score, citation in scored[:top_k]:
            # Normalize cross-encoder score to 0-1 range
            normalized = max(0.0, min(1.0, (float(score) + 10) / 20))
            reranked.append(Citation(
                title=citation.title,
                content=citation.content,
                doc_type=citation.doc_type,
                source=citation.source,
                relevance=round(normalized, 3),
                section=citation.section,
                act=citation.act,
                url=citation.url,
                metadata=citation.metadata,
            ))
        return reranked

    # ─── Query Preprocessing (Phase 4.4) ─────────────────────────────

    @staticmethod
    def preprocess_query(query: str) -> str:
        """Expand legal abbreviations and normalize section references.

        Section references are normalised *first* so that "sec 27" becomes
        "Section 27" before the abbreviation map runs. Otherwise a generic
        "sec" → "Section" abbreviation would interfere with the
        ``Section <number>`` pattern.
        """
        def _expand_section(match: re.Match) -> str:
            return f"Section {match.group(1)}"

        processed = SECTION_REF_RE.sub(_expand_section, query)

        for abbr, expansion in LEGAL_ABBREVIATIONS.items():
            pattern = re.compile(r"\b" + re.escape(abbr) + r"\b", re.IGNORECASE)
            processed = pattern.sub(f"{expansion} ({abbr.upper()})", processed)

        return processed

    # ─── Tokenization & Lexical Matching ─────────────────────────────

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text for local lexical retrieval."""
        normalized = "".join(char.lower() if char.isalnum() else " " for char in text)
        return [
            token for token in normalized.split()
            if token not in LOCAL_STOPWORDS and (len(token) > 2 or token.isdigit())
        ]

    def _token_matches(self, query_token: str, document_token: str) -> bool:
        """Allow loose token matches for simple stemming-like behavior."""
        if query_token == document_token:
            return True
        if len(query_token) >= 5 and query_token in document_token:
            return True
        if len(document_token) >= 5 and document_token in query_token:
            return True
        return False

    def _build_local_document(
        self,
        *,
        title: str,
        content: str,
        doc_type: str,
        source: str,
        section: Optional[str] = None,
        act: Optional[str] = None,
        url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Build a local corpus record.

        Tokens are stored as ``list`` (not ``set``) so that BM25 keeps the term
        frequency information it needs to score correctly. A separate
        ``token_set`` is kept for fast O(1) intersection during the lexical
        scan.
        """
        document = {
            "title": title,
            "content": content,
            "doc_type": doc_type,
            "source": source,
            "section": section,
            "act": act,
            "url": url,
            "metadata": metadata or {},
        }
        token_source = " ".join([
            title,
            content,
            source,
            section or "",
            act or "",
            " ".join(str(v) for v in (metadata or {}).values()),
        ])
        body_tokens = self._tokenize(token_source)
        title_tokens = self._tokenize(title)
        document["tokens"] = body_tokens
        document["token_set"] = set(body_tokens)
        document["title_tokens"] = title_tokens
        document["title_token_set"] = set(title_tokens)
        return document

    # ─── Corpus Loading ──────────────────────────────────────────────

    @staticmethod
    def _read_json_records(path: Path) -> List[Dict[str, Any]]:
        """Read a JSON list from disk. Invalid or missing files are skipped."""
        if not path.exists():
            return []
        try:
            with path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                return data if isinstance(data, list) else []
        except Exception as exc:
            logger.warning("Skipping corpus file %s: %s", path, exc)
            return []

    def _init_local_corpus(self):
        """Load sample legal corpus for offline lexical retrieval."""
        if self.local_corpus:
            return

        corpus: List[Dict[str, Any]] = []

        if self._load_cloud_corpus(corpus):
            self.local_corpus = corpus
            self.corpus_source = "cloud"
            return

        for filename in CURATED_SAMPLE_FILES:
            items = self._read_json_records(SAMPLES_DIR / filename)
            if items:
                self.loaded_corpus_files.append(filename)
            self._append_corpus_items_from_json(corpus, filename, items, source_prefix="Local")

        # ── Load HuggingFace-sourced corpus (Phase 3.1) ─────────────
        hf_corpus_file = PROCESSED_DIR / "hf_legal_corpus.json"
        hf_items = self._read_json_records(hf_corpus_file)
        if hf_items:
            self.loaded_corpus_files.append(str(hf_corpus_file.relative_to(BASE_DIR)))
        for item in hf_items:
            corpus.append(self._build_local_document(
                title=item.get("title", "Legal Document"),
                content=item.get("content", ""),
                doc_type=item.get("doc_type", "judgment"),
                source=item.get("source", "HuggingFace Legal Corpus"),
                section=item.get("section"),
                act=item.get("act"),
                metadata=item.get("metadata", {}),
            ))

        # ── Load Obsidian vault notes (if enabled) ─────────────────
        if OBSIDIAN_ENABLED:
            obsidian_docs = self._load_obsidian_corpus(corpus)
            if obsidian_docs > 0:
                logger.info("Loaded %d documents from Obsidian vault", obsidian_docs)

        self.local_corpus = corpus
        self.corpus_source = "local"

    def _load_obsidian_corpus(self, corpus: List[Dict[str, Any]]) -> int:
        """Load notes from Obsidian vault into corpus."""
        try:
            from obsidian_loader import load_obsidian_corpus, ObsidianLoader
        except ImportError:
            try:
                from .obsidian_loader import load_obsidian_corpus, ObsidianLoader
            except ImportError:
                logger.warning("Obsidian loader not available")
                return 0

        vault_path = OBSIDIAN_VAULT_PATH
        if not Path(vault_path).exists():
            logger.info("Obsidian vault not found at %s, skipping", vault_path)
            return 0

        try:
            loader = ObsidianLoader(vault_path=vault_path)
            docs = loader.load_documents()

            for doc in docs:
                corpus.append(self._build_local_document(
                    title=doc.get("title", "Obsidian Note"),
                    content=doc.get("content", ""),
                    doc_type=doc.get("doc_type", "note"),
                    source=doc.get("source", "Obsidian Vault"),
                    section=doc.get("section"),
                    act=doc.get("act"),
                    url=doc.get("url"),
                    metadata=doc.get("metadata", {}),
                ))

            if loader.loaded_files:
                self.loaded_corpus_files.extend(
                    [f"obsidian:{f}" for f in loader.loaded_files]
                )

            return len(docs)
        except Exception as e:
            logger.warning("Error loading Obsidian corpus: %s", e)
            return 0

    def _get_cloud_corpus_files(self) -> List[str]:
        """Get configured cloud corpus object keys."""
        env_value = os.getenv("JURISGPT_CLOUD_CORPUS_FILES", "")
        if env_value.strip():
            return [item.strip() for item in env_value.split(",") if item.strip()]
        return DEFAULT_CLOUD_CORPUS_FILES.copy()

    def _build_spaces_client(self):
        """Build an S3-compatible client for DigitalOcean Spaces."""
        access_key = os.getenv("DO_SPACES_KEY")
        secret_key = os.getenv("DO_SPACES_SECRET")
        endpoint = os.getenv("DO_SPACES_ENDPOINT")
        region = os.getenv("DO_SPACES_REGION")

        if not access_key or not secret_key or not endpoint:
            self.corpus_error = "DigitalOcean Spaces is not fully configured."
            return None

        try:
            import boto3
        except ImportError:
            self.corpus_error = "boto3 is not installed, so cloud corpus loading is unavailable."
            return None

        return boto3.client(
            "s3",
            region_name=region,
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    def _load_cloud_json(self, s3_client, bucket: str, object_key: str) -> List[Dict[str, Any]]:
        """Load a JSON corpus file from cloud storage and cache it locally."""
        response = s3_client.get_object(Bucket=bucket, Key=object_key)
        raw_bytes = response["Body"].read()

        CLOUD_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = CLOUD_CACHE_DIR / Path(object_key).name
        cache_path.write_bytes(raw_bytes)

        data = json.loads(raw_bytes.decode("utf-8"))
        return data if isinstance(data, list) else []

    def _append_corpus_items_from_json(
        self,
        corpus: List[Dict[str, Any]],
        object_key: str,
        items: List[Dict[str, Any]],
        *,
        source_prefix: str = "Cloud",
    ):
        """Append cloud corpus items using the same schema as local sample files."""
        filename = Path(object_key).name.lower()

        if filename in STATUTE_SAMPLE_FILES:
            for item in items:
                corpus.append(self._build_local_document(
                    title=f"{item.get('act', 'Indian Law')} - Section {item.get('section', '')}: {item.get('title', 'Untitled')}",
                    content=item.get("content", ""),
                    doc_type="statute",
                    source=item.get("act", "Indian Law"),
                    section=item.get("section"),
                    act=item.get("act"),
                    metadata=item,
                ))
            return

        if filename == "case_summaries.json":
            for item in items:
                content_parts = [
                    item.get("principle", ""),
                    item.get("summary", ""),
                    item.get("relevance", ""),
                ]
                corpus.append(self._build_local_document(
                    title=item.get("case_name", "Case Summary"),
                    content=" ".join(part for part in content_parts if part),
                    doc_type="case",
                    source=item.get("citation", item.get("court", "Case Summary")),
                    metadata=item,
                ))
            return

        if filename == "legal_faqs.json":
            for item in items:
                corpus.append(self._build_local_document(
                    title=item.get("question", "Legal FAQ"),
                    content=item.get("answer", ""),
                    doc_type="faq",
                    source=f"{source_prefix} Legal FAQ Corpus",
                    act=", ".join(item.get("related_laws", [])) if item.get("related_laws") else None,
                    metadata=item,
                ))
            return

        if filename == "founder_agreement_clauses.json":
            for item in items:
                corpus.append(self._build_local_document(
                    title=f"Founder Agreement Clause - {item.get('clause_type', 'Clause')}",
                    content=f"{item.get('standard_terms', '')}. {item.get('sample_text', '')}",
                    doc_type="clause",
                    source="Founder Agreement Clause Bank",
                    metadata=item,
                ))
            return

        if filename == "compliance_deadlines.json":
            for item in items:
                content_parts = [
                    item.get("description", ""),
                    f"Due day: {item.get('due_day')}" if item.get("due_day") else "",
                    f"Recurring: {item.get('recurring')}" if item.get("recurring") else "",
                    f"Penalty: {item.get('penalty')}" if item.get("penalty") else "",
                    f"Applicable to: {', '.join(item.get('applicable_to', []))}" if item.get("applicable_to") else "",
                    f"Law reference: {item.get('law_reference')}" if item.get("law_reference") else "",
                ]
                corpus.append(self._build_local_document(
                    title=item.get("title", "Compliance Deadline"),
                    content=" ".join(part for part in content_parts if part),
                    doc_type="compliance",
                    source=item.get("law_reference", "Compliance Calendar"),
                    act=item.get("category"),
                    metadata=item,
                ))
            return

        if filename == "legal_news.json":
            for item in items:
                content_parts = [
                    item.get("summary", ""),
                    f"Published: {item.get('published_at')}" if item.get("published_at") else "",
                    f"Tags: {', '.join(item.get('tags', []))}" if item.get("tags") else "",
                ]
                corpus.append(self._build_local_document(
                    title=item.get("title", "Legal News"),
                    content=" ".join(part for part in content_parts if part),
                    doc_type="news",
                    source=item.get("source", "Legal News"),
                    url=item.get("url"),
                    act=item.get("category"),
                    metadata=item,
                ))
            return

        logger.warning("No corpus loader registered for %s", object_key)

    def _load_cloud_corpus(self, corpus: List[Dict[str, Any]]) -> bool:
        """Load legal corpus from DigitalOcean Spaces when configured."""
        bucket = os.getenv("DO_SPACES_BUCKET")
        if not bucket:
            return False

        s3_client = self._build_spaces_client()
        if s3_client is None:
            return False

        base_path = os.getenv("JURISGPT_CLOUD_BASE_PATH", "").strip("/")
        loaded_any = False
        errors = []

        for relative_key in self._get_cloud_corpus_files():
            object_key = relative_key.strip("/")
            if base_path:
                object_key = f"{base_path}/{object_key}"

            try:
                items = self._load_cloud_json(s3_client, bucket, object_key)
                self._append_corpus_items_from_json(corpus, object_key, items)
                if items:
                    self.loaded_corpus_files.append(object_key)
                loaded_any = loaded_any or bool(items)
            except Exception as e:
                errors.append(f"{object_key}: {e}")

        if loaded_any:
            self.corpus_error = None
            return True

        if errors:
            self.corpus_error = "; ".join(errors[:3])

        return False

    # ─── Retrieval Methods ───────────────────────────────────────────

    def _candidate_doc_indices(self, query_tokens: List[str]) -> List[int]:
        """Use the inverted index to limit lexical scoring to a candidate set.

        Falls back to the full corpus only when the inverted index has not been
        built yet (e.g. when hybrid_search is disabled).
        """
        index = getattr(self, "_inverted_index", None)
        if not index:
            return list(range(len(self.local_corpus)))
        candidates: set[int] = set()
        for token in set(query_tokens):
            candidates.update(index.get(token, []))
        return list(candidates)

    def _retrieve_from_local_corpus(self, query: str, top_k: int) -> List[Citation]:
        """Retrieve citations using lexical token matching with O(candidates)
        scanning powered by the inverted index. Uses the precomputed
        ``token_set`` for O(1) intersection.
        """
        if not self.local_corpus:
            self._init_local_corpus()

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        query_token_set = set(query_tokens)
        scored_results: List[tuple[float, Dict[str, Any]]] = []
        for doc_idx in self._candidate_doc_indices(query_tokens):
            document = self.local_corpus[doc_idx]
            doc_token_set = document.get("token_set") or set(document.get("tokens", []))
            title_token_set = document.get("title_token_set") or set(
                document.get("title_tokens", [])
            )

            matched_tokens = query_token_set & doc_token_set
            if not matched_tokens:
                # Loose match fallback for stems / partials
                matched_tokens = {
                    qt for qt in query_token_set
                    if any(self._token_matches(qt, dt) for dt in doc_token_set)
                }
                if not matched_tokens:
                    continue

            matched_title_tokens = query_token_set & title_token_set

            coverage = len(matched_tokens) / len(query_tokens)
            title_coverage = len(matched_title_tokens) / len(query_tokens)
            score = min(0.98, (coverage * 0.75) + (title_coverage * 0.2) + 0.05)

            if score >= 0.2:
                scored_results.append((score, document))

        scored_results.sort(key=lambda item: item[0], reverse=True)

        return [
            Citation(
                title=document["title"],
                content=document["content"],
                doc_type=document["doc_type"],
                source=document["source"],
                relevance=round(score, 3),
                section=document.get("section"),
                act=document.get("act"),
                url=document.get("url"),
                metadata=document.get("metadata", {}),
            )
            for score, document in scored_results[:top_k]
        ]

    def _retrieve_bm25(self, query: str, top_k: int) -> List[Citation]:
        """Retrieve citations using BM25 scoring."""
        if self._bm25_index is None or not self.local_corpus:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores = self._bm25_index.get_scores(query_tokens)

        # Pair scores with document indices and sort
        indexed_scores = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in indexed_scores[:top_k]:
            if score <= 0:
                continue
            doc = self.local_corpus[idx]
            # Normalize BM25 score to 0-1 range
            max_score = indexed_scores[0][1] if indexed_scores else 1.0
            normalized = score / max_score if max_score > 0 else 0.0

            results.append(Citation(
                title=doc["title"],
                content=doc["content"],
                doc_type=doc["doc_type"],
                source=doc["source"],
                relevance=round(normalized, 3),
                section=doc.get("section"),
                act=doc.get("act"),
                url=doc.get("url"),
                metadata=doc.get("metadata", {}),
            ))
        return results

    def _reciprocal_rank_fusion(
        self,
        *result_lists: List[Citation],
        k: int = 60,
        top_k: int = 5,
    ) -> List[Citation]:
        """
        Combine multiple ranked result lists using Reciprocal Rank Fusion.
        RRF_score(d) = sum(1 / (k + rank_i)) for each list i
        """
        # Build a mapping from document title+source → (best citation, rrf_score)
        doc_scores: Dict[str, tuple[Citation, float]] = {}

        for result_list in result_lists:
            for rank, citation in enumerate(result_list):
                doc_key = f"{citation.title}||{citation.source}"
                rrf_contribution = 1.0 / (k + rank + 1)  # rank is 0-indexed

                if doc_key in doc_scores:
                    existing_citation, existing_score = doc_scores[doc_key]
                    doc_scores[doc_key] = (existing_citation, existing_score + rrf_contribution)
                else:
                    doc_scores[doc_key] = (citation, rrf_contribution)

        # Sort by RRF score
        sorted_docs = sorted(doc_scores.values(), key=lambda x: x[1], reverse=True)

        # Normalize RRF scores to 0-1
        max_rrf = sorted_docs[0][1] if sorted_docs else 1.0
        return [
            Citation(
                title=citation.title,
                content=citation.content,
                doc_type=citation.doc_type,
                source=citation.source,
                relevance=round(score / max_rrf, 3) if max_rrf > 0 else 0.0,
                section=citation.section,
                act=citation.act,
                url=citation.url,
                metadata=citation.metadata,
            )
            for citation, score in sorted_docs[:top_k]
        ]

    def retrieve(self, query: str, top_k: int = None) -> List[Citation]:
        """
        Retrieve relevant documents from the legal corpus.

        Uses hybrid BM25 + lexical/semantic with RRF fusion when enabled.
        Optionally re-ranks with a cross-encoder.
        """
        k = top_k or self.top_k

        # Preprocess query
        processed_query = self.preprocess_query(query)

        if self.vector_store == "lexical":
            # When BM25 is available it is strictly better than the
            # coverage-based lexical scorer (it has TF/IDF + length norm), so
            # prefer it as the primary signal. The coverage scorer is only
            # used as a fallback or as a secondary signal in hybrid mode.
            candidates_k = self.rerank_top_n if self.use_reranker else max(k, 10)

            if self._bm25_index is not None:
                bm25_results = self._retrieve_bm25(processed_query, candidates_k)
                if self.hybrid_search:
                    lexical_results = self._retrieve_from_local_corpus(
                        processed_query, candidates_k
                    )
                    # Weighted RRF — BM25 gets the heavier weight because it
                    # already accounts for term frequency and document length.
                    fused = self._reciprocal_rank_fusion(
                        bm25_results,
                        bm25_results,  # double-count BM25 to weight it higher
                        lexical_results,
                        top_k=candidates_k,
                    )
                else:
                    fused = bm25_results
            else:
                fused = self._retrieve_from_local_corpus(processed_query, candidates_k)

            # Re-rank with cross-encoder when configured.
            if self.use_reranker:
                return self._rerank(processed_query, fused, k)
            return fused[:k]

        # ── Vector store retrieval ───────────────────────────────────
        results: List[Citation] = []

        if self.vector_store == "chroma" and hasattr(self, 'collection'):
            query_embedding = self.embeddings.embed_query(processed_query)
            n_results = self.rerank_top_n if self.use_reranker else k

            search_results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )

            for doc, metadata, distance in zip(
                search_results['documents'][0],
                search_results['metadatas'][0],
                search_results['distances'][0]
            ):
                score = max(0, 1 - distance)
                results.append(Citation(
                    content=doc,
                    title=metadata.get('title', 'Unknown'),
                    doc_type=metadata.get('doc_type', 'unknown'),
                    source=metadata.get('source', 'unknown'),
                    relevance=round(score, 3),
                    section=metadata.get('section'),
                    act=metadata.get('act'),
                    url=metadata.get('url') or metadata.get('source_url') or metadata.get('pdf_url'),
                    metadata=metadata
                ))

        elif self.vector_store == "faiss" and hasattr(self, 'faiss_store'):
            n_results = self.rerank_top_n if self.use_reranker else k
            docs_with_scores = self.faiss_store.similarity_search_with_score(processed_query, k=n_results)

            for doc, score in docs_with_scores:
                normalized_score = max(0, 1 - (score / 2))
                results.append(Citation(
                    content=doc.page_content,
                    title=doc.metadata.get('title', 'Unknown'),
                    doc_type=doc.metadata.get('doc_type', 'unknown'),
                    source=doc.metadata.get('source', 'unknown'),
                    relevance=round(normalized_score, 3),
                    section=doc.metadata.get('section'),
                    act=doc.metadata.get('act'),
                    url=doc.metadata.get('url') or doc.metadata.get('source_url') or doc.metadata.get('pdf_url'),
                    metadata=doc.metadata
                ))

        # Re-rank semantic results with cross-encoder when configured.
        if self.use_reranker:
            return self._rerank(processed_query, results, k)

        return results[:k]

    # ─── Confidence Scoring (Enhanced per Paper Section III.E) ────────

    def _assess_confidence(self, query: str, citations: List[Citation]) -> str:
        """
        Assess confidence level based on retrieval quality.
        Enhanced 3-criteria scoring aligned with paper Section III.E:
        1. Citation count above similarity threshold (0.65)
        2. Query-topic correspondence via category matching
        3. Source type diversity (statute + case + clause)
        """
        if not citations:
            return "insufficient"

        # Criterion 1: High-relevance citation count
        high_relevance_count = sum(1 for c in citations if c.relevance >= self.relevance_threshold)

        # Criterion 2: Topic correspondence — check if doc types match query intent
        query_lower = query.lower()
        has_statute_query = any(w in query_lower for w in ["section", "act", "provision", "law", "statute"])
        has_case_query = any(w in query_lower for w in ["case", "judgment", "ruling", "precedent", "court"])
        has_clause_query = any(w in query_lower for w in ["clause", "agreement", "contract", "nda", "mou"])

        matching_types = set()
        for c in citations:
            if has_statute_query and c.doc_type in ("statute", "act", "section"):
                matching_types.add("statute")
            if has_case_query and c.doc_type in ("case", "judgment"):
                matching_types.add("case")
            if has_clause_query and c.doc_type in ("clause", "agreement"):
                matching_types.add("clause")
            if not (has_statute_query or has_case_query or has_clause_query):
                matching_types.add(c.doc_type)  # Any match counts

        topic_match = len(matching_types) > 0

        # Criterion 3: Source type diversity
        doc_types = set(c.doc_type for c in citations)
        source_diversity = len(doc_types) >= 2

        # Calculate average relevance
        top_scores = [c.relevance for c in citations[:3]]
        avg_relevance = sum(top_scores) / len(top_scores) if top_scores else 0

        # Combined scoring
        if avg_relevance >= self.high_confidence_threshold and high_relevance_count >= 2 and topic_match:
            return "high"
        elif avg_relevance >= self.medium_confidence_threshold and high_relevance_count >= 1 and (topic_match or source_diversity):
            return "medium"
        elif avg_relevance >= self.low_confidence_threshold and high_relevance_count >= 1:
            return "low"
        else:
            return "insufficient"

    def _generate_limitations(self, query: str, citations: List[Citation], confidence: str) -> str:
        """Generate limitations statement based on retrieval quality."""
        if confidence == "insufficient":
            return "The legal corpus does not contain sufficient information to answer this question reliably. Please consult a qualified legal professional."

        if confidence == "low":
            return "Limited relevant sources were found. This information should be verified with primary legal sources or a qualified professional."

        doc_types = {c.doc_type for c in citations}

        limitations = []

        if len(doc_types) == 1:
            limitations.append(f"This answer is based primarily on {list(doc_types)[0]} sources")

        if "case" not in doc_types:
            limitations.append("No case law citations were found for this query")

        if not limitations:
            return "This information is based on the indexed legal corpus. Laws and interpretations may have been updated since indexing. Always verify with current official sources."

        return ". ".join(limitations) + ". Always verify with current official sources."

    # ─── Answer Generation ───────────────────────────────────────────

    def _build_legal_prompt(self, query: str, context: str) -> str:
        """Build the full prompt for the local LLM."""
        return f"""You are JurisGPT, a citation-grounded legal research assistant specializing in Indian law for startups and corporate matters.

CRITICAL RULES:
1. ONLY answer based on the provided citations. Do not use external knowledge.
2. ALWAYS cite your sources using [1], [2], etc. format in your answer.
3. If the citations don't contain relevant information, say so explicitly.
4. Never invent or hallucinate legal information.
5. Be precise about legal terminology, sections, and acts.

YOUR ROLE:
- Answer legal research questions using the provided context
- Cite specific statutes, sections, and case law from the context
- Explain legal concepts clearly for non-lawyers
- Highlight important caveats and when professional advice is needed

RESPONSE FORMAT:
- Start with a direct answer to the question
- Reference citations inline using [1], [2], etc.
- Mention specific acts, sections, and legal provisions
- Use clear formatting with bullet points where appropriate
- Keep responses focused and concise

DO NOT:
- Draft legal documents (this is a separate workflow)
- Provide advice that requires knowing specific case facts
- Make up legal provisions not in the citations
- Give definitive legal advice on complex matters

CONTEXT FROM LEGAL CORPUS:
{context}

USER QUESTION: {query}

ANSWER:"""

    def generate_answer(self, query: str, citations: List[Citation]) -> RAGResponse:
        """
        Generate a citation-grounded answer using the LLM.
        Priority: Local Legal Llama → OpenAI → Retrieval-only
        """
        confidence = self._assess_confidence(query, citations)
        limitations = self._generate_limitations(query, citations, confidence)

        if self.llm is None and self.local_llm is None:
            return self._format_retrieval_only_response(query, citations, confidence, limitations)

        if confidence == "insufficient":
            return RAGResponse(
                answer="I don't have sufficient information in my legal corpus to answer this question reliably. The available sources do not contain relevant content for your query. Please consult a qualified legal professional or refer to primary legal sources.",
                citations=citations,
                confidence=confidence,
                limitations=limitations,
                follow_up_questions=[
                    "Can you rephrase your question with more specific terms?",
                    "Are you looking for information about a specific act or section?",
                    "Would you like me to search for related topics?"
                ],
                query=query,
                model_used="retrieval-only",
                grounded=False
            )

        # Build context from citations
        context = "\n\n---\n\n".join([
            f"[{i+1}] {c.title} ({c.doc_type}, {c.source})\nRelevance: {c.relevance:.0%}\n{c.content}"
            for i, c in enumerate(citations)
        ])

        # ── Try Local Legal Llama first ──────────────────────────────
        if self.local_llm is not None:
            try:
                prompt = self._build_legal_prompt(query, context)
                answer = self.local_llm.generate(prompt, max_tokens=2048, temperature=0.3)
                if answer.strip():
                    follow_ups = self._generate_follow_ups(query, citations)
                    return RAGResponse(
                        answer=answer,
                        citations=citations,
                        confidence=confidence,
                        limitations=limitations,
                        follow_up_questions=follow_ups,
                        query=query,
                        model_used="local_legal_llama",
                        grounded=confidence in ["high", "medium"]
                    )
            except Exception as e:
                logger.error("Local LLM generation failed: %s", e)

        # ── Anthropic / OpenAI LLM ────────────────────────────────────
        if self.llm is not None and self.llm != "local_legal_llama":
            try:
                system_prompt = f"""You are JurisGPT, a citation-grounded legal research assistant specializing in Indian law for startups and corporate matters.

CRITICAL RULES:
1. ONLY answer based on the provided citations. Do not use external knowledge.
2. ALWAYS cite your sources using [1], [2], etc. format in your answer.
3. If the citations don't contain relevant information, say so explicitly.
4. Never invent or hallucinate legal information.
5. Be precise about legal terminology, sections, and acts.
6. Structure your response with clear headings when appropriate.
7. Provide actionable advice when the question warrants it.

CONTEXT FROM LEGAL CORPUS:
{context}
"""
                from langchain_core.prompts import ChatPromptTemplate
                prompt = ChatPromptTemplate.from_messages([
                    ("system", system_prompt),
                    ("human", "{query}")
                ])

                chain = prompt | self.llm
                response = chain.invoke({"context": context, "query": query})
                answer = response.content

                follow_ups = self._generate_follow_ups(query, citations)
                model_name = "anthropic" if self.llm_type == "anthropic" else "openai"
                return RAGResponse(
                    answer=answer,
                    citations=citations,
                    confidence=confidence,
                    limitations=limitations,
                    follow_up_questions=follow_ups,
                    query=query,
                    model_used=model_name,
                    grounded=confidence in ["high", "medium"]
                )
            except Exception as e:
                logger.error("LLM generation failed: %s", e)
                fallback_limitations = (
                    f"{limitations} Live answer generation is currently unavailable, so a retrieval-only response is shown."
                )
                return self._format_retrieval_only_response(query, citations, confidence, fallback_limitations)

        return self._format_retrieval_only_response(query, citations, confidence, limitations)

    def stream_answer(self, query: str, citations: List[Citation]) -> Iterator[str]:
        """
        Stream a citation-grounded answer token-by-token.
        Uses OpenAI streaming when available, falls back to retrieval-only.
        """
        confidence = self._assess_confidence(query, citations)
        limitations = self._generate_limitations(query, citations, confidence)

        # If no citations or insufficient confidence, return retrieval-only
        if not citations or confidence == "insufficient":
            response = self._format_retrieval_only_response(query, citations, confidence, limitations)
            yield response.answer
            return

        # Build context from citations
        context = "\n\n---\n\n".join([
            f"[{i+1}] {c.title} ({c.doc_type}, {c.source})\nRelevance: {c.relevance:.0%}\n{c.content}"
            for i, c in enumerate(citations)
        ])

        # Try Anthropic/OpenAI streaming (best quality)
        if self.llm is not None and self.llm != "local_legal_llama":
            try:
                system_prompt = f"""You are JurisGPT, a citation-grounded legal research assistant specializing in Indian law for startups and MSMEs.

CRITICAL RULES:
1. ONLY answer based on the provided citations. Do not use external knowledge.
2. ALWAYS cite your sources using [1], [2], etc. format in your answer.
3. If the citations don't contain relevant information, say so explicitly.
4. Never invent or hallucinate legal information.
5. Be precise about legal terminology, sections, and acts.
6. Structure your answer clearly with headings if needed.
7. Provide practical, actionable advice when possible.
8. Reference specific sections, acts, and legal provisions from the citations.

CONTEXT FROM LEGAL CORPUS:
{context}
"""
                from langchain_core.prompts import ChatPromptTemplate
                prompt = ChatPromptTemplate.from_messages([
                    ("system", system_prompt),
                    ("human", "{query}")
                ])

                chain = prompt | self.llm

                # Try streaming if supported
                try:
                    for chunk in chain.stream({"query": query}):
                        if hasattr(chunk, 'content') and chunk.content:
                            yield chunk.content
                    return
                except Exception as stream_error:
                    logger.warning("Streaming not supported, falling back to invoke: %s", stream_error)
                    # Fall back to non-streaming
                    response = chain.invoke({"query": query})
                    yield response.content
                    return
            except Exception as e:
                logger.error("LLM streaming failed: %s", e)

        # Fall back to retrieval-only format
        response = self._format_retrieval_only_response(query, citations, confidence, limitations)
        yield response.answer

    # ─── Retrieval-Only Formatting ───────────────────────────────────

    def _format_retrieval_only_response(
        self,
        query: str,
        citations: List[Citation],
        confidence: str,
        limitations: str
    ) -> RAGResponse:
        """Format a helpful response when no LLM is available"""
        if not citations:
            response = (
                "I could not find relevant material in the local legal corpus for this query. "
                "Try using more specific terms such as the act name, section number, or legal issue."
            )
            return RAGResponse(
                answer=response,
                citations=[],
                confidence="insufficient",
                limitations="No sufficiently relevant material was found in the local legal corpus.",
                follow_up_questions=[
                    "Can you mention the specific act or section?",
                    "Is this about company law, contracts, or compliance?",
                    "Would you like related startup law topics instead?"
                ],
                query=query,
                model_used="local-lexical",
                grounded=False
            )

        query_lower = query.lower()

        if any(word in query_lower for word in ["startup", "start-up", "new business", "entrepreneur"]):
            intro = "Here's what you need to know about **starting a business in India**:\n\n"
        elif any(word in query_lower for word in ["company", "incorporate", "registration"]):
            intro = "Here's the key information about **company formation in India**:\n\n"
        elif any(word in query_lower for word in ["compliance", "filing", "deadline"]):
            intro = "Here are the **compliance requirements** you should be aware of:\n\n"
        elif any(word in query_lower for word in ["tax", "gst", "tds"]):
            intro = "Here's the relevant **tax information**:\n\n"
        elif any(word in query_lower for word in ["contract", "agreement", "nda"]):
            intro = "Here's what you need to know about **legal agreements**:\n\n"
        elif any(word in query_lower for word in ["employee", "employment", "labor", "labour"]):
            intro = "Here's the relevant **employment law information**:\n\n"
        else:
            intro = "Based on your query, here's the relevant legal information:\n\n"

        key_points = []
        for i, citation in enumerate(citations[:3], 1):
            content = citation.content.strip()
            if citation.doc_type == "faq":
                heading = f"**{citation.title}**"
            elif citation.section:
                heading = f"**{citation.title}** (Section {citation.section})"
            else:
                heading = f"**{citation.title}**"
            if len(content) > 400:
                content = content[:400].rsplit(' ', 1)[0] + "..."
            key_points.append(f"### {i}. {heading}\n\n{content} [{i}]")

        response = intro + "\n\n".join(key_points)
        response += "\n\n---\n\n**Recommended Next Steps:**\n"
        response += "- Review the specific sections mentioned above\n"
        response += "- Consult with a qualified legal professional for your specific situation\n"
        response += "- Check the official government portals for the latest updates\n"

        return RAGResponse(
            answer=response,
            citations=citations,
            confidence=confidence if confidence != "insufficient" else "medium",
            limitations=limitations,
            follow_up_questions=self._generate_smart_follow_ups(query, citations),
            query=query,
            model_used="local-lexical",
            grounded=True
        )

    # ─── Follow-up Generation ────────────────────────────────────────

    def _generate_smart_follow_ups(self, query: str, citations: List[Citation]) -> List[str]:
        """Generate contextual follow-up questions based on query and citations"""
        query_lower = query.lower()

        if "startup" in query_lower or "business" in query_lower:
            return [
                "What are the compliance requirements after incorporation?",
                "How do I structure founder equity and vesting?",
                "What tax benefits are available for startups in India?"
            ]
        elif "company" in query_lower or "incorporate" in query_lower:
            return [
                "What is the difference between Private Limited and LLP?",
                "What are the post-incorporation compliances?",
                "What documents are needed for company registration?"
            ]
        elif "tax" in query_lower or "gst" in query_lower:
            return [
                "What are the GST registration thresholds?",
                "What input tax credits can I claim?",
                "What are the filing deadlines and penalties?"
            ]
        elif "employee" in query_lower or "employment" in query_lower:
            return [
                "What are the mandatory employee benefits?",
                "What are PF and ESI requirements?",
                "What notice period is required for termination?"
            ]
        elif "patent" in query_lower or "trademark" in query_lower:
            return [
                "How do I file a patent application in India?",
                "What is the trademark registration process?",
                "How long does IP protection last?"
            ]
        elif "consumer" in query_lower:
            return [
                "What are consumer rights under the 2019 Act?",
                "How do I file a consumer complaint?",
                "What compensation can consumers claim?"
            ]
        else:
            return [
                "What are the key compliance requirements?",
                "What documents do I need to prepare?",
                "What are the common legal pitfalls to avoid?"
            ]

    def _generate_follow_ups(self, query: str, citations: List[Citation]) -> List[str]:
        """Generate contextual follow-up questions based on the query and citations."""
        query_lower = query.lower()

        if "section" in query_lower or "act" in query_lower:
            return [
                "What are the penalties for non-compliance?",
                "Are there any exceptions to this provision?",
                "What recent amendments affect this section?"
            ]
        if "incorporate" in query_lower or "company" in query_lower:
            return [
                "What are the post-incorporation compliance requirements?",
                "What is the minimum capital requirement?",
                "What are the director eligibility criteria?"
            ]
        if "tax" in query_lower or "gst" in query_lower:
            return [
                "What are the filing deadlines?",
                "What input tax credits are available?",
                "What are the penalties for late filing?"
            ]
        if "employment" in query_lower or "labor" in query_lower:
            return [
                "What are the mandatory employee benefits?",
                "What are the notice period requirements?",
                "What are the PF/ESI thresholds?"
            ]
        return [
            "What are the relevant case law precedents?",
            "What are the compliance requirements?",
            "Are there any recent amendments to consider?"
        ]

    # ─── Main Query & Chat Methods ───────────────────────────────────

    def query(self, query: str, top_k: int = None) -> RAGResponse:
        """
        Main RAG query method.
        1. Validates input
        2. Preprocesses query (legal term expansion)
        3. Retrieves relevant documents (hybrid + re-rank)
        4. Assesses confidence
        5. Generates citation-grounded answer
        """
        # Input validation
        if not query or not query.strip():
            return RAGResponse(
                answer="Please provide a question to search the legal corpus.",
                citations=[],
                confidence="insufficient",
                limitations="No query provided.",
                follow_up_questions=[
                    "What legal topic are you interested in?",
                    "Try asking about a specific act, section, or legal concept.",
                ],
                query=query or "",
                model_used="validation",
                grounded=False,
            )
        query = query.strip()
        if len(query) > 2000:
            query = query[:2000]
            logger.warning("Query truncated from >2000 characters to 2000")

        citations = self.retrieve(query, top_k)
        return self.generate_answer(query, citations)

    def get_corpus_stats(self) -> CorpusStats:
        """Return current corpus provenance for API diagnostics and evaluations."""
        if not self.local_corpus and self.vector_store == "lexical":
            self._init_local_corpus()

        by_doc_type: Dict[str, int] = {}
        for document in self.local_corpus:
            doc_type = document.get("doc_type", "unknown")
            by_doc_type[doc_type] = by_doc_type.get(doc_type, 0) + 1

        return CorpusStats(
            source=self.corpus_source,
            total_documents=len(self.local_corpus),
            by_doc_type=dict(sorted(by_doc_type.items())),
            loaded_files=self.loaded_corpus_files.copy(),
            cloud_error=self.corpus_error,
        )

    def chat(self, query: str) -> str:
        """Simple chat interface for CLI testing"""
        response = self.query(query)

        output = f"\n{'='*60}\n"
        output += f"QUERY: {query}\n"
        output += f"{'='*60}\n\n"
        output += f"ANSWER:\n{response.answer}\n\n"
        output += f"{'='*60}\n"
        output += f"CONFIDENCE: {response.confidence.upper()}\n"
        output += f"GROUNDED: {'Yes' if response.grounded else 'No'}\n"
        output += f"MODEL: {response.model_used}\n"
        output += f"{'='*60}\n"
        output += f"CITATIONS ({len(response.citations)}):\n"

        for i, citation in enumerate(response.citations, 1):
            output += f"\n[{i}] {citation.title}\n"
            output += f"    Type: {citation.doc_type} | Relevance: {citation.relevance:.0%}\n"

        output += f"\n{'='*60}\n"
        output += f"LIMITATIONS:\n{response.limitations}\n"
        output += f"{'='*60}\n"
        output += "FOLLOW-UP QUESTIONS:\n"
        for q in response.follow_up_questions:
            output += f"  - {q}\n"

        return output


class JurisGPTChatbot:
    """Chatbot wrapper for integration with FastAPI backend"""

    def __init__(self):
        self.rag = None
        self._initialized = False

    def initialize(self):
        """Lazy initialization"""
        if not self._initialized:
            try:
                self.rag = JurisGPTRAG()
                self._initialized = True
            except Exception as e:
                logger.error("RAG initialization failed: %s", e)
                self._initialized = False

    def get_response(self, query: str) -> Dict[str, Any]:
        """Get chatbot response for API integration"""
        self.initialize()

        if not self._initialized or not self.rag:
            return {
                "success": False,
                "error": "RAG pipeline not initialized. Run setup scripts first.",
                "answer": None,
                "citations": [],
                "confidence": "insufficient",
                "limitations": "System not available",
                "follow_up_questions": [],
                "grounded": False
            }

        try:
            response = self.rag.query(query)
            return {
                "success": True,
                "answer": response.answer,
                "citations": [
                    {
                        "title": c.title,
                        "content": c.content[:300] + "..." if len(c.content) > 300 else c.content,
                        "doc_type": c.doc_type,
                        "source": c.source,
                        "relevance": c.relevance,
                        "section": c.section,
                        "act": c.act
                    }
                    for c in response.citations
                ],
                "confidence": response.confidence,
                "limitations": response.limitations,
                "follow_up_questions": response.follow_up_questions,
                "grounded": response.grounded,
                "model_used": response.model_used
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "answer": None,
                "citations": [],
                "confidence": "insufficient",
                "limitations": "Error occurred",
                "follow_up_questions": [],
                "grounded": False
            }


# Global chatbot instance for FastAPI
chatbot = JurisGPTChatbot()


def main():
    """CLI interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(description="JurisGPT RAG Pipeline")
    parser.add_argument("--query", "-q", type=str, help="Legal query to answer")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")

    args = parser.parse_args()

    # Initialize RAG
    rag = JurisGPTRAG()

    if args.query:
        print(rag.chat(args.query))
    elif args.interactive:
        print("\n" + "="*60)
        print("JurisGPT Legal Research Assistant")
        print("="*60)
        print("Ask any legal question about Indian law, company formation,")
        print("or corporate compliance. Type 'quit' to exit.\n")

        while True:
            try:
                query = input("\nYou: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye!")
                    break
                if not query:
                    continue
                print(rag.chat(query))
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
    else:
        demo_queries = [
            "What is Section 7 of Companies Act, 2013?",
            "What are the requirements for incorporating a private limited company?",
            "What is the punishment for cheating under IPC?"
        ]

        print("\nRunning demo queries...\n")
        for query in demo_queries:
            print(rag.chat(query))
            print("\n")


if __name__ == "__main__":
    main()
