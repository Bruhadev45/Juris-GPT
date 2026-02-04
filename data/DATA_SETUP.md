# Data Setup Guide

## Quick Start

After cloning the repository, download the required datasets:

```bash
cd data
python3 download_datasets.py
```

## What Gets Downloaded

### 1. Indian Law JSON (Required) ✅
- **Source:** GitHub - civictech-India/Indian-Law-Penal-Code-Json
- **Size:** ~12K lines total
- **Files:** 8 JSON files (CPC, IPC, CRPC, HMA, IDA, IEA, NIA, MVA)
- **Location:** `datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/`
- **Status:** Already included in git (small files)

### 2. Indian Legal Dataset (Optional - Large)
- **Source:** Hugging Face - ninadn/indian-legal
- **Size:** ~213 MB download, ~427 MB processed
- **Files:** Arrow format (train + test splits)
- **Location:** `datasets/indian_legal/`
- **Status:** Excluded from git (too large)
- **Use:** For RAG pipeline, ML training

### 3. Sample Datasets (Included)
- **Case Summaries:** `datasets/samples/case_summaries.json`
- **Companies Act:** `datasets/samples/companies_act_sections.json`
- **Founder Clauses:** `datasets/samples/founder_agreement_clauses.json`
- **Status:** Already in repository

## Manual Download (If Script Fails)

### Indian Law JSON
```bash
cd data/raw
wget https://github.com/civictech-India/Indian-Law-Penal-Code-Json/archive/refs/heads/master.zip
unzip master.zip -d ../datasets/indian_law_json/
```

### Indian Legal Dataset
```python
from datasets import load_dataset
dataset = load_dataset("ninadn/indian-legal")
dataset.save_to_disk("data/datasets/indian_legal")
```

## Verify Installation

```bash
# Check Indian law files
ls -lh data/datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/*.json

# Check sample files
ls -lh data/datasets/samples/*.json

# Count sections
find data/datasets/indian_law_json -name "*.json" -exec jq 'length' {} \;
```

## Expected Results

After setup, you should have:
- ✅ 8 Indian law JSON files (~2,214 sections total)
- ✅ 3 sample JSON files
- ✅ Dataset metadata files
- ⚠️ Large arrow files (optional, for RAG)

## Troubleshooting

### Missing JSON Files
```bash
cd data
python3 download_datasets.py
```

### Permission Errors
```bash
chmod +x data/download_datasets.py
```

### Python Dependencies
```bash
pip install -r data/requirements.txt
```

## Notes

- Large dataset files (`.arrow`) are **not** in git
- Download them separately if needed for RAG
- JSON law files are small and included in repository
- All data is publicly available legal information
