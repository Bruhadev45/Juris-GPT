"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Loader2,
  Scale,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ArrowRight,
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

type FilterType = "all" | "cases" | "statutes" | "companies_act";

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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
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
  const [selectedLaw, setSelectedLaw] = useState<string>("");
  const [lawSections, setLawSections] = useState<LawSection[]>([]);

  const LIMIT = 15;

  useEffect(() => {
    apiClient.listAvailableLaws().then(setLaws).catch(console.error);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && !selectedLaw) return;

    setLoading(true);
    setHasSearched(true);

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

        setSearchResults(response.results);
        setTotalResults(response.total);
        setSuggestions(response.suggestions);
        setCases([]);
        setCompaniesAct([]);
        setLawSections([]);
        setLoading(false);
        return;
      } catch {
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
            .then(setCases)
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
            .then(setCompaniesAct)
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
            .then(setLawSections)
        );
      } else {
        setLawSections([]);
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedFilter, selectedLaw, page, useUnifiedSearch]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2 || selectedLaw) {
        handleSearch();
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedFilter, selectedLaw, page, handleSearch]);

  const fallbackTotal = cases.length + companiesAct.length + lawSections.length;
  const displayTotal = searchResults.length > 0 ? totalResults : fallbackTotal;

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Legal Research
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Unified search across case law, statutes, and regulations — AI-powered summaries and relevance ranking
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Search Bar */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search case law, statutes, regulations... (e.g., 'contract breach', 'director duties')"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      className="pl-12 h-12 text-lg bg-background border-border"
                    />
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
                      >
                        {f.label}
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
                              {result.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {result.subtitle}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {result.content}
                          </p>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                                {c.case_name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{c.court}</span>
                              </div>
                              <span>{c.citation}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {c.summary || c.principle}
                            </p>
                          </div>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 ml-4 flex-shrink-0">
                            Case Law
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {companiesAct.map((s, idx) => (
                    <Card
                      key={`ca-${idx}`}
                      className="shadow-sm border-border hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <h3 className="text-base font-semibold text-foreground">
                                Section {s.section}: {s.title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {s.content}
                            </p>
                          </div>
                          <Badge className="bg-green-50 text-green-700 border-green-200 ml-4 flex-shrink-0">
                            Companies Act
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {lawSections.map((s, idx) => (
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
                                Section {s.section}: {s.title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {s.description}
                            </p>
                          </div>
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 ml-4 flex-shrink-0">
                            {selectedLaw.toUpperCase()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
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

            {/* Empty State */}
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
        </div>
      </div>
    </div>
  );
}
