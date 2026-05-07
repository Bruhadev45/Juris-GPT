"use client";

import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start drafting legally compliant agreements in minutes."
      pitch={{
        kicker: "Trusted by 200+ Indian founders",
        headline:
          "Your legal-ops co-pilot — citation-grounded, lawyer-reviewed, and built for India.",
        quote:
          "We replaced two contractors with JurisGPT for our first 90 days. Same quality, a tenth of the cost, ten times the speed.",
        quoteBy: "Co-founder, fintech early-stage",
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        }
      >
        <SignUp
          path="/signup"
          routing="path"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 bg-transparent p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </Suspense>
    </AuthShell>
  );
}
