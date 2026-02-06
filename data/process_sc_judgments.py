#!/usr/bin/env python3
"""
Process Supreme Court Judgment PDFs for RAG
"""

import json
from pathlib import Path
from tqdm import tqdm
import re

BASE_DIR = Path(__file__).parent
SC_DIR = BASE_DIR / "datasets/kaggle/sc_judgments/supreme_court_judgments"
PROCESSED_DIR = BASE_DIR / "processed"

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from PDF using pypdf"""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(pdf_path))
        text = ""
        for page in reader.pages[:20]:  # Limit to first 20 pages
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return ""

def parse_case_name(filename: str) -> dict:
    """Parse case name from filename"""
    # Format: Party1_vs_Party2_on_Date.PDF
    name = filename.replace(".PDF", "").replace(".pdf", "")
    parts = name.split("_on_")

    case_name = parts[0].replace("_", " ") if parts else name
    date = parts[1].replace("_", " ") if len(parts) > 1 else ""

    return {
        "case_name": case_name,
        "date": date,
        "filename": filename
    }

def process_year(year: str, max_cases: int = 100) -> list:
    """Process judgments from a specific year"""
    year_dir = SC_DIR / year
    if not year_dir.exists():
        return []

    documents = []
    pdf_files = list(year_dir.glob("*.PDF")) + list(year_dir.glob("*.pdf"))

    for pdf_file in tqdm(pdf_files[:max_cases], desc=f"Year {year}"):
        text = extract_text_from_pdf(pdf_file)
        if len(text) < 500:  # Skip if too short
            continue

        case_info = parse_case_name(pdf_file.name)

        doc = {
            "doc_id": f"sc_{year}_{pdf_file.stem}",
            "title": case_info["case_name"],
            "content": text[:10000],  # Limit content size
            "doc_type": "judgment",
            "metadata": {
                "source": "kaggle_sc_judgments",
                "year": year,
                "date": case_info["date"],
                "court": "Supreme Court of India",
                "filename": pdf_file.name
            }
        }
        documents.append(doc)

    return documents

def main():
    print("="*60)
    print("📜 Processing Supreme Court Judgments")
    print("="*60)

    # Process recent years (more relevant)
    years_to_process = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"]
    max_per_year = 50  # Limit per year for manageable size

    all_docs = []

    for year in years_to_process:
        docs = process_year(year, max_per_year)
        all_docs.extend(docs)
        print(f"  {year}: {len(docs)} judgments processed")

    print(f"\n✅ Total SC judgments processed: {len(all_docs)}")

    # Save to processed folder
    output_path = PROCESSED_DIR / "sc_judgments.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_docs, f, ensure_ascii=False, indent=2)

    print(f"📁 Saved to {output_path}")

    # Also append to main chunks file
    chunks_path = PROCESSED_DIR / "all_chunks.json"
    if chunks_path.exists():
        with open(chunks_path, 'r') as f:
            existing_chunks = json.load(f)

        # Create chunks from SC judgments
        new_chunks = []
        for doc in all_docs:
            # Simple chunking - split by ~1000 chars
            content = doc["content"]
            chunk_size = 1000
            for i in range(0, len(content), chunk_size - 200):
                chunk_text = content[i:i + chunk_size]
                if len(chunk_text) < 200:
                    continue
                new_chunks.append({
                    "chunk_id": f"{doc['doc_id']}_chunk_{i//chunk_size}",
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "content": chunk_text,
                    "doc_type": "judgment",
                    "metadata": doc["metadata"],
                    "chunk_index": i // chunk_size,
                    "total_chunks": (len(content) // chunk_size) + 1
                })

        # Combine and save
        all_chunks = existing_chunks + new_chunks
        with open(chunks_path, 'w', encoding='utf-8') as f:
            json.dump(all_chunks, f, ensure_ascii=False, indent=2)

        print(f"✅ Added {len(new_chunks)} chunks to {chunks_path}")
        print(f"📊 Total chunks now: {len(all_chunks)}")

if __name__ == "__main__":
    main()
