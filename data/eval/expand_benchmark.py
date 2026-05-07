#!/usr/bin/env python3
"""Auto-generate additional benchmark queries from the indexed corpus.

The script samples distinct ``(act, section, doc_type)`` triples from the
indexed local corpus and templates natural-language queries. Generated
entries carry ``"source": "auto"`` so they can be cleanly separated from
human-authored queries.

Output: ``data/eval/benchmark_queries_expanded.json``. The original
benchmark file is NOT overwritten.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import random
from pathlib import Path
from typing import Dict, List, Set

DATA_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = DATA_DIR / "eval"
SRC_BENCHMARK = EVAL_DIR / "benchmark_queries.json"
DST_BENCHMARK = EVAL_DIR / "benchmark_queries_expanded.json"


STATUTE_TEMPLATES = [
    "What does Section {section} of {act} cover?",
    "Explain Section {section} of {act}.",
    "What is the legal effect of Section {section} of {act}?",
    "Summarise Section {section} of {act}.",
    "When does Section {section} of {act} apply?",
]

CASE_TEMPLATES = [
    "What is the principle established in {case_name}?",
    "Summarise the holding in {case_name}.",
    "What are the implications of {case_name}?",
]

CLAUSE_TEMPLATES = [
    "What is a {clause_type} clause in a founder agreement?",
    "How is the {clause_type} clause typically drafted?",
]

FAQ_TEMPLATES = [
    "{question}",
]


def _load_rag():
    spec = importlib.util.spec_from_file_location(
        "rag_pipeline", DATA_DIR / "rag_pipeline.py"
    )
    assert spec and spec.loader
    rag_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rag_module)
    os.environ.pop("DO_SPACES_BUCKET", None)
    return rag_module.JurisGPTRAG(
        vector_store_type="lexical", llm_type="none", hybrid_search=True
    )


def _generate_statute_queries(rag, n: int, rng: random.Random) -> List[Dict]:
    """Sample (act, section) pairs from the curated sample statutes only.

    We deliberately avoid the 47k HuggingFace statute chunks because their
    "section" field is often the full Act title rather than a section
    number, and the act text is too generic for templated questions to be
    answerable.
    """
    candidates = []
    for doc in rag.local_corpus:
        if doc.get("doc_type") != "statute":
            continue
        section = doc.get("section")
        act = doc.get("act")
        if not section or not act or not isinstance(section, (str, int)):
            continue
        if str(section).strip() == "" or str(section).isdigit() is False:
            # Restrict to numeric section numbers — the templates assume that.
            try:
                int(str(section))
            except (TypeError, ValueError):
                continue
        candidates.append((act, str(section), doc))

    seen: Set[tuple] = set()
    out: List[Dict] = []
    rng.shuffle(candidates)
    for act, section, doc in candidates:
        key = (act, section)
        if key in seen:
            continue
        seen.add(key)
        template = rng.choice(STATUTE_TEMPLATES)
        query = template.format(act=act, section=section)
        out.append({
            "id": f"AS-{len(out) + 1:03d}",
            "category": "auto_statute",
            "query": query,
            "expected_doc_types": ["statute"],
            "expected_acts": [act],
            "source": "auto",
            "template": template,
            "evidence_title": doc.get("title", ""),
        })
        if len(out) >= n:
            break
    return out


def _generate_case_queries(rag, n: int, rng: random.Random) -> List[Dict]:
    out = []
    cases = [
        doc for doc in rag.local_corpus
        if doc.get("doc_type") == "case"
        and doc.get("metadata", {}).get("case_name")
    ]
    rng.shuffle(cases)
    for doc in cases[:n]:
        meta = doc.get("metadata", {})
        case_name = meta["case_name"]
        out.append({
            "id": f"AC-{len(out) + 1:03d}",
            "category": "auto_case",
            "query": rng.choice(CASE_TEMPLATES).format(case_name=case_name),
            "expected_doc_types": ["case"],
            "expected_acts": [],
            "source": "auto",
            "evidence_title": doc.get("title", ""),
        })
    return out


def _generate_clause_queries(rag, n: int, rng: random.Random) -> List[Dict]:
    out = []
    clauses = [
        doc for doc in rag.local_corpus
        if doc.get("doc_type") == "clause"
        and doc.get("metadata", {}).get("clause_type")
    ]
    rng.shuffle(clauses)
    for doc in clauses[:n]:
        clause_type = doc["metadata"]["clause_type"]
        out.append({
            "id": f"AL-{len(out) + 1:03d}",
            "category": "auto_clause",
            "query": rng.choice(CLAUSE_TEMPLATES).format(clause_type=clause_type.lower()),
            "expected_doc_types": ["clause"],
            "expected_acts": [],
            "source": "auto",
            "evidence_title": doc.get("title", ""),
        })
    return out


def _generate_faq_queries(rag, n: int, rng: random.Random) -> List[Dict]:
    out = []
    faqs = [
        doc for doc in rag.local_corpus
        if doc.get("doc_type") == "faq"
        and doc.get("metadata", {}).get("question")
    ]
    rng.shuffle(faqs)
    for doc in faqs[:n]:
        out.append({
            "id": f"AF-{len(out) + 1:03d}",
            "category": "auto_faq",
            "query": doc["metadata"]["question"],
            "expected_doc_types": ["faq"],
            "expected_acts": doc["metadata"].get("related_laws", []) or [],
            "source": "auto",
            "evidence_title": doc.get("title", ""),
        })
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=20260503)
    parser.add_argument("--n-statute", type=int, default=40)
    parser.add_argument("--n-case", type=int, default=20)
    parser.add_argument("--n-clause", type=int, default=4)
    parser.add_argument("--n-faq", type=int, default=20)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    rag = _load_rag()

    src = json.loads(SRC_BENCHMARK.read_text())
    base_queries = src.get("queries", [])
    base_categories = src.get("categories", [])

    # Mark every existing query as human-authored so the provenance survives.
    for entry in base_queries:
        entry.setdefault("source", "human")

    auto_queries = (
        _generate_statute_queries(rag, args.n_statute, rng)
        + _generate_case_queries(rag, args.n_case, rng)
        + _generate_clause_queries(rag, args.n_clause, rng)
        + _generate_faq_queries(rag, args.n_faq, rng)
    )

    expanded = {
        "version": src.get("version", "1.0") + "+auto",
        "description": (
            f"{src.get('description', 'JurisGPT benchmark')} — extended with "
            f"{len(auto_queries)} auto-generated queries (seed={args.seed})."
        ),
        "categories": list(dict.fromkeys(
            base_categories + sorted({q["category"] for q in auto_queries})
        )),
        "queries": base_queries + auto_queries,
        "provenance": {
            "human_authored": len(base_queries),
            "auto_generated": len(auto_queries),
            "seed": args.seed,
            "auto_breakdown": {
                "auto_statute": args.n_statute,
                "auto_case": args.n_case,
                "auto_clause": args.n_clause,
                "auto_faq": args.n_faq,
            },
        },
    }
    DST_BENCHMARK.write_text(json.dumps(expanded, indent=2, ensure_ascii=False))
    print(
        f"Expanded benchmark: {len(base_queries)} human + "
        f"{len(auto_queries)} auto → {DST_BENCHMARK}"
    )


if __name__ == "__main__":
    main()
