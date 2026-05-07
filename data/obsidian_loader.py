#!/usr/bin/env python3
"""
Obsidian Vault Loader for JurisGPT RAG Pipeline

Reads markdown files from an Obsidian vault and converts them into
corpus documents for the RAG pipeline. Supports YAML frontmatter
for metadata extraction.

Usage:
    Set OBSIDIAN_VAULT_PATH environment variable or pass vault_path to ObsidianLoader.

Example .env:
    OBSIDIAN_VAULT_PATH=/Users/bruuu/Documents/Obsidian Vault
"""

import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Default vault path - can be overridden via environment variable
DEFAULT_VAULT_PATH = os.path.expanduser("~/Documents/Obsidian Vault")


def parse_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """
    Parse YAML frontmatter from markdown content.

    Returns:
        Tuple of (metadata_dict, body_content)
    """
    frontmatter: Dict[str, Any] = {}
    body = content

    # Check for YAML frontmatter (--- at start)
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            yaml_content = parts[1].strip()
            body = parts[2].strip()

            # Simple YAML parsing (key: value pairs)
            for line in yaml_content.split("\n"):
                line = line.strip()
                if ":" in line and not line.startswith("#"):
                    key, _, value = line.partition(":")
                    key = key.strip()
                    value = value.strip()

                    # Handle lists (- item format)
                    if value.startswith("[") and value.endswith("]"):
                        # Inline list: [item1, item2]
                        items = value[1:-1].split(",")
                        frontmatter[key] = [item.strip().strip('"\'') for item in items]
                    elif value == "":
                        # Multi-line list follows
                        frontmatter[key] = []
                    else:
                        # Remove quotes if present
                        value = value.strip('"\'')
                        # Coerce YAML booleans so consumers can rely on real bools
                        if value.lower() in ("true", "yes"):
                            frontmatter[key] = True
                        elif value.lower() in ("false", "no"):
                            frontmatter[key] = False
                        else:
                            frontmatter[key] = value

    return frontmatter, body


def extract_title_from_content(content: str, filename: str) -> str:
    """Extract title from H1 heading or filename."""
    # Look for first H1 heading
    h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()

    # Fall back to filename without extension
    return Path(filename).stem


def detect_doc_type(content: str, frontmatter: Dict[str, Any], filename: str) -> str:
    """
    Detect document type based on content, frontmatter, or filename.

    Recognized types: statute, case, clause, compliance, faq, news, note
    """
    # Check frontmatter first
    if "type" in frontmatter:
        return frontmatter["type"].lower()
    if "doc_type" in frontmatter:
        return frontmatter["doc_type"].lower()

    content_lower = content.lower()
    filename_lower = filename.lower()

    # Detect based on content patterns
    if any(term in content_lower for term in ["section ", "act,", "act ", "provision", "statute"]):
        return "statute"
    if any(term in content_lower for term in ["v.", "vs.", "case", "judgment", "court", "held that", "petitioner", "respondent"]):
        return "case"
    if any(term in content_lower for term in ["clause", "agreement", "contract", "parties agree", "whereas"]):
        return "clause"
    if any(term in content_lower for term in ["deadline", "compliance", "filing", "due date", "penalty"]):
        return "compliance"
    if any(term in content_lower for term in ["q:", "question:", "answer:", "faq", "?"]):
        return "faq"
    if any(term in content_lower for term in ["news", "update", "announced", "published"]):
        return "news"

    # Check filename patterns
    if any(term in filename_lower for term in ["law", "act", "section", "statute"]):
        return "statute"
    if any(term in filename_lower for term in ["case", "judgment", "ruling"]):
        return "case"

    # Default to note
    return "note"


def extract_tags(content: str, frontmatter: Dict[str, Any]) -> List[str]:
    """Extract tags from frontmatter and inline #tags."""
    tags = set()

    # From frontmatter
    if "tags" in frontmatter:
        fm_tags = frontmatter["tags"]
        if isinstance(fm_tags, list):
            tags.update(fm_tags)
        elif isinstance(fm_tags, str):
            tags.update(t.strip() for t in fm_tags.split(","))

    # Inline #tags (excluding headings)
    inline_tags = re.findall(r"(?<!\S)#([a-zA-Z0-9_-]+)", content)
    tags.update(inline_tags)

    return list(tags)


class ObsidianLoader:
    """
    Loads markdown notes from an Obsidian vault for JurisGPT RAG integration.

    Notes are converted to corpus documents with:
    - title: From frontmatter, H1 heading, or filename
    - content: Full markdown body
    - doc_type: Detected or from frontmatter
    - source: "Obsidian Vault"
    - metadata: Frontmatter + extracted info
    """

    def __init__(
        self,
        vault_path: Optional[str] = None,
        include_patterns: Optional[List[str]] = None,
        exclude_patterns: Optional[List[str]] = None,
    ):
        """
        Initialize the Obsidian loader.

        Args:
            vault_path: Path to Obsidian vault. Defaults to OBSIDIAN_VAULT_PATH env var or ~/Documents/Obsidian Vault
            include_patterns: Only load files matching these patterns (e.g., ["Legal/*", "Cases/*"])
            exclude_patterns: Skip files matching these patterns (e.g., ["Templates/*", "Daily/*"])
        """
        self.vault_path = Path(
            vault_path or os.getenv("OBSIDIAN_VAULT_PATH", DEFAULT_VAULT_PATH)
        ).expanduser()

        self.include_patterns = include_patterns if include_patterns is not None else []
        self.exclude_patterns = exclude_patterns if exclude_patterns is not None else [
            ".obsidian/*",
            ".trash/*",
            "Templates/*",
            "templates/*",
            "Daily Notes/*",
            "Daily/*",
            "_meta/*",
            "_Archive/*",
            "Juris-GPT Codebase/*",
        ]

        self.loaded_files: List[str] = []

    def _should_include(self, rel_path: str) -> bool:
        """Check if file should be included based on patterns."""
        from fnmatch import fnmatch

        # Check exclusions first
        for pattern in self.exclude_patterns:
            if fnmatch(rel_path, pattern):
                return False

        # If no include patterns, include all (that aren't excluded)
        if not self.include_patterns:
            return True

        # Check include patterns
        for pattern in self.include_patterns:
            if fnmatch(rel_path, pattern):
                return True

        return False

    def load_documents(self) -> List[Dict[str, Any]]:
        """
        Load all markdown files from the vault.

        Returns:
            List of document dicts compatible with JurisGPT RAG corpus format
        """
        if not self.vault_path.exists():
            logger.warning("Obsidian vault not found at %s", self.vault_path)
            return []

        documents: List[Dict[str, Any]] = []
        self.loaded_files = []

        # Find all markdown files
        for md_file in self.vault_path.rglob("*.md"):
            rel_path = str(md_file.relative_to(self.vault_path))

            if not self._should_include(rel_path):
                continue

            try:
                content = md_file.read_text(encoding="utf-8")

                # Skip empty files
                if not content.strip():
                    continue

                # Parse frontmatter
                frontmatter, body = parse_frontmatter(content)

                # Skip if marked as draft or private
                if frontmatter.get("draft") is True or frontmatter.get("private") is True:
                    continue

                # Extract metadata
                title = frontmatter.get("title") or extract_title_from_content(body, md_file.name)
                doc_type = detect_doc_type(body, frontmatter, md_file.name)
                tags = extract_tags(body, frontmatter)

                # Build document
                doc = {
                    "title": title,
                    "content": body,
                    "doc_type": doc_type,
                    "source": f"Obsidian: {rel_path}",
                    "section": frontmatter.get("section"),
                    "act": frontmatter.get("act") or frontmatter.get("law"),
                    "url": None,
                    "metadata": {
                        "obsidian_path": rel_path,
                        "tags": tags,
                        "created": frontmatter.get("created"),
                        "modified": frontmatter.get("modified"),
                        **{k: v for k, v in frontmatter.items()
                           if k not in ("title", "type", "doc_type", "section", "act", "law", "draft", "private", "tags", "created", "modified")}
                    }
                }

                documents.append(doc)
                self.loaded_files.append(rel_path)

            except Exception as e:
                logger.warning("Error loading %s: %s", rel_path, e)

        logger.info("Loaded %d documents from Obsidian vault", len(documents))
        return documents

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about loaded documents."""
        return {
            "vault_path": str(self.vault_path),
            "exists": self.vault_path.exists(),
            "loaded_files": len(self.loaded_files),
            "files": self.loaded_files[:10],  # First 10 files
        }


# Convenience function for RAG pipeline integration
def load_obsidian_corpus(
    vault_path: Optional[str] = None,
    include_patterns: Optional[List[str]] = None,
    exclude_patterns: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Load documents from Obsidian vault for RAG corpus.

    This is the main entry point for RAG pipeline integration.

    Args:
        vault_path: Path to vault (uses OBSIDIAN_VAULT_PATH env var if not provided)
        include_patterns: Glob patterns for files to include
        exclude_patterns: Glob patterns for files to exclude

    Returns:
        List of document dicts ready for RAG corpus
    """
    loader = ObsidianLoader(
        vault_path=vault_path,
        include_patterns=include_patterns,
        exclude_patterns=exclude_patterns,
    )
    return loader.load_documents()


if __name__ == "__main__":
    # CLI for testing
    import argparse
    import json

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Load Obsidian vault for JurisGPT")
    parser.add_argument("--vault", "-v", type=str, help="Path to Obsidian vault")
    parser.add_argument("--include", "-i", type=str, nargs="*", help="Include patterns")
    parser.add_argument("--exclude", "-e", type=str, nargs="*", help="Exclude patterns")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    loader = ObsidianLoader(
        vault_path=args.vault,
        include_patterns=args.include,
        exclude_patterns=args.exclude,
    )

    docs = loader.load_documents()

    if args.json:
        print(json.dumps(docs, indent=2, default=str))
    else:
        print(f"\nLoaded {len(docs)} documents from: {loader.vault_path}")
        print(f"Files: {loader.loaded_files}")
        print("\nDocuments:")
        for doc in docs[:5]:
            print(f"  - {doc['title']} ({doc['doc_type']}) from {doc['source']}")
        if len(docs) > 5:
            print(f"  ... and {len(docs) - 5} more")
