"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  FolderOpen,
  ClipboardList,
  FileSignature,
  ScrollText,
  ArrowRight,
  Clock,
  IndianRupee,
  FormInput,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { templatesApi, type Template } from "@/lib/api";

const quickActions = [
  {
    title: "New Agreement",
    description: "Create a founder agreement with our step-by-step wizard",
    icon: FileSignature,
    href: "/agreements/new",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Legal Forms",
    description: "Generate documents from pre-built legal templates",
    icon: ClipboardList,
    href: "/dashboard/forms",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    title: "RTI Application",
    description: "Draft a Right to Information application",
    icon: ScrollText,
    href: "/dashboard/rti",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
];

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

export default function DocumentsPage() {
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create legal documents using AI templates and wizards — manage finalized and in-progress paperwork
            </p>
          </div>
          <Link href="/agreements/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Agreement
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="group hover:shadow-md transition-all cursor-pointer border-border hover:border-primary/30">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-2.5 ${action.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Templates */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Document Templates
            </h2>
            <Link href="/dashboard/forms">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Loading templates...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.slice(0, 6).map((template) => (
                <Link
                  key={template.id}
                  href={
                    template.id === "founder-agreement"
                      ? "/agreements/new"
                      : `/dashboard/forms/${template.id}`
                  }
                >
                  <Card className="group hover:shadow-md transition-all cursor-pointer border-border hover:border-primary/30 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={categoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.estimated_time && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.estimated_time}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm line-clamp-2">
                        {template.description}
                      </CardDescription>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {template.price !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <IndianRupee className="h-3 w-3" />
                            {template.price === 0 ? "Free" : template.price}
                          </span>
                        )}
                        {template.fields_count !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <FormInput className="h-3 w-3" />
                            {template.fields_count} fields
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Documents Placeholder */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Recent Documents
          </h2>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-medium text-foreground">No recent documents</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Documents you generate will appear here. Start by creating a new agreement or using a template.
              </p>
              <Link href="/agreements/new" className="mt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
