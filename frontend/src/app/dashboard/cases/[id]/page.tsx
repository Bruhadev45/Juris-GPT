"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Scale,
  FileText,
  Calendar,
  User,
  Tag,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Loader2,
  LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RelatedPdf {
  title: string;
  url: string;
}

interface CaseDetail {
  id: number;
  case_name: string;
  citation: string;
  court: string;
  principle: string;
  summary: string;
  relevance: string;
  date?: string;
  judges?: string[];
  status?: string;
  description?: string;
  key_points?: string[];
  related_pdfs?: RelatedPdf[];
  related_sections?: string[];
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await fetch(`${API_BASE}/api/legal/cases/${params.id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Case not found" : "Failed to load case");
          return;
        }
        setCaseData(await res.json());
      } catch {
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <Scale className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">{error ?? "Case not found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {caseData.case_name}
              </h1>
            </div>
            {caseData.status && (
              <Badge
                variant="outline"
                className={
                  caseData.status === "Landmark"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : caseData.status === "Active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {caseData.status}
              </Badge>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Meta info bar */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {caseData.citation && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{caseData.citation}</span>
                </div>
              )}
              {caseData.court && (
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  <span>{caseData.court}</span>
                </div>
              )}
              {caseData.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(caseData.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {caseData.principle && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  {caseData.principle}
                </Badge>
              )}
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {caseData.summary}
                </p>
              </CardContent>
            </Card>

            {/* Detailed Description */}
            {caseData.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Detailed Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {caseData.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Points */}
            {caseData.key_points && caseData.key_points.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {caseData.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Judges */}
            {caseData.judges && caseData.judges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Bench ({caseData.judges.length} Judges)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caseData.judges.map((judge, i) => (
                      <Badge key={i} variant="outline" className="text-sm py-1 px-3">
                        {judge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Related PDFs / Links */}
              {caseData.related_pdfs && caseData.related_pdfs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Related Documents & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {caseData.related_pdfs.map((pdf, i) => (
                        <li key={i}>
                          <a
                            href={pdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors group"
                          >
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground group-hover:text-primary flex-1">
                              {pdf.title}
                            </span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Related Sections */}
              {caseData.related_sections && caseData.related_sections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Related Legal Provisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {caseData.related_sections.map((section, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                          <Tag className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{section}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Relevance */}
            {caseData.relevance && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-primary">
                    Relevance: {caseData.relevance}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
