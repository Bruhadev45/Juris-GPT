"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  FileSignature,
  FileText,
  Gavel,
  Loader2,
  Scale,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  apiClient,
  complianceApi,
  reviewsApi,
  type CaseSummary,
  type CompaniesActSection,
  type LegalDataStats,
  type ComplianceDeadline,
  type DocumentReview,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { LogOut } from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

const starterPrompts = [
  "What are the annual compliance requirements for a private limited company in India?",
  "What clauses should be included in a founder agreement?",
  "What does Section 149 of the Companies Act say about directors?",
  "Are non-compete clauses enforceable in India for startup employees?",
];

const workspaceActions = [
  {
    label: "Ask JurisGPT",
    description: "Start with natural-language legal research and grounded answers",
    href: "/dashboard/chat",
    icon: Scale,
    color: "text-primary bg-primary/10",
  },
  {
    label: "Search Sources",
    description: "Inspect statutes, case law, and source snippets directly",
    href: "/dashboard/search",
    icon: Search,
    color: "text-[#7B1E2E] bg-[#FCE8EA] dark:bg-primary/10 dark:text-primary",
  },
  {
    label: "Draft Contract",
    description: "Move from research into drafting workflows",
    href: "/dashboard/contracts",
    icon: FileSignature,
    color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
  {
    label: "Track Compliance",
    description: "Check deadlines and statutory tasks",
    href: "/dashboard/compliance",
    icon: Shield,
    color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300",
  },
  {
    label: "Calendar",
    description: "See filing events and upcoming due dates by month",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    color: "text-rose-800 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300",
  },
  {
    label: "Analyze Document",
    description: "Upload agreements and inspect flagged clauses",
    href: "/dashboard/analyzer",
    icon: FileText,
    color: "text-stone-900 bg-stone-100 dark:bg-stone-800 dark:text-stone-100",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Ask the assistant",
    description: "Begin with a legal question in plain English about startup, corporate, or compliance law.",
  },
  {
    step: "02",
    title: "Inspect citations",
    description: "Review confidence, limitations, and the supporting sections or case summaries.",
  },
  {
    step: "03",
    title: "Deepen with search",
    description: "Open source search when you need manual verification or broader legal context.",
  },
  {
    step: "04",
    title: "Move into workflows",
    description: "Only after research, continue into contracts, compliance tracking, or document review.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [companiesActSections, setCompaniesActSections] = useState<CompaniesActSection[]>([]);
  const [stats, setStats] = useState<LegalDataStats | null>(null);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [casesData, companiesActData, statsData, deadlinesData, reviewsData] =
          await Promise.allSettled([
            apiClient.getCaseSummaries({ limit: 4 }),
            apiClient.getCompaniesActSections({ limit: 4 }),
            apiClient.getLegalDataStats(),
            complianceApi.getUpcoming(14),
            reviewsApi.list(),
          ]);

        if (casesData.status === "fulfilled") setCases(casesData.value);
        if (companiesActData.status === "fulfilled") setCompaniesActSections(companiesActData.value);
        if (statsData.status === "fulfilled") setStats(statsData.value);
        if (deadlinesData.status === "fulfilled") setDeadlines(deadlinesData.value.data?.slice(0, 4) || []);
        if (reviewsData.status === "fulfilled") setReviews(reviewsData.value.data?.slice(0, 3) || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const assistantMetrics = useMemo(() => {
    const statutesCovered = stats ? Object.keys(stats.laws).length : 0;
    const totalSections = stats
      ? Object.values(stats.laws).reduce((acc, value) => acc + value, 0)
      : 0;

    return [
      {
        label: "Case Law Indexed",
        value: stats?.cases || 0,
        sublabel: "Research-ready judgments",
        icon: Gavel,
        color: "text-[#7B1E2E] bg-[#FCE8EA] dark:bg-primary/10 dark:text-primary",
      },
      {
        label: "Statutes Covered",
        value: statutesCovered,
        sublabel: "Acts available for retrieval",
        icon: Scale,
        color: "text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300",
      },
      {
        label: "Legal Sections",
        value: totalSections.toLocaleString(),
        sublabel: "Section-level source coverage",
        icon: BookOpen,
        color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300",
      },
      {
        label: "Due Soon",
        value: deadlines.length,
        sublabel: "Upcoming compliance items",
        icon: Clock,
        color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300",
      },
    ];
  }, [deadlines.length, stats]);

  const { user, logout } = useAuth();

  const handleResearchSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/dashboard/chat?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const greetingPrefix = greeting();
  const firstName = user?.full_name?.split(" ")[0];

  const completedReviews = reviews.filter((review) => review.status === "completed").length;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Database className="h-3.5 w-3.5" />
              Citation-grounded workspace
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {greetingPrefix}
              {firstName ? `, ${firstName}` : ""} — ready when you are.
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Ask anything in plain English — JurisGPT cites every answer against Indian statutes, judgments, and circulars.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <Link href="/dashboard/chat" className="flex-1 sm:flex-none">
              <Button className="w-full gap-1.5 sm:w-auto">
                <Scale className="h-4 w-4" />
                Ask JurisGPT
              </Button>
            </Link>
            <Link href="/dashboard/search" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full gap-1.5 sm:w-auto">
                <Search className="h-4 w-4" />
                Search Sources
              </Button>
            </Link>
            {user && (
              <div className="hidden items-center gap-2 border-l border-border pl-3 lg:flex">
                <div className="text-right leading-tight">
                  <div className="text-sm font-medium text-foreground">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <section className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 overflow-hidden border-border bg-card shadow-sm lg:col-span-8">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Research first
                </div>
                <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Ask a legal question, verify the citations, then move into the right workflow.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  The converted dashboard mirrors the prototype priority: Legal Q&A is the hub, while source search,
                  compliance tracking, contract drafting, document analysis, and the filing calendar support it.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleResearchSubmit(query);
                        }
                      }}
                      placeholder="Ask about director duties, founder agreements, annual filings, or section-level compliance..."
                    className="h-11 rounded-md border-border bg-background pl-10"
                  />
                  </div>
                  <Button className="h-11 gap-1.5 px-5" onClick={() => handleResearchSubmit(query)}>
                    Ask Question
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleResearchSubmit(prompt)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-primary"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-12 border-border bg-card shadow-sm lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Dashboard Modules</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {workspaceActions.map((action) => (
                  <Link key={action.label} href={action.href} className="block">
                    <div className="rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30 hover:bg-accent/70">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-md ${action.color}`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{action.label}</p>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-12 gap-4">
            {assistantMetrics.map((metric) => (
              <Card key={metric.label} className="col-span-12 sm:col-span-6 xl:col-span-3 border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.color}`}>
                      <metric.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : metric.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{metric.sublabel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Research Workflow
                </div>
                <CardTitle className="text-sm font-semibold">How the research-paper flow works inside the app</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {workflowSteps.map((item) => (
                  <div key={item.step} className="rounded-xl border border-border p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{item.step}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

          </section>

          <section className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 border-border bg-card shadow-sm xl:col-span-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Research Sources Snapshot</CardTitle>
                <Link href="/dashboard/search">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Open Search
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Gavel className="h-3.5 w-3.5" />
                    Recent Cases
                  </div>
                  {loading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : cases.length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">No case summaries available.</p>
                  ) : (
                    cases.map((caseItem, index) => (
                      <div key={`${caseItem.case_name}-${index}`} className="rounded-lg border border-border p-3">
                        <p className="truncate text-sm font-medium text-foreground">{caseItem.case_name}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {caseItem.court} · {caseItem.citation}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{caseItem.relevance}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    Companies Act Sections
                  </div>
                  {loading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : companiesActSections.length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">No statutory sections available.</p>
                  ) : (
                    companiesActSections.map((section, index) => (
                      <div key={`${section.section}-${index}`} className="rounded-lg border border-border p-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          Section {section.section}: {section.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{section.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-12 border-border bg-card shadow-sm xl:col-span-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Supporting Workflows</CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  Secondary Modules
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Compliance Monitor</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Track due-soon obligations after completing your legal research.
                  </p>
                  <div className="mt-3 space-y-2">
                    {loading ? (
                      <div className="py-6 text-center">
                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : deadlines.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No upcoming deadlines.</p>
                    ) : (
                      deadlines.map((deadline) => (
                        <div key={`${deadline.id}-${deadline.due_date}`} className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">{deadline.title}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {deadline.category} · Due {new Date(deadline.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={
                              deadline.status === "overdue"
                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                : deadline.status === "upcoming"
                                  ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                            }
                          >
                            {deadline.days_remaining}d
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Document Review Queue</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Review and drafting stay accessible, but they no longer dominate the main dashboard.
                  </p>
                  <div className="mt-3 space-y-2">
                    {loading ? (
                      <div className="py-6 text-center">
                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No reviews have been created yet.</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-lg border border-border p-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-medium text-foreground">{review.file_name}</p>
                            <Badge
                              className={
                                review.status === "completed"
                                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                                  : review.status === "failed"
                                    ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                    : review.status === "analyzing"
                                      ? "bg-[#E6ECF0] text-[#5C7A8A] border-[#D8E1E6] dark:bg-secondary dark:text-muted-foreground"
                                      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {review.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Created {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{completedReviews} completed reviews</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
