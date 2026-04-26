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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzerApi } from "@/lib/api";

interface AnalysisResult {
  id: string;
  file_name: string;
  status: "pending" | "analyzing" | "completed" | "failed";
  analysis?: {
    overall_risk_score: number;
    summary: string;
    clauses: { name: string; status: string; risk: string }[];
    risks: { title: string; severity: string; description: string }[];
    suggestions: string[];
  };
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
                    <CardDescription>Overall risk score for {result.file_name}</CardDescription>
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
                    <p className="text-sm text-muted-foreground mt-4">{result.analysis.summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clause Analysis</CardTitle>
                    <CardDescription>Review of key contract clauses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.analysis.clauses.map((clause, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            {clause.status === "present" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-medium">{clause.name}</span>
                          </div>
                          <Badge className={getRiskBadge(clause.risk)}>{clause.risk}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {result.analysis.risks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Identified Risks</CardTitle>
                      <CardDescription>Potential issues found in the document</CardDescription>
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
                            <p className="text-sm text-muted-foreground">{risk.description}</p>
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
                      <CardDescription>Suggested improvements for the document</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
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
