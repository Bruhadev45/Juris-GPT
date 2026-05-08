"use client";

import { useState, useRef } from "react";
import {
  FileSearch,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Shield,
  Info,
  Users,
  Calendar,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzerApi } from "@/lib/api";

interface Clause {
  name: string;
  status: string;
  risk_level?: string;
  risk?: string; // legacy field
  description?: string;
  extracted_text?: string | null;
  risk_factors?: string[];
  suggestions?: string[];
}

interface Party {
  name: string;
  role: string;
}

interface KeyEntry {
  label: string;
  value: string;
  note?: string | null;
}

interface AnalysisResult {
  id: string;
  file_name: string;
  status: "uploaded" | "pending" | "analyzing" | "analyzed" | "completed" | "failed";
  analysis?: {
    overall_risk_score: number;
    summary: string;
    executive_summary?: string;
    contract_type?: string;
    parties?: Party[];
    key_dates?: KeyEntry[];
    key_terms?: KeyEntry[];
    clauses: Clause[];
    risks: { title: string; severity: string; description: string }[];
    suggestions: string[];
  };
}

function clauseRisk(c: Clause): string {
  return (c.risk_level || c.risk || "medium").toLowerCase();
}

function getRiskColor(score: number) {
  if (score <= 30) return "text-green-600";
  if (score <= 60) return "text-yellow-600";
  return "text-red-600";
}

function getRiskBadge(risk: string) {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return colors[risk.toLowerCase()] || colors.medium;
}

function getSeverityIcon(severity: string) {
  switch (severity.toLowerCase()) {
    case "low":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "high":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

export default function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedClause, setExpandedClause] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    try {
      setError(null);
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      const uploadResult = await analyzerApi.upload(formData);

      setUploading(false);
      setAnalyzing(true);

      const analysisResult = await analyzerApi.analyze(uploadResult.id);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSearch className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Contract Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                Upload contracts and agreements for AI-powered risk analysis
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload a contract, agreement, or legal document (PDF, DOC, DOCX) for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    {file ? (
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, DOCX (max 10MB)</p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUploadAndAnalyze}
                      disabled={!file || uploading || analyzing}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Analyze Document
                        </>
                      )}
                    </Button>
                    {file && (
                      <Button variant="outline" onClick={resetForm}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {result?.analysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>
                      {result.analysis.contract_type
                        ? `${result.analysis.contract_type.toUpperCase()} · ${result.file_name}`
                        : `Overall risk score for ${result.file_name}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={`text-5xl font-bold ${getRiskColor(result.analysis.overall_risk_score)}`}>
                          {result.analysis.overall_risk_score}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Risk Score</p>
                      </div>
                      <div className="flex-1">
                        <Progress value={result.analysis.overall_risk_score} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Low Risk</span>
                          <span>Medium Risk</span>
                          <span>High Risk</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 font-medium">{result.analysis.summary}</p>
                  </CardContent>
                </Card>

                {result.analysis.executive_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Plain-English Summary
                      </CardTitle>
                      <CardDescription>What this document actually does</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {result.analysis.executive_summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {(result.analysis.parties?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Parties
                      </CardTitle>
                      <CardDescription>Who is on each side of this document</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {result.analysis.parties!.map((p, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-border bg-card">
                            <p className="font-medium text-foreground">{p.name || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{p.role}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {((result.analysis.key_dates?.length ?? 0) > 0 || (result.analysis.key_terms?.length ?? 0) > 0) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {(result.analysis.key_dates?.length ?? 0) > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Key Dates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3">
                            {result.analysis.key_dates!.map((d, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-3 pb-3 last:pb-0 last:border-0 border-b border-border">
                                <div className="min-w-0">
                                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</dt>
                                  {d.note && <p className="text-xs text-muted-foreground mt-0.5">{d.note}</p>}
                                </div>
                                <dd className="text-sm font-medium text-foreground text-right whitespace-nowrap">{d.value || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </CardContent>
                      </Card>
                    )}
                    {(result.analysis.key_terms?.length ?? 0) > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            Key Terms
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3">
                            {result.analysis.key_terms!.map((t, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-3 pb-3 last:pb-0 last:border-0 border-b border-border">
                                <div className="min-w-0">
                                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</dt>
                                  {t.note && <p className="text-xs text-muted-foreground mt-0.5">{t.note}</p>}
                                </div>
                                <dd className="text-sm font-medium text-foreground text-right">{t.value || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Clause Analysis</CardTitle>
                    <CardDescription>Click any clause to see what it says and how to fix it</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.analysis.clauses.map((clause, idx) => {
                        const isOpen = expandedClause === idx;
                        const risk = clauseRisk(clause);
                        const status = (clause.status || "").toLowerCase();
                        return (
                          <div key={idx} className="rounded-lg border border-border overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedClause(isOpen ? null : idx)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {status === "present" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                ) : status === "missing" ? (
                                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                )}
                                <span className="font-medium truncate">{clause.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={getRiskBadge(risk)}>{risk}</Badge>
                                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border bg-muted/20">
                                {clause.description && (
                                  <p className="text-sm text-foreground">{clause.description}</p>
                                )}
                                {clause.extracted_text && (
                                  <blockquote className="text-xs italic text-muted-foreground border-l-2 border-border pl-3 py-1">
                                    &ldquo;{clause.extracted_text}&rdquo;
                                  </blockquote>
                                )}
                                {(clause.risk_factors?.length ?? 0) > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
                                    <ul className="space-y-1">
                                      {clause.risk_factors!.map((rf, ridx) => (
                                        <li key={ridx} className="text-sm text-foreground flex gap-2">
                                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                          <span>{rf}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {(clause.suggestions?.length ?? 0) > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Suggested fix</p>
                                    <ul className="space-y-1">
                                      {clause.suggestions!.map((s, sidx) => (
                                        <li key={sidx} className="text-sm text-foreground flex gap-2">
                                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {result.analysis.risks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Risks</CardTitle>
                      <CardDescription>The things to worry about, ranked</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.analysis.risks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                              {getSeverityIcon(risk.severity)}
                              <span className="font-medium">{risk.title}</span>
                              <Badge className={getRiskBadge(risk.severity)}>{risk.severity}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.analysis.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                      <CardDescription>What to do next</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {suggestion}
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
