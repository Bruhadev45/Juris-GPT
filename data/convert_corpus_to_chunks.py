#!/usr/bin/env python3
"""
Convert hf_legal_corpus.json to all_chunks.json format
Adds required chunk_id and doc_id fields
"""

import json
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "processed"

def generate_doc_id(title: str, source: str) -> str:
    """Generate unique doc_id from title and source"""
    content = f"{title}:{source}"
    return hashlib.md5(content.encode()).hexdigest()[:16]

def generate_chunk_id(doc_id: str, chunk_index: int) -> str:
    """Generate unique chunk_id"""
    return f"{doc_id}_chunk_{chunk_index}"

def main():
    corpus_path = PROCESSED_DIR / "hf_legal_corpus.json"
    output_path = PROCESSED_DIR / "all_chunks.json"

    print(f"Loading corpus from {corpus_path}...")
    with open(corpus_path, 'r', encoding='utf-8') as f:
        corpus = json.load(f)

    print(f"Converting {len(corpus)} records...")
    chunks = []

    for record in corpus:
        doc_id = generate_doc_id(record['title'], record['source'])
        chunk_id = generate_chunk_id(doc_id, record['chunk_index'])

        chunk = {
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "title": record['title'],
            "content": record['content'],
            "doc_type": record['doc_type'],
            "chunk_index": record['chunk_index'],
            "total_chunks": record['total_chunks'],
            "metadata": {
                "source": record['source'],
                "section": record.get('section'),
                "act": record.get('act'),
                **record.get('metadata', {})
            }
        }
        chunks.append(chunk)

    print(f"Saving {len(chunks)} chunks to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"✅ Conversion complete!")
    print(f"📁 Output: {output_path}")
    print(f"📊 Total chunks: {len(chunks)}")

if __name__ == "__main__":
    main()
