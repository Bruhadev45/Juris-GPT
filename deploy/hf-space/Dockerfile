# Backend container for Hugging Face Spaces.
#
# Differs from the root Dockerfile in two ways that Spaces requires:
#   1. Listens on 7860, the port Spaces routes to (also declared as app_port
#      in the Space README frontmatter).
#   2. Runs as UID 1000. Spaces containers are not root, so anything the app
#      writes at runtime must be owned by that user — in particular
#      data/processed/, where the gzipped corpus is decompressed on first boot.

FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libssl-dev \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Spaces runs containers as a non-root user with UID 1000.
RUN useradd -m -u 1000 appuser

WORKDIR /app

COPY --chown=appuser:appuser backend/requirements-deploy.txt ./backend/requirements-deploy.txt

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r backend/requirements-deploy.txt

COPY --chown=appuser:appuser backend/ /app/backend/
COPY --chown=appuser:appuser data/ /app/data/

# The corpus archive is decompressed in place at startup (see
# _read_json_records in data/rag_pipeline.py), so this directory must be
# writable by the runtime user.
RUN mkdir -p /app/data/processed /app/data/cloud_cache \
    && chown -R appuser:appuser /app/data

USER appuser

ENV PORT=7860 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    RAG_HYBRID_SEARCH=true \
    RAG_USE_RERANKER=false \
    JURISGPT_VECTOR_STORE=local \
    OBSIDIAN_ENABLED=false

EXPOSE 7860

WORKDIR /app/backend

# Single worker on purpose: each worker loads its own copy of the corpus and
# BM25 index (~1.2 GB), so a second worker doubles memory for no throughput
# gain on a demo-scale workload.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
