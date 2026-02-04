# JurisGPT RAG Pipeline

AI-powered legal knowledge base using Retrieval-Augmented Generation (RAG) for Indian law.

## Quick Start

```bash
# One-click setup
python setup_rag.py

# Or step by step:
pip install -r requirements.txt
python download_datasets.py
python process_datasets.py
python build_vector_store.py --test
```

## Directory Structure

```
data/
├── datasets/           # Downloaded datasets
│   ├── api_configs/    # API configuration files
│   ├── samples/        # Sample legal data
│   ├── indian_law_json/    # GitHub: Indian Law JSON
│   ├── central_acts/   # Zenodo: Central Acts
│   ├── sc_judgments_chunked/   # HuggingFace: SC Judgments
│   └── kaggle/         # Kaggle datasets
├── processed/          # Processed documents
│   ├── all_documents.json
│   └── all_chunks.json
├── vectors/            # Vector store
│   └── chroma_db/      # ChromaDB embeddings
├── raw/                # Raw downloaded files
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── *.py                # Pipeline scripts
```

## Scripts

| Script | Description |
|--------|-------------|
| `setup_rag.py` | One-click setup for everything |
| `download_datasets.py` | Download all datasets |
| `process_datasets.py` | Process and chunk documents |
| `build_vector_store.py` | Build vector embeddings |
| `rag_pipeline.py` | Main RAG pipeline & chatbot |

## Data Sources

### Free Datasets (Auto-downloaded)

| Source | Content | Format |
|--------|---------|--------|
| GitHub | Indian Law (IPC, MVA) | JSON |
| Zenodo | 858 Central Acts | JSON |
| HuggingFace | SC Judgments (chunked) | Parquet |
| HuggingFace | Indian Legal corpus | Parquet |
| Sample Data | Companies Act, Cases | JSON |

### Optional Datasets (Require Auth)

| Source | Content | Setup |
|--------|---------|-------|
| Kaggle | 1.99M Companies, SC Judgments | ~/.kaggle/kaggle.json |
| data.gov.in | 17M+ Companies | Manual download |

## API Keys Required

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### Required
- **OPENAI_API_KEY** - For GPT responses and embeddings

### Optional
- **KAGGLE_KEY** - For Kaggle dataset downloads
- **INDIAN_KANOON_API_KEY** - For live legal search
- **HUGGINGFACE_TOKEN** - For private datasets

## Usage

### CLI Interactive Mode

```bash
python rag_pipeline.py --interactive
```

### Python API

```python
from rag_pipeline import JurisGPTRAG

rag = JurisGPTRAG()
response = rag.query("What is Section 7 of Companies Act?")
print(response.answer)
```

### FastAPI Integration

The chatbot is integrated with the backend:

```bash
# Start backend
cd ../backend
uvicorn app.main:app --reload

# API endpoint
POST http://localhost:8000/api/chat/message
{
    "message": "How do I incorporate a company in India?"
}
```

## Features

- **Legal Q&A** - Answer questions about Indian law
- **Case Law Search** - Find relevant judgments
- **Statute Lookup** - Reference specific sections
- **Document Assistance** - Help with legal documents
- **Source Citations** - All answers cite sources

## Supported Legal Topics

- Company Formation (Companies Act, 2013)
- Founder Agreements
- Equity Vesting
- Non-Compete Clauses
- IP Assignment
- Dispute Resolution
- Corporate Compliance
- Case Law Precedents

## Troubleshooting

### "Vector store not found"
Run the setup scripts:
```bash
python download_datasets.py
python process_datasets.py
python build_vector_store.py
```

### "OPENAI_API_KEY not set"
The pipeline works in retrieval-only mode without OpenAI. For full functionality:
```bash
export OPENAI_API_KEY=your_key_here
```

### Kaggle authentication error
```bash
# 1. Download kaggle.json from https://www.kaggle.com/settings
# 2. Save to ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```

## License

This RAG pipeline is part of JurisGPT. Data sources have their own licenses - check individual datasets for terms.
