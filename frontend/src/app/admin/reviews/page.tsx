"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await adminApi.getPendingReviews();
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    if (!confirm("Approve this document?")) return;
    
    try {
      await adminApi.approveReview(reviewId);
      await loadReviews();
      alert("Document approved!");
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve document.");
    }
  };

  const handleRequestChanges = async (reviewId: string) => {
    const changes = prompt("Enter the changes requested:");
    if (!changes) return;

    try {
      await adminApi.requestChanges(reviewId, changes);
      await loadReviews();
      alert("Changes requested!");
    } catch (error) {
      console.error("Failed to request changes:", error);
      alert("Failed to request changes.");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
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
                    <Button onClick={() => handleApprove(review.id)}>
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => handleRequestChanges(review.id)}>
                      Request Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
