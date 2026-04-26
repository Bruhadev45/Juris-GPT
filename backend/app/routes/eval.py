"""
JurisGPT Evaluation API Routes
Run and view benchmark evaluation results.
"""

import json
import logging
import importlib.util
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Evaluation"])

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
EVAL_DIR = DATA_DIR / "eval"
RESULTS_DIR = EVAL_DIR / "results"


@router.post("/run")
async def run_evaluation(
    max_queries: Optional[int] = Query(None, description="Limit number of queries"),
    categories: Optional[str] = Query(None, description="Comma-separated category filter"),
):
    """
    Run the evaluation benchmark suite.

    This executes the 120-query benchmark (or a subset) and returns
    aggregate metrics: Recall@5, Precision@5, MRR, nDCG@5, etc.

    **Warning:** This can take several minutes for the full suite.
    Use `max_queries=10` for a quick test.
    """
    try:
        # Use importlib instead of sys.path.insert
        evaluator_path = EVAL_DIR / "evaluator.py"
        if not evaluator_path.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Evaluator module not found at {evaluator_path}"
            )
        
        spec = importlib.util.spec_from_file_location("evaluator", evaluator_path)
        if spec is None or spec.loader is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to load evaluator module"
            )
        
        evaluator_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(evaluator_module)
        _run_eval = evaluator_module.run_evaluation

        cat_list = [c.strip() for c in categories.split(",")] if categories else None

        results = _run_eval(categories=cat_list, max_queries=max_queries)

        # Return just the summary, not per-query details (too large for API)
        return {
            "success": True,
            "timestamp": results["timestamp"],
            "total_queries": results["total_queries"],
            "aggregate": results["aggregate"],
            "confidence_distribution": results["confidence_distribution"],
            "category_metrics": results["category_metrics"],
            "rag_config": results["rag_config"],
        }
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Evaluation module not found: {e}")
    except (KeyError, ValueError, TypeError) as e:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {e}")
    except Exception:
        logger.exception("Unexpected error during evaluation")
        raise HTTPException(status_code=500, detail="Internal evaluation error")


@router.get("/results")
async def get_evaluation_results(latest: bool = Query(True, description="Return only latest result")):
    """
    View saved evaluation results.

    Returns the latest evaluation run or all saved results.
    """
    if not RESULTS_DIR.exists():
        return {"results": [], "message": "No evaluation results found. Run POST /api/eval/run first."}

    result_files = sorted(RESULTS_DIR.glob("eval_*.json"), reverse=True)
    if not result_files:
        return {"results": [], "message": "No evaluation results found."}

    if latest:
        async with aiofiles.open(result_files[0], "r", encoding="utf-8") as f:
            content = await f.read()
        data = json.loads(content)
        return {
            "file": result_files[0].name,
            "timestamp": data.get("timestamp"),
            "total_queries": data.get("total_queries"),
            "aggregate": data.get("aggregate"),
            "confidence_distribution": data.get("confidence_distribution"),
            "category_metrics": data.get("category_metrics"),
            "rag_config": data.get("rag_config"),
        }

    summaries = []
    for path in result_files[:10]:  # Last 10 runs
        async with aiofiles.open(path, "r", encoding="utf-8") as f:
            content = await f.read()
        data = json.loads(content)
        summaries.append({
            "file": path.name,
            "timestamp": data.get("timestamp"),
            "total_queries": data.get("total_queries"),
            "aggregate": data.get("aggregate"),
        })

    return {"results": summaries}


@router.get("/benchmark")
async def get_benchmark_info():
    """
    Get information about the benchmark query suite.

    Returns categories, query count, and sample queries.
    """
    benchmark_path = EVAL_DIR / "benchmark_queries.json"
    if not benchmark_path.exists():
        raise HTTPException(status_code=404, detail="Benchmark file not found")

    async with aiofiles.open(benchmark_path, "r", encoding="utf-8") as f:
        content = await f.read()
    data = json.loads(content)

    categories = {}
    for q in data["queries"]:
        cat = q["category"]
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "version": data.get("version"),
        "description": data.get("description"),
        "total_queries": len(data["queries"]),
        "categories": categories,
        "sample_queries": [
            {"id": q["id"], "category": q["category"], "query": q["query"]}
            for q in data["queries"][:5]
        ],
    }
