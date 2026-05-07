#!/usr/bin/env python3
"""Render the JurisGPT research paper figures and tables from benchmark JSON.

Reads the most recent ``eval_<config>_<timestamp>.json`` files in
``data/eval/results/`` and produces:

* PNG figures (one per graph in the RESEARCH_PAPER_BLUEPRINT.md plotting plan)
* ``aggregate_metrics.csv`` and ``category_metrics.csv`` for the paper tables
* ``METRICS.md`` — a paper-ready summary referencing the figures

All artefacts land in ``data/eval/results/figures/``.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

CONFIG_ORDER: List[str] = [
    "baseline_lexical",
    "hybrid_bm25",
    "hybrid_bm25_rerank",
    "dense_minilm",
    "dense_minilm_rerank",
]

CONFIG_LABELS: Dict[str, str] = {
    "baseline_lexical": "Baseline\n(Lexical)",
    "hybrid_bm25": "Hybrid\n(BM25 + Lexical)",
    "hybrid_bm25_rerank": "Hybrid + Rerank\n(BM25 + CrossEnc.)",
    "dense_minilm": "Dense\n(MiniLM-384)",
    "dense_minilm_rerank": "Dense + Rerank\n(MiniLM + CrossEnc.)",
}

PLOT_STYLE = {
    "figure.dpi": 130,
    "savefig.dpi": 200,
    "font.size": 11,
    "axes.titlesize": 12,
    "axes.labelsize": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.25,
    "axes.axisbelow": True,
}
plt.rcParams.update(PLOT_STYLE)

CONFIG_COLORS = {
    "baseline_lexical": "#9CA3AF",
    "hybrid_bm25": "#2563EB",
    "hybrid_bm25_rerank": "#10B981",
    "dense_minilm": "#7C3AED",
    "dense_minilm_rerank": "#F59E0B",
}


def _latest_results() -> Dict[str, dict]:
    """Pick the most recent ``eval_<config>_<ts>.json`` per configuration.

    Iterates configs in *longest-name-first* order so that
    ``hybrid_bm25_rerank`` does not get accidentally captured by the
    ``hybrid_bm25`` prefix.
    """
    chosen: Dict[str, Path] = {}
    config_by_length = sorted(CONFIG_ORDER, key=len, reverse=True)
    for path in RESULTS_DIR.glob("eval_*_*.json"):
        for config in config_by_length:
            prefix = f"eval_{config}_"
            if path.name.startswith(prefix):
                if config not in chosen or path.stat().st_mtime > chosen[config].stat().st_mtime:
                    chosen[config] = path
                break
    if not chosen:
        raise FileNotFoundError(
            "No eval_<config>_<timestamp>.json files found in "
            f"{RESULTS_DIR}. Run run_paper_benchmarks.py first."
        )
    return {config: json.loads(path.read_text()) for config, path in chosen.items()}


# ── Tables ────────────────────────────────────────────────────────────────


def _aggregate_table(results: Dict[str, dict]) -> pd.DataFrame:
    rows = []
    for config in CONFIG_ORDER:
        if config not in results:
            continue
        agg = results[config]["aggregate"]
        rows.append({
            "configuration": config,
            "recall_at_5": agg["recall_at_5"],
            "precision_at_5": agg["precision_at_5"],
            "mrr": agg["mrr"],
            "ndcg_at_5": agg["ndcg_at_5"],
            "groundedness_rate": agg["groundedness_rate"],
            "hallucination_proxy_rate": agg["hallucination_proxy_rate"],
            "avg_response_time_s": agg["avg_response_time"],
        })
    return pd.DataFrame(rows)


def _category_table(results: Dict[str, dict]) -> pd.DataFrame:
    rows = []
    for config in CONFIG_ORDER:
        if config not in results:
            continue
        for category, metrics in results[config]["category_metrics"].items():
            rows.append({
                "configuration": config,
                "category": category,
                **metrics,
            })
    return pd.DataFrame(rows)


# ── Figures ───────────────────────────────────────────────────────────────


def _save(fig: plt.Figure, name: str) -> Path:
    out = FIGURES_DIR / name
    fig.tight_layout()
    fig.savefig(out)
    plt.close(fig)
    return out


def _grouped_bar(metric_key: str, ylabel: str, title: str, results: Dict[str, dict]) -> plt.Figure:
    configs = [c for c in CONFIG_ORDER if c in results]
    values = [results[c]["aggregate"][metric_key] for c in configs]
    colors = [CONFIG_COLORS.get(c, "#444") for c in configs]
    labels = [CONFIG_LABELS.get(c, c) for c in configs]

    fig, ax = plt.subplots(figsize=(7.5, 4.5))
    bars = ax.bar(labels, values, color=colors, edgecolor="black", linewidth=0.5)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ymax = max(values + [0.0])
    ax.set_ylim(0, max(0.05, ymax * 1.18))
    for bar, value in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + ymax * 0.02,
            f"{value:.3f}" if value < 1 else f"{value:.0f}",
            ha="center",
            va="bottom",
            fontweight="semibold",
        )
    return fig


def figure_retrieval_performance(results):
    return _grouped_bar(
        "recall_at_5",
        "Recall@5",
        "Figure 1 · Retrieval performance by method (120-query benchmark)",
        results,
    )


def figure_groundedness(results):
    return _grouped_bar(
        "groundedness_rate",
        "Grounded answers (fraction)",
        "Figure 2 · Answer groundedness across configurations",
        results,
    )


def figure_hallucination(results):
    return _grouped_bar(
        "hallucination_proxy_rate",
        "Hallucination proxy rate",
        "Figure 3 · Automatic hallucination proxy (lower is better)",
        results,
    )


def figure_confidence_distribution(results):
    configs = [c for c in CONFIG_ORDER if c in results]
    levels = ["high", "medium", "low", "insufficient"]
    counts = {
        config: [results[config]["confidence_distribution"].get(level, 0) for level in levels]
        for config in configs
    }
    fig, ax = plt.subplots(figsize=(7.5, 4.5))
    bottom = np.zeros(len(configs))
    palette = ["#16A34A", "#2563EB", "#EAB308", "#DC2626"]
    for level, color in zip(levels, palette):
        values = np.array([counts[config][levels.index(level)] for config in configs])
        ax.bar(
            [CONFIG_LABELS.get(c, c) for c in configs],
            values,
            bottom=bottom,
            label=level,
            color=color,
            edgecolor="black",
            linewidth=0.4,
        )
        bottom += values
    ax.set_ylabel("Number of queries")
    ax.set_title("Figure 4 · Confidence distribution across configurations")
    ax.legend(title="Confidence", loc="upper right", frameon=False)
    return fig


def figure_category_performance(results):
    configs = [c for c in CONFIG_ORDER if c in results]
    categories = list(results[configs[0]]["category_metrics"].keys())
    width = 0.25
    x = np.arange(len(categories))
    fig, ax = plt.subplots(figsize=(9.5, 5))
    for i, config in enumerate(configs):
        recalls = [
            results[config]["category_metrics"].get(cat, {}).get("recall_at_5", 0)
            for cat in categories
        ]
        ax.bar(
            x + (i - 1) * width,
            recalls,
            width,
            label=CONFIG_LABELS.get(config, config).replace("\n", " "),
            color=CONFIG_COLORS.get(config, "#444"),
            edgecolor="black",
            linewidth=0.4,
        )
    ax.set_xticks(x)
    ax.set_xticklabels([cat.replace("_", " ") for cat in categories], rotation=20, ha="right")
    ax.set_ylabel("Recall@5")
    ax.set_title("Figure 5 · Category-level retrieval performance")
    ax.legend(loc="upper right", frameon=False)
    return fig


def figure_latency(results):
    return _grouped_bar(
        "avg_response_time",
        "Average response time (seconds)",
        "Figure 6 · End-to-end latency per query",
        results,
    )


def figure_human_eval_radar(results):
    """Radar chart based on the four runtime quality signals available without
    human annotation: recall@5, precision@5, MRR, groundedness_rate. We name
    them 'system quality dimensions' so it is clear this is *not* a human
    Likert score — those require external annotation."""
    metrics = [
        ("Recall@5", "recall_at_5"),
        ("Precision@5", "precision_at_5"),
        ("MRR", "mrr"),
        ("nDCG@5", "ndcg_at_5"),
        ("Groundedness", "groundedness_rate"),
    ]
    labels = [m[0] for m in metrics]
    angles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(7, 6.5), subplot_kw={"projection": "polar"})
    for config in CONFIG_ORDER:
        if config not in results:
            continue
        agg = results[config]["aggregate"]
        values = [agg[key] for _, key in metrics]
        values += values[:1]
        ax.plot(
            angles,
            values,
            color=CONFIG_COLORS.get(config, "#444"),
            label=CONFIG_LABELS.get(config, config).replace("\n", " "),
            linewidth=2,
        )
        ax.fill(angles, values, color=CONFIG_COLORS.get(config, "#444"), alpha=0.12)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0.25", "0.50", "0.75", "1.00"], color="#555")
    ax.set_ylim(0, 1)
    ax.set_title("Figure 7 · System quality dimensions across configurations\n(runtime metrics; not a human Likert score)", pad=18)
    ax.legend(loc="upper right", bbox_to_anchor=(1.35, 1.1), frameon=False)
    return fig


def figure_source_type_contribution(results):
    """Distribution of retrieved doc_types across categories for the best
    configuration we report (hybrid + rerank if available, else hybrid)."""
    config = "hybrid_bm25_rerank" if "hybrid_bm25_rerank" in results else "hybrid_bm25"
    if config not in results:
        return None
    per_query = results[config].get("per_query", [])
    categories = sorted({row["category"] for row in per_query})
    types_seen = set()
    for row in per_query:
        types_seen.update(row.get("retrieved_doc_types", []))
    types = sorted(types_seen)

    matrix = np.zeros((len(categories), len(types)))
    for row in per_query:
        cat_idx = categories.index(row["category"])
        for doc_type in row.get("retrieved_doc_types", []):
            matrix[cat_idx, types.index(doc_type)] += 1

    matrix_pct = matrix / matrix.sum(axis=1, keepdims=True).clip(min=1) * 100

    fig, ax = plt.subplots(figsize=(9, 5))
    bottom = np.zeros(len(categories))
    palette = plt.cm.tab10.colors
    for i, doc_type in enumerate(types):
        ax.bar(
            [cat.replace("_", " ") for cat in categories],
            matrix_pct[:, i],
            bottom=bottom,
            label=doc_type,
            color=palette[i % len(palette)],
            edgecolor="black",
            linewidth=0.4,
        )
        bottom += matrix_pct[:, i]
    ax.set_ylabel("Share of retrieved citations (%)")
    ax.set_title(
        f"Figure 8 · Contribution of source types per category ({config})"
    )
    ax.set_ylim(0, 105)
    ax.legend(title="Document type", loc="upper right", frameon=False)
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")
    return fig


def figure_corpus_composition(results):
    """Composition of the indexed legal corpus (largest reported subset)."""
    by_type: Dict[str, int] = {}
    for payload in results.values():
        candidate = payload.get("corpus", {}).get("by_doc_type") or {}
        if sum(candidate.values()) > sum(by_type.values()):
            by_type = candidate
    if not by_type:
        return None
    items = sorted(by_type.items(), key=lambda kv: kv[1], reverse=True)
    labels, counts = zip(*items)
    fig, ax = plt.subplots(figsize=(8, 4.5))
    bars = ax.bar(labels, counts, color="#2563EB", edgecolor="black", linewidth=0.4)
    ax.set_ylabel("Number of documents")
    ax.set_title("Figure 9 · Composition of the indexed legal corpus")
    ax.set_yscale("log")
    for bar, value in zip(bars, counts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value * 1.05,
            f"{value:,}",
            ha="center",
            va="bottom",
            fontsize=9,
        )
    return fig


def figure_recall_with_ci(results):
    """Recall@5 with 95% bootstrap confidence intervals."""
    configs = [c for c in CONFIG_ORDER if c in results]
    rng = np.random.default_rng(20260503)
    means: List[float] = []
    lows: List[float] = []
    highs: List[float] = []
    for config in configs:
        per_query = results[config]["per_query"]
        recalls = np.array([row["recall_at_5"] for row in per_query])
        boots = np.empty(2000)
        for i in range(2000):
            idx = rng.integers(0, len(recalls), size=len(recalls))
            boots[i] = recalls[idx].mean()
        means.append(float(recalls.mean()))
        lows.append(float(np.quantile(boots, 0.025)))
        highs.append(float(np.quantile(boots, 0.975)))

    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    x = np.arange(len(configs))
    yerr = np.array([
        [m - lo for m, lo in zip(means, lows)],
        [hi - m for m, hi in zip(means, highs)],
    ])
    bars = ax.bar(
        [CONFIG_LABELS.get(c, c) for c in configs],
        means,
        yerr=yerr,
        color=[CONFIG_COLORS.get(c, "#444") for c in configs],
        edgecolor="black",
        linewidth=0.5,
        capsize=5,
    )
    for bar, value in zip(bars, means):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 0.02,
            f"{value:.3f}",
            ha="center", va="bottom", fontweight="semibold",
        )
    ax.set_ylabel("Recall@5")
    ax.set_ylim(0, max(highs + [0.0]) * 1.18 + 0.05)
    ax.set_title("Figure 11 · Recall@5 with 95% bootstrap confidence intervals (n=2000)")
    return fig


def figure_success_failure(results):
    """For each configuration, fraction of queries with at least one
    high-relevance citation (>=0.65) vs not."""
    configs = [c for c in CONFIG_ORDER if c in results]
    fractions = []
    for config in configs:
        per_query = results[config].get("per_query", [])
        success = sum(1 for r in per_query if r.get("recall_at_5", 0) > 0)
        fractions.append(success / len(per_query) if per_query else 0)

    fig, ax = plt.subplots(figsize=(7.5, 4.5))
    bars = ax.bar(
        [CONFIG_LABELS.get(c, c) for c in configs],
        fractions,
        color=[CONFIG_COLORS.get(c, "#444") for c in configs],
        edgecolor="black",
        linewidth=0.5,
    )
    ax.set_ylabel("Fraction of queries with non-zero recall@5")
    ax.set_title("Figure 10 · Per-query success rate")
    ax.set_ylim(0, 1.05)
    for bar, value in zip(bars, fractions):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 0.015,
            f"{value:.1%}",
            ha="center",
            va="bottom",
            fontweight="semibold",
        )
    return fig


# ── Driver ────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Render JurisGPT paper artefacts")
    parser.add_argument("--show-paths", action="store_true", help="Print written paths")
    args = parser.parse_args()

    results = _latest_results()
    print(f"Using {len(results)} configurations: {sorted(results)}")

    aggregate_table = _aggregate_table(results)
    category_table = _category_table(results)

    aggregate_csv = FIGURES_DIR / "aggregate_metrics.csv"
    category_csv = FIGURES_DIR / "category_metrics.csv"
    aggregate_table.to_csv(aggregate_csv, index=False)
    category_table.to_csv(category_csv, index=False)

    figure_writers = [
        ("fig01_retrieval_performance.png", figure_retrieval_performance),
        ("fig02_groundedness.png", figure_groundedness),
        ("fig03_hallucination.png", figure_hallucination),
        ("fig04_confidence_distribution.png", figure_confidence_distribution),
        ("fig05_category_performance.png", figure_category_performance),
        ("fig06_latency.png", figure_latency),
        ("fig07_quality_radar.png", figure_human_eval_radar),
        ("fig08_source_type_contribution.png", figure_source_type_contribution),
        ("fig09_corpus_composition.png", figure_corpus_composition),
        ("fig10_success_rate.png", figure_success_failure),
        ("fig11_recall_with_ci.png", figure_recall_with_ci),
    ]
    written: List[Path] = [aggregate_csv, category_csv]
    for filename, fn in figure_writers:
        fig = fn(results)
        if fig is None:
            continue
        written.append(_save(fig, filename))

    metrics_md = FIGURES_DIR / "METRICS.md"
    lines = [
        "# JurisGPT — Paper Metrics Snapshot",
        "",
        "Auto-generated from the latest 120-query benchmark run.",
        "",
        "## Aggregate Comparison (all configurations)",
        "",
        aggregate_table.to_markdown(index=False, floatfmt=".4f"),
        "",
        "## Per-Category Recall@5 (selected metrics)",
        "",
        category_table.to_markdown(index=False, floatfmt=".4f"),
        "",
        "## Figures",
        "",
    ]
    for filename, _ in figure_writers:
        lines.append(f"- `{filename}`")
    metrics_md.write_text("\n".join(lines), encoding="utf-8")
    written.append(metrics_md)

    if args.show_paths:
        for path in written:
            print(path)
    else:
        print(f"Wrote {len(written)} artefacts to {FIGURES_DIR}/")


if __name__ == "__main__":
    main()
