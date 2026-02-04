"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Bell,
  User,
  Eye,
  Download,
  MoreVertical,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  FileText,
  ChevronDown,
  ArrowUpDown,
  BookOpen,
  Scale,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { apiClient, CaseSummary, CompaniesActSection, LegalDataStats } from "@/lib/api";

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [companiesActSections, setCompaniesActSections] = useState<CompaniesActSection[]>([]);
  const [stats, setStats] = useState<LegalDataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLegalData();
  }, []);

  const loadLegalData = async () => {
    try {
      setLoading(true);
      const [casesData, companiesActData, statsData] = await Promise.all([
        apiClient.getCaseSummaries({ limit: 10 }),
        apiClient.getCompaniesActSections({ limit: 5 }),
        apiClient.getLegalDataStats(),
      ]);
      setCases(casesData);
      setCompaniesActSections(companiesActData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading legal data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold text-foreground">AI Analysis Overview</h1>
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
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-secondary rounded-lg transition-all hover:scale-110 hover:rotate-90 duration-300 group">
                <Plus className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-all hover:scale-110 duration-300 group">
                <Filter className="h-5 w-5 text-foreground group-hover:text-primary group-hover:rotate-180 transition-all duration-300" />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-all hover:scale-110 duration-300 relative group">
                <Bell className="h-5 w-5 text-foreground group-hover:text-primary group-hover:animate-ring transition-all" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full group-hover:animate-pulse"></span>
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-all hover:scale-110 duration-300 group">
                <User className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              </button>
              <span className="text-sm text-muted-foreground">Legal Insight AI Tool</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-7 space-y-6">
              {/* Document Status Card */}
              <Card className="shadow-sm border-border hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Document Status</CardTitle>
                  <button className="p-1 hover:bg-secondary rounded hover:rotate-90 transition-transform duration-300">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <FileText className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">NDA_v3.2_Draft.pdf</p>
                          <p className="text-sm text-muted-foreground">1.1 MB</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-secondary rounded">
                            <Eye className="h-4 w-4 text-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded">
                            <Download className="h-4 w-4 text-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Analyzed: 07 Nov 2025</p>
                        <p>Last Edited: Anna K., Associate</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI Review Progress</span>
                      <span className="font-medium text-foreground">91% complete</span>
                    </div>
                    <Progress value={91} className="h-2" />
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      Stage: Clause Analysis
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">AI Summary</CardTitle>
                  <button className="p-1 hover:bg-secondary rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Risk Zone: Medium 2.3
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Clause Type:</span> License / IP
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Impact:</span> May affect exclusivity rights
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendation Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-lg font-semibold text-foreground">Recommendation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-foreground">
                      Clarify the term "limited license" or replace with "non-exclusive use right"
                    </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-lg transition-all duration-300">
                    See Suggested Rewrite
                  </Button>
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Documents</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Last AI Documents Reviews
                    </CardDescription>
                  </div>
                  <button className="p-1 hover:bg-secondary rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "NDA_v3.2_Draft.pdf", size: "1.1 MB", type: "pdf" },
                      { name: "SupplierContract.docx", size: "2.3 MB", type: "docx" },
                      { name: "NDA_v.4.1_Final.pdf", size: "1.5 MB", type: "pdf" },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg hover:shadow-md hover:-translate-x-1 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                            <FileText className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.size}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-primary/10 rounded hover:scale-110 transition-all duration-300">
                            <Eye className="h-4 w-4 text-foreground hover:text-primary transition-colors" />
                          </button>
                          <button className="p-2 hover:bg-primary/10 rounded hover:scale-110 transition-all duration-300">
                            <Download className="h-4 w-4 text-foreground hover:text-primary hover:animate-bounce transition-all" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-sm text-primary hover:text-primary/80 flex items-center gap-1 hover:gap-2 transition-all group">
                    Show all
                    <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="col-span-5 space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-sm border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">Legal Cases</p>
                    <p className="text-3xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform inline-block">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.cases || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 group-hover:animate-bounce" />
                      Case summaries available
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">Companies Act</p>
                    <p className="text-3xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform inline-block">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.companies_act_sections || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <BookOpen className="h-3 w-3 group-hover:animate-bounce" />
                      Sections available
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">Indian Laws</p>
                    <p className="text-3xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform inline-block">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats ? Object.keys(stats.laws).length : 0}
                    </p>
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Scale className="h-3 w-3 group-hover:animate-pulse" />
                      Laws indexed
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">Total Sections</p>
                    <p className="text-3xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform inline-block">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats ? Object.values(stats.laws).reduce((a, b) => a + b, 0) : 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 group-hover:animate-bounce" />
                      Legal sections
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Risk Trend Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">AI Risk Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Documents analyzed
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      With risks
                    </Badge>
                  </div>
                  <div className="h-48 bg-secondary rounded-lg flex items-center justify-center border border-border">
                    <p className="text-sm text-muted-foreground">Chart: AI Risk Trend (Jan - Dec)</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Risk exposure: 25% (highlighted in July)
                  </p>
                </CardContent>
              </Card>

              {/* Companies Act Sections Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">Companies Act Sections</CardTitle>
                  <button className="p-1 hover:bg-secondary rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
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
                          className="p-3 border border-border rounded-lg hover:bg-secondary hover:shadow-md transition-all duration-300 cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                Section {section.section}: {section.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {section.content.substring(0, 150)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Relevant Cases Card */}
              <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">Relevant Cases</CardTitle>
                  <button className="p-1 hover:bg-secondary rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-semibold text-foreground flex items-center gap-1">
                            Case Name
                            <ArrowUpDown className="h-3 w-3" />
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-foreground">
                            Court
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-foreground flex items-center gap-1">
                            Year
                            <ArrowUpDown className="h-3 w-3" />
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-foreground flex items-center gap-1">
                            Principle
                            <ArrowUpDown className="h-3 w-3" />
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-foreground">
                            Relevance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </td>
                          </tr>
                        ) : cases.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No cases found
                            </td>
                          </tr>
                        ) : (
                          cases.map((case_, idx) => {
                            const year = case_.citation.match(/\d{4}/)?.[0] || "N/A";
                            return (
                              <tr key={idx} className="border-b border-border hover:bg-secondary hover:shadow-md transition-all duration-300 cursor-pointer group">
                                <td className="py-2 px-3 text-foreground group-hover:text-primary group-hover:font-semibold transition-all">
                                  {case_.case_name}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                    {case_.court}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-muted-foreground group-hover:text-foreground transition-colors">
                                  {year}
                                </td>
                                <td className="py-2 px-3 text-foreground font-medium group-hover:scale-110 transition-transform inline-block">
                                  {case_.principle}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge className="bg-primary/10 text-primary border-primary/20 group-hover:scale-110 transition-transform">
                                    {case_.relevance}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
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
  );
}
