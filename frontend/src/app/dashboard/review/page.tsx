"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Loader2,
  XCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { reviewsApi, type DocumentReview } from "@/lib/api";

export default function ReviewPage() {
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<DocumentReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setError(null);
      const result = await reviewsApi.list();
      setReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      const result = await reviewsApi.upload(file);
      if (result.success) {
        setReviews((prev) => [result.review, ...prev]);
        setSelectedReview(result.review);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleAnalyze = async (reviewId: string) => {
    try {
      setAnalyzingIds((prev) => new Set(prev).add(reviewId));
      setError(null);
      const result = await reviewsApi.analyze(reviewId);
      if (result.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? result.review : r))
        );
        if (selectedReview?.id === reviewId) {
          setSelectedReview(result.review);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  const statusBadge = (status: DocumentReview["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "analyzing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Analyzing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const riskColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const riskProgressColor = (score: number) => {
    if (score <= 30) return "[&>div]:bg-green-500";
    if (score <= 60) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  const severityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 border-red-200">{severity}</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{severity}</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">{severity}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Document Review</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload documents for AI review and risk assessment — submit for optional lawyer verification
              </p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {reviews.length} document{reviews.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Upload + Document List */}
          <div className="w-[400px] border-r border-border flex flex-col overflow-y-auto">
            {/* Upload Zone */}
            <div className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                      Drop file here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, DOC (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="px-4 pb-2">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              </div>
            )}

            {/* Document List */}
            <div className="flex-1 px-4 pb-4 space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider py-2">
                Documents
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card
                    key={review.id}
                    onClick={() => setSelectedReview(review)}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedReview?.id === review.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {review.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(review.file_size)} &middot;{" "}
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {statusBadge(review.status)}
                      </div>
                      {review.status === "pending" && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          disabled={analyzingIds.has(review.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyze(review.id);
                          }}
                        >
                          {analyzingIds.has(review.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-3 w-3 mr-2" />
                              Analyze
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Analysis Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedReview ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Shield className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select a Document
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload a document for AI-powered clause analysis and risk scoring. Ensures legal accuracy while reducing lawyer dependency.
                  </p>
                </div>
              </div>
            ) : selectedReview.status === "pending" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Clock className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Pending Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    This document has not been analyzed yet. Click the Analyze
                    button to start the AI review.
                  </p>
                  <Button
                    disabled={analyzingIds.has(selectedReview.id)}
                    onClick={() => handleAnalyze(selectedReview.id)}
                  >
                    {analyzingIds.has(selectedReview.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : selectedReview.status === "analyzing" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Analyzing Document
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Our AI is reviewing your document. This may take a few moments.
                  </p>
                </div>
              </div>
            ) : selectedReview.status === "failed" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Analysis Failed
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Something went wrong during analysis. Please try again.
                  </p>
                  <Button
                    onClick={() => handleAnalyze(selectedReview.id)}
                    disabled={analyzingIds.has(selectedReview.id)}
                  >
                    Retry Analysis
                  </Button>
                </div>
              </div>
            ) : selectedReview.analysis ? (
              <div className="max-w-4xl space-y-6">
                {/* Document Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedReview.file_name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyzed on{" "}
                      {new Date(selectedReview.created_at).toLocaleString()}
                    </p>
                  </div>
                  {statusBadge(selectedReview.status)}
                </div>

                {/* Summary */}
                {selectedReview.analysis.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedReview.analysis.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Overall Risk Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <span
                        className={`text-4xl font-bold ${riskColor(
                          selectedReview.analysis.overall_risk_score
                        )}`}
                      >
                        {selectedReview.analysis.overall_risk_score}
                      </span>
                      <span className="text-lg text-muted-foreground">/ 100</span>
                    </div>
                    <Progress
                      value={selectedReview.analysis.overall_risk_score}
                      className={`h-3 ${riskProgressColor(
                        selectedReview.analysis.overall_risk_score
                      )}`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedReview.analysis.overall_risk_score <= 30
                        ? "Low risk - Document appears well-structured"
                        : selectedReview.analysis.overall_risk_score <= 60
                        ? "Medium risk - Some areas may need attention"
                        : "High risk - Significant issues identified"}
                    </p>
                  </CardContent>
                </Card>

                {/* Clause Analysis */}
                {selectedReview.analysis.clauses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Clause Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedReview.analysis.clauses.map((clause, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-2">
                              {clause.status === "present" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {clause.name}
                              </span>
                            </div>
                            {severityBadge(clause.risk)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Identified Risks */}
                {selectedReview.analysis.risks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Identified Risks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedReview.analysis.risks.map((risk, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border border-border"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-foreground">
                                {risk.title}
                              </h4>
                              {severityBadge(risk.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {risk.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Suggestions */}
                {selectedReview.analysis.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedReview.analysis.suggestions.map(
                          (suggestion, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{suggestion}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
