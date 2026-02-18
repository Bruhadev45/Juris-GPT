"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  User,
  TrendingUp,
  FileText,
  BookOpen,
  Scale,
  Loader2,
  Shield,
  Calendar,
  Gavel,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sparkles,
  MessageSquare,
  FileScan,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  apiClient,
  complianceApi,
  reviewsApi,
  CaseSummary,
  CompaniesActSection,
  LegalDataStats,
  ComplianceDeadline,
  DocumentReview,
} from "@/lib/api";

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [companiesActSections, setCompaniesActSections] = useState<CompaniesActSection[]>([]);
  const [stats, setStats] = useState<LegalDataStats | null>(null);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [casesData, companiesActData, statsData, deadlinesData, reviewsData] =
        await Promise.allSettled([
          apiClient.getCaseSummaries({ limit: 5 }),
          apiClient.getCompaniesActSections({ limit: 5 }),
          apiClient.getLegalDataStats(),
          complianceApi.getUpcoming(14),
          reviewsApi.list(),
        ]);

      if (casesData.status === "fulfilled") setCases(casesData.value);
      if (companiesActData.status === "fulfilled") setCompaniesActSections(companiesActData.value);
      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (deadlinesData.status === "fulfilled") setDeadlines(deadlinesData.value.data?.slice(0, 5) || []);
      if (reviewsData.status === "fulfilled") setReviews(reviewsData.value.data?.slice(0, 3) || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const overdueCount = deadlines.filter((d) => d.status === "overdue").length;
  const upcomingCount = deadlines.filter((d) => d.status === "upcoming").length;
  const completedReviews = reviews.filter((r) => r.status === "completed").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;

  const quickActions = [
    { label: "AI Lawyer", icon: Scale, href: "/dashboard/chat", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
    { label: "New Agreement", icon: FileText, href: "/agreements/new", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Contract Analyzer", icon: FileScan, href: "/dashboard/analyzer", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
    { label: "Legal Research", icon: Search, href: "/dashboard/search", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Documents", icon: FileText, href: "/dashboard/documents", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Tools", icon: Gavel, href: "/dashboard/tools", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search cases, laws, documents..." className="pl-10 bg-background border-border" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/chat">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">AI Lawyer</span>
              </Button>
            </Link>
            <Link href="/agreements/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Agreement</span>
              </Button>
            </Link>
            <button className="p-2 hover:bg-secondary rounded-lg transition-all relative group ml-1">
              <Bell className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              {overdueCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg transition-all group">
              <User className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Welcome */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Your legal health at a glance</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI-powered insights</span>
            </div>
          </div>

          {/* ═══════════ BENTO GRID ═══════════ */}
          <div className="grid grid-cols-12 gap-4">

            {/* ── Row 1: Four metric cards ── */}
            {[
              { label: "Legal Cases", value: stats?.cases || 0, icon: Gavel, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", sub: "Case summaries", subIcon: TrendingUp },
              { label: "Companies Act", value: stats?.companies_act_sections || 0, icon: BookOpen, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", sub: "Sections indexed", subIcon: BookOpen },
              { label: "Indian Laws", value: stats ? Object.keys(stats.laws).length : 0, icon: Scale, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", sub: "Statutes available", subIcon: Scale },
              { label: "Total Sections", value: stats ? Object.values(stats.laws).reduce((a, b) => a + b, 0).toLocaleString() : 0, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", sub: "Legal provisions", subIcon: TrendingUp },
            ].map((metric, i) => (
              <Card key={i} className="col-span-6 md:col-span-3 shadow-sm border-border hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center`}>
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : metric.value}
                  </p>
                  <p className={`text-[11px] ${metric.color} flex items-center gap-1 mt-1.5`}>
                    <metric.subIcon className="h-3 w-3" />
                    {metric.sub}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* ── Row 2: Compliance (7col) + Quick Actions (5col) ── */}

            {/* Compliance Deadlines — wide left */}
            <Card className="col-span-12 lg:col-span-7 shadow-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Compliance Deadlines</CardTitle>
                </div>
                <Link href="/dashboard/compliance">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {loading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="h-7 w-7 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deadlines.map((deadline, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            deadline.urgency === "critical" ? "bg-red-500"
                            : deadline.urgency === "high" ? "bg-orange-500"
                            : deadline.urgency === "medium" ? "bg-yellow-500"
                            : "bg-green-500"
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{deadline.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {deadline.category} &middot; Due: {new Date(deadline.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] px-2 py-0.5 ${
                          deadline.status === "overdue"
                            ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                            : deadline.status === "upcoming"
                            ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {deadline.status === "overdue"
                            ? `${Math.abs(deadline.days_remaining)}d overdue`
                            : `${deadline.days_remaining}d left`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {(overdueCount > 0 || upcomingCount > 0) && (
                  <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-border">
                    {overdueCount > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-600 font-medium">{overdueCount} overdue</span>
                      </div>
                    )}
                    {upcomingCount > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-orange-600 font-medium">{upcomingCount} due soon</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions — right */}
            <Card className="col-span-12 lg:col-span-5 shadow-sm border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {quickActions.map((action) => (
                    <Link key={action.label} href={action.href}>
                      <div className="flex items-center gap-2.5 p-3 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                          <action.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {action.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Row 3: Document Reviews (5col) + Cases (4col) + Companies Act (3col) ── */}

            {/* Document Reviews */}
            <Card className="col-span-12 md:col-span-5 shadow-sm border-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Document Reviews</CardTitle>
                </div>
                <Link href="/dashboard/review">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {loading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents reviewed yet</p>
                    <Link href="/dashboard/review">
                      <Button variant="outline" size="sm" className="mt-3 text-xs h-7">
                        Upload a Document
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex items-center justify-between p-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{review.file_name}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${
                          review.status === "completed" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                          : review.status === "pending" ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          : review.status === "failed" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {review.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border text-[11px] text-muted-foreground">
                    <span>{completedReviews} completed</span>
                    <span>{pendingReviews} pending</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Cases */}
            <Card className="col-span-12 md:col-span-4 shadow-sm border-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Recent Cases</CardTitle>
                <Link href="/dashboard/cases">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                    All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : cases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No cases found</p>
                  ) : (
                    cases.map((case_, idx) => (
                      <div key={idx} className="p-2.5 border border-border rounded-lg hover:bg-muted/30 transition-all cursor-pointer overflow-hidden">
                        <p className="font-medium text-sm text-foreground truncate">{case_.case_name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {case_.court} &middot; {case_.citation}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          {case_.relevance}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Showing {cases.length} of {stats?.cases || 0} cases
                </p>
              </CardContent>
            </Card>

            {/* Companies Act Sections */}
            <Card className="col-span-12 md:col-span-3 shadow-sm border-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Companies Act</CardTitle>
                <Link href="/dashboard/search">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                    <Search className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : companiesActSections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No sections</p>
                  ) : (
                    companiesActSections.map((section, idx) => (
                      <div key={idx} className="p-2.5 border border-border rounded-lg hover:bg-muted/30 transition-all cursor-pointer overflow-hidden">
                        <p className="font-medium text-xs text-foreground truncate">
                          §{section.section}: {section.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 break-words">
                          {section.content.substring(0, 100)}...
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
