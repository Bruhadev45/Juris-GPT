#!/usr/bin/env python3
"""Run the JurisGPT 120-query benchmark across the three paper configurations.

Configurations evaluated (per RESEARCH_PAPER_BLUEPRINT.md, Section 12):

    1. ``baseline_lexical``        — token-coverage lexical retrieval only.
    2. ``hybrid_bm25``             — BM25 + lexical fused with weighted RRF.
    3. ``hybrid_bm25_rerank``      — hybrid_bm25 + cross-encoder re-ranking.

Each configuration shares the same underlying corpus and benchmark, so the
metrics are directly comparable. Results land in ``data/eval/results/`` as
``eval_<config>_<timestamp>.json`` plus a Markdown report.

Run:
    python data/eval/run_paper_benchmarks.py            # all 120 queries
    python data/eval/run_paper_benchmarks.py --quick    # first 12 queries
    python data/eval/run_paper_benchmarks.py --configs baseline_lexical
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import logging
import os
import sys
import time
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Silence chatty libraries during evaluation runs.
logging.getLogger("chromadb").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.ERROR)

EVAL_DIR = Path(__file__).resolve().parent
DATA_DIR = EVAL_DIR.parent
RESULTS_DIR = EVAL_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


RAG_MOD = _load_module("rag_pipeline", DATA_DIR / "rag_pipeline.py")
EVAL_MOD = _load_module("evaluator", EVAL_DIR / "evaluator.py")


@dataclass(frozen=True)
class RAGConfig:
    """Reproducible RAG configuration for a benchmark run."""

    name: str
    description: str
    hybrid_search: bool
    use_reranker: bool
    vector_store_type: str = "lexical"  # "lexical" | "chroma"


PAPER_CONFIGS: Dict[str, RAGConfig] = {
    "baseline_lexical": RAGConfig(
        name="baseline_lexical",
        description="Token-coverage lexical retrieval only (no BM25, no rerank)",
        hybrid_search=False,
        use_reranker=False,
    ),
    "hybrid_bm25": RAGConfig(
        name="hybrid_bm25",
        description="BM25 + lexical fused via weighted Reciprocal Rank Fusion",
        hybrid_search=True,
        use_reranker=False,
    ),
    "hybrid_bm25_rerank": RAGConfig(
        name="hybrid_bm25_rerank",
        description="Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank",
        hybrid_search=True,
        use_reranker=False,  # set programmatically; field kept for compatibility
    ),
    "dense_minilm": RAGConfig(
        name="dense_minilm",
        description=(
            "Dense neural retrieval over the 28k-vector Chroma store "
            "(all-MiniLM-L6-v2, 384d)"
        ),
        hybrid_search=False,
        use_reranker=False,
        vector_store_type="chroma",
    ),
    "dense_minilm_rerank": RAGConfig(
        name="dense_minilm_rerank",
        description=(
            "Dense MiniLM retrieval + ms-marco-MiniLM-L-6-v2 cross-encoder re-rank"
        ),
        hybrid_search=False,
        use_reranker=True,
        vector_store_type="chroma",
    ),
}

# Override the rerank flag for the rerank configurations after dataclass
# construction (kept as an explicit dict so that the source of truth lives in
# one place and the dataclass remains frozen).
PAPER_CONFIGS["hybrid_bm25_rerank"] = RAGConfig(
    name="hybrid_bm25_rerank",
    description="Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank",
    hybrid_search=True,
    use_reranker=True,
)


def _build_rag_for_config(config: RAGConfig, *, force_lexical: bool):
    """Construct a fresh RAG instance for the given configuration.

    The vector-store choice is taken from the config itself so that lexical
    and dense baselines can coexist in one benchmark run. ``force_lexical``
    is honoured only for configs that did not explicitly request a vector
    store (kept for backward compatibility with single-config CLI invocations).
    """
    os.environ.pop("DO_SPACES_BUCKET", None)
    os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")

    if config.use_reranker:
        os.environ["RAG_USE_RERANKER"] = "true"
    else:
        os.environ.pop("RAG_USE_RERANKER", None)

    if config.vector_store_type == "chroma":
        # Match the existing 28k-vector Chroma store, which was built with
        # all-MiniLM-L6-v2 (384d). Using InLegalBERT here would crash at
        # query time (dim mismatch).
        os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-MiniLM-L6-v2"
        store_type = "chroma"
    else:
        store_type = "lexical" if force_lexical else "chroma"

    rag = RAG_MOD.JurisGPTRAG(
        vector_store_type=store_type,
        llm_type="none",
        hybrid_search=config.hybrid_search,
        use_reranker=config.use_reranker,
    )
    rag.hybrid_search = config.hybrid_search
    rag.use_reranker = config.use_reranker
    return rag


def _aggregate(per_query: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not per_query:
        return {}

    def avg(key: str) -> float:
        return round(sum(r[key] for r in per_query) / len(per_query), 4)

    return {
        "recall_at_5": avg("recall_at_5"),
        "precision_at_5": avg("precision_at_5"),
        "mrr": avg("mrr"),
        "ndcg_at_5": avg("ndcg_at_5"),
        "groundedness_rate": round(
            sum(1 for r in per_query if r["grounded"]) / len(per_query), 4
        ),
        "hallucination_proxy_rate": avg("hallucination_proxy"),
        "avg_response_time": avg("elapsed_seconds"),
    }


def _category_metrics(
    per_query: List[Dict[str, Any]], categories: List[str]
) -> Dict[str, Dict[str, float]]:
    out: Dict[str, Dict[str, float]] = {}
    for category in categories:
        rows = [r for r in per_query if r["category"] == category]
        if not rows:
            continue
        out[category] = {
            "count": len(rows),
            **_aggregate(rows),
        }
    return out


def evaluate_config(
    config: RAGConfig,
    queries: List[Dict[str, Any]],
    categories: List[str],
    *,
    force_lexical: bool = True,
) -> Dict[str, Any]:
    """Evaluate a single configuration over the supplied query list."""
    print(f"\n{'=' * 64}\nConfig: {config.name}\n  {config.description}\n{'=' * 64}")
    rag = _build_rag_for_config(config, force_lexical=force_lexical)

    per_query: List[Dict[str, Any]] = []
    config_start = time.perf_counter()
    for idx, query_item in enumerate(queries, 1):
        print(f"  [{idx:3d}/{len(queries)}] {query_item['id']}: "
              f"{query_item['query'][:60]}", flush=True)
        per_query.append(EVAL_MOD.evaluate_single_query(rag, query_item))
    total_elapsed = time.perf_counter() - config_start

    aggregate = _aggregate(per_query)
    confidence = dict(Counter(r["confidence"] for r in per_query))
    corpus_stats = rag.get_corpus_stats()

    return {
        "config": {
            "name": config.name,
            "description": config.description,
            "hybrid_search": config.hybrid_search,
            "use_reranker": config.use_reranker,
            "vector_store": rag.vector_store,
            "llm": rag.llm_type,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_queries": len(per_query),
        "total_elapsed_seconds": round(total_elapsed, 3),
        "aggregate": aggregate,
        "confidence_distribution": confidence,
        "category_metrics": _category_metrics(per_query, categories),
        "corpus": {
            "source": corpus_stats.source,
            "total_documents": corpus_stats.total_documents,
            "by_doc_type": corpus_stats.by_doc_type,
            "loaded_files_count": len(corpus_stats.loaded_files),
        },
        "per_query": per_query,
    }


def _write_combined_summary(
    results: Dict[str, Dict[str, Any]],
    output_dir: Path,
    timestamp: str,
) -> Path:
    """Write a comparison report for all evaluated configurations."""
    output = output_dir / f"paper_benchmark_summary_{timestamp}.md"
    lines: List[str] = [
        "# JurisGPT Paper Benchmark Summary",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Aggregate Comparison",
        "",
        "| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | "
        "Grounded | Hallucination Proxy | Latency (s) |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for name, payload in results.items():
        agg = payload["aggregate"]
        lines.append(
            f"| {name} "
            f"| {agg['recall_at_5']:.2%} "
            f"| {agg['precision_at_5']:.2%} "
            f"| {agg['mrr']:.4f} "
            f"| {agg['ndcg_at_5']:.4f} "
            f"| {agg['groundedness_rate']:.2%} "
            f"| {agg['hallucination_proxy_rate']:.2%} "
            f"| {agg['avg_response_time']:.3f} |"
        )

    for name, payload in results.items():
        lines.extend([
            "",
            f"## {name}",
            f"- Description: {payload['config']['description']}",
            f"- Total queries: {payload['total_queries']}",
            f"- Total wall time: {payload['total_elapsed_seconds']:.1f}s",
            f"- Corpus: {payload['corpus']['total_documents']} documents "
            f"from {payload['corpus']['source']}",
            "",
            "### Confidence distribution",
            *(
                f"- {label}: {count}"
                for label, count in sorted(payload['confidence_distribution'].items())
            ),
            "",
            "### Category metrics",
            "",
            "| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | "
            "Avg Latency (s) |",
            "|---|---|---|---|---|---|---|",
        ])
        for category, metrics in payload["category_metrics"].items():
            lines.append(
                f"| {category} "
                f"| {metrics['recall_at_5']:.2%} "
                f"| {metrics['precision_at_5']:.2%} "
                f"| {metrics['mrr']:.4f} "
                f"| {metrics['ndcg_at_5']:.4f} "
                f"| {metrics['groundedness_rate']:.2%} "
                f"| {metrics['avg_response_time']:.3f} |"
            )

    output.write_text("\n".join(lines), encoding="utf-8")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="JurisGPT paper benchmarks")
    parser.add_argument(
        "--configs",
        nargs="*",
        default=list(PAPER_CONFIGS.keys()),
        choices=list(PAPER_CONFIGS.keys()),
        help=(
            "Configurations to evaluate (default: all). Choices: "
            + ", ".join(PAPER_CONFIGS.keys())
        ),
    )
    parser.add_argument("--quick", action="store_true", help="Run 12 queries only")
    parser.add_argument(
        "--max-queries",
        type=int,
        default=None,
        help="Cap the number of queries (overrides --quick)",
    )
    parser.add_argument(
        "--use-vector",
        action="store_true",
        help="Allow the configuration to attach to a Chroma/FAISS vector store",
    )
    args = parser.parse_args()

    benchmark = EVAL_MOD.load_benchmark()
    queries: List[Dict[str, Any]] = benchmark["queries"]
    if args.max_queries:
        queries = queries[: args.max_queries]
    elif args.quick:
        queries = queries[:12]

    print(f"Running benchmark with {len(queries)} queries across "
          f"{len(args.configs)} configurations.")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    results: Dict[str, Dict[str, Any]] = {}

    for config_name in args.configs:
        config = PAPER_CONFIGS[config_name]
        payload = evaluate_config(
            config,
            queries,
            benchmark["categories"],
            force_lexical=not args.use_vector,
        )
        result_path = RESULTS_DIR / f"eval_{config_name}_{timestamp}.json"
        result_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
        results[config_name] = payload
        agg = payload["aggregate"]
        print(
            f"  Done. Recall@5={agg['recall_at_5']:.2%} "
            f"Precision@5={agg['precision_at_5']:.2%} "
            f"MRR={agg['mrr']:.4f} nDCG@5={agg['ndcg_at_5']:.4f} "
            f"Grounded={agg['groundedness_rate']:.2%} "
            f"Latency={agg['avg_response_time']:.3f}s"
        )
        print(f"  Results: {result_path}")

    summary_path = _write_combined_summary(results, RESULTS_DIR, timestamp)
    print(f"\nCombined summary: {summary_path}")


if __name__ == "__main__":
    sys.exit(main() or 0)
