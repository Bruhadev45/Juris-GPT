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

function useInView({ threshold = 0.2 }: InViewOptions = {}) {
  const ref = useRef<HTMLDivElement | HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
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
  }, [threshold]);

  return [ref, inView] as const;
}

function useTypingEffect(texts: string[], speed = 60, pause = 2500) {
  const [display, setDisplay] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

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
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) return;
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
  const [scrolled, setScrolled] = useState(false);

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
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: "0.05em", padding: "2px 6px", border: `1px solid ${C.border}`, borderRadius: 4, marginLeft: 4 }}>
          BETA
        </span>
      </div>
      <div className="lp-nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["Features", "Pricing", "Resources", "Changelog", "Docs"].map((item) => (
          <a key={item} href={item === "Features" ? "#features" : item === "Pricing" ? "#pricing" : "#"} style={{ color: C.inkSoft, fontSize: 13.5, textDecoration: "none", fontWeight: 500, opacity: 0.7 }}>
            {item}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onOpenApp} style={{ padding: "7px 14px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: C.inkSoft, fontWeight: 500 }}>
          Sign in
        </button>
        <button className="lp-dark-button" onClick={onOpenApp} style={{ padding: "7px 16px", background: C.ink, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: C.cream, fontWeight: 500 }}>
          Get started →
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

function Hero({ onOpenApp }: { onOpenApp: () => void }) {
  const typed = useTypingEffect(["Draft a Series A SHA", "Research Companies Act §185", "Check FDI compliance", "Analyze a vendor contract"], 55, 2200);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "110px 40px 60px", background: C.cream, overflow: "hidden" }}>
      <GridBG />
      <div className="lp-hero-grid" style={{ maxWidth: 1240, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 1 }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 600ms cubic-bezier(0.25,0.1,0.25,1)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 100, marginBottom: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.sage }} />
            <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>New — DPDP Act 2023 corpus added</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>→</span>
          </div>
          <h1 style={{ fontSize: "clamp(40px,5.2vw,68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, color: C.ink, marginBottom: 24 }}>
            Legal research,
            <br />
            built for{" "}
            <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>Indian</em>
            <br />
            startups.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: C.textSub, marginBottom: 32, maxWidth: 460 }}>
            Ask any legal question in plain English. Get cited answers from 16 million Indian statutes, judgments, and circulars — in under two seconds.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "6px 6px 6px 16px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 20, maxWidth: 540, boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 13, color: C.burgundy, fontWeight: 700, marginRight: 10 }}>›</span>
            <span style={{ flex: 1, fontFamily: "var(--font-jetbrains-mono)", fontSize: 13.5, color: C.ink }}>
              {typed}
              <span style={{ display: "inline-block", width: 7, height: 14, background: C.ink, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
            </span>
            <button onClick={onOpenApp} style={{ padding: "8px 14px", background: C.ink, color: C.cream, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              Try it <span style={{ fontSize: 11, opacity: 0.6, fontFamily: "var(--font-jetbrains-mono)" }}>↵</span>
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <button onClick={onOpenApp} className="lp-dark-button" style={{ padding: "11px 20px", background: C.ink, color: C.cream, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Start free trial
            </button>
            <button onClick={onOpenApp} style={{ padding: "11px 20px", background: "transparent", border: `1px solid ${C.border}`, color: C.ink, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              ▶ Watch demo <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted }}>0:32</span>
            </button>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              Trusted by 500+ Indian startups
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              {["ZERODHA", "CRED", "GROWW", "RAZORPAY", "POSTMAN"].map((name) => (
                <span key={name} style={{ fontWeight: 800, fontSize: 14, color: C.textMuted, letterSpacing: "-0.02em", opacity: 0.6 }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: "all 800ms cubic-bezier(0.25,0.1,0.25,1) 200ms" }}>
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const stats = [
    { value: 16, suffix: "M+", label: "Documents indexed", sub: "Statutes, judgments & circulars" },
    { value: 95, suffix: "%", label: "Citation accuracy", sub: "Verified against source" },
    { value: 1.4, suffix: "s", label: "Avg. response", sub: "From query to first token", decimals: 1 },
    { value: 500, suffix: "+", label: "Active customers", sub: "Indian startups & MSMEs" },
  ];
  return (
    <section ref={ref} style={{ background: C.cream, padding: "0 40px 100px", borderTop: `1px solid ${C.border}`, marginTop: 40 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="lp-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, marginTop: -1 }}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={{ padding: "40px 32px", borderRight: i < 3 ? `1px solid ${C.border}` : "none", opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 600ms cubic-bezier(0.25,0.1,0.25,1) ${i * 80}ms` }}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 18 }}>{String(i + 1).padStart(2, "0")} —</div>
              <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: C.ink }}>
                <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} active={inView} />
              </div>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, marginTop: 14 }}>{stat.label}</div>
              <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{stat.sub}</div>
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
  const services = [
    { kind: "chat", num: "01", title: "Legal Q&A", desc: "Ask any question. Get cited answers from Indian statutes, judgments, and regulations — all sources visible.", color: C.burgundy },
    { kind: "draft", num: "02", title: "Contract drafting", desc: "Generate SHAs, NDAs, ESOP plans, and service agreements with clauses tailored to Indian law.", color: C.gold },
    { kind: "calendar", num: "03", title: "Compliance tracker", desc: "Never miss a ROC filing, GST return, or TDS deadline. All obligations mapped, with reminders.", color: C.sage },
    { kind: "analyze", num: "04", title: "Document review", desc: "Upload any contract. Get clause-by-clause risk analysis with redline suggestions in minutes.", color: "#5C7A8A" },
    { kind: "search", num: "05", title: "Case law research", desc: "Semantic search across 16M+ Supreme Court, High Court, and tribunal judgments.", color: C.burgundy },
    { kind: "rti", num: "06", title: "RTI assistant", desc: "Draft and track Right to Information applications with templates and response monitoring.", color: C.gold },
  ];
  return (
    <section id="features" ref={ref} style={{ padding: "100px 40px", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="lp-section-header" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, marginBottom: 56, alignItems: "end" }}>
          <div>
            <SectionLabel num="§ 01">Capabilities</SectionLabel>
            <h2 style={{ fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.05 }}>
              Six tools.
              <br />
              <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>One workspace.</em>
            </h2>
          </div>
          <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.65, maxWidth: 520, justifySelf: "end" }}>
            Everything an Indian founder, MSME, or in-house counsel needs — from a Series A SHA to a labour audit response. No more juggling research, drafting, and compliance across five tools.
          </p>
        </div>
        <div className="lp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {services.map((service, i) => (
            <div key={service.title} className="lp-service-card" style={{ padding: "28px 28px 24px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `opacity 500ms ease ${i * 70}ms, transform 200ms ease, border-color 150ms`, boxShadow: "0 1px 2px rgba(10,10,10,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>{service.num}</span>
                <ServiceIcon kind={service.kind} color={service.color} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 8, letterSpacing: "-0.01em" }}>{service.title}</div>
              <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6, marginBottom: 18 }}>{service.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>Learn more →</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const steps = [
    { num: "01", title: "Ask in plain English", desc: "Type your question naturally. No legal jargon required — our model understands context, even in Hinglish.", code: "> Can a foreign fund subscribe to CCDs in our Series A?" },
    { num: "02", title: "AI scans 16M docs", desc: "In under 2 seconds, the model reads relevant statutes, RBI circulars, SEBI regs, and case law.", code: "scanning... [████████████] 16,243,891 docs" },
    { num: "03", title: "Get cited answer", desc: "Numbered citations link to the exact section or paragraph. Confidence score on every claim.", code: 'answer.cite(["FEMA §6(3)(b)", "Press Note 3"])' },
    { num: "04", title: "Act with confidence", desc: "Generate a memo, draft a clause, or share with your team. Every answer is auditable.", code: 'export.memo({ format: "PDF" }) → ✓' },
  ];
  return (
    <section ref={ref} style={{ padding: "100px 40px", background: C.warmGray, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
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
              <div style={{ padding: "8px 10px", background: C.warmGray, border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.inkSoft, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.code}</div>
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
    ["Affordable for early-stage", "no", "yes", "yes"],
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
    <section ref={ref} style={{ padding: "100px 40px", background: C.cream }}>
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
              ["Traditional lawyer", "₹3L+ per matter", false],
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
  const items = [
    ["Rohan Mehta", "Co-founder, fintech", "Bangalore", "Drafted our SHA and founders agreement with full citations in under an hour. Saved ₹3L in legal fees during seed round."],
    ["Priya Nair", "Legal Head, D2C", "Mumbai", "We've never missed a ROC filing since we started using JurisGPT. The compliance tracker is genuinely a game changer."],
    ["Aditya Sharma", "CEO, SaaS", "Hyderabad", "Asked about DPDP compliance for our data flows. Got a 15-page cited brief in 90 seconds. Replaced an entire research week."],
  ];
  return (
    <section ref={ref} style={{ padding: "100px 40px", background: C.warmGray, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ marginBottom: 56, maxWidth: 600 }}>
          <SectionLabel num="§ 04" color={C.sage}>Testimonials</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.1 }}>
            <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>What founders</em> are saying.
          </h2>
        </div>
        <div className="lp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {items.map(([name, role, city, quote], i) => (
            <div key={name} style={{ padding: "32px 28px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 600ms ease ${i * 100}ms` }}>
              <div style={{ fontFamily: "var(--font-spectral)", fontSize: 48, color: C.burgundy, lineHeight: 0.5, marginBottom: 12, height: 24 }}>&quot;</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: C.inkSoft, marginBottom: 28, fontFamily: "var(--font-spectral)" }}>{quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: `1px solid ${C.borderSoft}` }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.warmGray, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: C.ink }}>{name[0]}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{name}</div>
                  <div style={{ fontSize: 12, color: C.textSub, fontFamily: "var(--font-jetbrains-mono)" }}>{role} · {city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const [yearly, setYearly] = useState(true);
  const plans = [
    { name: "Starter", price: yearly ? 999 : 1199, desc: "For early-stage founders.", features: ["50 AI queries / month", "Contract templates (basic)", "Compliance calendar", "Email support"], cta: "Start free trial" },
    { name: "Professional", price: yearly ? 2999 : 3599, desc: "For growing startups.", highlight: true, features: ["Unlimited AI queries", "Full contract suite", "Document analysis (10/mo)", "Slack + priority support", "Team access (5 users)", "API access"], cta: "Start free trial" },
    { name: "Enterprise", price: null, desc: "For legal teams & firms.", features: ["Unlimited everything", "Custom integrations", "Dedicated account manager", "SLA guarantees", "White-label options", "Audit logs + SSO"], cta: "Contact sales" },
  ];
  return (
    <section id="pricing" ref={ref} style={{ padding: "100px 40px", background: C.cream }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel num="§ 05">Pricing</SectionLabel>
          <h2 style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.1, marginBottom: 28 }}>
            Simple, <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>transparent.</em>
          </h2>
          <div style={{ display: "inline-flex", padding: 4, background: C.paper, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            {["Monthly", "Yearly"].map((opt, i) => (
              <button key={opt} onClick={() => setYearly(i === 1)} style={{ padding: "7px 18px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 500, background: (i === 1) === yearly ? C.ink : "transparent", color: (i === 1) === yearly ? C.cream : C.inkSoft, transition: "all 150ms" }}>
                {opt}
                {i === 1 && <span style={{ marginLeft: 6, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: C.gold }}>−17%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="lp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <div key={plan.name} style={{ padding: "36px 32px", background: plan.highlight ? C.ink : C.paper, color: plan.highlight ? C.cream : C.ink, border: `1px solid ${plan.highlight ? C.ink : C.border}`, borderRadius: 12, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 600ms ease ${i * 100}ms`, position: "relative" }}>
              {plan.highlight && <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", background: C.burgundy, borderRadius: 100, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, fontWeight: 700, color: C.cream, letterSpacing: "0.05em" }}>POPULAR</div>}
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>{plan.name}</div>
              <div style={{ fontSize: 13.5, color: plan.highlight ? "#A7A29A" : C.textSub, marginBottom: 28 }}>{plan.desc}</div>
              <div style={{ marginBottom: 28 }}>{plan.price ? <><span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em" }}>₹{plan.price.toLocaleString("en-IN")}</span><span style={{ fontSize: 14, color: plan.highlight ? "#A7A29A" : C.textSub, marginLeft: 4 }}>/mo</span></> : <span style={{ fontSize: 28, fontWeight: 700 }}>Custom</span>}</div>
              <button style={{ width: "100%", padding: 11, background: plan.highlight ? C.cream : C.ink, color: plan.highlight ? C.ink : C.cream, border: "none", borderRadius: 7, cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 28 }}>{plan.cta}</button>
              <div style={{ paddingTop: 24, borderTop: `1px solid ${plan.highlight ? "#3A3A3A" : C.borderSoft}` }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", gap: 10, marginBottom: 11, fontSize: 13.5, color: plan.highlight ? "#D4D0C8" : C.inkSoft }}>
                    <span style={{ color: plan.highlight ? C.gold : C.burgundy, fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>→</span>
                    {feature}
                  </div>
                ))}
              </div>
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
    ["Is my data secure?", "ISO 27001 certified. AES-256 encryption at rest and in transit. Documents and queries never used to train models. DPDP Act 2023 compliant."],
    ["What does the free trial include?", "14 days of full Professional plan access. No credit card required."],
    ["Can I use JurisGPT in Hindi?", "Yes — English, Hindi, or Hinglish. The model responds in your preferred language."],
  ];
  return (
    <section ref={ref} style={{ padding: "100px 40px", background: C.cream }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <SectionLabel num="§ 06" color={C.gold}>FAQ</SectionLabel>
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
    <section ref={ref} style={{ padding: "0 40px 100px", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ background: C.ink, color: C.cream, borderRadius: 16, padding: "72px 64px", textAlign: "center", position: "relative", overflow: "hidden", opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 700ms ease" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: C.gold, letterSpacing: "0.1em", fontWeight: 700, marginBottom: 20 }}>§ 07 — GET STARTED</div>
            <h2 style={{ fontSize: "clamp(34px,4vw,56px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: 18 }}>
              Ready to ship faster?
              <br />
              <em style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontWeight: 400, color: C.gold }}>Start free, today.</em>
            </h2>
            <p style={{ fontSize: 16, color: "#A7A29A", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>500+ Indian startups already use JurisGPT. 14-day free trial. No credit card.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onOpenApp} style={{ padding: "13px 28px", background: C.cream, color: C.ink, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14.5, fontWeight: 600 }}>Start free trial →</button>
              <button onClick={onOpenApp} style={{ padding: "13px 28px", background: "transparent", color: C.cream, border: "1px solid #3A3A3A", borderRadius: 8, cursor: "pointer", fontSize: 14.5, fontWeight: 500 }}>Schedule demo</button>
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
          <div style={{ display: "flex", gap: 6 }}>
            {["ISO 27001", "SOC 2", "DPDP"].map((badge) => (
              <span key={badge} style={{ padding: "3px 9px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: C.inkSoft, fontWeight: 700 }}>{badge}</span>
            ))}
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
      `}</style>
      <Nav onOpenApp={openApp} />
      <Hero onOpenApp={openApp} />
      <StatsBar />
      <ServicesGrid />
      <HowItWorks />
      <ComparisonTable />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <FinalCTA onOpenApp={openApp} />
      <Footer />
    </main>
  );
}
