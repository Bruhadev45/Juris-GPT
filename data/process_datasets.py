#!/usr/bin/env python3
"""
JurisGPT Dataset Processor
Processes downloaded datasets into a unified format for RAG
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any
from tqdm import tqdm
import pandas as pd

BASE_DIR = Path(__file__).parent
DATASETS_DIR = BASE_DIR / "datasets"
PROCESSED_DIR = BASE_DIR / "processed"
PROCESSED_DIR.mkdir(exist_ok=True)


class LegalDocument:
    """Represents a processed legal document"""

    def __init__(
        self,
        doc_id: str,
        title: str,
        content: str,
        doc_type: str,
        metadata: Dict[str, Any] = None
    ):
        self.doc_id = doc_id
        self.title = title
        self.content = content
        self.doc_type = doc_type  # 'judgment', 'act', 'section', 'clause'
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "title": self.title,
            "content": self.content,
            "doc_type": self.doc_type,
            "metadata": self.metadata
        }


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence end within last 100 chars
            for i in range(min(100, end - start)):
                if text[end - i] in '.!?\n':
                    end = end - i + 1
                    break

        chunks.append(text[start:end].strip())
        start = end - overlap

    return chunks


def process_indian_law_json():
    """Process GitHub Indian Law JSON dataset"""
    print("\n📚 Processing Indian Law JSON...")

    source_dir = DATASETS_DIR / "indian_law_json"
    if not source_dir.exists():
        print("⚠️ Indian Law JSON not found. Run download_datasets.py first.")
        return []

    documents = []

    # Find JSON files recursively
    json_files = list(source_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")

    for json_file in tqdm(json_files, desc="Processing"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if isinstance(data, list):
                for i, item in enumerate(data):
                    if isinstance(item, dict):
                        doc = LegalDocument(
                            doc_id=f"indian_law_{json_file.stem}_{i}",
                            title=item.get('title', item.get('section', f'Section {i}')),
                            content=item.get('content', item.get('text', str(item))),
                            doc_type='section',
                            metadata={
                                'source': 'indian_law_json',
                                'file': json_file.name,
                                'act': item.get('act', json_file.stem)
                            }
                        )
                        documents.append(doc)
            elif isinstance(data, dict):
                doc = LegalDocument(
                    doc_id=f"indian_law_{json_file.stem}",
                    title=data.get('title', json_file.stem),
                    content=data.get('content', data.get('text', json.dumps(data))),
                    doc_type='act',
                    metadata={
                        'source': 'indian_law_json',
                        'file': json_file.name
                    }
                )
                documents.append(doc)
        except Exception as e:
            print(f"Error processing {json_file}: {e}")

    print(f"✅ Processed {len(documents)} documents from Indian Law JSON")
    return documents


def process_central_acts():
    """Process Zenodo Central Acts dataset"""
    print("\n📜 Processing Central Acts...")

    source_dir = DATASETS_DIR / "central_acts"
    if not source_dir.exists():
        print("⚠️ Central Acts not found. Run download_datasets.py first.")
        return []

    documents = []
    json_files = list(source_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")

    for json_file in tqdm(json_files, desc="Processing"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if isinstance(data, dict):
                title = data.get('title', data.get('act_title', json_file.stem))
                content = data.get('content', data.get('text', ''))

                # If content is a list of sections, join them
                if isinstance(content, list):
                    content = '\n\n'.join(str(c) for c in content)

                doc = LegalDocument(
                    doc_id=f"central_act_{json_file.stem}",
                    title=title,
                    content=content if content else json.dumps(data),
                    doc_type='act',
                    metadata={
                        'source': 'zenodo_central_acts',
                        'file': json_file.name,
                        'year': data.get('year', data.get('enactment_date', '')),
                        'act_number': data.get('act_number', '')
                    }
                )
                documents.append(doc)
        except Exception as e:
            print(f"Error processing {json_file}: {e}")

    print(f"✅ Processed {len(documents)} documents from Central Acts")
    return documents


def process_huggingface_datasets():
    """Process Hugging Face datasets"""
    print("\n🤗 Processing Hugging Face datasets...")

    documents = []

    # Process SC Judgments Chunked
    sc_path = DATASETS_DIR / "sc_judgments_chunked"
    if sc_path.exists():
        try:
            from datasets import load_from_disk
            dataset = load_from_disk(str(sc_path))

            # Handle different dataset structures
            if hasattr(dataset, 'keys'):
                for split in dataset.keys():
                    for i, item in enumerate(tqdm(dataset[split], desc=f"SC Judgments ({split})")):
                        content = item.get('text', item.get('chunk', item.get('content', '')))
                        if content:
                            doc = LegalDocument(
                                doc_id=f"sc_judgment_{split}_{i}",
                                title=item.get('title', item.get('case_name', f'SC Judgment {i}')),
                                content=content,
                                doc_type='judgment',
                                metadata={
                                    'source': 'huggingface_sc_judgments',
                                    'split': split,
                                    'citation': item.get('citation', ''),
                                    'date': item.get('date', '')
                                }
                            )
                            documents.append(doc)
            print(f"✅ Processed SC Judgments: {len(documents)} documents")
        except Exception as e:
            print(f"⚠️ Error processing SC Judgments: {e}")

    # Process Indian Legal dataset
    legal_path = DATASETS_DIR / "indian_legal"
    if legal_path.exists():
        try:
            from datasets import load_from_disk
            dataset = load_from_disk(str(legal_path))
            count_before = len(documents)

            if hasattr(dataset, 'keys'):
                for split in dataset.keys():
                    for i, item in enumerate(tqdm(dataset[split], desc=f"Indian Legal ({split})")):
                        content = item.get('text', item.get('content', ''))
                        if content:
                            doc = LegalDocument(
                                doc_id=f"indian_legal_{split}_{i}",
                                title=item.get('title', f'Legal Doc {i}'),
                                content=content,
                                doc_type=item.get('type', 'legal'),
                                metadata={
                                    'source': 'huggingface_indian_legal',
                                    'split': split
                                }
                            )
                            documents.append(doc)
            print(f"✅ Processed Indian Legal: {len(documents) - count_before} documents")
        except Exception as e:
            print(f"⚠️ Error processing Indian Legal: {e}")

    return documents


def process_kaggle_datasets():
    """Process Kaggle datasets"""
    print("\n📊 Processing Kaggle datasets...")

    documents = []
    kaggle_dir = DATASETS_DIR / "kaggle"

    if not kaggle_dir.exists():
        print("⚠️ Kaggle datasets not found. Run download_datasets.py first.")
        return []

    # Process SC Judgments
    for subdir in ['sc_judgments_1950_2024', 'sc_judgments_vangap']:
        sc_dir = kaggle_dir / subdir
        if sc_dir.exists():
            csv_files = list(sc_dir.glob("*.csv"))
            for csv_file in csv_files:
                try:
                    df = pd.read_csv(csv_file, encoding='utf-8', on_bad_lines='skip')
                    print(f"Processing {csv_file.name}: {len(df)} rows")

                    # Common column names for judgments
                    text_cols = ['text', 'judgment', 'content', 'body', 'judgment_text']
                    title_cols = ['title', 'case_name', 'case_title', 'name']

                    text_col = next((c for c in text_cols if c in df.columns), None)
                    title_col = next((c for c in title_cols if c in df.columns), None)

                    if text_col:
                        for i, row in tqdm(df.iterrows(), total=len(df), desc=csv_file.name):
                            content = str(row[text_col]) if pd.notna(row[text_col]) else ''
                            if len(content) > 100:  # Skip empty/short entries
                                title = str(row[title_col]) if title_col and pd.notna(row.get(title_col)) else f'Judgment {i}'
                                doc = LegalDocument(
                                    doc_id=f"kaggle_{subdir}_{i}",
                                    title=title,
                                    content=content,
                                    doc_type='judgment',
                                    metadata={
                                        'source': f'kaggle_{subdir}',
                                        'file': csv_file.name
                                    }
                                )
                                documents.append(doc)
                except Exception as e:
                    print(f"⚠️ Error processing {csv_file}: {e}")

    # Process Indian Companies data
    companies_dir = kaggle_dir / "indian_companies"
    if companies_dir.exists():
        csv_files = list(companies_dir.glob("*.csv"))
        for csv_file in csv_files:
            try:
                df = pd.read_csv(csv_file, encoding='utf-8', on_bad_lines='skip', nrows=10000)
                print(f"Processing {csv_file.name}: {len(df)} rows (limited to 10k for RAG)")

                # Save processed company data separately
                company_data_path = PROCESSED_DIR / "company_data.json"
                companies = df.to_dict('records')
                with open(company_data_path, 'w') as f:
                    json.dump(companies[:10000], f)
                print(f"✅ Saved company data to {company_data_path}")
            except Exception as e:
                print(f"⚠️ Error processing companies: {e}")

    print(f"✅ Processed {len(documents)} documents from Kaggle")
    return documents


def process_sample_data():
    """Process sample legal data"""
    print("\n📝 Processing sample legal data...")

    documents = []
    samples_dir = DATASETS_DIR / "samples"

    if not samples_dir.exists():
        print("⚠️ Sample data not found. Run download_datasets.py first.")
        return []

    # Process Companies Act sections
    sections_file = samples_dir / "companies_act_sections.json"
    if sections_file.exists():
        with open(sections_file, 'r') as f:
            sections = json.load(f)
        for i, section in enumerate(sections):
            doc = LegalDocument(
                doc_id=f"companies_act_section_{section.get('section', i)}",
                title=f"Companies Act 2013 - Section {section.get('section', i)}: {section.get('title', '')}",
                content=section.get('content', ''),
                doc_type='section',
                metadata={
                    'source': 'sample_data',
                    'act': 'Companies Act, 2013',
                    'section': section.get('section')
                }
            )
            documents.append(doc)

    # Process case summaries
    cases_file = samples_dir / "case_summaries.json"
    if cases_file.exists():
        with open(cases_file, 'r') as f:
            cases = json.load(f)
        for i, case in enumerate(cases):
            content = f"""
Case: {case.get('case_name', '')}
Citation: {case.get('citation', '')}
Court: {case.get('court', '')}
Legal Principle: {case.get('principle', '')}

Summary:
{case.get('summary', '')}

Relevance:
{case.get('relevance', '')}
""".strip()
            doc = LegalDocument(
                doc_id=f"case_summary_{i}",
                title=case.get('case_name', f'Case {i}'),
                content=content,
                doc_type='judgment',
                metadata={
                    'source': 'sample_data',
                    'citation': case.get('citation'),
                    'court': case.get('court'),
                    'principle': case.get('principle')
                }
            )
            documents.append(doc)

    # Process founder agreement clauses
    clauses_file = samples_dir / "founder_agreement_clauses.json"
    if clauses_file.exists():
        with open(clauses_file, 'r') as f:
            clauses = json.load(f)
        for i, clause in enumerate(clauses):
            content = f"""
Clause Type: {clause.get('clause_type', '')}
Standard Terms: {clause.get('standard_terms', '')}

Sample Text:
{clause.get('sample_text', '')}
""".strip()
            doc = LegalDocument(
                doc_id=f"founder_clause_{i}",
                title=f"Founder Agreement - {clause.get('clause_type', '')}",
                content=content,
                doc_type='clause',
                metadata={
                    'source': 'sample_data',
                    'clause_type': clause.get('clause_type')
                }
            )
            documents.append(doc)

    print(f"✅ Processed {len(documents)} documents from sample data")
    return documents


def save_processed_documents(documents: List[LegalDocument]):
    """Save all processed documents"""
    print(f"\n💾 Saving {len(documents)} processed documents...")

    # Save as JSON
    docs_json = [doc.to_dict() for doc in documents]
    json_path = PROCESSED_DIR / "all_documents.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(docs_json, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved to {json_path}")

    # Save chunked version for RAG
    print("\n🔪 Creating chunks for RAG...")
    chunks = []
    for doc in tqdm(documents, desc="Chunking"):
        doc_chunks = chunk_text(doc.content, chunk_size=1000, overlap=200)
        for i, chunk in enumerate(doc_chunks):
            chunks.append({
                "chunk_id": f"{doc.doc_id}_chunk_{i}",
                "doc_id": doc.doc_id,
                "title": doc.title,
                "content": chunk,
                "doc_type": doc.doc_type,
                "metadata": doc.metadata,
                "chunk_index": i,
                "total_chunks": len(doc_chunks)
            })

    chunks_path = PROCESSED_DIR / "all_chunks.json"
    with open(chunks_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {len(chunks)} chunks to {chunks_path}")

    # Save summary
    summary = {
        "total_documents": len(documents),
        "total_chunks": len(chunks),
        "doc_types": {},
        "sources": {}
    }
    for doc in documents:
        summary["doc_types"][doc.doc_type] = summary["doc_types"].get(doc.doc_type, 0) + 1
        source = doc.metadata.get('source', 'unknown')
        summary["sources"][source] = summary["sources"].get(source, 0) + 1

    summary_path = PROCESSED_DIR / "processing_summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"✅ Summary saved to {summary_path}")

    return chunks


def main():
    print("="*60)
    print("🔄 JurisGPT Dataset Processor")
    print("="*60)

    all_documents = []

    # Process all datasets
    all_documents.extend(process_sample_data())
    all_documents.extend(process_indian_law_json())
    all_documents.extend(process_central_acts())
    all_documents.extend(process_huggingface_datasets())
    all_documents.extend(process_kaggle_datasets())

    if all_documents:
        chunks = save_processed_documents(all_documents)
        print("\n" + "="*60)
        print("✅ Processing Complete!")
        print("="*60)
        print(f"Total documents: {len(all_documents)}")
        print(f"Total chunks: {len(chunks)}")
        print(f"\nNext step: python build_vector_store.py")
    else:
        print("\n⚠️ No documents found. Run download_datasets.py first.")


if __name__ == "__main__":
    main()
