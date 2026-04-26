#!/usr/bin/env python3
"""
JurisGPT Evaluation Framework
Benchmarks the RAG pipeline against the 120-query test suite.

Metrics (per IEEE paper Section III.G):
- Recall@5: Fraction of relevant docs retrieved in top-5
- Precision@5: Fraction of top-5 results that are relevant
- MRR (Mean Reciprocal Rank): 1/rank of first relevant result
- nDCG@5: Normalized Discounted Cumulative Gain at 5
- Groundedness: Whether the answer is grounded in citations
- Hallucination Rate: Fraction of answers with unsupported claims
"""

import json
import math
import importlib.util
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

EVAL_DIR = Path(__file__).parent
DATA_DIR = EVAL_DIR.parent
RESULTS_DIR = EVAL_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)
BENCHMARK_PATH = EVAL_DIR / "benchmark_queries.json"


def load_benchmark() -> Dict[str, Any]:
    """Load the 120-query benchmark suite."""
    with BENCHMARK_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _dcg(relevances: List[float], k: int = 5) -> float:
    """Discounted Cumulative Gain at k."""
    total = 0.0
    for i, rel in enumerate(relevances[:k]):
        total += rel / math.log2(i + 2)
    return total


def _ndcg(relevances: List[float], ideal: List[float], k: int = 5) -> float:
    """Normalized DCG at k."""
    dcg_val = _dcg(relevances, k)
    ideal_dcg = _dcg(sorted(ideal, reverse=True), k)
    if ideal_dcg == 0:
        return 0.0
    return dcg_val / ideal_dcg


def evaluate_single_query(
    rag,
    query_item: Dict[str, Any],
    *,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Evaluate a single benchmark query.

    Returns per-query metrics and timing.
    """
    query = query_item["query"]
    expected_doc_types = set(query_item.get("expected_doc_types", []))
    expected_acts = set(query_item.get("expected_acts", []))

    # Time the retrieval + generation
    start = time.perf_counter()
    response = rag.query(query, top_k=top_k)
    elapsed = time.perf_counter() - start

    citations = response.citations

    # Determine relevance for each retrieved citation
    relevances: List[float] = []
    for c in citations[:top_k]:
        rel = 0.0
        # Check doc_type match
        if not expected_doc_types or c.doc_type in expected_doc_types:
            rel += 0.5
        # Check act match
        if not expected_acts or (c.act and c.act in expected_acts):
            rel += 0.5
        # Boost by retrieval score
        rel = min(1.0, rel * c.relevance * 2)
        relevances.append(rel)

    # Recall@5: fraction of expected doc_types found
    retrieved_types = {c.doc_type for c in citations[:top_k]}
    recall_at_5 = (
        len(expected_doc_types & retrieved_types) / len(expected_doc_types)
        if expected_doc_types
        else 1.0
    )

    # Precision@5: fraction of top-5 that have relevance > 0.3
    relevant_count = sum(1 for r in relevances if r > 0.3)
    precision_at_5 = relevant_count / min(top_k, len(relevances)) if relevances else 0.0

    # MRR: reciprocal rank of first relevant result
    mrr = 0.0
    for i, r in enumerate(relevances):
        if r > 0.3:
            mrr = 1.0 / (i + 1)
            break

    # nDCG@5
    ideal_relevances = [1.0] * top_k
    ndcg_at_5 = _ndcg(relevances, ideal_relevances, k=top_k)

    # Groundedness check. This is a runtime signal from the RAG pipeline, not
    # a substitute for human legal review.
    is_grounded = response.grounded

    # Automatic hallucination proxy: a grounded answer should cite retrieved
    # evidence. This intentionally stays conservative and is reported as a
    # proxy, not as the human hallucination label used in the paper.
    has_citation_refs = any(f"[{i+1}]" in response.answer for i in range(len(citations)))
    hallucination_proxy = 0.0 if (has_citation_refs or not citations) else 1.0
    retrieved_doc_types = sorted({c.doc_type for c in citations[:top_k]})
    retrieved_acts = sorted({c.act for c in citations[:top_k] if c.act})

    return {
        "query_id": query_item["id"],
        "category": query_item["category"],
        "query": query,
        "recall_at_5": round(recall_at_5, 4),
        "precision_at_5": round(precision_at_5, 4),
        "mrr": round(mrr, 4),
        "ndcg_at_5": round(ndcg_at_5, 4),
        "grounded": is_grounded,
        "hallucination_proxy": round(hallucination_proxy, 4),
        "confidence": response.confidence,
        "model_used": response.model_used,
        "num_citations": len(citations),
        "elapsed_seconds": round(elapsed, 3),
        "retrieved_doc_types": retrieved_doc_types,
        "retrieved_acts": retrieved_acts,
    }


def write_research_report(results: Dict[str, Any], results_path: Path) -> Path:
    """Write a compact Markdown report next to the JSON results."""
    report_path = results_path.with_suffix(".md")
    agg = results["aggregate"]
    config = results["rag_config"]
    confidence = results["confidence_distribution"]

    lines = [
        "# JurisGPT RAG Evaluation Report",
        "",
        f"Generated: {results['timestamp']}",
        f"Benchmark queries: {results['total_queries']}",
        "",
        "## Aggregate Metrics",
        "",
        f"- Recall@5: {agg['recall_at_5']:.2%}",
        f"- Precision@5: {agg['precision_at_5']:.2%}",
        f"- MRR: {agg['mrr']:.4f}",
        f"- nDCG@5: {agg['ndcg_at_5']:.4f}",
        f"- Runtime groundedness rate: {agg['groundedness_rate']:.2%}",
        f"- Automatic hallucination proxy: {agg['hallucination_proxy_rate']:.2%}",
        f"- Average response time: {agg['avg_response_time']:.3f}s",
        "",
        "## Runtime Configuration",
        "",
        f"- Vector store: {config.get('vector_store')}",
        f"- LLM type: {config.get('llm_type')}",
        f"- Hybrid search: {config.get('hybrid_search')}",
        f"- Cross-encoder reranker: {config.get('use_reranker')}",
        f"- Corpus source: {config.get('corpus_source')}",
        f"- Corpus size: {config.get('corpus_size')}",
        f"- Corpus doc types: {config.get('corpus_doc_types')}",
        "",
        "## Confidence Distribution",
        "",
        *(f"- {label}: {count}" for label, count in sorted(confidence.items())),
        "",
        "## Category Metrics",
        "",
    ]

    for category, metrics in results["category_metrics"].items():
        lines.extend([
            f"### {category}",
            f"- Count: {metrics['count']}",
            f"- Recall@5: {metrics['recall_at_5']:.2%}",
            f"- Precision@5: {metrics['precision_at_5']:.2%}",
            f"- MRR: {metrics['mrr']:.4f}",
            f"- nDCG@5: {metrics['ndcg_at_5']:.4f}",
            f"- Groundedness: {metrics['groundedness_rate']:.2%}",
            f"- Avg latency: {metrics['avg_elapsed']:.3f}s",
            "",
        ])

    lines.extend([
        "## Methodology Notes",
        "",
        "- Retrieval metrics are computed from benchmark metadata (`expected_doc_types` and `expected_acts`).",
        "- `hallucination_proxy` is an automatic citation-reference check and should not be presented as a human hallucination label.",
        "- Human Likert scores, Fleiss kappa, and manual hallucination labels require a separate annotation file and are not inferred by this script.",
        f"- Full machine-readable results: `{results_path.name}`",
        "",
    ])

    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path


def run_evaluation(
    rag=None,
    *,
    categories: Optional[List[str]] = None,
    max_queries: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Run the full evaluation suite.

    Args:
        rag: JurisGPTRAG instance (creates one if None)
        categories: Restrict to specific categories
        max_queries: Limit number of queries (for quick testing)

    Returns:
        Full evaluation results with per-query and aggregate metrics.
    """
    if rag is None:
        # Use importlib instead of sys.path.insert
        rag_pipeline_path = DATA_DIR / "rag_pipeline.py"
        spec = importlib.util.spec_from_file_location("rag_pipeline", rag_pipeline_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"RAG pipeline not found at {rag_pipeline_path}")
        
        rag_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(rag_module)
        JurisGPTRAG = rag_module.JurisGPTRAG
        rag = JurisGPTRAG()

    benchmark = load_benchmark()
    queries = benchmark["queries"]

    if categories:
        queries = [q for q in queries if q["category"] in categories]
    if max_queries:
        queries = queries[:max_queries]

    print(f"\nRunning evaluation: {len(queries)} queries")
    print("=" * 60)

    per_query_results: List[Dict[str, Any]] = []
    for i, query_item in enumerate(queries, 1):
        print(f"  [{i}/{len(queries)}] {query_item['id']}: {query_item['query'][:60]}...")
        result = evaluate_single_query(rag, query_item)
        per_query_results.append(result)

    # Aggregate metrics
    def _avg(key: str) -> float:
        values = [r[key] for r in per_query_results]
        return round(sum(values) / len(values), 4) if values else 0.0

    # Per-category aggregation
    category_metrics: Dict[str, Dict[str, float]] = {}
    for cat in benchmark["categories"]:
        cat_results = [r for r in per_query_results if r["category"] == cat]
        if not cat_results:
            continue
        category_metrics[cat] = {
            "count": len(cat_results),
            "recall_at_5": round(sum(r["recall_at_5"] for r in cat_results) / len(cat_results), 4),
            "precision_at_5": round(sum(r["precision_at_5"] for r in cat_results) / len(cat_results), 4),
            "mrr": round(sum(r["mrr"] for r in cat_results) / len(cat_results), 4),
            "ndcg_at_5": round(sum(r["ndcg_at_5"] for r in cat_results) / len(cat_results), 4),
            "groundedness_rate": round(sum(1 for r in cat_results if r["grounded"]) / len(cat_results), 4),
            "avg_elapsed": round(sum(r["elapsed_seconds"] for r in cat_results) / len(cat_results), 3),
        }

    # Confidence distribution
    confidence_dist = dict(Counter(r["confidence"] for r in per_query_results))
    corpus_stats = rag.get_corpus_stats() if hasattr(rag, "get_corpus_stats") else None

    overall = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_queries": len(per_query_results),
        "aggregate": {
            "recall_at_5": _avg("recall_at_5"),
            "precision_at_5": _avg("precision_at_5"),
            "mrr": _avg("mrr"),
            "ndcg_at_5": _avg("ndcg_at_5"),
            "groundedness_rate": round(
                sum(1 for r in per_query_results if r["grounded"]) / len(per_query_results), 4
            ),
            "hallucination_proxy_rate": _avg("hallucination_proxy"),
            "avg_response_time": _avg("elapsed_seconds"),
        },
        "confidence_distribution": confidence_dist,
        "category_metrics": category_metrics,
        "per_query": per_query_results,
        "rag_config": {
            "vector_store": getattr(rag, "vector_store", None),
            "llm_type": getattr(rag, "llm_type", None),
            "hybrid_search": getattr(rag, "hybrid_search", False),
            "use_reranker": getattr(rag, "use_reranker", False),
            "corpus_size": len(getattr(rag, "local_corpus", [])),
            "corpus_source": getattr(corpus_stats, "source", None),
            "corpus_doc_types": getattr(corpus_stats, "by_doc_type", None),
            "loaded_corpus_files": getattr(corpus_stats, "loaded_files", None),
            "cloud_error": getattr(corpus_stats, "cloud_error", None),
        },
        "methodology_notes": [
            "Automatic hallucination proxy checks whether generated answers reference retrieved citation markers.",
            "Human legal correctness and Fleiss kappa require external annotation and are not generated here.",
        ],
    }

    # Save results
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    results_path = RESULTS_DIR / f"eval_{ts}.json"
    with results_path.open("w", encoding="utf-8") as f:
        json.dump(overall, f, indent=2, ensure_ascii=False)
    report_path = write_research_report(overall, results_path)

    # Print summary
    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    agg = overall["aggregate"]
    print(f"  Queries:           {overall['total_queries']}")
    print(f"  Recall@5:          {agg['recall_at_5']:.2%}")
    print(f"  Precision@5:       {agg['precision_at_5']:.2%}")
    print(f"  MRR:               {agg['mrr']:.4f}")
    print(f"  nDCG@5:            {agg['ndcg_at_5']:.4f}")
    print(f"  Groundedness:      {agg['groundedness_rate']:.2%}")
    print(f"  Hallucination Px.: {agg['hallucination_proxy_rate']:.2%}")
    print(f"  Avg Response Time: {agg['avg_response_time']:.3f}s")
    print(f"\n  Results saved to: {results_path}")
    print(f"  Report saved to:  {report_path}")

    return overall


def main():
    import argparse

    parser = argparse.ArgumentParser(description="JurisGPT Evaluation Suite")
    parser.add_argument("--categories", nargs="*", help="Restrict to categories")
    parser.add_argument("--max-queries", type=int, help="Max queries to run")
    parser.add_argument("--quick", action="store_true", help="Quick test (10 queries)")

    args = parser.parse_args()

    max_queries = args.max_queries
    if args.quick:
        max_queries = 10

    run_evaluation(categories=args.categories, max_queries=max_queries)


if __name__ == "__main__":
    main()
