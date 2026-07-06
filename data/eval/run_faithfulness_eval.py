#!/usr/bin/env python3
"""End-to-end answer-faithfulness (hallucination) evaluation.

Closes the gap left by the retrieval-only benchmarks: runs the REAL
generation pipeline (hybrid BM25 retrieval + Claude generation) over the
120-query benchmark, then has a stronger judge model verify every answer
against the exact passages that were retrieved for it.

Per answer, the judge returns:
* ``unsupported_claims``   — factual claims not backed by any provided source
* ``fabricated_citations`` — [i] markers pointing at sources that do not
  support the attached claim, or out-of-range markers
* ``verdict``              — faithful | minor_issues | hallucinated

The headline number is the **hallucination rate**: the share of answers
whose verdict is ``hallucinated``. Also reported: strict rate (answers with
>= 1 unsupported claim) and refusal rate (pipeline declined to answer).

Outputs:
* ``results/faithfulness_<config>_<ts>.json``   — per-query record
  (query, answer, sources, judge verdict)
* ``results/figures/FAITHFULNESS.md``           — aggregate summary

Usage:
    ANTHROPIC_API_KEY=... python run_faithfulness_eval.py [--max-queries N]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

EVAL_DIR = Path(__file__).resolve().parent
DATA_DIR = EVAL_DIR.parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"

JUDGE_MODEL = "claude-opus-4-8"

JUDGE_PROMPT = """You are auditing a legal QA system for hallucination.

The user asked:
{query}

The system retrieved these sources (the ONLY material it was allowed to use):
{sources_block}

The system answered:
---
{answer}
---

Audit every factual claim in the answer:
- A claim is SUPPORTED only if one of the sources above states it (paraphrase ok).
- A claim is UNSUPPORTED if no source states it, even if it is true in the real world.
- A citation marker [i] is FABRICATED if source i does not support the sentence it is attached to, or i is out of range.
- Hedged limitations, refusals, and "consult a professional" boilerplate are not claims.

Verdict rules:
- "faithful": every substantive claim supported, citations point at the right sources.
- "minor_issues": all core claims supported but small slips (an imprecise citation index, a mildly overbroad paraphrase).
- "hallucinated": at least one substantive legal claim is unsupported by the sources, or a citation is fabricated for a core claim.
"""

JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "unsupported_claims": {"type": "integer"},
        "fabricated_citations": {"type": "integer"},
        "verdict": {"type": "string", "enum": ["faithful", "minor_issues", "hallucinated"]},
        "worst_offense": {"type": "string"},
    },
    "required": ["unsupported_claims", "fabricated_citations", "verdict", "worst_offense"],
    "additionalProperties": False,
}


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _sources_block(citations: List[Any]) -> str:
    lines = []
    for i, c in enumerate(citations, 1):
        header = f"[{i}] {c.title}"
        if c.act:
            header += f" ({c.act}"
            header += f", {c.section})" if c.section else ")"
        lines.append(f"{header}\n{c.content.strip()[:1500]}")
    return "\n\n".join(lines) or "(no sources retrieved)"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-queries", type=int, default=0)
    args = parser.parse_args()

    if not os.getenv("ANTHROPIC_API_KEY"):
        raise SystemExit("ANTHROPIC_API_KEY required (generation and judging)")

    import anthropic

    rag_mod = _load_module("rag_pipeline", DATA_DIR / "rag_pipeline.py")
    eval_mod = _load_module("evaluator", EVAL_DIR / "evaluator.py")

    # Production configuration: hybrid BM25, no reranker, Claude generation.
    os.environ.pop("RAG_USE_RERANKER", None)
    rag = rag_mod.JurisGPTRAG(
        vector_store_type="lexical",
        llm_type="anthropic",
        hybrid_search=True,
        use_reranker=False,
    )
    if rag.llm is None:
        raise SystemExit("Generation LLM failed to initialize — check the API key")

    queries = eval_mod.load_benchmark()["queries"]
    if args.max_queries:
        queries = queries[: args.max_queries]
    print(f"Generating + judging {len(queries)} answers "
          f"(config=hybrid_bm25, generator={rag.llm_type}, judge={JUDGE_MODEL})")

    judge = anthropic.Anthropic(max_retries=5)

    def evaluate(item: Dict[str, Any]) -> Dict[str, Any]:
        query = item["query"]
        record: Dict[str, Any] = {
            "query_id": item["id"],
            "category": item.get("category"),
            "query": query,
        }
        try:
            response = rag.query(query, top_k=5)
        except Exception as exc:
            record["error"] = f"generation: {exc}"
            return record

        record["answer"] = response.answer
        record["confidence"] = response.confidence
        record["model_used"] = response.model_used
        record["sources"] = [
            {"title": c.title, "act": c.act, "section": c.section,
             "content": c.content[:1500]}
            for c in response.citations
        ]
        refused = response.confidence == "insufficient"
        record["refused"] = refused
        if refused:
            return record

        prompt = JUDGE_PROMPT.format(
            query=query,
            sources_block=_sources_block(response.citations),
            answer=response.answer,
        )
        try:
            resp = judge.messages.create(
                model=JUDGE_MODEL,
                max_tokens=1024,
                output_config={"format": {"type": "json_schema", "schema": JUDGE_SCHEMA}},
                messages=[{"role": "user", "content": prompt}],
            )
            if resp.stop_reason == "refusal":
                record["error"] = "judge: refusal"
            else:
                text = next(b.text for b in resp.content if b.type == "text")
                record["judge"] = json.loads(text)
        except Exception as exc:
            record["error"] = f"judge: {exc}"
        return record

    # Incremental, resumable persistence: one JSON line per completed query.
    # A killed run loses at most the in-flight requests; rerunning skips
    # everything already on disk.
    import threading

    progress_path = RESULTS_DIR / "faithfulness_hybrid_bm25_progress.jsonl"
    done_ids = set()
    if progress_path.exists():
        for line in progress_path.read_text().splitlines():
            try:
                done_ids.add(json.loads(line)["query_id"])
            except (ValueError, KeyError):
                continue
        print(f"Resuming: {len(done_ids)} queries already completed")

    pending = [q for q in queries if q["id"] not in done_ids]
    write_lock = threading.Lock()

    def evaluate_and_persist(item: Dict[str, Any]) -> None:
        record = evaluate(item)
        with write_lock:
            with progress_path.open("a") as fh:
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        print(f"  done {item['id']}", flush=True)

    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(evaluate_and_persist, pending))

    records = []
    for line in progress_path.read_text().splitlines():
        try:
            records.append(json.loads(line))
        except ValueError:
            continue  # truncated line from an interrupted earlier run

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out = RESULTS_DIR / f"faithfulness_hybrid_bm25_{timestamp}.json"
    out.write_text(json.dumps(records, indent=2, ensure_ascii=False))

    judged = [r for r in records if "judge" in r]
    refusals = [r for r in records if r.get("refused")]
    errors = [r for r in records if "error" in r]
    halluc = [r for r in judged if r["judge"]["verdict"] == "hallucinated"]
    minor = [r for r in judged if r["judge"]["verdict"] == "minor_issues"]
    faithful = [r for r in judged if r["judge"]["verdict"] == "faithful"]
    strict = [r for r in judged if r["judge"]["unsupported_claims"] > 0]

    n = len(judged)
    if n == 0:
        raise SystemExit(
            f"No answers were judged (refusals={len(refusals)}, errors={len(errors)}). "
            f"First error: {errors[0].get('error') if errors else 'n/a'} — see {out}"
        )
    summary = [
        "# Answer faithfulness (hallucination) — hybrid_bm25 + Claude generation",
        "",
        f"- Run: {timestamp} · generator: {rag.llm_type} · judge: {JUDGE_MODEL}",
        f"- Queries: {len(records)} · judged: {n} · refusals: {len(refusals)} · errors: {len(errors)}",
        "",
        "| metric | value |",
        "|---|---|",
        f"| **Hallucination rate** (verdict=hallucinated) | **{100 * len(halluc) / n:.1f}%** ({len(halluc)}/{n}) |",
        f"| Strict rate (>=1 unsupported claim) | {100 * len(strict) / n:.1f}% ({len(strict)}/{n}) |",
        f"| Minor issues | {100 * len(minor) / n:.1f}% ({len(minor)}/{n}) |",
        f"| Faithful | {100 * len(faithful) / n:.1f}% ({len(faithful)}/{n}) |",
        f"| Refusal rate (declined to answer) | {100 * len(refusals) / len(records):.1f}% ({len(refusals)}/{len(records)}) |",
        "",
        f"Per-query records: `{out.name}`",
    ]
    (FIGURES_DIR / "FAITHFULNESS.md").write_text("\n".join(summary) + "\n")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
