"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ScaleIcon, Sparkles, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  /** Side-panel hero copy. Defaults to a generic line. */
  pitch?: { kicker: string; headline: string; quote: string; quoteBy: string };
}

const DEFAULT_PITCH = {
  kicker: "Built for Indian startups & MSMEs",
  headline:
    "Draft, review, and ship lawyer-quality legal documents in a single afternoon.",
  quote:
    "JurisGPT cut our founder-agreement turnaround from three weeks to two hours — with a real lawyer signing off at the end.",
  quoteBy: "Operations Lead, Series-A SaaS startup",
};

export function AuthShell({ children, title, subtitle, pitch = DEFAULT_PITCH }: AuthShellProps) {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF6EF]">
      {/* Brand panel — hidden on small screens, full-bleed on large */}
      <aside
        aria-hidden
        className="relative hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between p-12 text-[#FAF6EF] overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, #5C1622 0%, #7B1E2E 45%, #4A1018 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FAF6EF" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl bg-[#FAF6EF]/10 p-2 backdrop-blur-sm ring-1 ring-[#FAF6EF]/15">
            <ScaleIcon className="h-5 w-5" />
          </div>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-spectral), Georgia, serif" }}
          >
            JurisGPT
          </span>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#B8884D]">
              {pitch.kicker}
            </p>
            <h2
              className="text-3xl xl:text-4xl font-semibold leading-tight"
              style={{ fontFamily: "var(--font-spectral), Georgia, serif" }}
            >
              {pitch.headline}
            </h2>
          </div>

          <ul className="space-y-3 text-sm text-[#FAF6EF]/85">
            <li className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 mt-0.5 text-[#B8884D] flex-shrink-0" />
              <span>AI-drafted Founder, NDA, and ESOP agreements grounded in Indian statute.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-[#B8884D] flex-shrink-0" />
              <span>Lawyer review on every document before it leaves the platform.</span>
            </li>
            <li className="flex items-start gap-3">
              <ScaleIcon className="h-4 w-4 mt-0.5 text-[#B8884D] flex-shrink-0" />
              <span>Citation-grounded answers from the Companies Act, Contract Act, and 8+ statutes.</span>
            </li>
          </ul>

          <figure className="border-l-2 border-[#B8884D] pl-4">
            <blockquote className="text-sm italic text-[#FAF6EF]/90 leading-relaxed">
              &ldquo;{pitch.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs text-[#FAF6EF]/60">— {pitch.quoteBy}</figcaption>
          </figure>
        </div>

        <p className="relative z-10 text-xs text-[#FAF6EF]/55">
          © {new Date().getFullYear()} JurisGPT · DPDPA-compliant
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Image src="/logo.png" alt="JurisGPT" width={28} height={28} className="rounded" />
            <span
              className="text-base font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "var(--font-spectral), Georgia, serif" }}
            >
              JurisGPT
            </span>
          </Link>
        </header>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 lg:px-10 pb-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-2">
              <h1
                className="text-3xl font-semibold text-[#0A0A0A] tracking-tight"
                style={{ fontFamily: "var(--font-spectral), Georgia, serif" }}
              >
                {title}
              </h1>
              <p className="text-sm text-[#6B6B6B]">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
