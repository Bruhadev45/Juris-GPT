#!/usr/bin/env python3
"""
Resume an interrupted InLegalBERT index build without rebuilding from zero.

build_dense_indexes.py inserts ids ``doc-{offset:06d}`` sequentially in
INSERT_BATCH chunks, so a killed run leaves a contiguous prefix in the
collection. This script appends only the missing suffix, reusing the build
script's corpus loader and encoder so the vectors are identical.

Usage: python data/eval/resume_inlegalbert.py
"""

from __future__ import annotations

import importlib.util
import time
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent


def _load_build_module():
    path = EVAL_DIR / "build_dense_indexes.py"
    spec = importlib.util.spec_from_file_location("build_dense_indexes", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load build_dense_indexes from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    build = _load_build_module()

    import chromadb
    from chromadb.config import Settings

    device = build._pick_device()
    print(f"Embedding device: {device}")

    corpus = build._load_corpus()
    total = len(corpus)

    client = chromadb.PersistentClient(
        path=str(build.DATA_DIR / "vectors" / "chroma_db"),
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_collection(build.INLEGALBERT_COLLECTION)
    done = collection.count()

    if done >= total:
        print(f"Nothing to do: {done}/{total} vectors already present")
        return
    # Ids must be the contiguous prefix doc-000000..doc-{done-1}; a gap means
    # the count can't be used as the resume offset.
    tail = collection.get(ids=[f"doc-{done - 1:06d}"])
    if not tail["ids"]:
        raise RuntimeError(
            f"Collection has {done} vectors but doc-{done - 1:06d} is missing "
            "— ids are not contiguous, refusing to resume by count"
        )

    print(f"Resuming at {done}/{total}")
    embed_fn = build._inlegalbert_embed_fn(device)
    start = time.time()
    for offset in range(done, total, build.INSERT_BATCH):
        batch = corpus[offset:offset + build.INSERT_BATCH]
        texts = [build._doc_text(d) for d in batch]
        collection.add(
            ids=[f"doc-{offset + i:06d}" for i in range(len(batch))],
            embeddings=embed_fn(texts),
            documents=texts,
            metadatas=[build._doc_metadata(d) for d in batch],
        )
        finished = offset + len(batch)
        rate = (finished - done) / max(time.time() - start, 1e-6)
        print(f"  [inlegalbert] {finished}/{total} ({rate:.0f} docs/s)", flush=True)

    print(f"Done: {collection.count()} vectors "
          f"(resumed {total - done} in {time.time() - start:.0f}s)")


if __name__ == "__main__":
    main()
