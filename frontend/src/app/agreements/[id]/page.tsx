"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mattersApi, documentsApi } from "@/lib/api";
import type { LegalMatter } from "@/types";

export default function AgreementDetailPage() {
  const params = useParams();
  const matterId = params.id as string;
  const [matter, setMatter] = useState<LegalMatter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (matterId) {
      loadMatter();
    }
  }, [matterId]);

  const loadMatter = async () => {
    try {
      const data = await mattersApi.get(matterId);
      setMatter(data);
    } catch (error) {
      console.error("Failed to load matter:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    setGenerating(true);
    try {
      await documentsApi.generate(matterId);
      await loadMatter();
      alert("Document generation started! You will be notified when it's ready.");
    } catch (error) {
      console.error("Failed to generate document:", error);
      alert("Failed to generate document. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!matter) {
    return <div className="container mx-auto px-4 py-8">Agreement not found</div>;
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    payment_pending: "bg-accent/20 text-accent",
    ai_generating: "bg-primary/20 text-primary",
    lawyer_review: "bg-accent/20 text-accent",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Founder Agreement</h1>
            <p className="text-muted-foreground">Matter ID: {matterId}</p>
          </div>
          <span className={`px-4 py-2 rounded-md text-sm font-semibold ${statusColors[matter.status] || "bg-muted"}`}>
            {matter.status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        <div className="grid gap-6">
          {matter.company && (
            <Card className="shadow-sm">
              <CardHeader className="border-l-4 border-primary">
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {matter.company.name}</p>
                  <p><strong>State:</strong> {matter.company.state}</p>
                  <p><strong>Authorized Capital:</strong> ₹{matter.company.authorized_capital}</p>
                  {matter.company.description && (
                    <p><strong>Description:</strong> {matter.company.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {matter.founders && matter.founders.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="border-l-4 border-accent">
                <CardTitle>Founders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matter.founders.map((founder, index) => (
                    <div key={index} className="border border-border p-6 rounded-lg bg-card shadow-sm">
                      <p><strong>{founder.name}</strong> ({founder.role})</p>
                      <p>Email: {founder.email}</p>
                      <p>Equity: {founder.equity_percentage}%</p>
                      <p>Vesting: {founder.vesting_months} months (Cliff: {founder.cliff_months} months)</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="border-l-4 border-primary">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {matter.status === "draft" && (
                <Button onClick={handleGenerateDocument} disabled={generating}>
                  {generating ? "Generating..." : "Generate Document"}
                </Button>
              )}
              {matter.status === "completed" && (
                <Button onClick={() => {
                  alert("Download functionality coming soon");
                }}>
                  Download Document
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
