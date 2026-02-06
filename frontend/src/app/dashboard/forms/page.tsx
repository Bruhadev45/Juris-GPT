"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2, AlertCircle, Clock, IndianRupee, FormInput } from "lucide-react";
import { templatesApi, type Template } from "@/lib/api";

function categoryColor(category: string) {
  const colors: Record<string, string> = {
    Corporate: "bg-primary/10 text-primary",
    Employment: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Legal: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Commercial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    Compliance: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    Tax: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    IP: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  };
  return colors[category] || "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300";
}

function groupByCategory(templates: Template[]): Record<string, Template[]> {
  return templates.reduce<Record<string, Template[]>>((groups, template) => {
    const key = template.category || "Other";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(template);
    return groups;
  }, {});
}

export default function FormsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        setError(null);
        const res = await templatesApi.list();
        setTemplates(res.templates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const grouped = groupByCategory(templates);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Legal Forms</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Legal Forms</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load templates</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Legal Forms</h1>
            <Link href="/agreements/new">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Agreement
              </Button>
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-8">
            {Object.entries(grouped).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTemplates.length} {categoryTemplates.length === 1 ? "template" : "templates"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="shadow-sm border-border hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${categoryColor(
                                template.category
                              )}`}
                            >
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription className="mt-1">{template.description}</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                          <Badge className={categoryColor(template.category)}>{template.category}</Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{template.estimated_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span>{template.price.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FormInput className="h-3.5 w-3.5" />
                            <span>{template.field_count} fields</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          {template.name === "Founder Agreement" ? (
                            <Link href="/agreements/new">
                              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Create
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/dashboard/forms/${template.id}`}>
                              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Create
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No templates available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
