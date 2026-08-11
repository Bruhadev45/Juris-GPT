#!/usr/bin/env bash
#
# Assemble and push the backend to a Hugging Face Space.
#
# Ships only what the API needs at runtime — roughly 25 MB, against the ~250 MB
# the full repository would push. The corpus travels as its gzip archive and is
# decompressed inside the container on first boot.
#
# Usage:
#   ./push.sh <space-id>          # e.g. ./push.sh Bruha01/jurisgpt
#
# Authentication: HF asks for a username and an access token (as the password)
# on first push. Create one at https://huggingface.co/settings/tokens with
# write scope. Run this in your own terminal so the token is never echoed
# anywhere it could be captured.

set -euo pipefail

SPACE_ID="${1:-}"
if [[ -z "$SPACE_ID" ]]; then
  echo "usage: ./push.sh <owner/space-name>" >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

echo "==> Staging Space contents in $STAGING"

cp "$HERE/Dockerfile" "$STAGING/Dockerfile"
cp "$HERE/README.md" "$STAGING/README.md"

# --- backend ---------------------------------------------------------------
mkdir -p "$STAGING/backend"
rsync -a \
  --exclude '__pycache__/' \
  --exclude 'tests/' \
  --exclude 'venv/' \
  --exclude '.venv/' \
  --exclude '.env' \
  --exclude '.env.*' \
  "$REPO_ROOT/backend/app" "$REPO_ROOT/backend/requirements-deploy.txt" \
  "$STAGING/backend/"

# --- data ------------------------------------------------------------------
# Only the pipeline module and the corpus. The other data/*.py scripts are
# offline tooling (ingestion, benchmarking) and have no place in the image.
mkdir -p "$STAGING/data/datasets/samples" "$STAGING/data/processed"
cp "$REPO_ROOT/data/rag_pipeline.py" "$STAGING/data/"
cp "$REPO_ROOT/data/obsidian_loader.py" "$STAGING/data/" 2>/dev/null || true

# Skip macOS AppleDouble files — the project lives on an exFAT volume, which
# creates ._* siblings that are not valid JSON and break the corpus loader.
rsync -a --exclude '._*' \
  "$REPO_ROOT/data/datasets/samples/" "$STAGING/data/datasets/samples/"

cp "$REPO_ROOT/data/processed/hf_legal_corpus.json.gz" "$STAGING/data/processed/"
cp "$REPO_ROOT/data/processed/README.md" "$STAGING/data/processed/" 2>/dev/null || true

echo "==> Staged $(du -sh "$STAGING" | cut -f1)"

# --- verify the corpus is intact before pushing ----------------------------
echo "==> Verifying corpus integrity"
python3 - "$STAGING" <<'PY'
import glob, gzip, json, os, sys

staging = sys.argv[1]

samples = 0
# Mirrors CURATED_SAMPLE_FILES: recent_judgments.json is present on disk but
# not registered with the loader, so it must not be counted here.
skip = {"recent_judgments.json", "legal_faqs_tax_supplement.json"}
for path in glob.glob(os.path.join(staging, "data/datasets/samples/*.json")):
    if os.path.basename(path) in skip:
        continue
    with open(path) as handle:
        samples += len(json.load(handle))

with gzip.open(os.path.join(staging, "data/processed/hf_legal_corpus.json.gz")) as handle:
    statutes = len(json.load(handle))

total = samples + statutes
print(f"    curated samples: {samples}")
print(f"    statutes:        {statutes}")
print(f"    total:           {total}")

if total != 47867:
    print(f"    WARNING: expected 47867 (the benchmarked corpus), got {total}")
else:
    print("    matches the benchmarked corpus")
PY

# --- push ------------------------------------------------------------------
# Uses `hf upload` rather than git push: it authenticates with the CLI's own
# stored token, so no git credential helper or manual token entry is needed,
# and it handles LFS for the ~22 MB corpus archive transparently.
command -v hf >/dev/null || {
  echo "hf CLI not found. Install with: pip install -U 'huggingface_hub[cli]'" >&2
  exit 1
}

hf auth whoami >/dev/null 2>&1 || {
  echo "Not logged in to Hugging Face. Run: hf auth login" >&2
  exit 1
}

echo "==> Uploading to https://huggingface.co/spaces/$SPACE_ID"
hf upload "$SPACE_ID" "$STAGING" . \
  --repo-type space \
  --commit-message "Deploy JurisGPT backend"

echo
echo "==> Pushed. The Space is now building."
echo "    Logs:  https://huggingface.co/spaces/$SPACE_ID?logs=build"
echo
echo "    Before it will answer, set ANTHROPIC_API_KEY in:"
echo "    https://huggingface.co/spaces/$SPACE_ID/settings"
echo
echo "    First boot takes 1-2 minutes while the corpus decompresses and the"
echo "    BM25 index builds. /health returns non-200 until then."
