"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  BookOpen,
  Loader2,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient, CaseSummary, CompaniesActSection, LawSection } from "@/lib/api";

type FilterType = "all" | "cases" | "statutes" | "companies_act";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [companiesAct, setCompaniesAct] = useState<CompaniesActSection[]>([]);
  const [laws, setLaws] = useState<string[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<string>("");
  const [lawSections, setLawSections] = useState<LawSection[]>([]);
  const [page, setPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const LIMIT = 10;

  useEffect(() => {
    apiClient.listAvailableLaws().then(setLaws).catch(console.error);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && !selectedLaw) return;

    setLoading(true);
    setHasSearched(true);
    try {
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
  }, [searchQuery, selectedFilter, selectedLaw, page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2 || selectedLaw) {
        handleSearch();
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedFilter, selectedLaw, page, handleSearch]);

  const totalResults = cases.length + companiesAct.length + lawSections.length;

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            Legal Search
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search across 16M+ Indian judgments, statutes, and regulations
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
                      placeholder="Search case law, statutes, regulations..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      className="pl-12 h-12 text-lg bg-background border-border"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: "all", label: "All" },
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

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">
                  Searching legal database...
                </span>
              </div>
            )}

            {/* Results */}
            {!loading && hasSearched && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {totalResults} results
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
                      disabled={totalResults < LIMIT}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Case Law Results */}
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

                {/* Companies Act Results */}
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

                {/* Statute Results */}
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

                {totalResults === 0 && (
                  <Card className="shadow-sm border-border">
                    <CardContent className="py-12 text-center">
                      <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        No results found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Try a different search term or filter
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Empty state */}
            {!hasSearched && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Search Indian Legal Database
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Search across Supreme Court judgments, Companies Act
                    sections, IPC, CPC, CrPC, and more
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Contract breach",
                      "Specific performance",
                      "Director duties",
                      "Arbitration clause",
                      "Unfair dismissal",
                    ].map((q) => (
                      <Badge
                        key={q}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/5"
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
