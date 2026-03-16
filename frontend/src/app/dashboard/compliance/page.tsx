"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Loader2, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { complianceApi, type ComplianceDeadline } from "@/lib/api";

const CATEGORY_TABS = ["All", "GST", "ROC", "TDS", "PF/ESI", "Income Tax", "Board Meetings"];

function urgencyColor(urgency: ComplianceDeadline["urgency"]) {
  switch (urgency) {
    case "critical":
      return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
    case "high":
      return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20";
    case "medium":
      return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    case "low":
      return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
    default:
      return "border-l-gray-500";
  }
}

function urgencyBadgeVariant(urgency: ComplianceDeadline["urgency"]) {
  switch (urgency) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300";
    default:
      return "";
  }
}

function statusBadge(status: ComplianceDeadline["status"]) {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "upcoming":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300";
    default:
      return "";
  }
}

function categoryBadgeColor(category: string) {
  const colors: Record<string, string> = {
    GST: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    ROC: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    TDS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
    "PF/ESI": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    "Income Tax": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    "Board Meetings": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  };
  return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CompliancePage() {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [deadlinesRes, categoriesRes] = await Promise.all([
          complianceApi.getDeadlines(),
          complianceApi.getCategories(),
        ]);
        setDeadlines(deadlinesRes.data);
        setCategories(categoriesRes.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load compliance data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredDeadlines =
    activeCategory === "All"
      ? deadlines
      : deadlines.filter((d) => d.category === activeCategory);

  const totalCount = deadlines.length;
  const overdueCount = deadlines.filter((d) => d.status === "overdue").length;
  const dueThisWeek = deadlines.filter((d) => d.days_remaining >= 0 && d.days_remaining <= 7).length;

  const overduePercent = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">Compliance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track statutory deadlines, urgency levels, penalties, and AI risk assessments</p>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading compliance deadlines...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">Compliance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track statutory deadlines, urgency levels, penalties, and AI risk assessments</p>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load compliance data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track statutory deadlines, urgency levels, penalties, and AI risk assessments</p>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Deadlines</p>
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalCount}</p>
                  <Progress value={overduePercent} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">{overduePercent}% on track</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">require immediate attention</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Due This Week</p>
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{dueThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">upcoming in 7 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((cat) => {
                const count =
                  cat === "All"
                    ? totalCount
                    : categories.find((c) => c.name === cat)?.count ?? 0;
                return (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className="gap-1.5"
                  >
                    {cat}
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {/* Deadline Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                {activeCategory === "All" ? "All Deadlines" : `${activeCategory} Deadlines`}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredDeadlines.length})
                </span>
              </h2>

              {filteredDeadlines.length === 0 ? (
                <Card className="shadow-sm border-border">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No deadlines found for this category.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredDeadlines.map((deadline) => (
                  <Card
                    key={deadline.id}
                    className={`shadow-sm border-border border-l-4 hover:shadow-md transition-shadow ${urgencyColor(deadline.urgency)}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{deadline.title}</h3>
                            <Badge className={categoryBadgeColor(deadline.category)}>
                              {deadline.category}
                            </Badge>
                            <Badge className={statusBadge(deadline.status)}>
                              {deadline.status.charAt(0).toUpperCase() + deadline.status.slice(1)}
                            </Badge>
                          </div>

                          {deadline.description && (
                            <p className="text-sm text-muted-foreground mb-3">{deadline.description}</p>
                          )}

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Due:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(deadline.due_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Days remaining:</span>
                              <span
                                className={`font-medium ${
                                  deadline.days_remaining < 0
                                    ? "text-red-600"
                                    : deadline.days_remaining <= 7
                                    ? "text-yellow-600"
                                    : "text-foreground"
                                }`}
                              >
                                {deadline.days_remaining < 0
                                  ? `${Math.abs(deadline.days_remaining)} days overdue`
                                  : `${deadline.days_remaining} days`}
                              </span>
                            </div>
                            {deadline.recurring && (
                              <div className="text-muted-foreground">
                                <span>Recurring: </span>
                                <span className="font-medium text-foreground">{deadline.recurring}</span>
                              </div>
                            )}
                          </div>

                          {deadline.penalty && (
                            <div className="mt-3 flex items-center gap-1.5 text-sm">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Penalty: {deadline.penalty}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          <Badge className={`text-sm px-3 py-1 ${urgencyBadgeVariant(deadline.urgency)}`}>
                            {deadline.urgency.charAt(0).toUpperCase() + deadline.urgency.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
