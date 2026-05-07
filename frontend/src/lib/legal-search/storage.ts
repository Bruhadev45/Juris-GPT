/**
 * localStorage-backed recent searches and bookmarked results.
 *
 * Recent searches: array of {query, filter, savedAt}, capped at 10.
 * Bookmarks: keyed by stable result identity (type + title + section).
 */

const RECENT_KEY = "jurisgpt:legal-search:recent";
const BOOKMARK_KEY = "jurisgpt:legal-search:bookmarks";
const MAX_RECENT = 10;

export interface RecentSearch {
  query: string;
  filter: string;
  law?: string;
  savedAt: string;
}

export interface BookmarkedResult {
  /** Stable hash identifying the result */
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  source?: string;
  citation?: string;
  section?: string;
  savedAt: string;
}

/* ─── Recent searches ─── */

export function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string, filter: string, law?: string): void {
  if (!query.trim() || query.trim().length < 2) return;
  try {
    const existing = loadRecentSearches();
    // Move to top if already exists; otherwise add
    const filtered = existing.filter(
      (r) => !(r.query === query && r.filter === filter && r.law === law)
    );
    const next: RecentSearch[] = [
      { query, filter, law, savedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

export function removeRecentSearch(query: string, filter: string, law?: string): void {
  try {
    const existing = loadRecentSearches();
    const next = existing.filter(
      (r) => !(r.query === query && r.filter === filter && r.law === law)
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/* ─── Bookmarks ─── */

export function bookmarkId(parts: {
  type: string;
  title: string;
  section?: string;
  source?: string;
}): string {
  return `${parts.type}::${parts.title}::${parts.section || ""}::${parts.source || ""}`.toLowerCase();
}

export function loadBookmarks(): BookmarkedResult[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: string): boolean {
  return loadBookmarks().some((b) => b.id === id);
}

export function toggleBookmark(item: Omit<BookmarkedResult, "savedAt">): boolean {
  try {
    const existing = loadBookmarks();
    const idx = existing.findIndex((b) => b.id === item.id);
    if (idx >= 0) {
      const next = [...existing];
      next.splice(idx, 1);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      return false;
    }
    const next: BookmarkedResult[] = [
      { ...item, savedAt: new Date().toISOString() },
      ...existing,
    ];
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a citation string from a result.
 * For cases:    "Case Name, Citation (Court, Year)"
 * For statutes: "Section X, Act Name"
 * For Companies Act: "Section X, Companies Act, 2013"
 */
export function buildCitation(parts: {
  type: string;
  title?: string;
  source?: string;
  citation?: string;
  section?: string;
  act?: string;
  court?: string;
}): string {
  const { type, title, source, citation, section, act, court } = parts;
  if (type === "case") {
    const parts: string[] = [];
    if (title) parts.push(title);
    if (citation) parts.push(citation);
    if (court) parts.push(`(${court})`);
    return parts.join(", ");
  }
  if (type === "companies_act" || type === "statute") {
    const parts: string[] = [];
    if (section) parts.push(`Section ${section}`);
    if (act || source) parts.push(act || source || "");
    return parts.filter(Boolean).join(", ");
  }
  return title || source || "Reference";
}
