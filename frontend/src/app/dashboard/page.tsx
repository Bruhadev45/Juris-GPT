"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  User,
  TrendingUp,
  AlertTriangle,
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Link href="/" className="flex items-center gap-2 mr-4">
                <Scale className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">JurisGPT</span>
              </Link>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 bg-background border-border"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/chat">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Legal Chat
                </Button>
              </Link>
              <Link href="/agreements/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Agreement
                </Button>
              </Link>
              <button className="p-2 hover:bg-secondary rounded-lg transition-all relative group ml-2">
                <Bell className="h-5 w-5 text-foreground group-hover:text-primary transition-all" />
                {overdueCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-all group">
                <User className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground mt-1">Your legal workspace at a glance</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Gavel className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Legal Cases</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.cases || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    Case summaries available
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Companies Act</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.companies_act_sections || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <BookOpen className="h-3 w-3" />
                    Sections indexed
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Scale className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Indian Laws</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats ? Object.keys(stats.laws).length : 0}
                  </p>
                  <p className="text-xs text-primary flex items-center gap-1 mt-1">
                    <Scale className="h-3 w-3" />
                    Statutes available
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Sections</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : stats ? (
                      Object.values(stats.laws).reduce((a, b) => a + b, 0).toLocaleString()
                    ) : (
                      0
                    )}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    Legal provisions
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                {/* Compliance Alerts */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Compliance Deadlines
                      </CardTitle>
                    </div>
                    <Link href="/dashboard/compliance">
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="py-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : deadlines.length === 0 ? (
                      <div className="py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No upcoming deadlines in the next 14 days</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deadlines.map((deadline, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  deadline.urgency === "critical"
                                    ? "bg-red-500"
                                    : deadline.urgency === "high"
                                    ? "bg-orange-500"
                                    : deadline.urgency === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">{deadline.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {deadline.category} &middot; Due: {new Date(deadline.due_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={
                                deadline.status === "overdue"
                                  ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                  : deadline.status === "upcoming"
                                  ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                                  : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                              }
                            >
                              {deadline.status === "overdue"
                                ? `${Math.abs(deadline.days_remaining)}d overdue`
                                : `${deadline.days_remaining}d left`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {(overdueCount > 0 || upcomingCount > 0) && (
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                        {overdueCount > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 font-medium">{overdueCount} overdue</span>
                          </div>
                        )}
                        {upcomingCount > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 font-medium">{upcomingCount} due soon</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Document Reviews */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Document Reviews
                      </CardTitle>
                    </div>
                    <Link href="/dashboard/review">
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="py-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="py-6 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No documents reviewed yet</p>
                        <Link href="/dashboard/review">
                          <Button variant="outline" size="sm" className="mt-3">
                            Upload a Document
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                                  {review.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={
                                review.status === "completed"
                                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                                  : review.status === "pending"
                                  ? "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                                  : review.status === "failed"
                                  ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                              }
                            >
                              {review.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
                        <span>{completedReviews} completed</span>
                        <span>{pendingReviews} pending</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: "New Agreement", icon: FileText, href: "/agreements/new", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
                        { label: "Legal Chat", icon: BookOpen, href: "/dashboard/chat", color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
                        { label: "Analyze Contract", icon: Shield, href: "/dashboard/analyzer", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
                        { label: "Legal Search", icon: Search, href: "/dashboard/search", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
                        { label: "Generate Form", icon: FileText, href: "/dashboard/forms", color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" },
                        { label: "RTI Assistant", icon: Gavel, href: "/dashboard/rti", color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
                      ].map((action) => (
                        <Link key={action.label} href={action.href}>
                          <div className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                              <action.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {action.label}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Companies Act Sections */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground">Companies Act Sections</CardTitle>
                    <Link href="/dashboard/search">
                      <Button variant="ghost" size="sm" className="gap-1">
                        Search <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </div>
                      ) : companiesActSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No sections found</p>
                      ) : (
                        companiesActSections.map((section, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <p className="font-semibold text-sm text-foreground">
                              Section {section.section}: {section.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {section.content.substring(0, 150)}...
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Relevant Cases */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground">Recent Cases</CardTitle>
                    <Link href="/dashboard/cases">
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </div>
                      ) : cases.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No cases found</p>
                      ) : (
                        cases.map((case_, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {case_.case_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {case_.court} &middot; {case_.citation}
                                </p>
                              </div>
                              <Badge className="bg-primary/10 text-primary border-primary/20 flex-shrink-0 text-xs">
                                {case_.relevance}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {case_.principle}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Showing {cases.length} of {stats?.cases || 0} cases
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
