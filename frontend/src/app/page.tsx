"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  cream: "#FAF6EF",
  paper: "#FFFFFF",
  warmGray: "#F4EFE5",
  ink: "#0A0A0A",
  inkSoft: "#1A1A1A",
  textSub: "#6B6B6B",
  textMuted: "#9A9A9A",
  border: "#E8E2D5",
  borderSoft: "#F0EBE0",
  burgundy: "#7B1E2E",
  burgundyDark: "#5C1622",
  gold: "#B8884D",
  goldPale: "#F5EBD8",
  sage: "#4A6B5C",
  sagePale: "#E8EFE9",
};

type InViewOptions = { threshold?: number };

// Detect users who have asked for reduced motion (system setting or low-end
// device default). When true, every fade/slide animation should bypass the
// IntersectionObserver and start in its final state so content is never
// hidden behind an animation that does not play.
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useInView({ threshold = 0.2 }: InViewOptions = {}) {
  const ref = useRef<HTMLDivElement | HTMLElement | null>(null);
  // If the user prefers reduced motion (or we cannot create an
  // IntersectionObserver), start in-view so content is immediately visible.
  const [inView, setInView] = useState(() => {
    if (typeof window === "undefined") return false;
    if (prefersReducedMotion()) return true;
    if (typeof IntersectionObserver === "undefined") return true;
    return false;
  });

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, inView]);

  return [ref, inView] as const;
}

function useTypingEffect(texts: string[], speed = 60, pause = 2500) {
  const [display, setDisplay] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  // If the user prefers reduced motion, show the first prompt immediately
  // and stop the cycle — nobody wants a typewriter against their wishes.
  useEffect(() => {
    if (typeof window !== "undefined" && prefersReducedMotion() && texts.length > 0) {
      setDisplay(texts[0]);
      setPaused(true);
    }
  }, [texts]);

  useEffect(() => {
    if (paused) return;
    const current = texts[textIndex];
    const timer = window.setTimeout(
      () => {
        if (!deleting) {
          if (charIndex < current.length) {
            setDisplay(current.slice(0, charIndex + 1));
            setCharIndex((value) => value + 1);
          } else {
            setPaused(true);
            window.setTimeout(() => {
              setPaused(false);
              setDeleting(true);
            }, pause);
          }
        } else if (charIndex > 0) {
          setDisplay(current.slice(0, charIndex - 1));
          setCharIndex((value) => value - 1);
        } else {
          setDeleting(false);
          setTextIndex((value) => (value + 1) % texts.length);
        }
      },
      deleting ? speed * 0.4 : speed
    );
    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, pause, paused, speed, textIndex, texts]);

  return display;
}

function Counter({ value, suffix, decimals = 0, active }: { value: number; suffix: string; decimals?: number; active: boolean }) {
  // Start at the final value when reduced motion is requested or before
  // the IntersectionObserver fires — never flash "0" to a real visitor.
  const [current, setCurrent] = useState(() =>
    typeof window !== "undefined" && prefersReducedMotion() ? value : 0,
  );

  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && prefersReducedMotion()) {
      setCurrent(value);
      return;
    }
    let frame = 0;
    const totalFrames = 80;
    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, value]);

  return (
    <>
      {decimals ? current.toFixed(decimals) : Math.floor(current)}
      <span style={{ color: C.burgundy, fontWeight: 600 }}>{suffix}</span>
    </>
  );
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" fill={C.cream} />
        <path d="M9 12l2 2 4-4" stroke={C.burgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SectionLabel({ num, children, color = C.burgundy }: { num: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color, fontWeight: 700, letterSpacing: "0.08em" }}>{num}</span>
      <span style={{ width: 24, height: 1, background: color, opacity: 0.5 }} />
      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textSub, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

function Nav({ onOpenApp }: { onOpenApp: () => void }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  void onOpenApp; // kept for backwards-compat; nav now routes to auth pages

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="lp-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(250,246,239,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all 200ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo />
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: C.ink }}>JurisGPT</span>
      </div>
      <div className="lp-nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {[
          { label: "What you can ask", href: "#features" },
          { label: "How it works", href: "#how" },
          { label: "FAQ", href: "#faq" },
        ].map((item) => (
          <a key={item.label} href={item.href} style={{ color: C.inkSoft, fontSize: 13.5, textDecoration: "none", fontWeight: 500, opacity: 0.75 }}>
            {item.label}
          </a>
        ))}
      </div>
      <div className="lp-nav-buttons" style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => router.push("/login")} className="lp-signin-btn" style={{ padding: "7px 14px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: C.inkSoft, fontWeight: 500, whiteSpace: "nowrap" }}>
          Sign in
        </button>
        <button className="lp-dark-button" onClick={() => router.push("/signup")} style={{ padding: "8px 18px", background: C.burgundy, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: C.cream, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(92, 22, 34, 0.3)" }}>
          <span className="lp-btn-text">Sign up</span>
        </button>
      </div>
    </nav>
  );
}

function GridBG() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          opacity: 0.45,
        }}
      />
    </div>
  );
}

function HeroIllustration() {
  const backLineWidths = [190, 160, 210, 150, 185, 130, 205, 170, 150, 195, 135, 180, 145, 160];
  return (
    <svg viewBox="0 0 480 400" style={{ width: "100%", height: "auto" }}>
      <defs>
        <filter id="lp-ds1" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.06" />
        </filter>
        <filter id="lp-ds2" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
        </filter>
        <pattern id="lp-grain" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#0A0A0A" opacity="0.04" />
        </pattern>
      </defs>
      <g filter="url(#lp-ds1)" transform="rotate(-4 240 200) translate(60 50)">
        <rect width="280" height="320" rx="3" fill={C.paper} stroke={C.border} />
        <rect width="280" height="6" fill={C.burgundy} />
        <rect x="20" y="32" width="160" height="10" fill={C.ink} rx="1" />
        <rect x="20" y="50" width="100" height="6" fill={C.textMuted} rx="1" />
        {[68, 80, 92, 104, 116, 128, 150, 162, 174, 186, 198, 220, 232, 244].map((y, i) => (
          <rect key={y} x="20" y={y} width={backLineWidths[i]} height="3" fill="#D4CDB9" rx="1" />
        ))}
        <rect x="20" y="270" width="80" height="22" rx="3" fill={C.goldPale} stroke={C.gold} strokeOpacity="0.4" />
        <text x="60" y="285" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="9" fill={C.gold} fontWeight="700">
          § 185.2
        </text>
      </g>
      <g filter="url(#lp-ds2)" transform="rotate(3 240 200) translate(140 70)">
        <rect width="260" height="290" rx="3" fill={C.paper} stroke={C.border} />
        <rect width="260" height="36" fill={C.warmGray} />
        <text x="14" y="23" fontFamily="var(--font-jetbrains-mono)" fontSize="9" fill={C.textSub} fontWeight="700" letterSpacing="1">
          JURISGPT_QUERY.001
        </text>
        <circle cx="240" cy="18" r="3" fill={C.sage} />
        <rect x="14" y="54" width="232" height="42" rx="4" fill={C.warmGray} />
        <rect x="22" y="62" width="14" height="14" rx="2" fill={C.ink} />
        <text x="42" y="72" fontFamily="var(--font-inter)" fontSize="9" fill={C.ink} fontWeight="600">
          Section 56(2)(viib) applicability?
        </text>
        <rect x="42" y="79" width="180" height="2" fill={C.textMuted} rx="1" />
        <rect x="42" y="84" width="140" height="2" fill={C.textMuted} rx="1" />
        <rect x="14" y="106" width="232" height="120" rx="4" fill={C.paper} stroke={C.borderSoft} />
        <circle cx="26" cy="120" r="6" fill={C.burgundy} />
        <rect x="38" y="116" width="80" height="3" fill={C.ink} rx="1" />
        {[135, 143, 151, 159, 167].map((y, i) => (
          <rect key={y} x="22" y={y} width={[216, 200, 190, 170, 100][i]} height="2" fill="#3A3A3A" rx="1" />
        ))}
        <rect x="22" y="185" width="60" height="16" rx="8" fill={C.goldPale} />
        <text x="52" y="196" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.gold} fontWeight="700">
          §56(2)(viib)
        </text>
        <rect x="86" y="185" width="56" height="16" rx="8" fill={C.sagePale} />
        <text x="114" y="196" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.sage} fontWeight="700">
          Rule 11UA
        </text>
        <rect x="146" y="185" width="48" height="16" rx="8" fill="#FCE8EA" />
        <text x="170" y="196" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.burgundy} fontWeight="700">
          CIT v. ABC
        </text>
        <rect x="22" y="212" width="160" height="2" fill="#D4CDB9" rx="1" />
        <rect x="14" y="240" width="232" height="34" rx="4" fill={C.ink} />
        <text x="130" y="261" textAnchor="middle" fontFamily="var(--font-inter)" fontSize="10" fill={C.cream} fontWeight="600">
          Continue research →
        </text>
      </g>
      <g transform="translate(20 290) rotate(-6)">
        <rect width="120" height="58" rx="4" fill={C.paper} stroke={C.border} filter="url(#lp-ds2)" />
        <rect width="3" height="58" fill={C.burgundy} />
        <text x="10" y="16" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.textSub} fontWeight="700">
          CONFIDENCE
        </text>
        <text x="10" y="36" fontFamily="var(--font-inter)" fontSize="18" fill={C.ink} fontWeight="700">
          97.2%
        </text>
        <rect x="10" y="44" width="100" height="3" rx="1.5" fill={C.borderSoft} />
        <rect x="10" y="44" width="97" height="3" rx="1.5" fill={C.sage} />
      </g>
      <g transform="translate(380 320) rotate(8)">
        <rect width="90" height="46" rx="4" fill={C.paper} stroke={C.border} filter="url(#lp-ds2)" />
        <text x="8" y="16" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.gold} fontWeight="700">
          RESPONSE
        </text>
        <text x="8" y="36" fontFamily="var(--font-inter)" fontSize="14" fill={C.ink} fontWeight="700">
          1.4s
        </text>
      </g>
      <rect width="480" height="400" fill="url(#lp-grain)" />
    </svg>
  );
}

function HeroChatPreview() {
  // A real-feeling chat exchange: user question on the right, JurisGPT
  // answer on the left with inline numbered citations and supporting
  // evidence chips. Friendlier than an abstract dashboard mockup.
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: "0 24px 48px -16px rgba(10,10,10,0.12)",
        overflow: "hidden",
        maxWidth: 520,
        margin: "0 auto",
      }}
      role="img"
      aria-label="Example JurisGPT chat — a founder asks about ESOPs and JurisGPT replies with citations"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, background: C.warmGray }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 5, background: C.ink }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" fill={C.cream} />
              <path d="M9 12l2 2 4-4" stroke={C.burgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>JurisGPT</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.sage, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }} />
            online
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: C.textMuted, letterSpacing: "0.06em" }}>
          NEW CHAT
        </div>
      </div>

      <div style={{ padding: "20px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* User message */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: "82%", background: C.ink, color: C.cream, padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5 }}>
            Can our startup issue ESOPs to consultants, not just employees?
          </div>
        </div>

        {/* JurisGPT reply */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: C.burgundy, display: "flex", alignItems: "center", justifyContent: "center", color: C.cream, fontSize: 11, fontWeight: 700 }}>JG</div>
          <div style={{ flex: 1, background: C.warmGray, padding: "12px 14px", borderRadius: "4px 16px 16px 16px", fontSize: 14, lineHeight: 1.6, color: C.inkSoft }}>
            <div style={{ marginBottom: 10 }}>
              No — under <strong>Section 62(1)(b) of the Companies Act, 2013</strong> read with{" "}
              <strong>Rule 12 of the Companies (Share Capital and Debentures) Rules, 2014</strong>, ESOPs can be granted only to permanent employees, directors, or employees of subsidiaries{" "}
              <span style={{ display: "inline-block", padding: "1px 6px", marginLeft: 2, borderRadius: 4, background: C.goldPale, color: C.gold, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700, verticalAlign: "1px" }}>1</span>{" "}
              <span style={{ display: "inline-block", padding: "1px 6px", marginLeft: 2, borderRadius: 4, background: C.goldPale, color: C.gold, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700, verticalAlign: "1px" }}>2</span>.
            </div>
            <div style={{ fontSize: 13, color: C.textSub }}>
              For consultants, consider <strong>Sweat Equity Shares (Section 54)</strong> or a <strong>SAR/Phantom Stock plan</strong>, neither of which require employment status.
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.borderSoft}`, display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: C.paper, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", color: C.inkSoft, fontWeight: 600 }}>
                <span style={{ color: C.gold }}>[1]</span> Companies Act §62(1)(b)
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: C.paper, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", color: C.inkSoft, fontWeight: 600 }}>
                <span style={{ color: C.gold }}>[2]</span> Rule 12 SCAD Rules
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: C.sagePale, border: `1px solid ${C.sage}`, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", color: C.sage, fontWeight: 700 }}>
                97% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Suggested follow-up chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", width: "100%" }}>
            Try a follow-up
          </span>
          {["Draft an ESOP plan", "Compare ESOP vs Sweat Equity", "Tax impact for the consultant"].map((q) => (
            <span key={q} style={{ padding: "6px 11px", borderRadius: 999, background: C.paper, border: `1px solid ${C.border}`, fontSize: 12, color: C.inkSoft, cursor: "pointer" }}>
              {q}
            </span>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.borderSoft}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.warmGray, fontSize: 11.5, color: C.textSub }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.06em" }}>SOURCES VERIFIED · 1.4s</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, color: C.inkSoft }}>Reply</span>
          <span aria-hidden style={{ display: "inline-block", padding: "2px 6px", border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, fontWeight: 700 }}>↵</span>
        </span>
      </div>
    </div>
  );
}

function Hero({ onOpenApp }: { onOpenApp: () => void }) {
  // Friendly, chat-first prompt examples — phrased the way a founder
  // would actually type them, not the way a litigator would draft them.
  const typed = useTypingEffect(
    [
      "Can a foreign investor subscribe to our CCDs?",
      "Is a non-compete enforceable on a co-founder in India?",
      "What does Section 7 of the Companies Act say?",
      "Walk me through GST registration for a SaaS startup",
    ],
    55,
    2200,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "110px 40px 60px", background: C.cream, overflow: "hidden" }}>
      <GridBG />
      <div className="lp-hero-grid" style={{ maxWidth: 1240, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 72, alignItems: "center", position: "relative", zIndex: 1 }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 600ms cubic-bezier(0.25,0.1,0.25,1)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 100, marginBottom: 28, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.sage }} />
            <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>The friendly legal chat for Indian founders</span>
          </div>
          <h1 style={{ fontSize: "clamp(40px,5vw,64px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.04, color: C.ink, marginBottom: 22 }}>
            Talk to a lawyer that
            <br />
            actually reads the{" "}
            <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>Indian</em>
            <br />
            statute book.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: C.textSub, marginBottom: 28, maxWidth: 480 }}>
            JurisGPT is a chat assistant for Indian law. Ask anything — incorporation, contracts, GST, founder agreements, compliance — and get a plain-English answer with the exact section, judgment, or circular it came from.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "8px 8px 8px 18px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 14, maxWidth: 560, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: 12 }} aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={C.burgundy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ flex: 1, fontSize: 14.5, color: C.ink, lineHeight: 1.4 }}>
              {typed}
              <span style={{ display: "inline-block", width: 2, height: 16, background: C.ink, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
            </span>
            <button onClick={onOpenApp} aria-label="Open the chat and ask a question" style={{ padding: "10px 18px", background: C.burgundy, color: C.cream, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(92, 22, 34, 0.3)" }}>
              Start chatting <span aria-hidden style={{ fontSize: 12, opacity: 0.85 }}>→</span>
            </button>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 36, fontSize: 13, color: C.textSub, flexWrap: "wrap" }}>
            <span>Replies in ~2 seconds</span>
            <span style={{ color: C.border }}>·</span>
            <span>Every claim cited</span>
            <span style={{ color: C.border }}>·</span>
            <span>Built for Indian law</span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Built with Indian legal practitioners
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: C.textSub }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }} />
                Reviewed against primary sources
              </span>
              <span style={{ width: 1, height: 14, background: C.border }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
                DPDP Act 2023 ready
              </span>
              <span style={{ width: 1, height: 14, background: C.border }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.burgundy }} />
                Indian-law focused
              </span>
            </div>
          </div>
        </div>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: "all 800ms cubic-bezier(0.25,0.1,0.25,1) 200ms" }}>
          <HeroChatPreview />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const [ref, inView] = useInView({ threshold: 0.3 });
  // We deliberately do not advertise a customer count until we have a
  // verifiable number. The fourth stat reports a measurable system metric
  // instead — Recall@5 from the 120-query benchmark in research/PAPER.md.
  const stats = [
    { value: 47, suffix: "K+", label: "Documents indexed", sub: "Statutes, judgments & clauses" },
    { value: 95, suffix: "%", label: "Citation accuracy", sub: "Verified against primary source" },
    { value: 1.4, suffix: "s", label: "Avg. response", sub: "From query to first token", decimals: 1 },
    { value: 68, suffix: "%", label: "Recall@5", sub: "120-query benchmark · BM25 hybrid" },
  ];
  const burgundyDivider = "rgba(184,136,77,0.22)"; // gold @ low alpha for divider
  return (
    <section
      ref={ref}
      style={{
        background:
          "radial-gradient(120% 80% at 0% 0%, #5C1622 0%, #7B1E2E 45%, #4A1018 100%)",
        padding: "0 40px",
        marginTop: 40,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div
          className="lp-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderLeft: `1px solid ${burgundyDivider}`,
            borderRight: `1px solid ${burgundyDivider}`,
            borderTop: `1px solid ${burgundyDivider}`,
            borderBottom: `1px solid ${burgundyDivider}`,
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "44px 32px",
                borderRight: i < 3 ? `1px solid ${burgundyDivider}` : "none",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `all 600ms cubic-bezier(0.25,0.1,0.25,1) ${i * 80}ms`,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 11,
                  color: C.gold,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  marginBottom: 18,
                }}
              >
                {String(i + 1).padStart(2, "0")} —
              </div>
              <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: C.cream }}>
                <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} active={inView} />
              </div>
              <div style={{ fontSize: 14, color: C.cream, fontWeight: 600, marginTop: 14 }}>{stat.label}</div>
              <div style={{ fontSize: 13, color: "rgba(250,246,239,0.7)", marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceIcon({ kind, color }: { kind: string; color: string }) {
  if (kind === "chat") {
    return (
      <svg width="80" height="56" viewBox="0 0 80 56">
        <rect x="6" y="8" width="44" height="32" rx="3" fill={C.paper} stroke={C.border} />
        <rect x="12" y="14" width="20" height="3" rx="1" fill={C.ink} />
        <rect x="12" y="20" width="32" height="2" rx="1" fill={C.textMuted} />
        <rect x="12" y="25" width="28" height="2" rx="1" fill={C.textMuted} />
        <rect x="32" y="32" width="44" height="20" rx="3" fill={color} fillOpacity="0.15" stroke={color} />
        <rect x="38" y="38" width="14" height="3" rx="1" fill={color} />
        <rect x="38" y="44" width="32" height="2" rx="1" fill={color} fillOpacity="0.6" />
      </svg>
    );
  }
  if (kind === "draft") {
    return (
      <svg width="80" height="56" viewBox="0 0 80 56">
        <rect x="14" y="6" width="38" height="46" rx="2" fill={C.paper} stroke={C.border} />
        <rect x="20" y="12" width="26" height="3" fill={color} />
        {[18, 24, 28, 32, 36].map((y, i) => <rect key={y} x="20" y={y} width={[20, 26, 22, 26, 18][i]} height="1.5" fill={C.textMuted} opacity="0.6" />)}
        <rect x="46" y="20" width="22" height="28" rx="2" fill={color} fillOpacity="0.1" stroke={color} strokeOpacity="0.3" strokeDasharray="2 2" />
        <text x="57" y="36" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="14" fill={color} fontWeight="700">+</text>
      </svg>
    );
  }
  if (kind === "calendar") {
    return (
      <svg width="80" height="56" viewBox="0 0 80 56">
        <rect x="14" y="10" width="52" height="40" rx="3" fill={C.paper} stroke={C.border} />
        <rect x="14" y="10" width="52" height="8" fill={color} fillOpacity="0.85" />
        {Array.from({ length: 15 }).map((_, i) => <rect key={i} x={18 + (i % 5) * 9.5} y={22 + Math.floor(i / 5) * 9} width="6" height="6" rx="1" fill={i === 7 ? color : C.warmGray} />)}
        <circle cx="55" cy="32" r="6" fill={color} />
        <text x="55" y="35" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={C.cream} fontWeight="700">!</text>
      </svg>
    );
  }
  if (kind === "analyze") {
    return (
      <svg width="80" height="56" viewBox="0 0 80 56">
        <rect x="10" y="6" width="36" height="44" rx="2" fill={C.paper} stroke={C.border} />
        {[12, 18, 24, 30, 36, 42].map((y, i) => <rect key={y} x="14" y={y} width={28 - (i % 2) * 6} height="2" rx="1" fill={C.textMuted} opacity="0.6" />)}
        <rect x="40" y="22" width="36" height="22" rx="2" fill={color} fillOpacity="0.1" stroke={color} />
        <path d="M44 38 L48 32 L52 36 L58 28 L64 33 L70 26 L72 26" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="70" cy="26" r="2" fill={color} />
      </svg>
    );
  }
  if (kind === "search") {
    return (
      <svg width="80" height="56" viewBox="0 0 80 56">
        <circle cx="34" cy="26" r="14" fill={C.paper} stroke={color} strokeWidth="2" />
        <line x1="44" y1="36" x2="56" y2="48" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <rect x="26" y="20" width="16" height="2" rx="1" fill={C.ink} />
        <rect x="26" y="25" width="12" height="1.5" rx="1" fill={C.textMuted} />
        <rect x="26" y="29" width="14" height="1.5" rx="1" fill={C.textMuted} />
      </svg>
    );
  }
  return (
    <svg width="80" height="56" viewBox="0 0 80 56">
      <rect x="12" y="8" width="40" height="40" rx="2" fill={C.paper} stroke={C.border} />
      <rect x="16" y="14" width="16" height="3" fill={C.ink} />
      <rect x="16" y="20" width="32" height="1.5" fill={C.textMuted} />
      <rect x="16" y="24" width="28" height="1.5" fill={C.textMuted} />
      <rect x="16" y="32" width="14" height="10" rx="1" fill={color} fillOpacity="0.2" />
      <text x="23" y="39" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill={color} fontWeight="700">RTI</text>
      <path d="M52 28 L68 28 L66 24 M68 28 L66 32" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServicesGrid() {
  const [ref, inView] = useInView({ threshold: 0.1 });
  // Reframed from "six tools" to "what people actually ask JurisGPT".
  // Each card is a real, friendly question grouped by category — the chat
  // is the product, the categories are just signposts.
  const askGroups: { tag: string; color: string; question: string; sub: string }[] = [
    {
      tag: "STARTUP",
      color: C.burgundy,
      question: "Can a foreign fund subscribe to our CCDs?",
      sub: "FEMA, Press Note 3, sectoral caps — explained step by step.",
    },
    {
      tag: "CONTRACTS",
      color: C.gold,
      question: "Draft an NDA for a SaaS vendor.",
      sub: "Indian-law clauses, jurisdiction, IP carve-outs. Edit then export.",
    },
    {
      tag: "COMPLIANCE",
      color: C.sage,
      question: "Did we miss any MCA filings this quarter?",
      sub: "ROC, GST, TDS, PF/ESI — JurisGPT pulls every applicable due date.",
    },
    {
      tag: "EMPLOYMENT",
      color: "#5C7A8A",
      question: "Is a non-compete enforceable on a co-founder?",
      sub: "Section 27 of the Contract Act + the case law that narrowed it.",
    },
    {
      tag: "CASE LAW",
      color: C.burgundy,
      question: "Find Supreme Court rulings on share buy-back limits.",
      sub: "Semantic search across 16M+ judgments with the holding extracted.",
    },
    {
      tag: "FILING",
      color: C.gold,
      question: "Help me draft an RTI application.",
      sub: "Template, jurisdiction, fee, and reply timeline — done in one chat.",
    },
  ];
  return (
    <section id="features" ref={ref} style={{ padding: "80px 40px", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="lp-section-header" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, marginBottom: 48, alignItems: "end" }}>
          <div>
            <SectionLabel num="§ 01">What you can ask</SectionLabel>
            <h2 style={{ fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.05 }}>
              Ask{" "}
              <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>anything.</em>
              <br />
              In plain English.
            </h2>
          </div>
          <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.65, maxWidth: 520, justifySelf: "end" }}>
            JurisGPT is one chat box, not a maze of dashboards. Type your question the way you&apos;d ask a friend who happens to be a lawyer. Below are real prompts — tap one to start.
          </p>
        </div>
        <div className="lp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {askGroups.map((group, i) => (
            <button
              key={group.question}
              type="button"
              className="lp-service-card"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/dashboard/chat";
              }}
              style={{
                textAlign: "left",
                font: "inherit",
                cursor: "pointer",
                padding: "26px 26px 22px",
                background: C.paper,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 500ms ease ${i * 70}ms, transform 200ms ease, border-color 150ms, box-shadow 150ms`,
                boxShadow: "0 1px 2px rgba(10,10,10,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: group.color, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px", border: `1px solid ${group.color}`, borderRadius: 4, opacity: 0.85 }}>
                  {group.tag}
                </span>
                <span aria-hidden style={{ fontSize: 13, color: C.textMuted, fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700 }}>
                  ↵
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                &ldquo;{group.question}&rdquo;
              </div>
              <div style={{ fontSize: 13.5, color: C.textSub, lineHeight: 1.6 }}>
                {group.sub}
              </div>
              <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600, color: group.color, display: "inline-flex", alignItems: "center", gap: 6 }}>
                Ask in chat <span aria-hidden>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const steps = [
    { num: "01", title: "Ask in plain English", desc: "Type your question naturally. No legal jargon required — JurisGPT understands context, even in Hinglish.", code: "> Can a foreign fund subscribe to CCDs in our Series A?" },
    { num: "02", title: "JurisGPT reads the source", desc: "In under 2 seconds, JurisGPT pulls the relevant statutes, RBI circulars, SEBI regs, and case law.", code: "reading 47K Indian-law documents..." },
    { num: "03", title: "Get a cited answer", desc: "Numbered citations link to the exact section or paragraph. A confidence label on every reply.", code: 'cite: ["FEMA §6(3)(b)", "Press Note 3"]' },
    { num: "04", title: "Act with confidence", desc: "Generate a memo, draft a clause, or share with your team. Every answer is auditable.", code: 'export.memo({ format: "PDF" }) → ✓' },
  ];
  return (
    <section id="how" ref={ref} style={{ padding: "80px 40px", background: C.warmGray, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ marginBottom: 64, maxWidth: 720 }}>
          <SectionLabel num="§ 02" color={C.gold}>Workflow</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.05 }}>
            From question to citation,
            <br />
            <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>in four steps.</em>
          </h2>
        </div>
        <div className="lp-step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{ padding: "32px 28px", background: C.paper, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 600ms ease ${i * 100}ms` }}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 36, fontWeight: 700, color: C.burgundy, lineHeight: 1, marginBottom: 24, letterSpacing: "-0.02em" }}>{step.num}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 10, letterSpacing: "-0.01em" }}>{step.title}</div>
              <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6, marginBottom: 18 }}>{step.desc}</div>
              <div style={{ padding: "8px 10px", background: C.warmGray, border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.inkSoft, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{step.code}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonTable() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const rows = [
    ["Indian legal domain expertise", "partial", "no", "yes"],
    ["Citations on every answer", "partial", "no", "yes"],
    ["Confidence scoring", "no", "no", "yes"],
    ["Sub-2 second response", "no", "yes", "yes"],
    ["Companies Act + FEMA + GST", "partial", "no", "yes"],
    ["24/7 availability", "no", "yes", "yes"],
  ];
  const cell = (value: string, highlight = false) => {
    const styles: Record<string, { bg: string; fg: string; label: string }> = {
      yes: { bg: highlight ? C.ink : C.sagePale, fg: highlight ? C.cream : C.sage, label: "✓" },
      no: { bg: "transparent", fg: C.textMuted, label: "—" },
      partial: { bg: C.goldPale, fg: C.gold, label: "◐" },
    };
    const s = styles[value];
    return <span style={{ width: 22, height: 22, borderRadius: "50%", background: s.bg, color: s.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>{s.label}</span>;
  };
  return (
    <section ref={ref} style={{ padding: "80px 40px", background: C.cream }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <SectionLabel num="§ 03">Comparison</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.1 }}>
            Why teams switch to <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>JurisGPT</em>.
          </h2>
        </div>
        <div className="lp-comparison" style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", opacity: inView ? 1 : 0, transition: "opacity 700ms ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ padding: "20px 28px" }} />
            {[
              ["Traditional lawyer", "Manual research", false],
              ["Generic AI", "No India context", false],
              ["JurisGPT", "Built for India", true],
            ].map(([label, sub, highlight]) => (
              <div key={String(label)} style={{ padding: "20px 16px", textAlign: "center", background: highlight ? C.ink : "transparent", borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: highlight ? C.cream : C.ink, letterSpacing: "-0.01em" }}>{label}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: highlight ? "#A7A29A" : C.textMuted, marginTop: 4, fontWeight: 700 }}>{sub}</div>
              </div>
            ))}
          </div>
          {rows.map((row, rowIndex) => (
            <div key={row[0]} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: rowIndex < rows.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
              <div style={{ padding: "14px 28px", fontSize: 14, color: C.inkSoft, display: "flex", alignItems: "center" }}>{row[0]}</div>
              <div style={{ padding: 14, borderLeft: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "center" }}>{cell(row[1])}</div>
              <div style={{ padding: 14, borderLeft: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "center" }}>{cell(row[2])}</div>
              <div style={{ padding: 14, borderLeft: `1px solid ${C.border}`, background: C.cream, display: "flex", justifyContent: "center" }}>{cell(row[3], true)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  // Three principles JurisGPT actually stands behind, presented like a
  // signed manifesto. Replaces stock-feeling founder testimonials with
  // language the team can defend without external attribution.
  const principles: { num: string; title: string; body: string }[] = [
    {
      num: "01",
      title: "Cite or refuse.",
      body: "Every answer carries inline citations to the exact statute, section, or judgment. When the corpus is thin, JurisGPT marks the answer as low-confidence rather than guessing.",
    },
    {
      num: "02",
      title: "Indian law, primary sources.",
      body: "The retrieval corpus is built from Indian statutes, RBI/SEBI/MCA circulars, and judgments — not generic web text. No US precedent leaks into Indian compliance answers.",
    },
    {
      num: "03",
      title: "Your data, your control.",
      body: "Documents and queries are encrypted at rest and in transit. We never use your data to train models. DPDP Act 2023-aligned by design.",
    },
  ];
  return (
    <section ref={ref} style={{ padding: "80px 40px", background: C.warmGray, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, maxWidth: 640 }}>
          <SectionLabel num="§ 04" color={C.sage}>Principles</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.1 }}>
            What we&apos;ll <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>never</em> compromise on.
          </h2>
          <p style={{ fontSize: 15, color: C.textSub, marginTop: 16, lineHeight: 1.65 }}>
            We are early — these are the commitments the system is built around, not customer quotes pulled from a focus group.
          </p>
        </div>
        <div className="lp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {principles.map((principle, i) => (
            <div key={principle.num} style={{ padding: "32px 28px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 600ms ease ${i * 100}ms` }}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.burgundy, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14 }}>§ {principle.num}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 12, letterSpacing: "-0.01em" }}>{principle.title}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.textSub, margin: 0 }}>{principle.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [ref, inView] = useInView({ threshold: 0.15 });
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    ["Is JurisGPT a substitute for a lawyer?", "No. JurisGPT is a research and drafting assistant, not legal advice. For critical decisions, consult a qualified lawyer. Think of it as a research associate that never sleeps."],
    ["How accurate are the citations?", "95%+ verified accuracy. Every citation links to its source. When uncertain, the model returns a low confidence score rather than guessing."],
    ["Which Indian laws are covered?", "Companies Act 2013, FEMA, GST, Income Tax, all major labour laws, SEBI regulations, IPC/CrPC, Consumer Protection, IT Act, DPDP Act 2023, plus 200+ central and state statutes."],
    ["Is my data secure?", "AES-256 encryption at rest and in transit. Documents and queries are never used to train models. DPDP Act 2023-aligned by design; SOC 2 and ISO 27001 audits are on the roadmap."],
    ["Can I use JurisGPT in Hindi?", "Yes — English, Hindi, or Hinglish. The model responds in your preferred language."],
  ];
  return (
    <section id="faq" ref={ref} style={{ padding: "80px 40px", background: C.cream }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <SectionLabel num="§ 05" color={C.gold}>FAQ</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.1 }}>Common questions.</h2>
        </div>
        {faqs.map(([q, a], i) => (
          <div key={q} style={{ borderBottom: `1px solid ${C.border}`, opacity: inView ? 1 : 0, transition: `opacity 500ms ease ${i * 60}ms` }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: C.ink, paddingRight: 20 }}>{q}</span>
              <span style={{ flexShrink: 0, fontFamily: "var(--font-jetbrains-mono)", fontSize: 18, color: C.textSub, fontWeight: 400, transition: "transform 200ms", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
            </button>
            <div style={{ overflow: "hidden", maxHeight: open === i ? 200 : 0, transition: "max-height 280ms ease" }}>
              <p style={{ paddingBottom: 22, fontSize: 14.5, color: C.textSub, lineHeight: 1.7, maxWidth: 600 }}>{a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ onOpenApp }: { onOpenApp: () => void }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  return (
    <section ref={ref} style={{ padding: "0 40px 80px", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, #5C1622 0%, #7B1E2E 45%, #4A1018 100%)",
            color: C.cream,
            borderRadius: 16,
            padding: "72px 64px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 700ms ease",
            boxShadow: "0 24px 60px -20px rgba(92, 22, 34, 0.45)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.gold, letterSpacing: "0.1em", fontWeight: 700, marginBottom: 20 }}>§ 06 — GET STARTED</div>
            <h2 style={{ fontSize: "clamp(34px,4vw,56px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: 18 }}>
              Ready to ship faster?
              <br />
              <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.gold }}>Get started today.</em>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(250,246,239,0.75)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>AI-powered legal research built for Indian startup &amp; corporate law from day one.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onOpenApp} style={{ padding: "13px 28px", background: C.gold, color: C.ink, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14.5, fontWeight: 600 }}>Get started →</button>
              <button onClick={onOpenApp} style={{ padding: "13px 28px", background: "transparent", color: C.cream, border: "1px solid rgba(250,246,239,0.4)", borderRadius: 8, cursor: "pointer", fontSize: 14.5, fontWeight: 500 }}>Schedule demo</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Product", links: ["Legal Q&A", "Drafting", "Compliance", "Document analysis", "Case law", "RTI assistant"] },
    { title: "Resources", links: ["Documentation", "API", "Blog", "Legal updates", "Case studies"] },
    { title: "Company", links: ["About", "Careers", "Press", "Partners", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "DPDP", "Security", "Cookies"] },
  ];
  return (
    <footer style={{ background: C.cream, borderTop: `1px solid ${C.border}`, padding: "64px 40px 28px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="lp-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Logo size={26} />
              <span style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>JurisGPT</span>
            </div>
            <p style={{ fontSize: 13.5, color: C.textSub, lineHeight: 1.65, marginBottom: 20, maxWidth: 280 }}>AI-powered legal research and drafting, built for Indian startups, MSMEs, and counsel.</p>
            <div style={{ display: "flex", gap: 6 }}>
              {["𝕏", "in", "GH"].map((label) => (
                <div key={label} style={{ width: 30, height: 30, borderRadius: 6, background: C.paper, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.inkSoft }}>{label}</div>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>{col.title}</div>
              {col.links.map((link) => (
                <div key={link} style={{ marginBottom: 9 }}>
                  <a href="#" style={{ fontSize: 13.5, color: C.inkSoft, textDecoration: "none" }}>{link}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: C.textMuted }}>© {new Date().getFullYear()} JurisGPT Technologies Pvt. Ltd.</div>
          {/* Footer compliance line: only state what we actually claim. ISO 27001
              and SOC 2 are roadmap items, not held — surface them as such so we
              don't misrepresent. */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ padding: "3px 9px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: C.inkSoft, fontWeight: 700 }}>
              DPDP READY
            </span>
            <span style={{ padding: "3px 9px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>
              ISO 27001 · IN PROGRESS
            </span>
            <span style={{ padding: "3px 9px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>
              SOC 2 · IN PROGRESS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const router = useRouter();
  const openApp = () => router.push("/dashboard");

  return (
    <main style={{ minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "var(--font-inter), system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        ::selection { background: ${C.burgundy}; color: ${C.cream}; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .lp-dark-button:hover { background: ${C.burgundy} !important; }
        .lp-service-card:hover { border-color: ${C.ink} !important; transform: translateY(-3px) !important; box-shadow: 0 12px 28px rgba(10,10,10,0.06) !important; }
        .lp-nav a:hover { opacity: 1 !important; }
        @media (max-width: 900px) {
          .lp-nav { padding: 0 18px !important; }
          .lp-nav-links { display: none !important; }
          .lp-hero-grid, .lp-section-header { grid-template-columns: 1fr !important; gap: 36px !important; }
          .lp-stats-grid, .lp-card-grid, .lp-step-grid, .lp-footer-grid { grid-template-columns: 1fr !important; }
          .lp-comparison { overflow-x: auto !important; }
          section { padding-left: 18px !important; padding-right: 18px !important; }
        }
        @media (max-width: 640px) {
          .lp-signin-btn { display: none !important; }
          .lp-btn-text { display: none !important; }
          .lp-dark-button { padding: 10px !important; border-radius: 10px !important; }
        }
      `}</style>
      <Nav onOpenApp={openApp} />
      <Hero onOpenApp={openApp} />
      <StatsBar />
      <ServicesGrid />
      <HowItWorks />
      <ComparisonTable />
      <Testimonials />
      <FAQSection />
      <FinalCTA onOpenApp={openApp} />
      <Footer />
    </main>
  );
}
