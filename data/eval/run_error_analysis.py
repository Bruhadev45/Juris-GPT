#!/usr/bin/env python3
"""Per-query error analysis for the JurisGPT benchmark.

For every configuration in ``data/eval/results/eval_<cfg>_<ts>.json`` and
every benchmark query, this script:

1. Flags hard failures (``recall_at_5 == 0``) with their query text,
   expected doc-types/acts, and the doc-types actually retrieved.
2. Computes failure rates broken down by:
   - benchmark category
   - expected doc_type
   - expected act
3. Builds a doc-type confusion matrix between expected and retrieved.

Outputs (under ``data/eval/results/figures/``):
    - error_analysis.md (paper appendix)
    - error_failures.csv (one row per failed query × config)
    - error_failure_rate_by_category.png
    - error_doctype_confusion_<config>.png (one per config)
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)
BENCHMARK_PATH = EVAL_DIR / "benchmark_queries.json"

CONFIG_ORDER: List[str] = [
    "baseline_lexical",
    "hybrid_bm25",
    "hybrid_bm25_rerank",
    "dense_minilm",
    "dense_minilm_rerank",
]


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


def _load_benchmark_index() -> Dict[str, dict]:
    benchmark = json.loads(BENCHMARK_PATH.read_text())
    return {row["id"]: row for row in benchmark["queries"]}


def main() -> None:
    results = _latest_results()
    if not results:
        raise SystemExit("No eval result JSONs in data/eval/results/")
    benchmark_index = _load_benchmark_index()
    configs = list(results.keys())

    # ── Hard failure rows ─────────────────────────────────────────────
    failures: List[dict] = []
    for config, payload in results.items():
        for row in payload["per_query"]:
            if row["recall_at_5"] > 0:
                continue
            bench = benchmark_index.get(row["query_id"], {})
            failures.append({
                "config": config,
                "query_id": row["query_id"],
                "category": row["category"],
                "query": row["query"],
                "expected_doc_types": bench.get("expected_doc_types", []),
                "expected_acts": bench.get("expected_acts", []),
                "retrieved_doc_types": row.get("retrieved_doc_types", []),
                "retrieved_acts": row.get("retrieved_acts", []),
                "confidence": row["confidence"],
                "num_citations": row["num_citations"],
            })

    failures_csv = FIGURES_DIR / "error_failures.csv"
    with failures_csv.open("w") as f:
        cols = [
            "config", "query_id", "category", "confidence",
            "num_citations", "query",
            "expected_doc_types", "expected_acts",
            "retrieved_doc_types", "retrieved_acts",
        ]
        f.write(",".join(cols) + "\n")
        for failure in failures:
            f.write(
                ",".join(
                    json.dumps(failure[col]) if isinstance(failure[col], list)
                    else str(failure[col]).replace(",", ";")
                    for col in cols
                ) + "\n"
            )

    # ── Failure rate breakdowns ──────────────────────────────────────
    failure_rate_by_category: Dict[str, Dict[str, float]] = {}
    for config, payload in results.items():
        per_cat: Dict[str, List[float]] = defaultdict(list)
        for row in payload["per_query"]:
            per_cat[row["category"]].append(0 if row["recall_at_5"] > 0 else 1)
        failure_rate_by_category[config] = {
            cat: round(sum(values) / len(values), 4)
            for cat, values in per_cat.items()
        }

    fig, ax = plt.subplots(figsize=(9.5, 5))
    categories = sorted({
        cat for per_cat in failure_rate_by_category.values()
        for cat in per_cat
    })
    width = 0.8 / max(1, len(configs))
    x = np.arange(len(categories))
    palette = plt.cm.tab10.colors
    for i, config in enumerate(configs):
        rates = [failure_rate_by_category[config].get(cat, 0) for cat in categories]
        ax.bar(
            x + (i - len(configs) / 2) * width + width / 2,
            rates,
            width,
            label=config,
            color=palette[i % len(palette)],
            edgecolor="black",
            linewidth=0.4,
        )
    ax.set_xticks(x)
    ax.set_xticklabels([c.replace("_", " ") for c in categories], rotation=20, ha="right")
    ax.set_ylabel("Failure rate (recall@5 = 0)")
    ax.set_title("Figure E1 · Failure rate by category and configuration")
    ax.set_ylim(0, 1.05)
    ax.grid(True, axis="y", alpha=0.25)
    ax.legend(loc="upper right", frameon=False)
    fig.tight_layout()
    fr_path = FIGURES_DIR / "error_failure_rate_by_category.png"
    fig.savefig(fr_path, dpi=200)
    plt.close(fig)

    # ── Doc-type confusion matrices ──────────────────────────────────
    confusion_paths: List[Path] = []
    for config, payload in results.items():
        expected_types: List[str] = []
        retrieved_types: List[str] = []
        for row in payload["per_query"]:
            bench = benchmark_index.get(row["query_id"], {})
            expected = bench.get("expected_doc_types", []) or ["any"]
            retrieved = row.get("retrieved_doc_types", []) or ["none"]
            for et in expected:
                for rt in retrieved:
                    expected_types.append(et)
                    retrieved_types.append(rt)
        all_types = sorted(set(expected_types) | set(retrieved_types))
        if not all_types:
            continue
        idx = {t: i for i, t in enumerate(all_types)}
        matrix = np.zeros((len(all_types), len(all_types)))
        for et, rt in zip(expected_types, retrieved_types):
            matrix[idx[et], idx[rt]] += 1
        # Row-normalise so each row sums to 1 (or 0 if the type was never expected).
        row_sums = matrix.sum(axis=1, keepdims=True)
        matrix_pct = np.divide(matrix, row_sums, out=np.zeros_like(matrix), where=row_sums > 0)

        fig, ax = plt.subplots(figsize=(7.5, 6))
        im = ax.imshow(matrix_pct, cmap="Blues", vmin=0, vmax=1)
        ax.set_xticks(range(len(all_types)))
        ax.set_yticks(range(len(all_types)))
        ax.set_xticklabels(all_types, rotation=30, ha="right")
        ax.set_yticklabels(all_types)
        ax.set_xlabel("Retrieved doc_type")
        ax.set_ylabel("Expected doc_type")
        ax.set_title(f"Figure E2 · Doc-type confusion ({config})")
        for i in range(len(all_types)):
            for j in range(len(all_types)):
                if matrix_pct[i, j] > 0:
                    ax.text(
                        j, i,
                        f"{matrix_pct[i, j]:.2f}",
                        ha="center", va="center",
                        color="white" if matrix_pct[i, j] > 0.5 else "black",
                        fontsize=9,
                    )
        plt.colorbar(im, ax=ax, fraction=0.04, pad=0.04, label="row-normalised")
        fig.tight_layout()
        cm_path = FIGURES_DIR / f"error_doctype_confusion_{config}.png"
        fig.savefig(cm_path, dpi=200)
        plt.close(fig)
        confusion_paths.append(cm_path)

    # ── Markdown summary ─────────────────────────────────────────────
    md_lines = [
        "# JurisGPT Error Analysis",
        "",
        f"Configurations: {', '.join(configs)}",
        f"Total failures (recall@5 = 0) across configs: {len(failures)}",
        "",
        "## Failure rate by category",
        "",
        "| Category | " + " | ".join(configs) + " |",
        "|---|" + "|".join("---" for _ in configs) + "|",
    ]
    for category in categories:
        cells = [
            f"{failure_rate_by_category[config].get(category, 0):.2%}"
            for config in configs
        ]
        md_lines.append(f"| {category} | " + " | ".join(cells) + " |")

    md_lines.extend([
        "",
        "## Most-failed expected acts (across all configs)",
        "",
        "| Expected act | Failures |",
        "|---|---|",
    ])
    act_failures: Dict[str, int] = defaultdict(int)
    for failure in failures:
        for act in failure.get("expected_acts", []):
            act_failures[act] += 1
    for act, count in sorted(act_failures.items(), key=lambda kv: -kv[1])[:15]:
        md_lines.append(f"| {act} | {count} |")

    md_lines.extend([
        "",
        "## Sample of hard failures (first 10)",
        "",
        "| config | query_id | category | expected_doc_types | retrieved_doc_types |",
        "|---|---|---|---|---|",
    ])
    for failure in failures[:10]:
        md_lines.append(
            f"| {failure['config']} | {failure['query_id']} | {failure['category']} "
            f"| {failure['expected_doc_types']} | {failure['retrieved_doc_types']} |"
        )

    md_lines.extend([
        "",
        "## Generated figures",
        f"- {fr_path.name}",
        *(f"- {p.name}" for p in confusion_paths),
        f"- {failures_csv.name}",
    ])
    md_path = FIGURES_DIR / "error_analysis.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Wrote {md_path}")
    print(f"Wrote {failures_csv}")
    print(f"Wrote {fr_path}")
    for p in confusion_paths:
        print(f"Wrote {p}")


if __name__ == "__main__":
    main()
