"use client";

import { useEffect, useState } from "react";
import {
  Gavel,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Building2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";

interface Review {
  id: string;
  matter_id: string;
  status: string;
  created_at?: string;
  legal_matters?: {
    id: string;
    status: string;
    companies?: {
      name: string;
    };
  };
}

function statusConfig(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Pending Review",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300",
        dot: "bg-yellow-500",
      };
    case "approved":
      return {
        label: "Approved",
        icon: CheckCircle2,
        color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300",
        dot: "bg-green-500",
      };
    case "changes_requested":
      return {
        label: "Changes Requested",
        icon: MessageSquare,
        color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
        dot: "bg-orange-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300",
        dot: "bg-red-500",
      };
    default:
      return {
        label: status,
        icon: FileText,
        color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300",
        dot: "bg-gray-500",
      };
  }
}

export default function LawyerReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchReviews() {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPendingReviews();
      setReviews(res.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  async function handleApprove(reviewId: string) {
    try {
      setActionLoading(reviewId);
      await adminApi.approveReview(reviewId);
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve review");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRequestChanges(reviewId: string) {
    try {
      setActionLoading(reviewId);
      await adminApi.requestChanges(reviewId, "Please review and update the document.");
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request changes");
    } finally {
      setActionLoading(null);
    }
  }

  // Summary counts
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const changesCount = reviews.filter((r) => r.status === "changes_requested").length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Lawyer Review</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Submit documents for licensed lawyer review — track status and access professional legal accountability
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/40 p-2.5">
                <Clock className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/40 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/40 p-2.5">
                <MessageSquare className="h-5 w-5 text-orange-700 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{changesCount}</p>
                <p className="text-xs text-muted-foreground">Changes Requested</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading reviews...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Gavel className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-medium text-foreground">No reviews found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Submit documents for licensed lawyer review. They will appear here with status tracking.
              </p>
            </CardContent>
          </Card>

          {/* Lawyer Marketplace Teaser */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Lawyer Marketplace</h3>
                  <span className="text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect with verified lawyers for document reviews, legal opinions, and consultations — combining AI speed with professional legal accountability.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const config = statusConfig(review.status);
              const StatusIcon = config.icon;
              return (
                <Card key={review.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              Review #{review.id.slice(0, 8)}
                            </h3>
                            <Badge variant="outline" className={config.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          {review.legal_matters?.companies?.name && (
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5" />
                              {review.legal_matters.companies.name}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Matter ID: {review.matter_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      {review.status === "pending" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRequestChanges(review.id)}
                            disabled={actionLoading === review.id}
                          >
                            {actionLoading === review.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Request Changes"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            disabled={actionLoading === review.id}
                          >
                            {actionLoading === review.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
