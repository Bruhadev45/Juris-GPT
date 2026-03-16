"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  RotateCcw,
  Check,
  FileText,
  Building2,
  Briefcase,
  Shield,
  Scale,
  Landmark,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { draftingApi, type DraftingDocumentType } from "@/lib/api";

const categoryIcons: Record<string, React.ElementType> = {
  Corporate: Building2,
  Contracts: Briefcase,
  Employment: FileText,
  Compliance: Shield,
  Legal: Scale,
  Property: Landmark,
  Finance: IndianRupee,
};

const categoryColors: Record<string, string> = {
  Corporate: "bg-primary/10 text-primary",
  Contracts: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Employment: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Compliance: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Legal: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Property: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Finance: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function DraftingPage() {
  const [types, setTypes] = useState<DraftingDocumentType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [result, setResult] = useState<{ content: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    draftingApi
      .getTypes()
      .then((data) => setTypes(data.types))
      .catch(() => setError("Failed to load document types"))
      .finally(() => setTypesLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedType || description.length < 20) return;
    setLoading(true);
    setError(null);

    try {
      const res = await draftingApi.generate({
        document_type: selectedType,
        description,
      });
      if (res.success && res.document_content) {
        setResult({ content: res.document_content, name: res.document_name || "Document" });
      } else {
        setError(res.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const blob = await draftingApi.downloadDocx(result.content, `${selectedType}_draft.docx`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedType}_draft.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download document");
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedType(null);
    setDescription("");
  };

  const selectedTypeInfo = types.find((t) => t.id === selectedType);

  // Group types by category
  const grouped = types.reduce<Record<string, DraftingDocumentType[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI-Powered Drafting</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Generate legal documents using GPT-4 with Indian law context
              </p>
            </div>
          </div>
          {result && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              New Draft
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* Result View */}
        {result ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={categoryColors[selectedTypeInfo?.category || ""] || "bg-gray-100"}>
                    {selectedTypeInfo?.category}
                  </Badge>
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download DOCX
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {result.content}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-semibold">Generating your document...</h2>
            <p className="text-sm text-muted-foreground mt-1">
              GPT-4 is drafting a complete {selectedTypeInfo?.name || "document"} with Indian law context
            </p>
          </div>
        ) : (
          /* Selection & Input Form */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Error */}
            {error && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
              </Card>
            )}

            {/* Document Type Selection */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                1. Select Document Type
              </h2>
              {typesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, items]) => {
                    const CatIcon = categoryIcons[category] || FileText;
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <CatIcon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {items.map((t) => (
                            <Card
                              key={t.id}
                              onClick={() => setSelectedType(t.id)}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedType === t.id
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm">{t.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <CardDescription className="text-xs line-clamp-2">
                                  {t.description}
                                </CardDescription>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Description Input */}
            {selectedType && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  2. Describe Your Requirements
                </h2>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={categoryColors[selectedTypeInfo?.category || ""] || "bg-gray-100"}>
                        {selectedTypeInfo?.category}
                      </Badge>
                      <span className="text-sm font-medium">{selectedTypeInfo?.name}</span>
                    </div>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={`Describe what you need. For example: "An NDA between ABC Pvt Ltd and XYZ Corp for sharing proprietary software code, valid for 2 years, with jurisdiction in Mumbai, and INR 10 lakh penalty for breach..."`}
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {description.length}/2000 characters (minimum 20)
                      </p>
                      <Button
                        onClick={handleGenerate}
                        disabled={description.length < 20}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
