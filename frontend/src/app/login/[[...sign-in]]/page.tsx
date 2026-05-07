"use client";

import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to JurisGPT to continue your legal research."
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        }
      >
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
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
