"use client";

import { useState } from "react";
import { FileText, Upload, CheckCircle, AlertTriangle, Clock, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const reviews = [
  {
    id: "1",
    document: "NDA_v3.2_Draft.pdf",
    status: "Completed",
    reviewedBy: "Anna K.",
    reviewedAt: "2025-02-03",
    issues: 2,
    suggestions: 5,
  },
  {
    id: "2",
    document: "Employment_Contract.docx",
    status: "In Review",
    reviewedBy: "John D.",
    reviewedAt: "2025-02-04",
    issues: 0,
    suggestions: 0,
  },
  {
    id: "3",
    document: "Partnership_Agreement.pdf",
    status: "Pending",
    reviewedBy: null,
    reviewedAt: null,
    issues: 0,
    suggestions: 0,
  },
];

export default function ReviewPage() {
  const [dragActive, setDragActive] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Smart Review</h1>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Upload Area */}
            <Card className="shadow-sm border-border border-dashed">
              <CardContent className="p-12">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload Document for Review
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your document here or click to browse
                  </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Select File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports PDF, DOCX, DOC (Max 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Reviews</h2>
              {reviews.map((review) => (
                <Card key={review.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">{review.document}</h3>
                          <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                        </div>
                        {review.status === "In Review" && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Review Progress</span>
                              <span className="text-foreground font-medium">65%</span>
                            </div>
                            <Progress value={65} className="h-2" />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {review.reviewedBy && (
                            <div className="flex items-center gap-2">
                              <span>Reviewed by: {review.reviewedBy}</span>
                            </div>
                          )}
                          {review.reviewedAt && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{review.reviewedAt}</span>
                            </div>
                          )}
                          {review.status === "Completed" && (
                            <>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span>{review.issues} issues found</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>{review.suggestions} suggestions</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.status === "Completed" && (
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
