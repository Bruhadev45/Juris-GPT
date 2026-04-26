#!/usr/bin/env python3
"""
JurisGPT research experiment runner.

Runs comparable retrieval/RAG variants against data/eval/benchmark_queries.json
and writes a compact cross-variant summary under research/results/.

This script intentionally reports automatic metrics only. Human correctness,
hallucination labels, and inter-annotator agreement must come from a separate
annotation workflow.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

RESEARCH_DIR = Path(__file__).parent
PROJECT_DIR = RESEARCH_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
EVAL_DIR = DATA_DIR / "eval"
RESULTS_DIR = RESEARCH_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to import {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _build_rag(variant: str):
    rag_module = _load_module("rag_pipeline", DATA_DIR / "rag_pipeline.py")
    JurisGPTRAG = rag_module.JurisGPTRAG

    if variant == "lexical":
        return JurisGPTRAG(vector_store_type="lexical", llm_type="none")
    if variant == "lexical_hybrid":
        return JurisGPTRAG(vector_store_type="lexical", llm_type="none", hybrid_search=True)
    if variant == "lexical_hybrid_rerank":
        return JurisGPTRAG(
            vector_store_type="lexical",
            llm_type="none",
            hybrid_search=True,
            use_reranker=True,
        )
    if variant == "configured_rag":
        return JurisGPTRAG()

    raise ValueError(f"Unknown variant: {variant}")


def _write_summary(results: list[dict[str, Any]]) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = RESULTS_DIR / f"baseline_summary_{timestamp}.json"
    rows = []

    for result in results:
        aggregate = result["aggregate"]
        rows.append({
            "variant": result["variant"],
            "queries": result["total_queries"],
            "recall_at_5": aggregate["recall_at_5"],
            "precision_at_5": aggregate["precision_at_5"],
            "mrr": aggregate["mrr"],
            "ndcg_at_5": aggregate["ndcg_at_5"],
            "groundedness_rate": aggregate["groundedness_rate"],
            "hallucination_proxy_rate": aggregate["hallucination_proxy_rate"],
            "avg_response_time": aggregate["avg_response_time"],
            "rag_config": result["rag_config"],
        })

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "methodology_note": (
            "These are automatic retrieval/RAG metrics. Do not present them as "
            "human legal correctness or hallucination labels."
        ),
        "variants": rows,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    markdown_path = path.with_suffix(".md")
    lines = [
        "# JurisGPT Baseline Summary",
        "",
        f"Generated: {payload['timestamp']}",
        "",
        "| Variant | Queries | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Avg Time |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in rows:
        lines.append(
            f"| {row['variant']} | {row['queries']} | "
            f"{row['recall_at_5']:.2%} | {row['precision_at_5']:.2%} | "
            f"{row['mrr']:.4f} | {row['ndcg_at_5']:.4f} | "
            f"{row['groundedness_rate']:.2%} | {row['hallucination_proxy_rate']:.2%} | "
            f"{row['avg_response_time']:.3f}s |"
        )
    lines.extend([
        "",
        "## Methodology Note",
        "",
        payload["methodology_note"],
        "",
    ])
    markdown_path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run JurisGPT research baselines")
    parser.add_argument(
        "--variants",
        nargs="*",
        default=["lexical", "lexical_hybrid"],
        choices=["lexical", "lexical_hybrid", "lexical_hybrid_rerank", "configured_rag"],
    )
    parser.add_argument("--max-queries", type=int, help="Limit query count for quick experiments")
    parser.add_argument("--quick", action="store_true", help="Run only 10 queries")
    args = parser.parse_args()

    evaluator = _load_module("evaluator", EVAL_DIR / "evaluator.py")
    max_queries = 10 if args.quick else args.max_queries

    results = []
    for variant in args.variants:
        print(f"\n=== Running variant: {variant} ===")
        rag = _build_rag(variant)
        result = evaluator.run_evaluation(rag=rag, max_queries=max_queries)
        result["variant"] = variant
        results.append(result)

    summary_path = _write_summary(results)
    print(f"\nBaseline summary saved to: {summary_path}")
    print(f"Markdown summary saved to: {summary_path.with_suffix('.md')}")


if __name__ == "__main__":
    main()
