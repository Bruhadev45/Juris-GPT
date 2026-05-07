<p align="center">
  <h1 align="center">JurisGPT</h1>
  <p align="center">
    <strong>Citation-Grounded Legal Research Assistant for Indian Startup Law</strong>
  </p>
  <p align="center">
    <a href="#legal-assistant">Legal Assistant</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#research">Research</a> •
    <a href="#installation">Installation</a> •
    <a href="#supporting-workflows">Supporting Workflows</a>
  </p>
</p>

---

## Overview

**JurisGPT** is a Retrieval-Augmented Generation (RAG) legal research assistant that provides citation-grounded answers to legal questions about Indian startup and corporate law.

Unlike generic AI chatbots, JurisGPT:
- **Retrieves relevant sources** from a curated corpus of Indian legal documents before answering
- **Cites specific statutes, sections, and case law** when grounded sources are available
- **Indicates confidence and limitations** when evidence is insufficient
- **Refuses to hallucinate** — if the corpus doesn't contain relevant information, it says so

The assistant is designed for Indian startups, MSMEs, and entrepreneurs navigating company formation, compliance, and corporate governance.

## Legal Assistant

The core of JurisGPT is a citation-grounded legal Q&A system:

### What It Does

```
User: "What is Section 7 of the Companies Act, 2013?"

JurisGPT:
┌─────────────────────────────────────────────────────────────────────┐
│ ANSWER                                                               │
│ Section 7 of the Companies Act, 2013 deals with the incorporation   │
│ of a company. It specifies that an application must be filed with   │
│ the Registrar along with the Memorandum and Articles of Association,│
│ a declaration by professionals, and other prescribed documents...   │
├─────────────────────────────────────────────────────────────────────┤
│ CITATIONS                                                            │
│ [1] Companies Act, 2013 - Section 7 (Relevance: 94%)                │
│ [2] Companies (Incorporation) Rules, 2014 (Relevance: 87%)          │
│ [3] MCA Circular on SPICe+ Form (Relevance: 82%)                    │
├─────────────────────────────────────────────────────────────────────┤
│ CONFIDENCE: High (3 relevant sources found)                          │
│ LIMITATIONS: This covers the statutory requirements; procedural      │
│ details may vary by state and time of filing.                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Citation-First Answers** | Every response includes specific legal citations with relevance scores |
| **Confidence Indicators** | Clear signals when evidence is strong, weak, or missing |
| **Source Deep Links** | Direct references to statutes, sections, and case law |
| **Uncertainty Awareness** | Explicit acknowledgment of limitations and gaps |
| **Indian Law Focus** | Specialized for Companies Act, GST, labor laws, and startup regulations |

### What It Covers

- **Company Formation** — Incorporation, Directors, Shareholders, MCA compliance
- **Corporate Governance** — Board meetings, resolutions, annual filings
- **Startup Law** — DPIIT recognition, angel tax, ESOP, funding structures
- **Tax Compliance** — GST, TDS, advance tax, filings
- **Labor Law** — Employment contracts, PF/ESI, Shops Act
- **Contracts** — Indian Contract Act, enforceability, dispute resolution

## How It Works

JurisGPT uses a RAG (Retrieval-Augmented Generation) architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER QUERY                                   │
│              "What is the vesting schedule for ESOP?"               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RETRIEVAL LAYER                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Embed Query  │ → │ Vector Search │ → │ Rank Sources │          │
│  │ (MiniLM-L6)  │    │ (ChromaDB)    │    │ (Top-K=5)   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
│  Legal Corpus: 3,171 indexed documents                              │
│  - Indian statutes (IPC, CrPC, CPC, Companies Act, etc.)            │
│  - Supreme Court and High Court judgments                           │
│  - MCA circulars and notifications                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GENERATION LAYER                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Build Context│ → │ GPT-4o-mini  │ → │ Structure    │          │
│  │ from Sources │    │ Generation   │    │ Response     │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
│  Output: Answer + Citations + Confidence + Limitations              │
└─────────────────────────────────────────────────────────────────────┘
```

### RAG Configuration

| Parameter | Value |
|-----------|-------|
| Embedding Model | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | ChromaDB (persistent) |
| Chunk Size | 1000 tokens |
| Chunk Overlap | 200 tokens |
| Top-K Retrieval | 5 documents |
| LLM | GPT-4o-mini (temperature: 0.3) |
| Max Tokens | 4000 |

## Research

JurisGPT ships with a reproducible 120-query benchmark and a paper draft
(`research/PAPER.md`). All metrics below were measured by
`data/eval/run_paper_benchmarks.py` against an indexed corpus of
**47,606 documents** spanning curated samples and HuggingFace-sourced
statute chunks.

### Indexed Corpus (composition)

| Document type | Count |
|---|---|
| statute | 47,414 |
| case | 62 |
| faq | 60 |
| compliance | 41 |
| news | 25 |
| clause | 4 |

See `data/eval/results/figures/fig09_corpus_composition.png`.

### 120-Query Benchmark

The benchmark covers six categories with 20 queries each, with explicit
`expected_doc_types` and `expected_acts` metadata:
company-formation, founder-agreements, compliance, contracts, tax-law,
employment-law (`data/eval/benchmark_queries.json`).

### Aggregate Results — Three Configurations

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| `baseline_lexical` | 66.25% | **86.67%** | 0.886 | **0.778** | 100% | 0.0% | **0.053** |
| `hybrid_bm25` | **68.33%** | 66.67% | **0.938** | 0.608 | 100% | 0.0% | 0.075 |
| `hybrid_bm25_rerank` | 67.50% | 66.67% | 0.825 | 0.469 | 100% | 0.0% | 1.529 |

Hybrid BM25 + lexical fusion is best on Recall@5 and MRR. The simple
lexical baseline keeps the highest Precision@5 and nDCG@5 because the
coverage scorer is harsh enough to keep junk out of the top-5. The
generic ms-marco MiniLM cross-encoder *degrades* ranking quality on this
corpus — see `research/PAPER.md` §6 for discussion.

### Reproducing the Numbers

```bash
source backend/venv/bin/activate
python data/eval/run_paper_benchmarks.py          # 120 queries × 3 configs
python data/eval/generate_paper_artifacts.py      # 10 figures + 2 CSVs
python -m pytest data/eval/test_rag_pipeline.py   # 13 unit/integration tests
```

Artefacts land in `data/eval/results/` (per-config JSON, combined Markdown
summary) and `data/eval/results/figures/` (PNG figures, CSV tables,
`METRICS.md`).

## Installation

### Prerequisites

- **Python** >= 3.10
- **Node.js** >= 18.x
- **OpenAI API Key** (for generation)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/jurisgpt.git
cd jurisgpt

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Build vector store (first time only)
cd ../data
python setup_rag.py

# Start backend
cd ../backend
uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| **Legal Assistant** | http://localhost:3000/dashboard/chat |
| **Legal Search** | http://localhost:3000/dashboard/search |
| **API Docs** | http://localhost:8000/docs |

## Project Structure

```
jurisgpt/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # Application entry
│   │   ├── routes/
│   │   │   ├── chatbot.py       # Legal Assistant API
│   │   │   ├── legal_data.py    # Search & retrieval API
│   │   │   └── ...
│   │   └── services/
│   │       └── chatbot_service.py  # RAG integration
│   └── requirements.txt
│
├── frontend/                     # Next.js Frontend
│   └── src/app/dashboard/
│       ├── chat/                # Legal Assistant UI
│       ├── search/              # Legal Search UI
│       └── ...
│
├── data/                         # RAG Pipeline & Data
│   ├── rag_pipeline.py          # Core RAG implementation
│   ├── setup_rag.py             # Vector store builder
│   ├── datasets/
│   │   ├── research_corpus/     # Primary legal corpus
│   │   ├── eval/                # Evaluation datasets
│   │   └── demo/                # Demo/sample data
│   └── vectors/                 # ChromaDB vector store
│
├── research/                     # Research & Evaluation
│   ├── configs/                 # Versioned RAG configs
│   ├── eval_questions.json      # Evaluation question set
│   ├── run_baselines.py         # Baseline comparisons
│   └── eval_retrieval.py        # Retrieval metrics
│
└── README.md
```

## Supporting Workflows

Beyond the core legal assistant, JurisGPT includes supporting tools for common startup legal tasks:

### Document Generation

Generate legal documents using templates and AI assistance:
- Founder Agreements
- NDA / Confidentiality Agreements
- Employment Contracts
- Board Resolutions

**Note**: Document generation is a separate workflow from the research assistant. Generated documents should be reviewed by qualified legal professionals.

### Compliance Tracking

Track important regulatory deadlines:
- MCA/ROC annual filings
- GST return deadlines
- Tax compliance dates
- Board meeting requirements

### Legal Calculator

Calculate common legal fees:
- Stamp duty by state
- Court filing fees
- TDS calculations
- Gratuity computation

### Document Vault

Secure storage for legal documents with categorization and search.

## API Reference

### Legal Assistant Endpoint

```bash
POST /api/chat/message

Request:
{
  "message": "What is Section 149 of Companies Act about?",
  "context": {}
}

Response:
{
  "success": true,
  "answer": "Section 149 of the Companies Act, 2013...",
  "citations": [
    {
      "title": "Companies Act, 2013 - Section 149",
      "content": "...",
      "doc_type": "statute",
      "source": "companies_act",
      "relevance": 0.94
    }
  ],
  "confidence": "high",
  "limitations": "This covers the current statutory position...",
  "follow_up_questions": [
    "What are the qualifications for independent directors?",
    "How many directors are required for a private company?"
  ]
}
```

### Legal Search Endpoint

```bash
GET /api/legal/search?q=director+appointment&types=statute,case

Response:
{
  "results": [...],
  "total": 42,
  "query": "director appointment",
  "suggestions": [...]
}
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI (Python 3.14) |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Vector Store** | ChromaDB |
| **Embeddings** | HuggingFace sentence-transformers |
| **LLM** | OpenAI GPT-4o-mini |
| **Database** | PostgreSQL (Supabase) |

## Contributing

We welcome contributions, especially:
- Expanding the legal corpus with more Indian law sources
- Improving retrieval quality and relevance ranking
- Adding evaluation datasets and benchmarks
- Enhancing citation formatting and source linking

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  <strong>JurisGPT</strong> — Citation-Grounded Legal Research for Indian Startups
</p>
