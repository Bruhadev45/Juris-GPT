import { Scale } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse">
          <Scale className="h-10 w-10 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
