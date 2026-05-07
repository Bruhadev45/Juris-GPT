"""Unit tests for the Obsidian vault loader.

Covers two behaviours that protect the RAG corpus from pollution:
1. YAML frontmatter boolean coercion (so `private: true` is honoured).
2. Default exclude_patterns keep non-legal vault folders out of the corpus.

These tests build a synthetic vault under tmp_path and never touch the
real ~/Documents/Obsidian Vault, so they are safe to run in CI.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Iterable

import pytest

DATA_DIR = Path(__file__).resolve().parent.parent
LOADER_PATH = DATA_DIR / "obsidian_loader.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("obsidian_loader_under_test", LOADER_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def loader_module():
    return _load_module()


def _write(path: Path, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def _titles(docs: Iterable[dict]) -> set[str]:
    return {d["title"] for d in docs}


@pytest.mark.unit
class TestBooleanCoercion:
    """parse_frontmatter must coerce yaml-style booleans to real bools."""

    @pytest.mark.parametrize(
        "raw, expected",
        [
            ("true", True),
            ("True", True),
            ("TRUE", True),
            ("yes", True),
            ("Yes", True),
            ("false", False),
            ("False", False),
            ("no", False),
            ("No", False),
        ],
    )
    def test_boolean_strings_become_bools(self, loader_module, raw, expected):
        content = f"---\nprivate: {raw}\n---\nbody"
        fm, body = loader_module.parse_frontmatter(content)
        assert fm["private"] is expected
        assert body == "body"

    def test_non_boolean_strings_pass_through(self, loader_module):
        fm, _ = loader_module.parse_frontmatter("---\ntitle: Hello World\n---\nx")
        assert fm["title"] == "Hello World"

    def test_missing_frontmatter(self, loader_module):
        fm, body = loader_module.parse_frontmatter("# Just a heading\n\ntext")
        assert fm == {}
        assert body == "# Just a heading\n\ntext"


@pytest.mark.unit
class TestPrivateFlagSkipsNote:
    """Notes flagged private/draft must be excluded from the corpus."""

    def test_private_true_is_skipped(self, loader_module, tmp_path):
        _write(tmp_path / "Public.md", "---\ntitle: Public\n---\nhello")
        _write(tmp_path / "Secret.md", "---\ntitle: Secret\nprivate: true\n---\nshhh")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert _titles(docs) == {"Public"}

    def test_draft_true_is_skipped(self, loader_module, tmp_path):
        _write(tmp_path / "Final.md", "---\ntitle: Final\n---\nready")
        _write(tmp_path / "WIP.md", "---\ntitle: WIP\ndraft: true\n---\nincomplete")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert _titles(docs) == {"Final"}

    def test_private_false_is_kept(self, loader_module, tmp_path):
        _write(tmp_path / "Open.md", "---\ntitle: Open\nprivate: false\n---\npublic")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert _titles(docs) == {"Open"}


@pytest.mark.unit
class TestDefaultExcludePatterns:
    """Default exclude_patterns must keep non-legal folders out of the corpus."""

    def test_codebase_folder_excluded(self, loader_module, tmp_path):
        _write(tmp_path / "Legal Notes" / "Case A.md", "---\ntitle: Case A\n---\nfacts")
        _write(
            tmp_path / "Juris-GPT Codebase" / "Backend" / "Routes.md",
            "---\ntitle: Routes\n---\nfastapi",
        )

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert _titles(docs) == {"Case A"}

    def test_templates_excluded(self, loader_module, tmp_path):
        _write(tmp_path / "Legal Notes" / "Note.md", "---\ntitle: Note\n---\nx")
        _write(tmp_path / "Templates" / "Case Template.md", "---\ntitle: Case Template\n---\nx")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert "Case Template" not in _titles(docs)
        assert "Note" in _titles(docs)

    def test_daily_notes_and_meta_and_archive_excluded(self, loader_module, tmp_path):
        _write(tmp_path / "Legal Notes" / "Note.md", "---\ntitle: Keeper\n---\nx")
        _write(tmp_path / "Daily Notes" / "2026-05-07.md", "---\ntitle: Daily\n---\nx")
        _write(tmp_path / "_meta" / "Tags.md", "---\ntitle: Tag Index\n---\nx")
        _write(tmp_path / "_Archive" / "Old.md", "---\ntitle: Old\n---\nx")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        docs = loader.load_documents()

        assert _titles(docs) == {"Keeper"}

    def test_custom_exclude_overrides_defaults(self, loader_module, tmp_path):
        _write(
            tmp_path / "Juris-GPT Codebase" / "Backend.md",
            "---\ntitle: Backend\n---\nfastapi",
        )

        loader = loader_module.ObsidianLoader(
            vault_path=str(tmp_path),
            exclude_patterns=[],  # opt-out of defaults
        )
        docs = loader.load_documents()

        assert _titles(docs) == {"Backend"}


@pytest.mark.unit
class TestStats:
    def test_get_stats_after_load(self, loader_module, tmp_path):
        _write(tmp_path / "a.md", "---\ntitle: A\n---\nx")

        loader = loader_module.ObsidianLoader(vault_path=str(tmp_path))
        loader.load_documents()
        stats = loader.get_stats()

        assert stats["exists"] is True
        assert stats["loaded_files"] == 1
        assert stats["files"] == ["a.md"]
