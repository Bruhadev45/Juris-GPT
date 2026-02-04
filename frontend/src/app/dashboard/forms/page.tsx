"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, FileCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formTemplates = [
  {
    id: "1",
    name: "Founder Agreement",
    description: "Create legally compliant Founder Agreements with AI assistance",
    category: "Corporate",
    icon: FileText,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "2",
    name: "Employment Contract",
    description: "Standard employment contracts for full-time and part-time employees",
    category: "Employment",
    icon: FileCheck,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "3",
    name: "NDA Template",
    description: "Non-disclosure agreements for protecting confidential information",
    category: "Legal",
    icon: FileText,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "4",
    name: "Service Agreement",
    description: "Service agreements for vendor and client relationships",
    category: "Commercial",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-600",
  },
];

export default function FormsPage() {
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Form Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${template.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="mt-1">{template.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{template.category}</Badge>
                        {template.id === "1" ? (
                          <Link href="/agreements/new">
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                              Create
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" disabled>
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common form-related tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <span className="font-semibold mb-1">View All Templates</span>
                    <span className="text-xs text-muted-foreground">Browse complete library</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <span className="font-semibold mb-1">My Documents</span>
                    <span className="text-xs text-muted-foreground">Access saved forms</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <span className="font-semibold mb-1">Recent Activity</span>
                    <span className="text-xs text-muted-foreground">View recent forms</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
