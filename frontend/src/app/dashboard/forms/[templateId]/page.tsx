"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  IndianRupee,
  FileText,
  Download,
  Copy,
  Printer,
  Eye,
  Edit3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { templatesApi, type TemplateDetail } from "@/lib/api";

export default function TemplateFormPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generateResult, setGenerateResult] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        setLoading(true);
        setError(null);
        const data = await templatesApi.get(templateId);
        setTemplate(data);

        // Initialize form data with defaults
        const defaults: Record<string, unknown> = {};
        for (const field of data.fields) {
          if (field.default !== undefined) {
            defaults[field.name] = field.default;
          } else if (field.type === "boolean") {
            defaults[field.name] = false;
          } else {
            defaults[field.name] = "";
          }
        }
        setFormData(defaults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [templateId]);

  function updateField(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) return;

    try {
      setSubmitting(true);
      setError(null);
      const result = await templatesApi.generate(templateId, formData);
      setGenerateResult(result);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate document");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    const content = String(generateResult?.document_content || "");
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownloadText() {
    const content = String(generateResult?.document_content || "");
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template?.name?.replace(/\s+/g, "_") || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const content = String(generateResult?.document_content || "");
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${template?.name || "Document"}</title>
            <style>
              body { font-family: 'Georgia', serif; line-height: 1.8; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
              h1 { font-size: 24px; text-align: center; margin-bottom: 30px; }
              h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
              h3 { font-size: 15px; margin-top: 18px; }
              p { margin: 8px 0; text-align: justify; }
              ul, ol { margin: 8px 0 8px 20px; }
              li { margin: 4px 0; }
              strong { font-weight: 600; }
              hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
            </style>
          </head>
          <body>${content.replace(/\n/g, "<br>")}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function renderField(field: TemplateDetail["fields"][number]) {
    const value = formData[field.name];

    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.name}
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            rows={4}
          />
        );

      case "number":
        return (
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder || ""}
            value={(value as string | number) ?? ""}
            onChange={(e) => updateField(field.name, e.target.value === "" ? "" : Number(e.target.value))}
            required={field.required}
          />
        );

      case "date":
        return (
          <Input
            id={field.name}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => updateField(field.name, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <Switch
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => updateField(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm text-muted-foreground cursor-pointer">
              {value ? "Yes" : "No"}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">Loading Template...</h1>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading template details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/forms">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-foreground">Template Not Found</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load template</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <div className="flex gap-2">
                <Link href="/dashboard/forms">
                  <Button variant="outline">Back to Forms</Button>
                </Link>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) return null;

  // Success state — show generated document
  if (success && generateResult) {
    const documentContent = String(generateResult.document_content || "");
    const hasContent = documentContent.length > 0;

    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/forms">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{template.name}</h1>
                  <p className="text-sm text-muted-foreground">Document generated successfully</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasContent && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <><Edit3 className="h-4 w-4 mr-1" /> Raw</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> Preview</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    <Button size="sm" onClick={handleDownloadText}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Success Banner */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-400">
                        Document Generated Successfully
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Your {template.name} has been generated using AI. Review the content below before downloading.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Content */}
              {hasContent ? (
                <Card className="shadow-sm border-border">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Generated Document
                      </CardTitle>
                      <Badge variant="outline">AI-Generated</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {showPreview ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                        <ReactMarkdown>{documentContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto">
                        {documentContent}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm border-border">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Document Generated</h2>
                    <p className="text-muted-foreground mb-6">
                      Your {template.name} has been generated.
                    </p>
                    {generateResult.download_url && (
                      <Button className="w-full max-w-xs gap-2" asChild>
                        <a href={String(generateResult.download_url)} download>
                          <Download className="h-4 w-4" />
                          Download Document
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setGenerateResult(null);
                  }}
                >
                  Generate Another
                </Button>
                <Link href="/dashboard/forms">
                  <Button variant="ghost">Back to Forms</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/forms">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">{template.name}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Template Info */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Badge variant="outline">{template.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {template.estimated_time}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {template.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {template.fields.length} fields
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Dynamic Form */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle>Fill in the Details</CardTitle>
                <CardDescription>
                  Complete all required fields to generate your document using AI. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {template.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name} className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Generate Document
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard/forms">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
