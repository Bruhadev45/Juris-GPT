# Backend container for Railway/Render/Fly.
# Targets the Python FastAPI backend at ./backend, with read access to ./data
# (the chatbot service imports rag_pipeline.py from ../data).

FROM python:3.11-slim

# Build deps for native wheels (cryptography, uvloop, scientific libs).
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        git \
        libssl-dev \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for layer caching. The deploy file is the slim
# production set (no torch/llama — the served config doesn't import them).
COPY backend/requirements-deploy.txt ./backend/requirements-deploy.txt

# Install Python deps (legacy peer deps not relevant; pure pip).
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r backend/requirements-deploy.txt

# Now copy the rest of the project (.dockerignore controls what ships).
COPY . /app

# Make sure runtime can find the data folder relative to backend.
WORKDIR /app/backend

# Hosts using $PORT (Railway, Render, Fly) — the start command honors it.
EXPOSE 8000

# Default to 8000 if PORT isn't injected; the start command interpolates it.
ENV PORT=8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
