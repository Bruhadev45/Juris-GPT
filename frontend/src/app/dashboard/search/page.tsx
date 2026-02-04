"use client";

import { useState } from "react";
import { Search, Filter, FileText, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const searchResults = [
  {
    id: "1",
    title: "Supreme Court Judgment on Contract Law",
    type: "Case Law",
    court: "Supreme Court of India",
    date: "2024-12-15",
    relevance: "95%",
    snippet: "The court held that contract terms must be clearly defined...",
  },
  {
    id: "2",
    title: "High Court Ruling on Employment Contracts",
    type: "Case Law",
    court: "Delhi High Court",
    date: "2024-11-20",
    relevance: "87%",
    snippet: "Employment contracts require explicit terms regarding termination...",
  },
  {
    id: "3",
    title: "Companies Act 2013 - Section 149",
    type: "Statute",
    court: "Companies Act",
    date: "2013",
    relevance: "92%",
    snippet: "Every company shall have a Board of Directors...",
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Legal Search</h1>
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-lg bg-background border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedFilter === "all" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("all")}
                      className={selectedFilter === "all" ? "bg-primary text-primary-foreground" : ""}
                    >
                      All
                    </Button>
                    <Button
                      variant={selectedFilter === "cases" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("cases")}
                      className={selectedFilter === "cases" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Case Law
                    </Button>
                    <Button
                      variant={selectedFilter === "statutes" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("statutes")}
                      className={selectedFilter === "statutes" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Statutes
                    </Button>
                    <Button
                      variant={selectedFilter === "regulations" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("regulations")}
                      className={selectedFilter === "regulations" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Regulations
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} results
                  </p>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>
                {searchResults.map((result) => (
                  <Card key={result.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">{result.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{result.court}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{result.date}</span>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80">{result.snippet}</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {result.relevance} match
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4">
                        View Full Text
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!searchQuery && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Search Legal Database</h3>
                  <p className="text-muted-foreground mb-4">
                    Search through case law, statutes, and regulations
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline">Supreme Court</Badge>
                    <Badge variant="outline">High Courts</Badge>
                    <Badge variant="outline">Companies Act</Badge>
                    <Badge variant="outline">Labor Law</Badge>
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
