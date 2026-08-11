#!/usr/bin/env python3
"""
Build full-corpus dense Chroma indexes for the benchmark.

Creates two collections in data/vectors/chroma_db, both over the complete
local corpus (the same documents the lexical configurations retrieve from):

- ``jurisgpt_minilm_full``      all-MiniLM-L6-v2, 384d, cosine
- ``jurisgpt_inlegalbert_full`` law-ai/InLegalBERT, 768d CLS-pooled, cosine

The InLegalBERT document encoding mirrors the query-time encoding in
rag_pipeline.py exactly (CLS token, L2-normalised), so the benchmark's
``dense_inlegalbert`` configuration compares retrievers, not encodings.

Usage: python data/eval/build_dense_indexes.py [--only minilm|inlegalbert]
"""

from __future__ import annotations

import argparse
import importlib.util
import os
import time
from pathlib import Path
from typing import Any, Dict, List

EVAL_DIR = Path(__file__).resolve().parent
DATA_DIR = EVAL_DIR.parent

MINILM_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
INLEGALBERT_MODEL = "law-ai/InLegalBERT"
MINILM_COLLECTION = "jurisgpt_minilm_full"
INLEGALBERT_COLLECTION = "jurisgpt_inlegalbert_full"
INSERT_BATCH = 2000
# Tokenizers truncate at 256/512 tokens; slicing the raw text first just
# keeps tokenisation from chewing on megabyte statute records.
MAX_CHARS = 3000


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _pick_device() -> str:
    try:
        import torch
        if torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"


def _load_corpus() -> List[Dict[str, Any]]:
    os.environ.pop("DO_SPACES_BUCKET", None)
    rag_mod = _load_module("rag_pipeline", DATA_DIR / "rag_pipeline.py")
    rag = rag_mod.JurisGPTRAG(
        vector_store_type="lexical", llm_type="none", hybrid_search=False
    )
    if not rag.local_corpus:
        raise RuntimeError("Local corpus failed to load")
    print(f"Corpus loaded: {len(rag.local_corpus)} documents")
    return rag.local_corpus


def _doc_text(doc: Dict[str, Any]) -> str:
    return f"{doc.get('title', '')}\n{doc.get('content', '')}"[:MAX_CHARS]


def _doc_metadata(doc: Dict[str, Any]) -> Dict[str, Any]:
    meta = {
        key: doc.get(key)
        for key in ("title", "doc_type", "source", "section", "act", "url")
    }
    return {k: v for k, v in meta.items() if v is not None}


def _fresh_collection(client, name: str):
    try:
        client.delete_collection(name)
    except Exception:
        pass
    return client.create_collection(name, metadata={"hnsw:space": "cosine"})


def _build(collection, corpus, embed_fn, label: str) -> None:
    start = time.time()
    total = len(corpus)
    for offset in range(0, total, INSERT_BATCH):
        batch = corpus[offset:offset + INSERT_BATCH]
        texts = [_doc_text(d) for d in batch]
        collection.add(
            ids=[f"doc-{offset + i:06d}" for i in range(len(batch))],
            embeddings=embed_fn(texts),
            documents=texts,
            metadatas=[_doc_metadata(d) for d in batch],
        )
        done = offset + len(batch)
        rate = done / max(time.time() - start, 1e-6)
        print(f"  [{label}] {done}/{total} ({rate:.0f} docs/s)", flush=True)
    print(f"  [{label}] finished in {time.time() - start:.0f}s "
          f"({collection.count()} vectors)")


def _minilm_embed_fn(device: str):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(MINILM_MODEL, device=device)

    def embed(texts: List[str]) -> List[List[float]]:
        return model.encode(
            texts, batch_size=256, normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

    return embed


def _inlegalbert_embed_fn(device: str):
    import torch
    from transformers import AutoModel, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(INLEGALBERT_MODEL)
    model = AutoModel.from_pretrained(INLEGALBERT_MODEL).to(device)
    model.eval()

    def embed(texts: List[str]) -> List[List[float]]:
        out: List[List[float]] = []
        for i in range(0, len(texts), 24):
            encoded = tokenizer(
                texts[i:i + 24], padding=True, truncation=True,
                max_length=512, return_tensors="pt",
            ).to(device)
            with torch.no_grad():
                hidden = model(**encoded).last_hidden_state
            # CLS token + L2 normalise — must match InLegalBERTEmbeddings
            # in rag_pipeline.py, which encodes the queries at benchmark time.
            cls = torch.nn.functional.normalize(hidden[:, 0, :], p=2, dim=1)
            out.extend(cls.cpu().numpy().tolist())
        # The MPS caching allocator grows unbounded across batches (OOM'd a
        # full run on 16GB); flush it once per INSERT_BATCH of documents.
        if device == "mps":
            torch.mps.empty_cache()
        return out

    return embed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", choices=["minilm", "inlegalbert"], default=None)
    args = parser.parse_args()

    import chromadb
    from chromadb.config import Settings

    device = _pick_device()
    print(f"Embedding device: {device}")

    corpus = _load_corpus()
    client = chromadb.PersistentClient(
        path=str(DATA_DIR / "vectors" / "chroma_db"),
        settings=Settings(anonymized_telemetry=False),
    )

    if args.only in (None, "minilm"):
        collection = _fresh_collection(client, MINILM_COLLECTION)
        _build(collection, corpus, _minilm_embed_fn(device), "minilm")

    if args.only in (None, "inlegalbert"):
        collection = _fresh_collection(client, INLEGALBERT_COLLECTION)
        _build(collection, corpus, _inlegalbert_embed_fn(device), "inlegalbert")

    print("Done.")


if __name__ == "__main__":
    main()
