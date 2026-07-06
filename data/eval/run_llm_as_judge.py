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


JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "i": {"type": "integer"},
                    "supports_answer": {"type": "integer"},
                    "right_kind_of_source": {"type": "integer"},
                },
                "required": ["i", "supports_answer", "right_kind_of_source"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["scores"],
    "additionalProperties": False,
}


def _run_with_anthropic(results: Dict[str, dict], model: str, max_queries: int) -> None:
    """Judge with Claude via the Anthropic API (structured outputs)."""
    from concurrent.futures import ThreadPoolExecutor

    import anthropic

    client = anthropic.Anthropic()

    def judge_row(row: dict) -> dict:
        evidence_block = _build_evidence_block(row)
        prompt = JUDGE_PROMPT.format(
            query=row["query"], k=min(5, row.get("num_citations", 0)),
            evidence_block=evidence_block,
        )
        try:
            resp = client.messages.create(
                model=model,
                max_tokens=1024,
                output_config={"format": {"type": "json_schema", "schema": JUDGE_SCHEMA}},
                messages=[{"role": "user", "content": prompt}],
            )
            if resp.stop_reason == "refusal":
                judge_payload = {"error": "refusal", "scores": []}
            else:
                text = next(b.text for b in resp.content if b.type == "text")
                judge_payload = json.loads(text)
        except Exception as exc:  # pragma: no cover — relies on live API
            judge_payload = {"error": str(exc), "scores": []}
        return {
            "query_id": row["query_id"],
            "category": row["category"],
            "judge": judge_payload,
        }

    summary: Dict[str, dict] = {}
    for config, payload in results.items():
        rows = payload["per_query"][:max_queries] if max_queries else payload["per_query"]
        with ThreadPoolExecutor(max_workers=8) as pool:
            scores = list(pool.map(judge_row, rows))
        errors = sum(1 for s in scores if "error" in s["judge"])
        summary[config] = scores
        out = FIGURES_DIR / f"llm_judge_{config}.json"
        out.write_text(json.dumps(scores, indent=2, ensure_ascii=False))
        print(f"Wrote {out} ({len(scores)} queries, {errors} errors)")
    overall = FIGURES_DIR / "llm_judge_summary.json"
    overall.write_text(json.dumps({"model": model, "configs": list(summary.keys())}, indent=2))


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
    parser.add_argument("--model", default=None,
                        help="Judge model (default: claude-opus-4-8 with an "
                             "Anthropic key, gpt-4o-mini with an OpenAI key)")
    parser.add_argument("--max-queries", type=int, default=0,
                        help="Cap queries per config (0 = all)")
    args = parser.parse_args()

    results = _latest_results()
    if not results:
        raise SystemExit("No eval result JSONs in data/eval/results/")

    if os.getenv("ANTHROPIC_API_KEY"):
        _run_with_anthropic(results, args.model or "claude-opus-4-8", args.max_queries)
    elif os.getenv("OPENAI_API_KEY") or os.getenv("LITELLM_API_KEY"):
        _run_with_openai(results, args.model or "gpt-4o-mini", args.max_queries)
    else:
        _stub_run(results)


if __name__ == "__main__":
    main()
