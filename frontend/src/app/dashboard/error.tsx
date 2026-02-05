"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Dashboard Error</h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong loading the dashboard. This may be a temporary issue.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={reset} className="bg-primary text-primary-foreground">
              Retry
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
