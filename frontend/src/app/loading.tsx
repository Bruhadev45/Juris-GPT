import { Scale } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="animate-pulse">
        <Scale className="h-12 w-12 text-primary" />
      </div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}
