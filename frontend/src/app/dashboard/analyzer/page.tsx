"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Shield,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzerApi } from "@/lib/api";

interface AnalysisClause {
  name: string;
  status: "Present" | "Missing" | "Risky";
  risk_level: "Low" | "Medium" | "High";
  description: string;
}

interface AnalysisResult {
  id: string;
  file_name: string;
  overall_risk_score: number;
  summary: string;
  clauses: AnalysisClause[];
  suggestions: string[];
}

type PageState = "idle" | "uploading" | "analyzing" | "done" | "error";

function riskScoreColor(score: number) {
  if (score < 4) return "text-green-600";
  if (score <= 6) return "text-yellow-600";
  return "text-red-600";
}

function riskScoreBgColor(score: number) {
  if (score < 4) return "bg-green-100 dark:bg-green-900/30";
  if (score <= 6) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function riskScoreLabel(score: number) {
  if (score < 4) return "Low Risk";
  if (score <= 6) return "Medium Risk";
  return "High Risk";
}

function riskProgressColor(score: number) {
  if (score < 4) return "[&>div]:bg-green-500";
  if (score <= 6) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

function clauseStatusIcon(status: string) {
  switch (status) {
    case "Present":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "Missing":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "Risky":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function clauseStatusBadge(status: string) {
  switch (status) {
    case "Present":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300";
    case "Missing":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "Risky":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function riskLevelBadge(level: string) {
  switch (level) {
    case "High":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "Low":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function riskLevelBarWidth(level: string) {
  switch (level) {
    case "High":
      return "w-full";
    case "Medium":
      return "w-2/3";
    case "Low":
      return "w-1/3";
    default:
      return "w-0";
  }
}

function riskLevelBarColor(level: string) {
  switch (level) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    case "Low":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
}

export default function AnalyzerPage() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setError(null);
      setPageState("uploading");
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      const uploadResult = await analyzerApi.upload(formData);
      setUploadProgress(50);

      setPageState("analyzing");
      setUploadProgress(70);
      const analyzeResult = await analyzerApi.analyze(uploadResult.id);
      setUploadProgress(90);

      // Fetch the complete result
      const fullResult = await analyzerApi.get(analyzeResult.id || uploadResult.id);
      setUploadProgress(100);

      setAnalysis({
        id: fullResult.id || uploadResult.id,
        file_name: fullResult.file_name || file.name,
        overall_risk_score: fullResult.overall_risk_score ?? fullResult.analysis?.overall_risk_score ?? 5,
        summary: fullResult.summary || fullResult.analysis?.summary || "Analysis complete.",
        clauses: fullResult.clauses || fullResult.analysis?.clauses || [],
        suggestions: fullResult.suggestions || fullResult.analysis?.suggestions || [],
      });
      setPageState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPageState("error");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const resetState = () => {
    setPageState("idle");
    setAnalysis(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Contract Analyzer</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Deep clause-by-clause analysis — understand contract risks before signing or negotiating
              </p>
            </div>
            {pageState === "done" && (
              <Button variant="outline" onClick={resetState}>
                <Upload className="h-4 w-4 mr-2" />
                Analyze Another
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Idle State: Upload Area */}
            {pageState === "idle" && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Upload a Contract
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Drag and drop your contract here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Uploading / Analyzing State */}
            {(pageState === "uploading" || pageState === "analyzing") && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {pageState === "uploading" ? "Uploading Contract..." : "Analyzing Contract..."}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pageState === "uploading"
                      ? "Securely uploading your document"
                      : "AI is performing clause-by-clause analysis. This may take a moment."}
                  </p>
                  <div className="max-w-xs mx-auto">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% complete</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {pageState === "error" && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={resetState}>Try Again</Button>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {pageState === "done" && analysis && (
              <>
                {/* File Header */}
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {analysis.file_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">Analysis complete</p>
                  </div>
                </div>

                {/* Overall Risk Score */}
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Overall Risk Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div
                        className={`flex items-center justify-center h-24 w-24 rounded-full ${riskScoreBgColor(
                          analysis.overall_risk_score
                        )}`}
                      >
                        <span
                          className={`text-4xl font-bold ${riskScoreColor(
                            analysis.overall_risk_score
                          )}`}
                        >
                          {analysis.overall_risk_score}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-foreground">
                            {riskScoreLabel(analysis.overall_risk_score)}
                          </span>
                          <Badge
                            className={
                              analysis.overall_risk_score < 4
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                : analysis.overall_risk_score <= 6
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            }
                          >
                            {analysis.overall_risk_score}/10
                          </Badge>
                        </div>
                        <Progress
                          value={analysis.overall_risk_score * 10}
                          className={`h-3 ${riskProgressColor(analysis.overall_risk_score)}`}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Score ranges: 0-3 (Low), 4-6 (Medium), 7-10 (High)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                {analysis.summary && (
                  <Card className="shadow-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Clause-by-Clause Table */}
                {analysis.clauses.length > 0 && (
                  <Card className="shadow-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Clause-by-Clause Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                Clause
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                Risk Level
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.clauses.map((clause, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-border last:border-0 hover:bg-muted/30"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {clauseStatusIcon(clause.status)}
                                    <span className="font-medium text-foreground">
                                      {clause.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className={clauseStatusBadge(clause.status)}>
                                    {clause.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className={riskLevelBadge(clause.risk_level)}>
                                    {clause.risk_level}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground max-w-xs">
                                  {clause.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Breakdown */}
                {analysis.clauses.length > 0 && (
                  <Card className="shadow-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Risk Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.clauses.map((clause, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground w-40 truncate flex-shrink-0">
                              {clause.name}
                            </span>
                            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${riskLevelBarColor(
                                  clause.risk_level
                                )} ${riskLevelBarWidth(clause.risk_level)}`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
                              {clause.risk_level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <Card className="shadow-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-muted-foreground"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
