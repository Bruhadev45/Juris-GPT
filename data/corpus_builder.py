#!/usr/bin/env python3
"""
JurisGPT Corpus Builder
=======================

Ingestion pipeline that downloads Indian legal datasets from HuggingFace Hub,
normalizes them to a unified schema, chunks long documents, and saves the
processed corpus as JSON.

Unified record schema
---------------------
{
    "title":    str,
    "content":  str,
    "doc_type": str,       # "judgment" | "statute" | "legal_text"
    "source":   str,       # HuggingFace dataset identifier
    "section":  str|None,
    "act":      str|None,
    "metadata": dict
}

Usage
-----
    python corpus_builder.py --download --normalize --chunk \
        --output processed/hf_legal_corpus.json
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterator, Sequence

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "processed"
RAW_CACHE_DIR = BASE_DIR / "raw" / "hf_cache"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("corpus_builder")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DATASET_REGISTRY: list[dict[str, Any]] = [
    {
        "repo_id": "opennyaiorg/InJudgements_dataset",
        "label": "OpenNyAI SC/HC Judgments",
        "doc_type": "judgment",
        "trust_remote_code": True,
        # Schema: Titles, Court_Name, Cites, Cited_by, Doc_url, Text,
        #         Doc_size, Case_Type, Court_Type, Court_Name_Normalized
    },
    {
        "repo_id": "geekyrakshit/indian-legal-acts",
        "label": "Indian Legal Acts (statutes)",
        "doc_type": "statute",
        "trust_remote_code": True,
        # Schema: Enactment Date, Act Number, Short Title, View, Entity, Markdown
        # Splits: central, andaman_and_nicobar_islands, andhra_pradesh, arunachal_pradesh
    },
    {
        "repo_id": "Prarabdha/indian-legal-data",
        "label": "Large-scale Indian Legal Data",
        "doc_type": "legal_text",
        "trust_remote_code": True,
        # Schema: text (single column)
        # 6M+ rows -- we sample to keep things manageable
        "streaming": True,
        "max_records": 10_000,
    },
]

DEFAULT_CHUNK_SIZE = 512       # tokens
DEFAULT_CHUNK_OVERLAP = 50     # tokens
DEFAULT_OUTPUT = "processed/hf_legal_corpus.json"

# Approximate token-to-character ratio for English legal text.
# tiktoken is used when available; otherwise we fall back to this heuristic.
_CHARS_PER_TOKEN_ESTIMATE = 4


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class CorpusRecord:
    """A single normalized record in the JurisGPT corpus."""

    title: str
    content: str
    doc_type: str
    source: str
    section: str | None = None
    act: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Tokenizer helper
# ---------------------------------------------------------------------------
class _Tokenizer:
    """Thin wrapper that tries tiktoken first, then falls back to a rough
    character-based estimate."""

    def __init__(self) -> None:
        self._enc = None
        try:
            import tiktoken
            self._enc = tiktoken.get_encoding("cl100k_base")
            log.info("Using tiktoken (cl100k_base) for token counting.")
        except ImportError:
            log.info(
                "tiktoken not installed -- using character-based approximation "
                "(%d chars/token).",
                _CHARS_PER_TOKEN_ESTIMATE,
            )

    def count(self, text: str) -> int:
        if self._enc is not None:
            return len(self._enc.encode(text))
        return max(1, len(text) // _CHARS_PER_TOKEN_ESTIMATE)

    def truncate(self, text: str, max_tokens: int) -> str:
        """Return the first *max_tokens* tokens of *text*."""
        if self._enc is not None:
            token_ids = self._enc.encode(text)[:max_tokens]
            return self._enc.decode(token_ids)
        return text[: max_tokens * _CHARS_PER_TOKEN_ESTIMATE]


_tokenizer = _Tokenizer()


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
def _load_dataset_safe(
    repo_id: str,
    *,
    trust_remote_code: bool = True,
    streaming: bool = False,
    max_records: int | None = None,
) -> Any | None:
    """Attempt to load a HuggingFace dataset, returning ``None`` on failure."""
    try:
        from datasets import load_dataset
    except ImportError:
        log.error(
            "The `datasets` library is required. Install it with: "
            "pip install datasets"
        )
        return None

    try:
        log.info("Loading %s (streaming=%s) ...", repo_id, streaming)
        ds = load_dataset(
            repo_id,
            trust_remote_code=trust_remote_code,
            streaming=streaming,
            cache_dir=str(RAW_CACHE_DIR),
        )
        return ds
    except Exception:
        log.exception("Failed to load dataset %s", repo_id)
        return None


def download_datasets() -> dict[str, Any]:
    """Download every dataset in the registry. Returns a mapping of
    ``repo_id -> dataset_or_None``."""
    results: dict[str, Any] = {}
    for entry in DATASET_REGISTRY:
        repo_id = entry["repo_id"]
        ds = _load_dataset_safe(
            repo_id,
            trust_remote_code=entry.get("trust_remote_code", True),
            streaming=entry.get("streaming", False),
            max_records=entry.get("max_records"),
        )
        results[repo_id] = ds
    return results


# ---------------------------------------------------------------------------
# Normalization helpers (one per dataset)
# ---------------------------------------------------------------------------
def _safe_str(value: Any, default: str = "") -> str:
    """Coerce a value to ``str``, returning *default* for ``None``."""
    if value is None:
        return default
    return str(value).strip()


def _normalize_injudgements(ds: Any) -> list[CorpusRecord]:
    """Normalize ``opennyaiorg/InJudgements_dataset``.

    Columns: Titles, Court_Name, Cites, Cited_by, Doc_url, Text,
             Doc_size, Case_Type, Court_Type, Court_Name_Normalized
    """
    try:
        from tqdm import tqdm
    except ImportError:  # pragma: no cover
        tqdm = lambda x, **kw: x  # noqa: E731

    records: list[CorpusRecord] = []
    repo_id = "opennyaiorg/InJudgements_dataset"

    # The dataset has a single "train" split.
    split_data = ds.get("train", ds)

    for row in tqdm(split_data, desc="InJudgements", unit="doc"):
        text = _safe_str(row.get("Text"))
        if not text:
            continue

        title = _safe_str(row.get("Titles"), default="Untitled Judgment")
        court = _safe_str(row.get("Court_Name_Normalized") or row.get("Court_Name"))
        case_type = _safe_str(row.get("Case_Type"))

        meta: dict[str, Any] = {}
        if court:
            meta["court"] = court
        if case_type:
            meta["case_type"] = case_type

        cites = row.get("Cites")
        cited_by = row.get("Cited_by")
        if cites is not None:
            meta["cites"] = cites
        if cited_by is not None:
            meta["cited_by"] = cited_by

        doc_url = _safe_str(row.get("Doc_url"))
        if doc_url:
            meta["url"] = doc_url

        court_type = _safe_str(row.get("Court_Type"))
        if court_type:
            meta["court_type"] = court_type

        records.append(
            CorpusRecord(
                title=title,
                content=text,
                doc_type="judgment",
                source=repo_id,
                section=None,
                act=None,
                metadata=meta,
            )
        )

    log.info("InJudgements: %d records normalized.", len(records))
    return records


def _normalize_indian_legal_acts(ds: Any) -> list[CorpusRecord]:
    """Normalize ``geekyrakshit/indian-legal-acts``.

    Columns: Enactment Date, Act Number, Short Title, View, Entity, Markdown
    Splits: central, andaman_and_nicobar_islands, andhra_pradesh, arunachal_pradesh
    """
    try:
        from tqdm import tqdm
    except ImportError:
        tqdm = lambda x, **kw: x  # noqa: E731

    records: list[CorpusRecord] = []
    repo_id = "geekyrakshit/indian-legal-acts"

    # Iterate over all splits.
    split_names = list(ds.keys()) if hasattr(ds, "keys") else ["train"]
    for split_name in split_names:
        split_data = ds[split_name] if hasattr(ds, "__getitem__") else ds
        for row in tqdm(
            split_data,
            desc=f"IndianLegalActs/{split_name}",
            unit="act",
        ):
            content = _safe_str(row.get("Markdown"))
            if not content:
                continue

            short_title = _safe_str(
                row.get("Short Title"), default="Untitled Act"
            )
            enactment_date = _safe_str(row.get("Enactment Date"))
            act_number = _safe_str(row.get("Act Number"))
            entity = _safe_str(row.get("Entity"))
            view_url = _safe_str(row.get("View"))

            meta: dict[str, Any] = {"split": split_name}
            if enactment_date:
                meta["enactment_date"] = enactment_date
            if act_number:
                meta["act_number"] = act_number
            if entity:
                meta["entity"] = entity
            if view_url:
                meta["url"] = view_url

            records.append(
                CorpusRecord(
                    title=short_title,
                    content=content,
                    doc_type="statute",
                    source=repo_id,
                    section=None,
                    act=short_title,
                    metadata=meta,
                )
            )

    log.info("IndianLegalActs: %d records normalized.", len(records))
    return records


def _normalize_prarabdha(ds: Any, max_records: int = 10_000) -> list[CorpusRecord]:
    """Normalize ``Prarabdha/indian-legal-data``.

    Single column: text
    6M+ rows -- we sample/limit to *max_records*.
    """
    try:
        from tqdm import tqdm
    except ImportError:
        tqdm = lambda x, **kw: x  # noqa: E731

    records: list[CorpusRecord] = []
    repo_id = "Prarabdha/indian-legal-data"
    count = 0

    # When loaded with streaming=True the splits are IterableDatasetDict.
    split_data = ds.get("train", ds) if hasattr(ds, "get") else ds

    progress = tqdm(
        desc="Prarabdha/indian-legal-data",
        total=max_records,
        unit="doc",
    )

    try:
        for row in split_data:
            text = _safe_str(row.get("text"))
            if not text or len(text) < 100:
                continue

            # Attempt to extract a title from the first line.
            first_line = text.split("\n", 1)[0].strip()
            title = first_line[:200] if first_line else "Indian Legal Document"

            records.append(
                CorpusRecord(
                    title=title,
                    content=text,
                    doc_type="legal_text",
                    source=repo_id,
                    section=None,
                    act=None,
                    metadata={},
                )
            )
            count += 1
            progress.update(1)

            if count >= max_records:
                break
    finally:
        progress.close()

    log.info("Prarabdha: %d records normalized.", len(records))
    return records


# Dispatch table: repo_id -> normalizer function
_NORMALIZERS: dict[str, Any] = {
    "opennyaiorg/InJudgements_dataset": _normalize_injudgements,
    "geekyrakshit/indian-legal-acts": _normalize_indian_legal_acts,
    "Prarabdha/indian-legal-data": _normalize_prarabdha,
}


# ---------------------------------------------------------------------------
# Public: normalize
# ---------------------------------------------------------------------------
def normalize_datasets(
    loaded: dict[str, Any],
) -> list[CorpusRecord]:
    """Apply per-dataset normalizers and return a flat list of records."""
    all_records: list[CorpusRecord] = []

    for entry in DATASET_REGISTRY:
        repo_id = entry["repo_id"]
        ds = loaded.get(repo_id)
        if ds is None:
            log.warning("Skipping %s (not loaded).", repo_id)
            continue

        normalizer = _NORMALIZERS.get(repo_id)
        if normalizer is None:
            log.warning("No normalizer registered for %s -- skipping.", repo_id)
            continue

        try:
            if repo_id == "Prarabdha/indian-legal-data":
                records = normalizer(
                    ds, max_records=entry.get("max_records", 10_000)
                )
            else:
                records = normalizer(ds)
            all_records.extend(records)
        except Exception:
            log.exception("Error normalizing %s", repo_id)

    log.info("Total normalized records: %d", len(all_records))
    return all_records


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
def _iter_sentence_boundaries(text: str) -> Iterator[int]:
    """Yield character offsets just after sentence-ending punctuation."""
    import re

    # Match period/question-mark/exclamation followed by whitespace or end.
    for m in re.finditer(r"[.!?]\s+", text):
        yield m.end()


def chunk_records(
    records: Sequence[CorpusRecord],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """Split long records into overlapping chunks.

    Each output dict contains the unified schema fields plus:
        - ``chunk_index``:  position of this chunk within its parent
        - ``total_chunks``: how many chunks the parent produced

    Short documents that fit within *chunk_size* tokens are emitted as-is
    (with ``chunk_index=0, total_chunks=1``).
    """
    try:
        from tqdm import tqdm
    except ImportError:
        tqdm = lambda x, **kw: x  # noqa: E731

    chunked: list[dict[str, Any]] = []

    for record in tqdm(records, desc="Chunking", unit="doc"):
        text = record.content
        token_count = _tokenizer.count(text)

        if token_count <= chunk_size:
            entry = record.to_dict()
            entry["chunk_index"] = 0
            entry["total_chunks"] = 1
            chunked.append(entry)
            continue

        # Build a list of sentence-boundary offsets for clean splitting.
        boundaries = sorted(set(_iter_sentence_boundaries(text)))

        pieces: list[str] = []
        start_char = 0

        while start_char < len(text):
            # Determine an approximate character budget for this chunk.
            char_budget = chunk_size * _CHARS_PER_TOKEN_ESTIMATE
            end_char = min(start_char + char_budget, len(text))

            # Snap to the nearest sentence boundary that does not exceed
            # the budget, if one exists within range.
            best_boundary = None
            for b in boundaries:
                if b <= start_char:
                    continue
                if b > end_char:
                    break
                best_boundary = b
            if best_boundary is not None:
                end_char = best_boundary

            piece = text[start_char:end_char].strip()
            if piece:
                pieces.append(piece)

            # Advance by (chunk_size - overlap) tokens worth of characters.
            advance = (chunk_size - overlap) * _CHARS_PER_TOKEN_ESTIMATE
            start_char = start_char + max(advance, 1)

        total_chunks = len(pieces)
        for idx, piece in enumerate(pieces):
            entry = record.to_dict()
            entry["content"] = piece
            entry["chunk_index"] = idx
            entry["total_chunks"] = total_chunks
            chunked.append(entry)

    log.info(
        "Chunking complete: %d records -> %d chunks.",
        len(records),
        len(chunked),
    )
    return chunked


# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
def save_corpus(
    data: list[dict[str, Any]],
    output_path: Path,
) -> Path:
    """Write the corpus to a JSON file, creating parent directories as needed."""
    output_path = Path(output_path)
    if not output_path.is_absolute():
        output_path = BASE_DIR / output_path

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)

    size_mb = output_path.stat().st_size / (1024 * 1024)
    log.info("Saved %d records to %s (%.1f MB).", len(data), output_path, size_mb)
    return output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="JurisGPT Corpus Builder -- download, normalize, and chunk "
        "Indian legal datasets from HuggingFace Hub.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  # Full pipeline\n"
            "  python corpus_builder.py --download --normalize --chunk\n\n"
            "  # Download only\n"
            "  python corpus_builder.py --download\n\n"
            "  # Custom output path and chunk settings\n"
            "  python corpus_builder.py --download --normalize --chunk "
            "--chunk-size 256 --chunk-overlap 32 "
            "--output processed/small_corpus.json\n"
        ),
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download datasets from HuggingFace Hub.",
    )
    parser.add_argument(
        "--normalize",
        action="store_true",
        help="Normalize downloaded datasets to a unified schema.",
    )
    parser.add_argument(
        "--chunk",
        action="store_true",
        help="Chunk long documents into overlapping segments.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT,
        help=(
            "Output path relative to the data/ directory "
            f"(default: {DEFAULT_OUTPUT})."
        ),
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help=f"Chunk size in tokens (default: {DEFAULT_CHUNK_SIZE}).",
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=DEFAULT_CHUNK_OVERLAP,
        help=f"Overlap between chunks in tokens (default: {DEFAULT_CHUNK_OVERLAP}).",
    )
    parser.add_argument(
        "--max-prarabdha",
        type=int,
        default=10_000,
        help=(
            "Maximum records to ingest from Prarabdha/indian-legal-data "
            "(default: 10000)."
        ),
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable DEBUG-level logging.",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not any([args.download, args.normalize, args.chunk]):
        parser.print_help()
        print(
            "\nError: specify at least one of --download, --normalize, --chunk.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Update Prarabdha cap from CLI.
    for entry in DATASET_REGISTRY:
        if entry["repo_id"] == "Prarabdha/indian-legal-data":
            entry["max_records"] = args.max_prarabdha

    start = time.monotonic()

    # ------------------------------------------------------------------
    # Step 1: Download
    # ------------------------------------------------------------------
    loaded: dict[str, Any] = {}
    if args.download:
        log.info("=" * 60)
        log.info("STEP 1 / 3  --  Downloading datasets")
        log.info("=" * 60)
        loaded = download_datasets()
        available = sum(1 for v in loaded.values() if v is not None)
        log.info(
            "Download complete: %d / %d datasets available.",
            available,
            len(DATASET_REGISTRY),
        )
    else:
        log.info("Skipping download (--download not specified).")

    # ------------------------------------------------------------------
    # Step 2: Normalize
    # ------------------------------------------------------------------
    records: list[CorpusRecord] = []
    if args.normalize:
        log.info("=" * 60)
        log.info("STEP 2 / 3  --  Normalizing datasets")
        log.info("=" * 60)

        if not loaded:
            log.info(
                "No datasets in memory -- attempting to load from HF cache ..."
            )
            loaded = download_datasets()

        records = normalize_datasets(loaded)

        if not records:
            log.error("No records after normalization. Exiting.")
            sys.exit(1)

        # Save raw (un-chunked) normalized corpus as an intermediate artifact.
        raw_output = PROCESSED_DIR / "hf_legal_normalized.json"
        save_corpus([r.to_dict() for r in records], raw_output)
    else:
        log.info("Skipping normalization (--normalize not specified).")

    # ------------------------------------------------------------------
    # Step 3: Chunk
    # ------------------------------------------------------------------
    if args.chunk:
        log.info("=" * 60)
        log.info("STEP 3 / 3  --  Chunking documents")
        log.info("=" * 60)

        if not records:
            # Try to load from the intermediate normalized file.
            intermediate = PROCESSED_DIR / "hf_legal_normalized.json"
            if intermediate.exists():
                log.info("Loading normalized records from %s ...", intermediate)
                with open(intermediate, "r", encoding="utf-8") as fh:
                    raw = json.load(fh)
                records = [
                    CorpusRecord(
                        title=r["title"],
                        content=r["content"],
                        doc_type=r["doc_type"],
                        source=r["source"],
                        section=r.get("section"),
                        act=r.get("act"),
                        metadata=r.get("metadata", {}),
                    )
                    for r in raw
                ]
            else:
                log.error(
                    "No records to chunk. Run with --normalize first, or "
                    "provide the intermediate file at %s.",
                    intermediate,
                )
                sys.exit(1)

        chunked = chunk_records(
            records,
            chunk_size=args.chunk_size,
            overlap=args.chunk_overlap,
        )

        output_path = save_corpus(chunked, Path(args.output))
        log.info("Final corpus written to: %s", output_path)
    else:
        log.info("Skipping chunking (--chunk not specified).")

        # If we normalized but did not chunk, save the normalized output
        # to the requested path as well.
        if records:
            output_path = save_corpus(
                [r.to_dict() for r in records], Path(args.output)
            )

    elapsed = time.monotonic() - start
    log.info("=" * 60)
    log.info("Pipeline finished in %.1f seconds.", elapsed)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
