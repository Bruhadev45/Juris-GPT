# JurisGPT RAG System Card

## Purpose

JurisGPT is an informational legal research assistant for Indian startup,
corporate, contract, compliance, tax, employment, and related business-law
questions. It is not a substitute for a qualified lawyer.

## Runtime Flow

1. Next.js chat UI sends a user query to FastAPI.
2. FastAPI builds a normalized chat request with recent conversation history.
3. The chatbot service routes greetings, document drafting, RAG Q&A, OpenAI
   fallback, or offline fallback.
4. The RAG layer retrieves top-k evidence from local, cloud, or vector corpus.
5. The generator answers using only retrieved context when RAG generation is
   active.
6. The API returns answer text, citations, confidence, limitations, follow-up
   questions, groundedness, and model provenance.

## Retrieval Modes

- `lexical`: local token-matching corpus. This is the safe default.
- `lexical_hybrid`: lexical plus BM25 with reciprocal rank fusion.
- `chroma` or `faiss`: semantic vector search when vector stores are built.
- Optional cross-encoder reranking can be enabled with `RAG_USE_RERANKER=true`.

## Confidence Policy

Confidence is derived from:

- number of citations above relevance threshold,
- correspondence between query intent and retrieved source types,
- source-type diversity,
- average top citation relevance.

Low or insufficient confidence should be treated as a prompt to consult primary
sources or a legal professional.

## Research Caveat

Automatic groundedness and hallucination proxy metrics are engineering signals.
Paper-level claims require manually annotated answers and inter-annotator
agreement.
