"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { useAuth } from "@/contexts/auth-context";

function isStrongPassword(value: string): boolean {
  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("next") || "/dashboard";

  const passwordsMatch = useMemo(
    () => confirmPassword.length > 0 && password === confirmPassword,
    [password, confirmPassword],
  );
  const passwordsMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include an uppercase letter, a number, and a symbol.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        company_name: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
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
        <Label htmlFor="full_name" className="text-[#0A0A0A]">
          Full name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="full_name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={submitting}
            placeholder="Aron Salomon"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#0A0A0A]">
          Work email
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
            placeholder="aron@company.com"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#0A0A0A]">
          Password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          placeholder="Create a strong password"
        />
        <PasswordStrength password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password" className="text-[#0A0A0A]">
          Confirm password
        </Label>
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={submitting}
          placeholder="Re-enter password"
          aria-invalid={passwordsMismatch}
          className={passwordsMismatch ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {passwordsMismatch && (
          <p className="text-xs text-destructive">Passwords do not match.</p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-[#4A6B5C]">Passwords match.</p>
        )}
      </div>

      <details className="group rounded-lg border border-[#E8E2D5] bg-[#FFFFFF]">
        <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm text-[#0A0A0A] flex items-center justify-between">
          <span>Add company details (optional)</span>
          <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
            ▾
          </span>
        </summary>
        <div className="border-t border-[#E8E2D5] p-3.5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-[#0A0A0A]">
              Company name
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="company_name"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={submitting}
                placeholder="Salomon & Co Ltd"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#0A0A0A]">
              Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                placeholder="+91 90000 00000"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </details>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#0A0A0A] hover:bg-[#7B1E2E] text-white transition-colors"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating your account…
          </>
        ) : (
          <>
            Create account <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-[#9A9A9A] leading-relaxed">
        By creating an account you agree to JurisGPT&apos;s{" "}
        <Link href="/terms" className="text-[#0A0A0A] hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#0A0A0A] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#E8E2D5]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#FAF6EF] px-3 text-xs uppercase tracking-wider text-[#9A9A9A]">
            Already a member
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-[#6B6B6B]">
        Have an account?{" "}
        <Link
          className="font-medium text-[#7B1E2E] hover:underline"
          href={`/login${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

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
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
