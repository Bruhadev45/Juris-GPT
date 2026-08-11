---
title: JurisGPT
emoji: ⚖️
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Citation-grounded legal assistant for Indian startup law
---

# JurisGPT — backend API

Citation-grounded question answering over 47,867 Indian legal documents.
Hybrid BM25 + lexical retrieval with weighted Reciprocal Rank Fusion, and
source-constrained generation: every answer is written only from retrieved
passages and carries inline citations, a confidence badge, and an explicit
limitation statement.

This Space runs the FastAPI backend. The user interface is a separate Next.js
app that calls it.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness. Returns 200 once the corpus is loaded. |
| `GET` | `/api/info` | Build and corpus metadata. |
| `POST` | `/api/chat/message` | Ask a question; returns answer + citations. |
| `GET` | `/docs` | OpenAPI documentation. |

```bash
curl -X POST https://<space-host>/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is Section 7 of the Companies Act, 2013?"}'
```

## Startup time

The container decompresses the corpus archive and builds the BM25 index on
first boot, which takes **1–2 minutes**. `/health` returns non-200 until that
finishes — this is expected, not a failure. On the free tier the Space also
sleeps when idle, so the first request after a period of inactivity pays that
cost again.

## Configuration

Set these in **Settings → Variables and secrets**:

| Secret | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Primary generation model |
| `OPENAI_API_KEY` | no | Fallback generation model |
| `CORS_ORIGINS_CSV` | yes | Comma-separated frontend origins allowed to call this API |

No object storage credentials are needed. The corpus ships inside the image
as a gzip archive and is decompressed at startup.

## Benchmark

Measured on 120 human-verified queries (Fleiss' κ = 0.81 across three
annotators) over the 47,867-document corpus:

| Configuration | Recall@5 | MRR | nDCG@5 |
|---|---|---|---|
| Lexical baseline | 0.8250 | 0.8878 | **0.7849** |
| Dense (MiniLM) | 0.4417 | 0.9250 | 0.5661 |
| **Hybrid BM25 (deployed)** | **0.8417** | **0.9531** | 0.6846 |
| Hybrid + generic reranker | 0.8375 | 0.8639 | 0.5974 |

A generic MS MARCO cross-encoder re-ranker lowered nDCG@5 by 8.7–16.3 points
(p < 10⁻⁴) and cost 17× the retrieval latency, so it is disabled in this
configuration.

On a 40-query claim-level audit, 80% of answers were faithful to their
citations and 2.5% cited authority that does not exist.

## Disclaimer

JurisGPT is an informational support tool. It does not give legal advice and
does not create a lawyer–client relationship. A qualified professional should
review its output before anyone acts on it.
