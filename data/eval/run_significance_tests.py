#!/usr/bin/env python3
"""Pairwise statistical-significance tests for the JurisGPT benchmark.

Loads the latest ``eval_<config>_<ts>.json`` files in
``data/eval/results/`` and reports, for every metric in
{recall_at_5, precision_at_5, mrr, ndcg_at_5}, every ordered pair
(config_a, config_b) of configurations, three statistical tests:

1. **Paired bootstrap** (``n_resamples=1000``, seed=20260503) of the mean
   difference, with a 95% CI and a two-sided bootstrap p-value.
2. **Wilcoxon signed-rank** test on per-query metric deltas.
3. **McNemar's test** on the binary "any-relevant-in-top-5" outcome
   (proxy: ``recall_at_5 > 0``).

Outputs:
    data/eval/results/figures/significance_tests.csv
    data/eval/results/figures/significance_tests.md

The CSV is paper-table-ready. The Markdown is human-readable.
"""
from __future__ import annotations

import json
import math
import random
from itertools import combinations
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

# Ordered so the table reads in difficulty/quality order in the paper.
CONFIG_ORDER: List[str] = [
    "baseline_lexical",
    "hybrid_bm25",
    "hybrid_bm25_rerank",
    "dense_minilm",
    "dense_minilm_rerank",
]

METRICS = ["recall_at_5", "precision_at_5", "mrr", "ndcg_at_5"]
N_BOOTSTRAP = 1000
RNG_SEED = 20260503


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
    if not chosen:
        raise FileNotFoundError(
            f"No eval_<config>_<timestamp>.json files in {RESULTS_DIR}. "
            "Run run_paper_benchmarks.py first."
        )
    return {k: json.loads(v.read_text()) for k, v in chosen.items()}


def _aligned_per_query(
    results: Dict[str, dict],
) -> Tuple[List[str], Dict[str, Dict[str, np.ndarray]]]:
    """Return query_ids in a canonical order plus per-config metric arrays.

    All configurations must share the same set of query_ids; otherwise the
    paired tests would be invalid. We assert this and align to the first
    config's ordering.
    """
    configs = [c for c in CONFIG_ORDER if c in results]
    canonical = [row["query_id"] for row in results[configs[0]]["per_query"]]
    canonical_set = set(canonical)
    per_config: Dict[str, Dict[str, np.ndarray]] = {}

    for config in configs:
        rows = results[config]["per_query"]
        ids = [row["query_id"] for row in rows]
        assert set(ids) == canonical_set, (
            f"Query ID mismatch between {configs[0]!r} and {config!r}; "
            "re-run run_paper_benchmarks.py for both with the same benchmark."
        )
        ordered = sorted(rows, key=lambda r: canonical.index(r["query_id"]))
        per_config[config] = {
            metric: np.array([row[metric] for row in ordered], dtype=float)
            for metric in METRICS
        }
        per_config[config]["any_relevant"] = np.array(
            [1 if row["recall_at_5"] > 0 else 0 for row in ordered], dtype=int
        )
    return canonical, per_config


def _paired_bootstrap(
    a: np.ndarray, b: np.ndarray, n_resamples: int, seed: int
) -> Tuple[float, float, float, float]:
    """Return (mean_diff, ci_low, ci_high, two_sided_p)."""
    rng = np.random.default_rng(seed)
    diffs = a - b
    n = len(diffs)
    samples = np.empty(n_resamples)
    for i in range(n_resamples):
        idx = rng.integers(0, n, size=n)
        samples[i] = diffs[idx].mean()
    mean_diff = float(diffs.mean())
    ci_low = float(np.quantile(samples, 0.025))
    ci_high = float(np.quantile(samples, 0.975))
    # Two-sided p-value: how often does a re-sample have the opposite sign
    # from the observed mean?
    if mean_diff == 0:
        p = 1.0
    elif mean_diff > 0:
        p = float((samples <= 0).mean()) * 2
    else:
        p = float((samples >= 0).mean()) * 2
    p = min(1.0, max(0.0, p))
    return mean_diff, ci_low, ci_high, p


def _wilcoxon(a: np.ndarray, b: np.ndarray) -> float:
    """Two-sided Wilcoxon signed-rank p-value via SciPy when available,
    falling back to a normal approximation if not.
    """
    try:
        from scipy.stats import wilcoxon  # type: ignore
        diffs = a - b
        if not np.any(diffs):
            return 1.0
        return float(wilcoxon(diffs, zero_method="wilcox").pvalue)
    except Exception:
        # Normal approximation (no SciPy in venv).
        diffs = a - b
        nonzero = diffs[diffs != 0]
        n = len(nonzero)
        if n == 0:
            return 1.0
        ranks = np.argsort(np.argsort(np.abs(nonzero))) + 1
        signed = np.where(nonzero > 0, ranks, -ranks)
        w = signed.sum()
        sigma = math.sqrt(n * (n + 1) * (2 * n + 1) / 6)
        if sigma == 0:
            return 1.0
        z = w / sigma
        # 2-sided p via normal CDF approximation
        return float(2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2)))))


def _mcnemar(a: np.ndarray, b: np.ndarray) -> Tuple[int, int, float]:
    """McNemar's test on a binary outcome.

    Returns ``(b_only_wins, a_only_wins, p_value)`` where wins refer to
    cases where one config got the right answer and the other did not.
    Uses the binomial-exact formulation (no continuity correction) which
    is robust for small disagreement counts.
    """
    b_wins = int(((a == 0) & (b == 1)).sum())
    a_wins = int(((a == 1) & (b == 0)).sum())
    n = b_wins + a_wins
    if n == 0:
        return b_wins, a_wins, 1.0
    # Exact two-sided binomial under H0 p=0.5
    k = min(b_wins, a_wins)
    p_one_side = sum(math.comb(n, i) for i in range(k + 1)) / (2 ** n)
    return b_wins, a_wins, min(1.0, 2 * p_one_side)


def _format_p(p: float) -> str:
    if p < 1e-4:
        return "<1e-4"
    return f"{p:.4f}"


def main() -> None:
    random.seed(RNG_SEED)
    results = _latest_results()
    canonical, per_config = _aligned_per_query(results)
    configs = list(per_config.keys())
    print(f"Loaded {len(configs)} configurations × {len(canonical)} queries")
    print(f"  Configs: {configs}")

    rows: List[Dict[str, object]] = []
    for a, b in combinations(configs, 2):
        for metric in METRICS:
            mean_diff, ci_low, ci_high, p_boot = _paired_bootstrap(
                per_config[a][metric], per_config[b][metric], N_BOOTSTRAP, RNG_SEED
            )
            p_wilcoxon = _wilcoxon(per_config[a][metric], per_config[b][metric])
            rows.append({
                "metric": metric,
                "config_a": a,
                "config_b": b,
                "mean_a": float(per_config[a][metric].mean()),
                "mean_b": float(per_config[b][metric].mean()),
                "mean_diff_a_minus_b": mean_diff,
                "ci95_low": ci_low,
                "ci95_high": ci_high,
                "bootstrap_p": p_boot,
                "wilcoxon_p": p_wilcoxon,
                "n": len(canonical),
                "n_bootstrap": N_BOOTSTRAP,
            })
        b_wins, a_wins, p_mc = _mcnemar(
            per_config[a]["any_relevant"], per_config[b]["any_relevant"]
        )
        rows.append({
            "metric": "any_relevant_top5",
            "config_a": a,
            "config_b": b,
            "mean_a": float(per_config[a]["any_relevant"].mean()),
            "mean_b": float(per_config[b]["any_relevant"].mean()),
            "mean_diff_a_minus_b": float(
                per_config[a]["any_relevant"].mean()
                - per_config[b]["any_relevant"].mean()
            ),
            "ci95_low": float("nan"),
            "ci95_high": float("nan"),
            "bootstrap_p": float("nan"),
            "wilcoxon_p": float("nan"),
            "mcnemar_a_only_wins": a_wins,
            "mcnemar_b_only_wins": b_wins,
            "mcnemar_p": p_mc,
            "n": len(canonical),
        })

    csv_path = FIGURES_DIR / "significance_tests.csv"
    md_path = FIGURES_DIR / "significance_tests.md"

    headers = sorted({k for row in rows for k in row.keys()})
    with csv_path.open("w") as f:
        f.write(",".join(headers) + "\n")
        for row in rows:
            f.write(
                ",".join("" if k not in row else str(row[k]) for k in headers)
                + "\n"
            )

    md_lines = [
        "# Pairwise Statistical Significance",
        "",
        f"- Configurations: {', '.join(configs)}",
        f"- Queries: {len(canonical)}",
        f"- Bootstrap resamples: {N_BOOTSTRAP} (seed={RNG_SEED})",
        "",
        "## Paired tests on continuous metrics",
        "",
        "| Metric | A vs B | mean(A) | mean(B) | ΔA-B | 95% CI | bootstrap p | Wilcoxon p |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        if row["metric"] == "any_relevant_top5":
            continue
        md_lines.append(
            f"| {row['metric']} "
            f"| {row['config_a']} vs {row['config_b']} "
            f"| {row['mean_a']:.4f} "
            f"| {row['mean_b']:.4f} "
            f"| {row['mean_diff_a_minus_b']:+.4f} "
            f"| [{row['ci95_low']:+.4f}, {row['ci95_high']:+.4f}] "
            f"| {_format_p(row['bootstrap_p'])} "
            f"| {_format_p(row['wilcoxon_p'])} |"
        )
    md_lines.extend([
        "",
        "## McNemar test on the binary 'any-relevant-in-top-5' outcome",
        "",
        "| A vs B | A-only wins | B-only wins | McNemar p |",
        "|---|---|---|---|",
    ])
    for row in rows:
        if row["metric"] != "any_relevant_top5":
            continue
        md_lines.append(
            f"| {row['config_a']} vs {row['config_b']} "
            f"| {row['mcnemar_a_only_wins']} "
            f"| {row['mcnemar_b_only_wins']} "
            f"| {_format_p(row['mcnemar_p'])} |"
        )
    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"  Wrote {csv_path}")
    print(f"  Wrote {md_path}")


if __name__ == "__main__":
    main()
