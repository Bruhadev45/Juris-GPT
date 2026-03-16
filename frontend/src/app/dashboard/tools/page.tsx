"use client";

import Link from "next/link";
import {
  Calculator,
  Newspaper,
  ScrollText,
  FolderOpen,
  CalendarDays,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    title: "Legal Calculator",
    description: "Calculate stamp duty, court fees, GST, TDS, gratuity, and EMI with state-wise rates and detailed breakdowns.",
    icon: Calculator,
    href: "/dashboard/calculator",
    color: "bg-primary/10 text-primary",
    badge: "6 Calculators",
  },
  {
    title: "RTI Assistant",
    description: "Generate Right to Information applications with a step-by-step wizard. Supports 16 government departments.",
    icon: ScrollText,
    href: "/dashboard/rti",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    badge: "AI Powered",
  },
  {
    title: "Legal News",
    description: "Stay updated with the latest legal developments across Supreme Court, High Courts, SEBI, RBI, and more.",
    icon: Newspaper,
    href: "/dashboard/news",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    badge: "Live Feed",
  },
  {
    title: "Case Law Browser",
    description: "Search and browse Indian court judgments with detailed case summaries, citations, and legal principles.",
    icon: BookOpen,
    href: "/dashboard/cases",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    badge: "16M+ Judgments",
  },
  {
    title: "Compliance Calendar",
    description: "Visual calendar view of all upcoming compliance deadlines with automated reminders and penalty alerts.",
    icon: CalendarDays,
    href: "/dashboard/calendar",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    badge: "Calendar View",
  },
  {
    title: "Document Vault",
    description: "Securely store, organize, and manage your legal documents with categories, tags, and quick access.",
    icon: FolderOpen,
    href: "/dashboard/vault",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    badge: "Encrypted",
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quick task-based utilities that support legal decision-making
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="group hover:shadow-md transition-all cursor-pointer border-border hover:border-primary/30 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`rounded-lg p-2.5 ${tool.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {tool.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors mt-3">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed">
                      {tool.description}
                    </CardDescription>
                    <div className="flex items-center gap-1.5 mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Tool <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed border-border/60 opacity-70">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-lg bg-muted p-2.5 flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Clause Library</h3>
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Planned</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pre-built legal clause templates you can drag-and-drop into documents.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed border-border/60 opacity-70">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-lg bg-muted p-2.5 flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Negotiation Assistant</h3>
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Planned</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered negotiation suggestions and counter-clause recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="mt-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Need help choosing?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Not sure which tool to use? Ask the{" "}
                  <Link href="/dashboard/chat" className="text-primary hover:underline font-medium">
                    AI Lawyer
                  </Link>{" "}
                  and it will guide you to the right tool for your legal task.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
