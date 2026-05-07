"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  Loader2,
  Scale,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Info,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Clock,
  X,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  apiClient,
  type SearchResult,
  type UnifiedSearchResponse,
  type CaseSummary,
  type CompaniesActSection,
  type LawSection,
} from "@/lib/api";
import { Highlight } from "@/lib/legal-search/highlight";
import {
  loadRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  loadBookmarks,
  toggleBookmark,
  bookmarkId,
  buildCitation,
  type RecentSearch,
  type BookmarkedResult,
} from "@/lib/legal-search/storage";
import { LiveUpdatesPanel } from "@/components/legal-search/live-updates-panel";
import { cn } from "@/lib/utils";

type FilterType = "all" | "cases" | "statutes" | "companies_act";

/* ─── Bookmark + Copy citation buttons (shared) ─── */
function ResultActions({
  bookmarkPayload,
  citation,
}: {
  bookmarkPayload: Omit<BookmarkedResult, "savedAt">;
  citation: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBookmarked(loadBookmarks().some((b) => b.id === bookmarkPayload.id));
  }, [bookmarkPayload.id]);

  const handleBookmark = () => {
    const isNow = toggleBookmark(bookmarkPayload);
    setBookmarked(isNow);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleBookmark}
        title={bookmarked ? "Remove bookmark" : "Bookmark this result"}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this result"}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4 text-amber-600" />
        ) : (
          <Bookmark className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleCopy}
        title="Copy citation"
        aria-label="Copy citation"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

function typeIcon(type: string) {
  switch (type) {
    case "case":
      return <Scale className="h-4 w-4 text-blue-600" />;
    case "statute":
      return <BookOpen className="h-4 w-4 text-purple-600" />;
    case "companies_act":
      return <Building2 className="h-4 w-4 text-green-600" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

function typeBadge(type: string) {
  switch (type) {
    case "case":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    case "statute":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
    case "companies_act":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "case":
      return "Case Law";
    case "statute":
      return "Statute";
    case "companies_act":
      return "Companies Act";
    default:
      return "Legal";
  }
}

function relevanceColor(score: number) {
  if (score >= 0.7) return "text-green-600";
  if (score >= 0.4) return "text-yellow-600";
  return "text-muted-foreground";
}

function relevanceProgressColor(score: number) {
  if (score >= 0.7) return "[&>div]:bg-green-500";
  if (score >= 0.4) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-gray-400";
}

// Expandable Search Result Card Component
function SearchResultCard({
  result,
  idx,
  query,
}: {
  result: SearchResult;
  idx: number;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const id = bookmarkId({
    type: result.type,
    title: result.title,
    section: undefined,
    source: result.source,
  });
  const citation = buildCitation({
    type: result.type,
    title: result.title,
    source: result.source,
  });

  return (
    <Card
      key={`result-${idx}`}
      className="shadow-sm border-border hover:shadow-md transition-all hover:border-primary/30"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {typeIcon(result.type)}
              <h3 className="text-base font-semibold text-foreground truncate">
                <Highlight text={result.title} query={query} />
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <Highlight text={result.subtitle} query={query} />
            </p>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
              <Highlight text={result.content} query={query} />
            </p>

            {/* Expanded Details */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                {result.source && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Source:</span>
                    <span className="text-sm text-foreground">{result.source}</span>
                  </div>
                )}
                {result.metadata?.court && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Court:</span>
                    <span className="text-sm text-foreground">{result.metadata.court}</span>
                  </div>
                )}
                {result.metadata?.date && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Date:</span>
                    <span className="text-sm text-foreground">{result.metadata.date}</span>
                  </div>
                )}
                {result.metadata?.citation && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Citation:</span>
                    <span className="text-sm text-foreground font-mono">{result.metadata.citation}</span>
                  </div>
                )}
                {result.metadata?.section && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Section:</span>
                    <span className="text-sm text-foreground">{result.metadata.section}</span>
                  </div>
                )}
                {result.metadata?.act && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Act:</span>
                    <span className="text-sm text-foreground">{result.metadata.act}</span>
                  </div>
                )}
                {result.url && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Link:</span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View original <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* More Info Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-1" />
                  More info
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge className={typeBadge(result.type)}>
              {typeLabel(result.type)}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="w-16">
                <Progress
                  value={result.relevance_score * 100}
                  className={`h-1.5 ${relevanceProgressColor(result.relevance_score)}`}
                />
              </div>
              <span className={`text-xs font-medium ${relevanceColor(result.relevance_score)}`}>
                {Math.round(result.relevance_score * 100)}%
              </span>
            </div>
            <ResultActions
              bookmarkPayload={{
                id,
                type: result.type,
                title: result.title,
                subtitle: result.subtitle,
                source: result.source,
              }}
              citation={citation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Expandable Case Card Component
function CaseCard({
  caseData,
  idx,
  query,
}: {
  caseData: CaseSummary;
  idx: number;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = bookmarkId({
    type: "case",
    title: caseData.case_name,
    source: caseData.citation,
  });
  const citation = buildCitation({
    type: "case",
    title: caseData.case_name,
    citation: caseData.citation,
    court: caseData.court,
  });

  return (
    <Card
      key={`case-${idx}`}
      className="shadow-sm border-border hover:shadow-md transition-shadow"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                <Highlight text={caseData.case_name} query={query} />
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{caseData.court}</span>
              </div>
              <span>{caseData.citation}</span>
            </div>
            <p className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-3" : ""}`}>
              <Highlight
                text={caseData.summary || caseData.principle || ""}
                query={query}
              />
            </p>

            {/* Expanded Details */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                {caseData.principle && caseData.principle !== caseData.summary && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Legal Principle:</span>
                    <p className="text-sm text-foreground mt-1">{caseData.principle}</p>
                  </div>
                )}
                {caseData.relevance && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Relevance:</span>
                    <p className="text-sm text-foreground mt-1">{caseData.relevance}</p>
                  </div>
                )}
              </div>
            )}

            {/* More Info Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-1" />
                  More info
                </>
              )}
            </Button>
          </div>
          <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">Case Law</Badge>
            <ResultActions
              bookmarkPayload={{
                id,
                type: "case",
                title: caseData.case_name,
                source: caseData.citation,
                citation: caseData.citation,
              }}
              citation={citation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Expandable Companies Act Card Component
function CompaniesActCard({
  section,
  idx,
  query,
}: {
  section: CompaniesActSection;
  idx: number;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = bookmarkId({
    type: "companies_act",
    title: section.title,
    section: section.section,
    source: section.act,
  });
  const citation = buildCitation({
    type: "companies_act",
    title: section.title,
    section: section.section,
    act: section.act,
  });

  return (
    <Card
      key={`ca-${idx}`}
      className="shadow-sm border-border hover:shadow-md transition-shadow"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Section {section.section}:{" "}
                <Highlight text={section.title} query={query} />
              </h3>
            </div>
            <p className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-3" : ""}`}>
              <Highlight text={section.content} query={query} />
            </p>

            {/* Expanded Details */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Act:</span>
                  <span className="text-sm text-foreground">{section.act}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Section:</span>
                  <span className="text-sm text-foreground font-mono">{section.section}</span>
                </div>
              </div>
            )}

            {/* More Info Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-1" />
                  More info
                </>
              )}
            </Button>
          </div>
          <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
            <Badge className="bg-green-50 text-green-700 border-green-200">Companies Act</Badge>
            <ResultActions
              bookmarkPayload={{
                id,
                type: "companies_act",
                title: section.title,
                section: section.section,
                source: section.act,
              }}
              citation={citation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Expandable Law Section Card Component
function LawSectionCard({
  section,
  lawName,
  idx,
  query,
}: {
  section: LawSection;
  lawName: string;
  idx: number;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sectionNo = String(section.section);
  const id = bookmarkId({
    type: "statute",
    title: section.title,
    section: sectionNo,
    source: lawName,
  });
  const citation = buildCitation({
    type: "statute",
    title: section.title,
    section: sectionNo,
    act: lawName.toUpperCase(),
  });

  return (
    <Card
      key={`law-${idx}`}
      className="shadow-sm border-border hover:shadow-md transition-shadow"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Section {section.section}:{" "}
                <Highlight text={section.title} query={query} />
              </h3>
            </div>
            <p className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-3" : ""}`}>
              <Highlight text={section.description} query={query} />
            </p>

            {/* Expanded Details */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Law:</span>
                  <span className="text-sm text-foreground">{lawName.toUpperCase()}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">Section:</span>
                  <span className="text-sm text-foreground font-mono">{section.section}</span>
                </div>
              </div>
            )}

            {/* More Info Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-1" />
                  More info
                </>
              )}
            </Button>
          </div>
          <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200">
              {lawName.toUpperCase()}
            </Badge>
            <ResultActions
              bookmarkPayload={{
                id,
                type: "statute",
                title: section.title,
                section: sectionNo,
                source: lawName,
              }}
              citation={citation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();

  // Initial state seeded from URL search params for deeplinking
  const [searchQuery, setSearchQuery] = useState(() => params?.get("q") ?? "");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    () => (params?.get("type") as FilterType) ?? "all"
  );
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(() => Number(params?.get("page") ?? "0") || 0);
  const [hasSearched, setHasSearched] = useState(false);

  // Unified search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [useUnifiedSearch, setUseUnifiedSearch] = useState(true);

  // Fallback state for old API
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [companiesAct, setCompaniesAct] = useState<CompaniesActSection[]>([]);
  const [laws, setLaws] = useState<string[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<string>(
    () => params?.get("law") ?? ""
  );
  const [lawSections, setLawSections] = useState<LawSection[]>([]);

  // Recent + bookmarks
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedResult[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const LIMIT = 15;
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.listAvailableLaws().then(setLaws).catch(console.error);
    setRecentSearches(loadRecentSearches());
    setBookmarks(loadBookmarks());
  }, []);

  // Keyboard shortcut: "/" focuses the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sync URL with search state — debounced so we don't thrash history during typing
  useEffect(() => {
    if (!searchQuery && !selectedLaw) return;
    const timeout = setTimeout(() => {
      const next = new URLSearchParams();
      if (searchQuery.trim()) next.set("q", searchQuery.trim());
      if (selectedFilter !== "all") next.set("type", selectedFilter);
      if (selectedLaw) next.set("law", selectedLaw);
      if (page > 0) next.set("page", String(page));
      router.replace(`/dashboard/search?${next.toString()}`, { scroll: false });
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedFilter, selectedLaw, page, router]);

  // Per-type counts for filter button badges (computed from current results)
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, cases: 0, statutes: 0, companies_act: 0 };
    if (searchResults.length > 0) {
      c.all = searchResults.length;
      for (const r of searchResults) {
        if (r.type === "case") c.cases++;
        else if (r.type === "statute") c.statutes++;
        else if (r.type === "companies_act") c.companies_act++;
      }
    } else {
      c.cases = cases.length;
      c.companies_act = companiesAct.length;
      c.statutes = lawSections.length;
      c.all = c.cases + c.statutes + c.companies_act;
    }
    return c;
  }, [searchResults, cases, companiesAct, lawSections]);

  const handleSearch = useCallback(async (signal?: AbortSignal) => {
    if (!searchQuery.trim() && !selectedLaw) return;

    // Cancel any in-flight search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Use provided signal or controller's signal
    const abortSignal = signal || controller.signal;

    setLoading(true);
    setHasSearched(true);

    // Record into recent searches (debounce-aware: only if it's a real new query, not just pagination)
    if (searchQuery.trim().length >= 2) {
      addRecentSearch(searchQuery.trim(), selectedFilter, selectedLaw || undefined);
      setRecentSearches(loadRecentSearches());
    }

    // Try unified search first
    if (useUnifiedSearch && searchQuery.trim()) {
      try {
        const types =
          selectedFilter === "all"
            ? undefined
            : selectedFilter === "cases"
            ? "cases"
            : selectedFilter === "statutes"
            ? "statutes"
            : "companies_act";

        const response = await apiClient.unifiedSearch({
          query: searchQuery,
          types,
          limit: LIMIT,
          offset: page * LIMIT,
        });

        // Don't update state if this request was aborted
        if (abortSignal.aborted) return;

        setSearchResults(response.results);
        setTotalResults(response.total);
        setSuggestions(response.suggestions);
        setCases([]);
        setCompaniesAct([]);
        setLawSections([]);
        setLoading(false);
        return;
      } catch (unifiedErr) {
        if (abortSignal.aborted) return;
        console.warn("Unified search unavailable, falling back:", unifiedErr);
        // Fall back to old search if unified fails
        setUseUnifiedSearch(false);
      }
    }

    // Fallback to individual API calls
    try {
      setSearchResults([]);
      const promises: Promise<void>[] = [];

      if (selectedFilter === "all" || selectedFilter === "cases") {
        promises.push(
          apiClient
            .getCaseSummaries({
              search: searchQuery,
              limit: LIMIT,
              offset: page * LIMIT,
            })
            .then((data) => { if (!abortSignal.aborted) setCases(data); })
        );
      } else {
        setCases([]);
      }

      if (selectedFilter === "all" || selectedFilter === "companies_act") {
        promises.push(
          apiClient
            .getCompaniesActSections({
              search: searchQuery,
              limit: LIMIT,
              offset: page * LIMIT,
            })
            .then((data) => { if (!abortSignal.aborted) setCompaniesAct(data); })
        );
      } else {
        setCompaniesAct([]);
      }

      if (
        (selectedFilter === "all" || selectedFilter === "statutes") &&
        selectedLaw
      ) {
        promises.push(
          apiClient
            .getLawSections(selectedLaw, { limit: LIMIT, offset: page * LIMIT })
            .then((data) => { if (!abortSignal.aborted) setLawSections(data); })
        );
      } else {
        setLawSections([]);
      }

      await Promise.all(promises);
    } catch (error) {
      if (abortSignal.aborted) return;
      console.error("Search error:", error);
    } finally {
      if (!abortSignal.aborted) {
        setLoading(false);
      }
    }
  }, [searchQuery, selectedFilter, selectedLaw, page, useUnifiedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2 || selectedLaw) {
        handleSearch(controller.signal);
      }
    }, 400);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery, selectedFilter, selectedLaw, page, handleSearch]);

  const fallbackTotal = cases.length + companiesAct.length + lawSections.length;
  const displayTotal = searchResults.length > 0 ? totalResults : fallbackTotal;

  const [showLiveFeed, setShowLiveFeed] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">
                  Source Search
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Use manual source search to verify or deepen assistant answers with statutes, cases, and regulations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showLiveFeed ? "default" : "outline"}
                className="gap-1.5 hidden xl:inline-flex"
                onClick={() => setShowLiveFeed((v) => !v)}
                title={showLiveFeed ? "Hide live feed" : "Show live feed"}
              >
                <Radio className="h-4 w-4" />
                Live Feed
              </Button>
              <Button
                variant={showBookmarks ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => {
                  setBookmarks(loadBookmarks());
                  setShowBookmarks((v) => !v);
                }}
                title={showBookmarks ? "Hide bookmarks" : "Show saved bookmarks"}
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks{bookmarks.length > 0 ? ` (${bookmarks.length})` : ""}
              </Button>
              <Link href={searchQuery.trim() ? `/dashboard/chat?q=${encodeURIComponent(searchQuery.trim())}` : "/dashboard/chat"}>
                <Button variant="outline" className="gap-1.5">
                  <Scale className="h-4 w-4" />
                  Ask JurisGPT
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div
            className={cn(
              "mx-auto grid gap-6",
              showLiveFeed
                ? "max-w-7xl xl:grid-cols-[1fr_360px]"
                : "max-w-5xl"
            )}
          >
            <div className="space-y-6 min-w-0">
            {/* Search Bar */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder='Search case law, statutes, regulations… ("director duties", "Section 149"). Press / to focus.'
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      className="pl-12 pr-24 h-12 text-lg bg-background border-border"
                    />
                    <kbd className="hidden md:inline-flex absolute right-12 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground pointer-events-none">
                      /
                    </kbd>
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          setCases([]);
                          setCompaniesAct([]);
                          setLawSections([]);
                          setHasSearched(false);
                          setSuggestions([]);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(
                      [
                        { key: "all", label: "All Results" },
                        { key: "cases", label: "Case Law" },
                        { key: "statutes", label: "Statutes" },
                        { key: "companies_act", label: "Companies Act" },
                      ] as const
                    ).map((f) => (
                      <Button
                        key={f.key}
                        variant={
                          selectedFilter === f.key ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setSelectedFilter(f.key);
                          setPage(0);
                        }}
                        className="gap-1.5"
                      >
                        {f.label}
                        {hasSearched && counts[f.key] > 0 && (
                          <span
                            className={`text-[10px] font-bold rounded-full px-1.5 py-0 ${
                              selectedFilter === f.key
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {counts[f.key]}
                          </span>
                        )}
                      </Button>
                    ))}

                    {(selectedFilter === "all" ||
                      selectedFilter === "statutes") && (
                      <select
                        value={selectedLaw}
                        onChange={(e) => {
                          setSelectedLaw(e.target.value);
                          setPage(0);
                        }}
                        className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="">Select Statute...</option>
                        {laws.map((law) => (
                          <option key={law} value={law}>
                            {law.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !showBookmarks && (
              <div className="flex items-center gap-2 flex-wrap">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Recent:</span>
                {recentSearches.slice(0, 6).map((r, i) => (
                  <Badge
                    key={`recent-${i}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/5 transition-colors group gap-1"
                  >
                    <span
                      onClick={() => {
                        setSearchQuery(r.query);
                        setSelectedFilter(r.filter as FilterType);
                        if (r.law) setSelectedLaw(r.law);
                        setPage(0);
                      }}
                      className="cursor-pointer"
                    >
                      {r.query}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(r.query, r.filter, r.law);
                        setRecentSearches(loadRecentSearches());
                      }}
                      aria-label="Remove recent search"
                      className="opacity-50 hover:opacity-100 hover:text-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-rose-600 underline underline-offset-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Bookmarks Panel */}
            {showBookmarks && (
              <Card className="shadow-sm border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900/40">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-amber-600" />
                      Saved Bookmarks ({bookmarks.length})
                    </h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowBookmarks(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No bookmarks yet. Click the bookmark icon on any result to save it.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((b) => {
                        const cite = buildCitation({
                          type: b.type,
                          title: b.title,
                          source: b.source,
                          citation: b.citation,
                          section: b.section,
                        });
                        return (
                          <div
                            key={b.id}
                            className="flex items-start justify-between gap-3 p-3 rounded-md bg-card border border-border/50 hover:border-amber-200 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {typeIcon(b.type)}
                                <span className="text-sm font-semibold truncate">
                                  {b.title}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {cite}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 flex-shrink-0"
                              onClick={() => {
                                toggleBookmark({
                                  id: b.id,
                                  type: b.type,
                                  title: b.title,
                                  subtitle: b.subtitle,
                                  source: b.source,
                                  citation: b.citation,
                                  section: b.section,
                                });
                                setBookmarks(loadBookmarks());
                              }}
                              title="Remove bookmark"
                            >
                              <X className="h-4 w-4 text-muted-foreground hover:text-rose-600" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Search Suggestions */}
            {suggestions.length > 0 && hasSearched && (
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Try:</span>
                {suggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setPage(0);
                    }}
                  >
                    {suggestion}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">
                  Searching legal database...
                </span>
              </div>
            )}

            {/* Unified Search Results */}
            {!loading && hasSearched && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Found <span className="font-semibold text-foreground">{totalResults}</span> results
                    </p>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ranked by relevance
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={searchResults.length < LIMIT}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {searchResults.map((result, idx) => (
                  <SearchResultCard
                    key={`result-${idx}`}
                    result={result}
                    idx={idx}
                    query={searchQuery}
                  />
                ))}
              </div>
            )}

            {/* Fallback Results (old API) */}
            {!loading &&
              hasSearched &&
              searchResults.length === 0 &&
              fallbackTotal > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {fallbackTotal} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={fallbackTotal < LIMIT}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {cases.map((c, idx) => (
                    <CaseCard key={`case-${idx}`} caseData={c} idx={idx} query={searchQuery} />
                  ))}

                  {companiesAct.map((s, idx) => (
                    <CompaniesActCard key={`ca-${idx}`} section={s} idx={idx} query={searchQuery} />
                  ))}

                  {lawSections.map((s, idx) => (
                    <LawSectionCard
                      key={`law-${idx}`}
                      section={s}
                      lawName={selectedLaw}
                      idx={idx}
                      query={searchQuery}
                    />
                  ))}
                </div>
              )}

            {/* No Results */}
            {!loading && hasSearched && displayTotal === 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    No results found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try a different search term or broaden your filters
                  </p>
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/5"
                          onClick={() => setSearchQuery(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!hasSearched && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Legal Research
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Replace manual legal research with fast, structured discovery
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Search across case law with citations, courts and principles, Companies Act sections, IPC, CPC, CrPC, and more
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Contract breach",
                      "Specific performance",
                      "Director duties",
                      "Arbitration clause",
                      "Non-compete enforceability",
                      "DPDPA compliance",
                      "Section 420 IPC",
                      "Company winding up",
                    ].map((q) => (
                      <Badge
                        key={q}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => setSearchQuery(q)}
                      >
                        {q}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            </div>

            {/* Right sidebar — Live legal feed (judgments + news, polls every 60s) */}
            {showLiveFeed && (
              <aside className="hidden xl:block">
                <div className="sticky top-0">
                  <LiveUpdatesPanel maxItems={10} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
