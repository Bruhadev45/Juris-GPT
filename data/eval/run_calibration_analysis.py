#!/usr/bin/env python3
"""Confidence calibration analysis — does the ConfidenceBadge predict faithfulness?

Cross-tabulates the pipeline's user-facing confidence label (high/medium/low/
insufficient, from ``_assess_confidence``) against the judge's faithfulness
verdict for every stored record in the faithfulness audit. No API calls —
purely local analysis of ``results/faithfulness_*_progress.jsonl`` (falls back
to the newest ``faithfulness_*.json``).

Answers reviewer criticism: "no calibration study is presented to verify
whether the assigned confidence levels actually correlate with correctness."

Output: ``results/figures/CALIBRATION.md``
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"

CONF_ORDER = ["high", "medium", "low", "insufficient"]
GOOD_VERDICTS = {"faithful", "minor_issues"}


def load_records() -> list[dict]:
    progress = sorted(RESULTS_DIR.glob("faithfulness_*_progress.jsonl"))
    if progress:
        records = []
        for line in progress[-1].read_text().splitlines():
            try:
                records.append(json.loads(line))
            except ValueError:
                continue
        return records
    snapshots = sorted(RESULTS_DIR.glob("faithfulness_*_[0-9]*.json"))
    if snapshots:
        return json.loads(snapshots[-1].read_text())
    raise SystemExit("No faithfulness records found — run run_faithfulness_eval.py first")


def main() -> None:
    records = [r for r in load_records() if "judge" in r and r.get("confidence")]
    if not records:
        raise SystemExit("No judged records with confidence labels found")

    by_conf: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_conf[r["confidence"]].append(r)

    lines = [
        "# Confidence calibration — badge label vs. judged faithfulness",
        "",
        f"n = {len(records)} judged answers (hybrid_bm25 + Claude generation).",
        "'Grounded' = judge verdict faithful or minor_issues (core claims supported).",
        "",
        "| confidence badge | n | grounded | hallucinated | grounded rate |",
        "|---|---|---|---|---|",
    ]
    rates: dict[str, float] = {}
    for conf in CONF_ORDER:
        rows = by_conf.get(conf, [])
        if not rows:
            continue
        good = sum(1 for r in rows if r["judge"]["verdict"] in GOOD_VERDICTS)
        bad = len(rows) - good
        rate = good / len(rows)
        rates[conf] = rate
        lines.append(f"| {conf} | {len(rows)} | {good} | {bad} | {100 * rate:.0f}% |")

    lines.append("")
    ordered = [rates[c] for c in CONF_ORDER if c in rates]
    monotone = all(a >= b for a, b in zip(ordered, ordered[1:]))
    if monotone and len(ordered) > 1:
        lines.append(
            "**Verdict: calibrated (directionally).** Grounded rate declines "
            "monotonically as the badge steps down — the label carries real "
            "signal about answer reliability."
        )
    elif len(ordered) > 1:
        lines.append(
            "**Verdict: mis-calibrated.** Grounded rate is not monotone across "
            "badge levels — the thresholds in `_assess_confidence` need tuning "
            "before the badge can be trusted as a reliability signal."
        )
    lines.append("")
    lines.append("Caveats: small n per bucket; judge-based (not human) verdicts; "
                 "single configuration and date.")

    out = FIGURES_DIR / "CALIBRATION.md"
    out.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
