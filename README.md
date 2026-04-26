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

JurisGPT is designed as a research system with reproducible configurations and evaluation.

### Research Corpus

| Dataset | Source | Documents | Purpose |
|---------|--------|-----------|---------|
| Indian Penal Code (IPC) | Government | 511 sections | Criminal law reference |
| Code of Criminal Procedure (CrPC) | Government | 484 sections | Criminal procedure |
| Code of Civil Procedure (CPC) | Government | 158 sections | Civil procedure |
| Indian Evidence Act (IEA) | Government | 167 sections | Evidence rules |
| Companies Act, 2013 | Government | 470 sections | Corporate law |
| Motor Vehicles Act (MVA) | Government | 223 sections | Traffic law |
| Supreme Court Judgments | OpenNyAI | 1,000+ cases | Case law |
| High Court Cases | OpenNyAI | 500+ cases | State-level precedents |

**Total**: 3,171 indexed documents, 15.2 GB raw data

### Evaluation Metrics

The system is evaluated on:

| Metric | Description | Target |
|--------|-------------|--------|
| **Retrieval Recall@5** | Relevant documents in top 5 | > 80% |
| **Citation Precision** | Accuracy of cited sources | > 90% |
| **Hallucination Rate** | Unsupported claims | < 5% |
| **Response Latency** | P95 response time | < 3s |
| **Groundedness Score** | Claims supported by sources | > 85% |

### Configuration Files

Research configurations are versioned in `research/configs/`:

```yaml
# research/configs/legal_assistant_v1.yaml
corpus_version: "2024-03"
embedding_model: "sentence-transformers/all-MiniLM-L6-v2"
chunk_size: 1000
chunk_overlap: 200
retriever_top_k: 5
reranker_enabled: false
llm_model: "gpt-4o-mini"
llm_temperature: 0.3
prompt_version: "v2.0"
```

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
