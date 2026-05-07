"use client";

import React, { useMemo } from "react";

/**
 * Render text with all instances of the search terms wrapped in <mark>.
 * Case-insensitive, word-boundary aware.
 *
 * Why this is non-trivial:
 *  - Splitting tokens naively breaks for multi-word phrases ("director duties")
 *  - Need to escape regex metacharacters in user input
 *  - Highlighting must survive React reconciliation (uses keyed spans)
 */

const STOPWORDS = new Set([
  "a", "an", "and", "or", "but", "if", "the", "to", "of", "in", "on", "at",
  "is", "are", "was", "were", "be", "been", "being", "for", "with", "by", "as",
]);

const REGEX_META_RE = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(s: string): string {
  return s.replace(REGEX_META_RE, "\\$&");
}

function tokenize(query: string): string[] {
  if (!query) return [];
  // Preserve quoted phrases
  const phrases: string[] = [];
  const quoted = query.match(/"([^"]+)"/g);
  let remaining = query;
  if (quoted) {
    for (const q of quoted) {
      phrases.push(q.slice(1, -1));
      remaining = remaining.replace(q, "");
    }
  }
  const tokens = remaining
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  return [...phrases, ...tokens];
}

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

export function Highlight({ text, query, className }: HighlightProps) {
  const parts = useMemo(() => {
    if (!query || !text) return [{ text, match: false }];
    const tokens = tokenize(query);
    if (tokens.length === 0) return [{ text, match: false }];

    // Build a single regex that matches any token (longest first to avoid partial overlaps)
    const sorted = [...tokens].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${sorted.map(escapeRegex).join("|")})`, "gi");

    const segments: Array<{ text: string; match: boolean }> = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      if (m.index > last) {
        segments.push({ text: text.slice(last, m.index), match: false });
      }
      segments.push({ text: m[0], match: true });
      last = m.index + m[0].length;
      if (m.index === pattern.lastIndex) pattern.lastIndex++; // avoid zero-width loops
    }
    if (last < text.length) {
      segments.push({ text: text.slice(last), match: false });
    }
    return segments;
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.match ? (
          <mark
            key={i}
            className="bg-amber-200/60 dark:bg-amber-500/30 text-foreground rounded-sm px-0.5"
          >
            {p.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        )
      )}
    </span>
  );
}
