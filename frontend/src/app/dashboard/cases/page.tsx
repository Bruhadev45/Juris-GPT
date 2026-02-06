"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, FileText, Calendar, User, Tag, Scale, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CaseSummary {
  case_name: string;
  citation: string;
  court: string;
  principle: string;
  summary: string;
  relevance: string;
}

const emptyForm: CaseSummary = {
  case_name: "",
  citation: "",
  court: "",
  principle: "",
  summary: "",
  relevance: "",
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CaseSummary>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`${API_BASE}/api/legal/cases?${params}`);
      if (res.ok) {
        setCases(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases(searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCases]);

  const handleSubmit = async () => {
    if (!form.case_name.trim() || !form.court.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/legal/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ ...emptyForm });
        setDialogOpen(false);
        fetchCases(searchQuery || undefined);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof CaseSummary, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Cases</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Case</DialogTitle>
                  <DialogDescription>
                    Enter the case details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="case_name">Case Name *</Label>
                    <Input
                      id="case_name"
                      placeholder="e.g. Kesavananda Bharati v. State of Kerala"
                      value={form.case_name}
                      onChange={(e) => updateField("case_name", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="citation">Citation</Label>
                      <Input
                        id="citation"
                        placeholder="e.g. (1973) 4 SCC 225"
                        value={form.citation}
                        onChange={(e) => updateField("citation", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="court">Court *</Label>
                      <Input
                        id="court"
                        placeholder="e.g. Supreme Court of India"
                        value={form.court}
                        onChange={(e) => updateField("court", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="principle">Legal Principle</Label>
                    <Input
                      id="principle"
                      placeholder="e.g. Basic Structure Doctrine"
                      value={form.principle}
                      onChange={(e) => updateField("principle", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      placeholder="Brief summary of the case..."
                      rows={3}
                      value={form.summary}
                      onChange={(e) => updateField("summary", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="relevance">Relevance</Label>
                    <Input
                      id="relevance"
                      placeholder="e.g. Constitutional law landmark"
                      value={form.relevance}
                      onChange={(e) => updateField("relevance", e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !form.case_name.trim() || !form.court.trim()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Case"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases by name, principle, or summary..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Cases List */}
            {!loading && (
              <div className="grid gap-4">
                {cases.map((c, i) => (
                  <Card key={i} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Scale className="h-5 w-5 text-primary shrink-0" />
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {c.case_name}
                            </h3>
                          </div>
                          {c.summary && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {c.summary}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {c.citation && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{c.citation}</span>
                              </div>
                            )}
                            {c.court && (
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                <span>{c.court}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {c.principle && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {c.principle}
                            </Badge>
                          )}
                          {c.relevance && (
                            <Badge variant="outline" className="text-xs">
                              {c.relevance}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && cases.length === 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <Scale className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No cases match your search" : "No cases yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setDialogOpen(true)}
                    >
                      Add Your First Case
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
