"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";

interface Review {
  id: string;
  matter_id: string;
  status: string;
  legal_matters?: {
    id: string;
    status: string;
    companies?: {
      name: string;
    };
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Approve confirmation dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveReviewId, setApproveReviewId] = useState<string | null>(null);

  // Request changes dialog
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const [changesReviewId, setChangesReviewId] = useState<string | null>(null);
  const [changesText, setChangesText] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadReviews = async () => {
    try {
      setError(null);
      const data = await adminApi.getPendingReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (reviewId: string) => {
    setApproveReviewId(reviewId);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!approveReviewId) return;
    setApproveDialogOpen(false);

    try {
      setActionLoading(approveReviewId);
      setError(null);
      await adminApi.approveReview(approveReviewId);
      await loadReviews();
      setSuccessMessage("Document approved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve document.");
    } finally {
      setActionLoading(null);
      setApproveReviewId(null);
    }
  };

  const handleRequestChangesClick = (reviewId: string) => {
    setChangesReviewId(reviewId);
    setChangesText("");
    setChangesDialogOpen(true);
  };

  const handleRequestChangesConfirm = async () => {
    if (!changesReviewId || !changesText.trim()) return;
    setChangesDialogOpen(false);

    try {
      setActionLoading(changesReviewId);
      setError(null);
      await adminApi.requestChanges(changesReviewId, changesText);
      await loadReviews();
      setSuccessMessage("Changes requested successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request changes.");
    } finally {
      setActionLoading(null);
      setChangesReviewId(null);
      setChangesText("");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JurisGPT Admin</span>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pending Reviews</h1>
          <p className="text-muted-foreground">Review and approve Founder Agreements</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {reviews.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">No pending reviews</p>
              <p className="text-sm mt-2">All documents have been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="shadow-sm">
                <CardHeader className="border-l-4 border-accent">
                  <CardTitle>
                    Matter: {review.legal_matters?.companies?.name || review.matter_id}
                  </CardTitle>
                  <CardDescription>
                    Status: {review.legal_matters?.status || review.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Link href={`/admin/reviews/${review.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                    <Button
                      onClick={() => handleApproveClick(review.id)}
                      disabled={actionLoading === review.id}
                    >
                      {actionLoading === review.id ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRequestChangesClick(review.id)}
                      disabled={actionLoading === review.id}
                    >
                      Request Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this document? This action will mark it as reviewed and approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Changes Dialog */}
      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes that need to be made to this document.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={changesText}
            onChange={(e) => setChangesText(e.target.value)}
            placeholder="Enter the changes requested..."
            rows={4}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestChangesConfirm}
              disabled={!changesText.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
