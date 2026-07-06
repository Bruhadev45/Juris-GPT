#!/usr/bin/env python3
"""Refresh the corpus with recent judgments from Indian Kanoon.

Closes the freshness gap: the chatbot could previously only cite whatever the
frozen corpus build contained. This script pulls recent case law for the
startup/corporate topics the product covers and writes them to
``data/datasets/samples/ingested_judgments.json`` — a file the RAG pipeline
loads automatically at startup (see ``CURATED_SAMPLE_FILES``).

Requires ``INDIAN_KANOON_API_KEY`` (https://api.indiankanoon.org). Without a
key the script exits without writing, so a misconfigured cron can never
overwrite real data with demo content.

Usage:
    INDIAN_KANOON_API_KEY=... python data/ingest_updates.py [--per-topic 5]

After ingesting, restart the backend (or call the admin reload endpoint,
``POST /api/admin/reload-corpus``) so the BM25 index is rebuilt.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

DATA_DIR = Path(__file__).resolve().parent
OUT_PATH = DATA_DIR / "datasets" / "samples" / "ingested_judgments.json"
BASE_URL = "https://api.indiankanoon.org"

# Topics matched to the product's coverage areas (and the benchmark's six
# categories) — each becomes one search against the Indian Kanoon API.
TOPICS = [
    "Companies Act 2013 incorporation",
    "ESOP employee stock option Companies Act",
    "shareholders agreement enforceability",
    "GST input tax credit",
    "Section 56(2)(viib) angel tax",
    "employment contract non-compete Section 27",
    "founder agreement dispute",
    "SEBI startup listing regulations",
]


def fetch_topic(session: requests.Session, token: str, query: str, limit: int) -> list[dict]:
    resp = session.post(
        f"{BASE_URL}/search/",
        params={"formInput": query, "pagenum": 0},
        headers={"Authorization": f"Token {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    docs = resp.json().get("docs", [])[:limit]
    records = []
    for doc in docs:
        title = doc.get("title", "").strip()
        headline = doc.get("headline", "").strip()
        if not title or not headline:
            continue
        records.append({
            "title": title,
            "content": headline,
            "doc_type": "case",
            "source": f"Indian Kanoon (doc {doc.get('tid', 'n/a')})",
            "act": None,
            "section": None,
            "url": f"https://indiankanoon.org/doc/{doc.get('tid')}/" if doc.get("tid") else None,
            "metadata": {
                "court": doc.get("docsource"),
                "date": doc.get("publishdate"),
                "ingest_topic": query,
                "ingested_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            },
        })
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-topic", type=int, default=5)
    args = parser.parse_args()

    token = os.getenv("INDIAN_KANOON_API_KEY", "").strip()
    if not token:
        raise SystemExit(
            "INDIAN_KANOON_API_KEY not set — refusing to write demo data. "
            "Get a key at https://api.indiankanoon.org and re-run."
        )

    session = requests.Session()
    seen_urls: set[str] = set()
    records: list[dict] = []

    # Merge with any previously ingested records so repeated runs accumulate.
    if OUT_PATH.exists():
        try:
            for r in json.loads(OUT_PATH.read_text()):
                records.append(r)
                if r.get("url"):
                    seen_urls.add(r["url"])
        except ValueError:
            pass

    added = 0
    for topic in TOPICS:
        try:
            for rec in fetch_topic(session, token, topic, args.per_topic):
                if rec.get("url") and rec["url"] in seen_urls:
                    continue
                records.append(rec)
                if rec.get("url"):
                    seen_urls.add(rec["url"])
                added += 1
        except requests.RequestException as exc:
            print(f"  topic '{topic}' failed: {exc}")

    OUT_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False))
    print(f"Ingested {added} new judgments ({len(records)} total) -> {OUT_PATH}")
    print("Restart the backend or POST /api/admin/reload-corpus to index them.")


if __name__ == "__main__":
    main()
