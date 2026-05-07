#!/usr/bin/env python3
"""Render a JurisGPT system-architecture diagram as PNG.

Pure-matplotlib block diagram so the paper has a clean architecture figure
without depending on Graphviz/dot. Output: ``data/eval/results/figures/
fig_architecture.png``.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent / "results" / "figures" / "fig_architecture.png"
OUT.parent.mkdir(parents=True, exist_ok=True)


def _box(ax, xy, w, h, text, color, edge="#1f2937"):
    rect = mpatches.FancyBboxPatch(
        xy,
        w,
        h,
        boxstyle="round,pad=0.04,rounding_size=0.18",
        linewidth=1.4,
        edgecolor=edge,
        facecolor=color,
    )
    ax.add_patch(rect)
    ax.text(
        xy[0] + w / 2,
        xy[1] + h / 2,
        text,
        ha="center",
        va="center",
        fontsize=10,
        wrap=True,
    )


def _arrow(ax, start, end, label=None):
    ax.annotate(
        "",
        xy=end,
        xytext=start,
        arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.4),
    )
    if label:
        mid = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.08)
        ax.text(mid[0], mid[1], label, ha="center", fontsize=8, color="#4B5563")


def main() -> None:
    fig, ax = plt.subplots(figsize=(12.5, 8.5))
    ax.set_xlim(0, 12.5)
    ax.set_ylim(0, 8.5)
    ax.set_axis_off()
    ax.set_title("JurisGPT — End-to-End System Architecture", pad=20, fontsize=13)

    # Frontend
    _box(ax, (0.4, 7.0), 3.6, 1.0,
         "Next.js 16 / React 19 chat UI\n(/dashboard/chat)",
         "#DBEAFE")

    # Backend
    _box(ax, (4.6, 7.0), 7.6, 1.0,
         "FastAPI backend (auth, CSRF, rate-limit, audit, /api/chat/stream)",
         "#FEF3C7")

    # RAG core
    _box(ax, (4.6, 5.5), 7.6, 1.1,
         "JurisGPTRAG — preprocess → retrieve → confidence → generate",
         "#E0E7FF")

    # Preprocessing
    _box(ax, (0.4, 4.0), 3.6, 1.0,
         "Query preprocessor\n(section regex + abbreviation expansion)",
         "#F3F4F6")

    # Retrieval components
    _box(ax, (4.6, 4.0), 2.4, 1.0, "BM25Okapi\n(rank-bm25)", "#DCFCE7")
    _box(ax, (7.2, 4.0), 2.4, 1.0, "Inverted index\n(token → doc_ids)", "#DCFCE7")
    _box(ax, (9.8, 4.0), 2.4, 1.0,
         "Chroma + MiniLM\n(28k vectors, 384d)",
         "#DCFCE7")

    # Fusion + rerank
    _box(ax, (4.6, 2.5), 3.6, 1.0,
         "Weighted Reciprocal Rank Fusion\n(k=60, BM25 ×2 weight)",
         "#E0F2FE")
    _box(ax, (8.6, 2.5), 3.6, 1.0,
         "Cross-encoder rerank\n(ms-marco MiniLM-L-6)",
         "#FEE2E2")

    # Confidence + LLM
    _box(ax, (0.4, 2.5), 3.6, 1.0,
         "Confidence layer\n(threshold + topic + diversity)",
         "#F3F4F6")

    _box(ax, (4.6, 1.0), 7.6, 1.0,
         "Optional LLM generation (Local Legal Llama → OpenAI fallback)\n"
         "or retrieval-only response with grounded citations",
         "#FFE4E6")

    _box(ax, (0.4, 1.0), 3.6, 1.0,
         "Structured response\n(answer, citations, confidence, limitations)",
         "#F3F4F6")

    # Arrows
    _arrow(ax, (2.2, 7.0), (2.2, 5.0), "POST /api/chat/stream")
    _arrow(ax, (8.4, 7.0), (8.4, 6.6))
    _arrow(ax, (5.8, 5.5), (5.8, 5.0))
    _arrow(ax, (8.4, 5.5), (8.4, 5.0))
    _arrow(ax, (11.0, 5.5), (11.0, 5.0))
    _arrow(ax, (5.8, 4.0), (6.0, 3.5))
    _arrow(ax, (11.0, 4.0), (10.4, 3.5))
    _arrow(ax, (6.4, 2.5), (8.6, 3.0))
    _arrow(ax, (10.4, 2.5), (8.4, 2.0))
    _arrow(ax, (6.4, 2.5), (4.0, 2.0))
    _arrow(ax, (2.2, 4.0), (2.2, 3.5))
    _arrow(ax, (2.2, 2.5), (2.2, 2.0))

    fig.tight_layout()
    fig.savefig(OUT, dpi=200)
    plt.close(fig)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
