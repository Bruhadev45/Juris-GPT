#!/usr/bin/env python3
"""Build a reproducibility manifest for the JurisGPT benchmark.

Records the exact corpus contents, Python and dependency versions, and
host fingerprint that produced the latest evaluation run. Reviewers can
hash the corpus on their side and compare against this file to ensure
identical inputs.

Outputs ``data/eval/results/REPRODUCIBILITY.json``.
"""
from __future__ import annotations

import hashlib
import json
import os
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

DATA_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = DATA_DIR / "eval" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def _sha256(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            data = fh.read(chunk)
            if not data:
                break
            h.update(data)
    return h.hexdigest()


def _enumerate_corpus_files() -> List[Path]:
    candidates: List[Path] = []
    candidates += sorted((DATA_DIR / "datasets" / "samples").glob("*.json"))
    candidates += sorted(
        (DATA_DIR / "datasets" / "indian_law_json" / "Indian-Law-Penal-Code-Json-main").glob("*.json")
    )
    processed = DATA_DIR / "processed" / "hf_legal_corpus.json"
    if processed.exists():
        candidates.append(processed)
    benchmark = DATA_DIR / "eval" / "benchmark_queries.json"
    if benchmark.exists():
        candidates.append(benchmark)
    expanded = DATA_DIR / "eval" / "benchmark_queries_expanded.json"
    if expanded.exists():
        candidates.append(expanded)
    return [p for p in candidates if p.exists()]


def _pip_freeze() -> str:
    try:
        out = subprocess.run(
            [sys.executable, "-m", "pip", "freeze"],
            capture_output=True, check=True, text=True,
        )
        return out.stdout
    except Exception as exc:
        return f"pip freeze failed: {exc!r}"


def _git_commit() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, check=True, text=True,
            cwd=DATA_DIR.parent,
        )
        return out.stdout.strip()
    except Exception:
        return "(not a git repository or git unavailable)"


def main() -> None:
    files = _enumerate_corpus_files()
    manifest: Dict[str, object] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "host": {
            "platform": platform.platform(),
            "python": sys.version,
            "machine": platform.machine(),
            "processor": platform.processor(),
        },
        "git_commit": _git_commit(),
        "corpus": [
            {
                "path": str(path.relative_to(DATA_DIR.parent)),
                "size_bytes": path.stat().st_size,
                "sha256": _sha256(path),
            }
            for path in files
        ],
        "pip_freeze": _pip_freeze().splitlines(),
        "env_subset": {
            k: v for k, v in os.environ.items()
            if k.startswith(("RAG_", "EMBEDDING_", "JURISGPT_"))
        },
    }
    out = RESULTS_DIR / "REPRODUCIBILITY.json"
    out.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"Wrote {out}")
    print(f"  Hashed {len(files)} corpus files")


if __name__ == "__main__":
    main()
