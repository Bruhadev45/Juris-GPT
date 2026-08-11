"""Tests for corpus storage client construction.

Covers the two authentication modes in JurisGPTRAG._build_spaces_client:
DigitalOcean Spaces via explicit keys, and native AWS S3 via the ambient
credential chain (the ECS task role in the deployed stack).

The method is exercised unbound so the test does not construct a JurisGPTRAG,
which would load the 47k-document corpus.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, Optional

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data"))

CORPUS_ENV_VARS = (
    "DO_SPACES_KEY",
    "DO_SPACES_SECRET",
    "DO_SPACES_ENDPOINT",
    "DO_SPACES_REGION",
    "AWS_REGION",
)


class _Recorder:
    """Stands in for a JurisGPTRAG instance and captures corpus_error."""

    def __init__(self) -> None:
        self.corpus_error: Optional[str] = None


@pytest.fixture
def build_client(monkeypatch: pytest.MonkeyPatch):
    """Return a callable invoking the method with boto3.client stubbed out."""
    import rag_pipeline

    captured: Dict[str, Any] = {}

    class _FakeBoto3:
        @staticmethod
        def client(service: str, **kwargs: Any) -> str:
            captured["service"] = service
            captured["kwargs"] = kwargs
            return "fake-s3-client"

    monkeypatch.setitem(sys.modules, "boto3", _FakeBoto3)

    for name in CORPUS_ENV_VARS:
        monkeypatch.delenv(name, raising=False)

    def _invoke(**env: str) -> tuple[Any, _Recorder, Dict[str, Any]]:
        for key, value in env.items():
            monkeypatch.setenv(key, value)
        recorder = _Recorder()
        result = rag_pipeline.JurisGPTRAG._build_spaces_client(recorder)
        return result, recorder, captured

    return _invoke


def test_native_s3_omits_static_credentials(build_client) -> None:
    """With no endpoint, the client defers to the ambient credential chain."""
    client, recorder, captured = build_client(DO_SPACES_REGION="ap-south-1")

    assert client == "fake-s3-client"
    assert recorder.corpus_error is None
    assert captured["kwargs"] == {"region_name": "ap-south-1"}
    assert "aws_access_key_id" not in captured["kwargs"]
    assert "endpoint_url" not in captured["kwargs"]


def test_native_s3_accepts_aws_region_fallback(build_client) -> None:
    """AWS_REGION alone is enough — ECS injects it, DO_SPACES_REGION need not."""
    client, recorder, captured = build_client(AWS_REGION="ap-south-1")

    assert client == "fake-s3-client"
    assert recorder.corpus_error is None
    assert captured["kwargs"]["region_name"] == "ap-south-1"


def test_native_s3_requires_a_region(build_client) -> None:
    """Without any region the client cannot be built, and says why."""
    client, recorder, _ = build_client()

    assert client is None
    assert recorder.corpus_error is not None
    assert "region" in recorder.corpus_error.lower()


def test_spaces_mode_passes_endpoint_and_keys(build_client) -> None:
    """An endpoint plus keys still produces a DigitalOcean Spaces client."""
    client, recorder, captured = build_client(
        DO_SPACES_ENDPOINT="https://blr1.digitaloceanspaces.com",
        DO_SPACES_KEY="test-key",
        DO_SPACES_SECRET="test-secret",
        DO_SPACES_REGION="blr1",
    )

    assert client == "fake-s3-client"
    assert recorder.corpus_error is None
    assert captured["kwargs"]["endpoint_url"] == "https://blr1.digitaloceanspaces.com"
    assert captured["kwargs"]["aws_access_key_id"] == "test-key"
    assert captured["kwargs"]["aws_secret_access_key"] == "test-secret"


def test_spaces_mode_without_keys_is_rejected(build_client) -> None:
    """A custom endpoint has no ambient credentials, so keys are mandatory."""
    client, recorder, _ = build_client(
        DO_SPACES_ENDPOINT="https://blr1.digitaloceanspaces.com",
        DO_SPACES_REGION="blr1",
    )

    assert client is None
    assert recorder.corpus_error is not None
    assert "DO_SPACES_KEY" in recorder.corpus_error
