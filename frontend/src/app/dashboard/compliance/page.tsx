"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Building2,
  IndianRupee,
  FileText,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { complianceApi, type ComplianceDeadline } from "@/lib/api";

// Extended compliance deadline with completion tracking
interface ExtendedComplianceDeadline extends ComplianceDeadline {
  completed?: boolean;
  completed_date?: string;
  applicable_to?: string[];
}

const CATEGORY_TABS = [
  { id: "All", label: "All", icon: FileText },
  { id: "ROC", label: "ROC/MCA", icon: Building2 },
  { id: "GST", label: "GST", icon: IndianRupee },
  { id: "TDS", label: "TDS", icon: FileText },
  { id: "PF/ESI", label: "Labour", icon: Users },
  { id: "Income Tax", label: "Income Tax", icon: IndianRupee },
  { id: "Board Meetings", label: "Board Meetings", icon: Users },
];

const COMPANY_TYPES = [
  { value: "all", label: "All Company Types" },
  { value: "private_limited", label: "Private Limited Company" },
  { value: "public_limited", label: "Public Limited Company" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "one_person", label: "One Person Company (OPC)" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "proprietorship", label: "Sole Proprietorship" },
];

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

function statusBadge(status: ComplianceDeadline["status"], completed?: boolean) {
  if (completed) {
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300";
  }
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

function formatPenalty(penalty?: string) {
  if (!penalty) return null;
  return penalty;
}

export default function CompliancePage() {
  const [deadlines, setDeadlines] = useState<ExtendedComplianceDeadline[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [companyType, setCompanyType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    // Load completed items from localStorage
    const saved = localStorage.getItem("jurisgpt_completed_compliance");
    if (saved) {
      setCompletedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [deadlinesRes, categoriesRes] = await Promise.all([
          complianceApi.getDeadlines(),
          complianceApi.getCategories(),
        ]);
        // Mark items as completed based on localStorage
        const enrichedDeadlines = deadlinesRes.data.map((d) => ({
          ...d,
          completed: completedItems.has(`${d.id}-${d.due_date}`),
        }));
        setDeadlines(enrichedDeadlines);
        setCategories(categoriesRes.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load compliance data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [completedItems]);

  const handleMarkComplete = (deadline: ExtendedComplianceDeadline) => {
    const key = `${deadline.id}-${deadline.due_date}`;
    const newCompleted = new Set(completedItems);

    if (completedItems.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }

    setCompletedItems(newCompleted);
    localStorage.setItem("jurisgpt_completed_compliance", JSON.stringify([...newCompleted]));

    // Update the deadlines state
    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === deadline.id && d.due_date === deadline.due_date
          ? { ...d, completed: !d.completed }
          : d
      )
    );
  };

  const filteredDeadlines = useMemo(() => {
    let filtered = deadlines;

    // Filter by category
    if (activeCategory !== "All") {
      filtered = filtered.filter((d) => d.category === activeCategory);
    }

    // Filter by show completed
    if (!showCompleted) {
      filtered = filtered.filter((d) => !d.completed);
    }

    return filtered;
  }, [deadlines, activeCategory, showCompleted]);

  // Quick stats calculations
  const stats = useMemo(() => {
    const activeDeadlines = deadlines.filter((d) => !d.completed);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: deadlines.length,
      active: activeDeadlines.length,
      completed: deadlines.filter((d) => d.completed).length,
      overdue: activeDeadlines.filter((d) => d.status === "overdue").length,
      dueThisWeek: activeDeadlines.filter(
        (d) => d.days_remaining >= 0 && d.days_remaining <= 7
      ).length,
      upcoming: activeDeadlines.filter(
        (d) => d.days_remaining > 7 && d.days_remaining <= 30
      ).length,
      critical: activeDeadlines.filter((d) => d.urgency === "critical").length,
      high: activeDeadlines.filter((d) => d.urgency === "high").length,
    };
  }, [deadlines]);

  const complianceScore = useMemo(() => {
    if (stats.active === 0) return 100;
    const onTrack = stats.active - stats.overdue;
    return Math.round((onTrack / stats.active) * 100);
  }, [stats]);

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "All") return deadlines.length;
    return deadlines.filter((d) => d.category === categoryId).length;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">Indian Regulatory Compliance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track ROC/MCA, GST, TDS, PF/ESI and other statutory deadlines
            </p>
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
            <h1 className="text-xl font-semibold text-foreground">Indian Regulatory Compliance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track ROC/MCA, GST, TDS, PF/ESI and other statutory deadlines
            </p>
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
        <header className="bg-card border-b border-border px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">Indian Regulatory Compliance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track ROC/MCA, GST, TDS, PF/ESI and other statutory deadlines under Indian law
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={companyType} onValueChange={setCompanyType}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Company Type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Stats Cards — single column on phones so neighbouring
                cards never get clipped at the right edge. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Card className="shadow-sm border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Compliance Score</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{complianceScore}%</p>
                  <Progress value={complianceScore} className="h-1.5 mt-2" />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-red-600 mt-1">Immediate action needed</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Due This Week</p>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.dueThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
                    <CalendarClock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground mt-1">8-30 days</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Completed</p>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground mt-1">This period</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-medium">Total Active</p>
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending filings</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgency Overview */}
            {(stats.critical > 0 || stats.high > 0) && (
              <Card className="shadow-sm border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Attention Required</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.critical > 0 && `${stats.critical} critical`}
                        {stats.critical > 0 && stats.high > 0 && " and "}
                        {stats.high > 0 && `${stats.high} high priority`}
                        {" "}compliance items need your attention
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setActiveCategory("All")}
                    >
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Filter Tabs */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TABS.map((tab) => {
                    const count = getCategoryCount(tab.id);
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeCategory === tab.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(tab.id)}
                        className="gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                        <Badge
                          variant="secondary"
                          className={`ml-1 text-xs px-1.5 py-0 ${
                            activeCategory === tab.id
                              ? "bg-white/20 text-white"
                              : ""
                          }`}
                        >
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={showCompleted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="gap-1.5"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {showCompleted ? "Showing Completed" : "Hide Completed"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Deadline Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {activeCategory === "All" ? "All Deadlines" : `${activeCategory} Deadlines`}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredDeadlines.length})
                  </span>
                </h2>
              </div>

              {filteredDeadlines.length === 0 ? (
                <Card className="shadow-sm border-border">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {showCompleted
                        ? "No deadlines found for this category."
                        : "All deadlines in this category have been completed!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDeadlines.map((deadline) => (
                  <Card
                    key={`${deadline.id}-${deadline.due_date}`}
                    className={`shadow-sm border-border border-l-4 hover:shadow-md transition-all ${
                      deadline.completed
                        ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10 opacity-75"
                        : urgencyColor(deadline.urgency)
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3
                              className={`text-lg font-semibold ${
                                deadline.completed
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {deadline.title}
                            </h3>
                            <Badge className={categoryBadgeColor(deadline.category)}>
                              {deadline.category}
                            </Badge>
                            <Badge
                              className={statusBadge(deadline.status, deadline.completed)}
                            >
                              {deadline.completed
                                ? "Completed"
                                : deadline.status.charAt(0).toUpperCase() +
                                  deadline.status.slice(1)}
                            </Badge>
                          </div>

                          {deadline.description && (
                            <p
                              className={`text-sm mb-3 ${
                                deadline.completed
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {deadline.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Due:</span>
                              <span
                                className={`font-medium ${
                                  deadline.completed
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {formatDate(deadline.due_date)}
                              </span>
                            </div>
                            {!deadline.completed && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Days remaining:
                                </span>
                                <span
                                  className={`font-medium ${
                                    deadline.days_remaining < 0
                                      ? "text-red-600"
                                      : deadline.days_remaining <= 7
                                      ? "text-orange-600"
                                      : "text-foreground"
                                  }`}
                                >
                                  {deadline.days_remaining < 0
                                    ? `${Math.abs(deadline.days_remaining)} days overdue`
                                    : `${deadline.days_remaining} days`}
                                </span>
                              </div>
                            )}
                            {deadline.recurring && (
                              <div className="text-muted-foreground">
                                <span>Recurring: </span>
                                <span className="font-medium text-foreground">
                                  {deadline.recurring}
                                </span>
                              </div>
                            )}
                          </div>

                          {deadline.penalty && !deadline.completed && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Non-Compliance Penalty
                                  </p>
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                                    {formatPenalty(deadline.penalty)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {!deadline.completed && (
                            <Badge
                              className={`text-sm px-3 py-1 ${urgencyBadgeVariant(
                                deadline.urgency
                              )}`}
                            >
                              {deadline.urgency.charAt(0).toUpperCase() +
                                deadline.urgency.slice(1)}
                            </Badge>
                          )}
                          <Button
                            variant={deadline.completed ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleMarkComplete(deadline)}
                            className={`gap-1.5 ${
                              deadline.completed
                                ? "border-green-500 text-green-600 hover:bg-green-50"
                                : ""
                            }`}
                          >
                            {deadline.completed ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Completed
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Compliance Calendar Legend */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Urgency Levels</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">Critical</p>
                      <p className="text-xs text-muted-foreground">Overdue items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <div>
                      <p className="text-sm font-medium">High</p>
                      <p className="text-xs text-muted-foreground">Due within 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Medium</p>
                      <p className="text-xs text-muted-foreground">Due within 30 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Low</p>
                      <p className="text-xs text-muted-foreground">Due after 30 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Reference */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Key Indian Regulatory Bodies</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">ROC/MCA</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Ministry of Corporate Affairs - Companies Act 2013 filings
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">GST Portal</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Goods and Services Tax returns and payments
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">Income Tax Department</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      TDS, Advance Tax, and ITR filings
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">EPFO</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Employees Provident Fund Organization
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">ESIC</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Employees State Insurance Corporation
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">State Authorities</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Professional Tax, Shops & Establishment Act
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
