"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuth } from "@/contexts/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("next") || "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#0A0A0A]">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="you@company.com"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[#0A0A0A]">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#7B1E2E] hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#0A0A0A] hover:bg-[#7B1E2E] text-white transition-colors"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing you in…
          </>
        ) : (
          <>
            Sign in <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#E8E2D5]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#FAF6EF] px-3 text-xs uppercase tracking-wider text-[#9A9A9A]">
            New here
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-[#6B6B6B]">
        Don&apos;t have an account yet?{" "}
        <Link
          className="font-medium text-[#7B1E2E] hover:underline"
          href={`/signup${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`}
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

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
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
