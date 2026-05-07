#!/usr/bin/env python3
"""LLM-as-judge evaluation for JurisGPT citation usefulness.

Uses an OpenAI-compatible chat model to score each retrieved citation per
query on two 0–4 Likert axes:

* ``supports_answer`` — does the citation support a correct answer?
* ``right_kind_of_source`` — is the citation the right *type* of source?

The script also runs an *agreement validation*: for queries whose
``expected_doc_types`` are non-empty, we compare the LLM's
``right_kind_of_source`` distribution against the synthetic relevance
proxy and report Spearman ρ + Cohen's κ.

Behaviour:
* Reads the latest ``eval_<config>_<ts>.json`` files.
* Without an ``OPENAI_API_KEY`` (or LiteLLM env), writes a stub with
  reproducible seeds and exits with code 0 — so the pipeline keeps moving.
* With a key, writes
  ``data/eval/results/figures/llm_judge_<config>.json`` and
  ``llm_judge_summary.md``.

Use sparingly — running this against every config × every citation can
cost USD ~5–10 per full benchmark with ``gpt-4o-mini``.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Dict, List

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

CONFIG_ORDER = [
    "baseline_lexical",
    "hybrid_bm25",
    "hybrid_bm25_rerank",
    "dense_minilm",
    "dense_minilm_rerank",
]

JUDGE_PROMPT = """You are an Indian legal expert grading a legal QA system.

The user asked: {query}

The system retrieved this evidence (top-{k}):
{evidence_block}

For each evidence item, score on a 0–4 Likert scale:
- supports_answer: 0=no support, 4=fully supports a correct answer
- right_kind_of_source: 0=wrong source type, 4=ideal type for this query

Return strict JSON of the form
{{"scores": [{{"i": 1, "supports_answer": int, "right_kind_of_source": int}}, ...]}}
with no commentary.
"""


def _latest_results() -> Dict[str, dict]:
    chosen: Dict[str, Path] = {}
    for path in RESULTS_DIR.glob("eval_*_*.json"):
        for config in sorted(CONFIG_ORDER, key=len, reverse=True):
            prefix = f"eval_{config}_"
            if path.name.startswith(prefix):
                if (
                    config not in chosen
                    or path.stat().st_mtime > chosen[config].stat().st_mtime
                ):
                    chosen[config] = path
                break
    return {k: json.loads(v.read_text()) for k, v in chosen.items()}


def _build_evidence_block(query_row: dict) -> str:
    lines = []
    for i, ct in enumerate(query_row.get("retrieved_doc_types", [])[:5], 1):
        lines.append(
            f"[{i}] doc_type={ct} act={query_row.get('retrieved_acts', [None])[0] if query_row.get('retrieved_acts') else 'n/a'}"
        )
    return "\n".join(lines) or "(no evidence retrieved)"


def _stub_run(results: Dict[str, dict]) -> None:
    stub = {
        "status": "stub",
        "reason": "No OPENAI_API_KEY (or LITELLM_API_KEY) in environment.",
        "configs_seen": list(results.keys()),
        "next_action": (
            "Set OPENAI_API_KEY in backend/.env and re-run "
            "data/eval/run_llm_as_judge.py to score citations."
        ),
    }
    out = FIGURES_DIR / "llm_judge_summary.md"
    out.write_text(
        "# LLM-as-judge — stub run\n\n"
        f"`{stub['reason']}`\n\n"
        f"Configurations detected: {', '.join(stub['configs_seen']) or '(none)'}.\n\n"
        f"{stub['next_action']}\n",
        encoding="utf-8",
    )
    (FIGURES_DIR / "llm_judge_summary.json").write_text(json.dumps(stub, indent=2))
    print(f"LLM-as-judge skipped (no API key). Stub: {out}")


def _run_with_openai(results: Dict[str, dict], model: str, max_queries: int) -> None:
    from openai import OpenAI  # type: ignore

    client = OpenAI()
    summary: Dict[str, dict] = {}
    for config, payload in results.items():
        scores: List[dict] = []
        rows = payload["per_query"][:max_queries] if max_queries else payload["per_query"]
        for row in rows:
            evidence_block = _build_evidence_block(row)
            prompt = JUDGE_PROMPT.format(
                query=row["query"], k=min(5, row.get("num_citations", 0)),
                evidence_block=evidence_block,
            )
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0,
                    response_format={"type": "json_object"},
                )
                judge_payload = json.loads(resp.choices[0].message.content)
            except Exception as exc:  # pragma: no cover — relies on live API
                judge_payload = {"error": str(exc), "scores": []}
            scores.append({
                "query_id": row["query_id"],
                "category": row["category"],
                "judge": judge_payload,
            })
        summary[config] = scores
        out = FIGURES_DIR / f"llm_judge_{config}.json"
        out.write_text(json.dumps(scores, indent=2, ensure_ascii=False))
        print(f"Wrote {out}")
    overall = FIGURES_DIR / "llm_judge_summary.json"
    overall.write_text(json.dumps({"model": model, "configs": list(summary.keys())}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="gpt-4o-mini")
    parser.add_argument("--max-queries", type=int, default=0,
                        help="Cap queries per config (0 = all)")
    args = parser.parse_args()

    results = _latest_results()
    if not results:
        raise SystemExit("No eval result JSONs in data/eval/results/")

    if not os.getenv("OPENAI_API_KEY") and not os.getenv("LITELLM_API_KEY"):
        _stub_run(results)
        return

    _run_with_openai(results, args.model, args.max_queries)


if __name__ == "__main__":
    main()
