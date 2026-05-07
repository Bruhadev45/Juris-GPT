#!/usr/bin/env python3
"""Attempt to load the IL-TUR statute-retrieval split as an external benchmark.

Reference: Bhattacharya, P., Paul, S., Ghosh, K., Ghosh, S., & Wyner, A.
(2024). IL-TUR: Benchmark for Indian Legal Text Understanding and
Reasoning. https://huggingface.co/datasets/Exploration-Lab/IL-TUR

The script tries multiple known IL-TUR-like dataset IDs because the public
release name has shifted between papers and Hub re-uploads. If none load,
it exits 0 with instructions — the rest of the pipeline keeps moving.

When successful, it converts the IL-TUR split into the JurisGPT
``benchmark_queries.json`` schema and writes it to
``data/eval/benchmark_il_tur.json``.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Iterable, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent
OUT_PATH = DATA_DIR / "eval" / "benchmark_il_tur.json"

CANDIDATE_DATASETS = [
    ("Exploration-Lab/IL-TUR", "statute_retrieval"),
    ("Exploration-Lab/IL-TUR-StatuteRetrieval", None),
    ("opennyaiorg/il_tur_statute_retrieval", None),
]


def _try_loader(dataset_id: str, subset: Optional[str]) -> Optional[Iterable]:
    """Try one HuggingFace dataset id; return iterable rows or None."""
    try:
        from datasets import load_dataset  # type: ignore
    except ImportError:
        print("datasets library not installed", file=sys.stderr)
        return None
    try:
        ds = load_dataset(dataset_id, subset, split="test") if subset else load_dataset(dataset_id, split="test")
        return list(ds)
    except Exception as exc:
        print(f"  {dataset_id}/{subset}: {exc.__class__.__name__}: {str(exc)[:140]}",
              file=sys.stderr)
        return None


def _convert(rows: Iterable, source_id: str) -> List[dict]:
    out: List[dict] = []
    for i, row in enumerate(rows, 1):
        # IL-TUR rows are dicts; we accept many possible field names so
        # this works against multiple Hub re-uploads.
        query = (
            row.get("query") or row.get("question") or row.get("text") or
            row.get("input") or ""
        )
        expected_acts = row.get("relevant_acts") or row.get("acts") or []
        out.append({
            "id": f"IL-{i:04d}",
            "category": "il_tur_statute_retrieval",
            "query": query,
            "expected_doc_types": ["statute"],
            "expected_acts": expected_acts if isinstance(expected_acts, list) else [expected_acts],
            "source": "il_tur",
            "external_dataset": source_id,
        })
    return out


def main() -> None:
    print("Attempting to load IL-TUR statute-retrieval split…")
    for dataset_id, subset in CANDIDATE_DATASETS:
        rows = _try_loader(dataset_id, subset)
        if rows:
            converted = _convert(rows, dataset_id)
            payload = {
                "version": "1.0-il-tur",
                "description": (
                    f"IL-TUR statute-retrieval split, converted to JurisGPT "
                    f"benchmark schema (source: {dataset_id})."
                ),
                "categories": ["il_tur_statute_retrieval"],
                "queries": converted,
            }
            OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
            print(
                f"OK: loaded {len(converted)} queries from {dataset_id}; "
                f"wrote {OUT_PATH}"
            )
            return
    print(
        "\nIL-TUR could not be auto-loaded.\n"
        "Manual fallback:\n"
        "  1. Visit https://huggingface.co/datasets/Exploration-Lab/IL-TUR\n"
        "  2. Download the statute-retrieval split.\n"
        "  3. Convert each row to the JurisGPT schema "
        "(query, expected_doc_types=['statute'], expected_acts=[...]).\n"
        f"  4. Save the JSON at {OUT_PATH}.\n"
        "The benchmark harness picks it up automatically.\n"
        "(Exiting 0 — the rest of the pipeline can still proceed.)"
    )


if __name__ == "__main__":
    sys.exit(main() or 0)
