#!/usr/bin/env python3
"""
JurisGPT Retrieval Evaluation Script
Evaluates retrieval quality against ground truth questions.
"""

import json
import sys
import importlib.util
from pathlib import Path
from typing import Dict, List, Any

# DATA_DIR moved to function scope


def load_eval_questions(path: str = None) -> List[Dict[str, Any]]:
    """Load evaluation questions from JSON."""
    if path is None:
        path = Path(__file__).parent / "eval_questions.json"
    with open(path) as f:
        data = json.load(f)
    return data["questions"]


def evaluate_retrieval(rag, questions: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Evaluate retrieval quality.

    Returns metrics:
    - recall_at_5: % of questions where expected doc type is in top 5
    - avg_relevance: average relevance score of top result
    - coverage: % of questions with at least one relevant result
    """
    results = {
        "total_questions": len(questions),
        "recall_at_5": 0,
        "avg_top_relevance": 0,
        "coverage": 0,
        "by_category": {}
    }

    for q in questions:
        citations = rag.retrieve(q["query"], top_k=5)

        # Check if expected doc type is found
        found_expected = any(
            c.doc_type in q.get("expected_doc_types", [])
            for c in citations
        )
        if found_expected:
            results["recall_at_5"] += 1

        # Track relevance
        if citations:
            results["avg_top_relevance"] += citations[0].relevance
            results["coverage"] += 1

        # Track by category
        cat = q.get("category", "other")
        if cat not in results["by_category"]:
            results["by_category"][cat] = {"total": 0, "found": 0}
        results["by_category"][cat]["total"] += 1
        if found_expected:
            results["by_category"][cat]["found"] += 1

    # Calculate percentages
    n = results["total_questions"]
    results["recall_at_5"] = results["recall_at_5"] / n if n > 0 else 0
    results["avg_top_relevance"] = results["avg_top_relevance"] / n if n > 0 else 0
    results["coverage"] = results["coverage"] / n if n > 0 else 0

    return results


def main():
    """Run evaluation."""
    # Dynamic import of rag_pipeline
    data_dir = Path(__file__).parent.parent / "data"
    rag_pipeline_path = data_dir / "rag_pipeline.py"
    
    spec = importlib.util.spec_from_file_location("rag_pipeline", rag_pipeline_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"RAG pipeline not found at {rag_pipeline_path}")
    
    rag_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rag_module)
    JurisGPTRAG = rag_module.JurisGPTRAG

    print("Loading RAG pipeline...")
    rag = JurisGPTRAG()

    print("Loading evaluation questions...")
    questions = load_eval_questions()

    print(f"Evaluating {len(questions)} questions...")
    results = evaluate_retrieval(rag, questions)

    print("\n" + "="*50)
    print("EVALUATION RESULTS")
    print("="*50)
    print(f"Recall@5: {results['recall_at_5']:.1%}")
    print(f"Avg Top Relevance: {results['avg_top_relevance']:.1%}")
    print(f"Coverage: {results['coverage']:.1%}")
    print("\nBy Category:")
    for cat, stats in results["by_category"].items():
        pct = stats["found"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {cat}: {pct:.1%} ({stats['found']}/{stats['total']})")


if __name__ == "__main__":
    main()
