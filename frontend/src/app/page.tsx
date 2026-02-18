"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Scale,
  FileCheck,
  Clock,
  Gavel,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  Lock,
  Globe,
  Star,
  ChevronRight,
  Check,
  ArrowUp,
  Send,
  MessageSquare,
  Briefcase,
  Building2,
  UserCheck,
  Search,
  Calculator,
  FileSearch,
  Handshake,
  IndianRupee,
  Menu,
  X,
} from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import dynamic from "next/dynamic";

const InteractiveDots = dynamic(() => import("@/components/ui/interactive-dots"), { ssr: false });

/* ─── Data ─── */
const services = [
  { icon: FileText, title: "Contracts", desc: "NDA, MSA, employment, freelancer agreements, MoU, rental and more", href: "/agreements/new" },
  { icon: Shield, title: "Compliance", desc: "GST, ROC filings, TDS, PF/ESI, Shops Act and state-wise tracking", href: "/dashboard/compliance" },
  { icon: Building2, title: "Corporate", desc: "Incorporation, DPIIT registration, equity, ESOP pools, board resolutions", href: "/dashboard/cases" },
  { icon: Users, title: "Employment", desc: "Offer letters, employment contracts, ESOP, contractor setup, policies", href: "/dashboard/forms" },
  { icon: Search, title: "Legal Research", desc: "AI-powered search across 16M+ Indian judgments, statutes and case law", href: "/dashboard/search" },
];

const howItWorks = [
  { step: "01", title: "Submit a legal matter", desc: "Share your legal need at no cost. Contracts, compliance, research — anything.", icon: Send },
  { step: "02", title: "Get fixed pricing", desc: "Transparent upfront pricing in INR. No hourly billing, no surprises.", icon: IndianRupee },
  { step: "03", title: "AI gets to work", desc: "Our AI handles 80% of the work — drafting, research, analysis. You pay only for the final 20%.", icon: Zap },
  { step: "04", title: "Lawyer reviews", desc: "Experienced Indian lawyers review and finalize every deliverable. Same-day turnaround.", icon: Scale },
];

const pricingPlans = [
  { name: "Naagrik", subtitle: "Citizen", price: "Free", period: "", description: "Get started with your first legal matter", features: ["Submit your first legal matter free", "Basic legal information & rights guide", "Secure document storage", "Connect with a verified lawyer", "Pay per case after first matter"], cta: "Get Started Free", highlighted: false },
  { name: "Udyami", subtitle: "Entrepreneur", price: "999", period: "/mo", description: "For startups and small businesses", features: ["Everything in Naagrik", "5 contracts per month", "Compliance deadline alerts", "AI legal research access", "Free 1:1 lawyer consultation", "Email support"], cta: "Start Free Trial", highlighted: true },
  { name: "Vyapar", subtitle: "Business", price: "4,999", period: "/mo", description: "For growing companies", features: ["Everything in Udyami", "Unlimited contracts", "Full compliance tracking & filing", "Contract analyzer & risk scoring", "Document vault with version history", "Priority lawyer review", "Phone & chat support"], cta: "Get in Touch", highlighted: false },
  { name: "Nigam", subtitle: "Enterprise", price: "Custom", period: "", description: "For large organizations", features: ["Everything in Vyapar", "Dedicated account manager", "Custom workflows & playbooks", "API access & integrations", "Advanced security controls", "Team management & RBAC", "SLA guarantee"], cta: "Contact Sales", highlighted: false },
];

const testimonials = [
  { name: "Rajesh Kumar", role: "Co-founder, TechStart", content: "JurisGPT delivered our founder agreement the same day for under ₹1,000. They move at startup speed and keep costs founder-friendly.", rating: 5 },
  { name: "Priya Sharma", role: "Founder, HealthTech India", content: "The AI handles the heavy lifting and the lawyer review catches everything. We moved fast without worrying about legal risk.", rating: 5 },
  { name: "Amit Patel", role: "CEO, FinServ Solutions", content: "JurisGPT delivered fast, actionable guidance on a complex corporate structuring issue. Their compliance tracking alone saves us hours.", rating: 5 },
];

const faqs = [
  { question: "What is JurisGPT?", answer: "JurisGPT is an AI-powered legal services platform for India. We combine advanced AI that handles 80% of legal work with experienced Indian lawyers who finalize the remaining 20% — delivering fast, affordable, and reliable legal services." },
  { question: "What does 'lawyer review' mean?", answer: "Every legal deliverable is reviewed by an experienced Indian lawyer before it reaches you. Our lawyers are Bar Council verified and bound by professional duties including confidentiality and attorney-client privilege." },
  { question: "How is pricing determined?", answer: "We provide fixed, upfront pricing for every matter — no hourly billing, no surprises. Our AI handles 80% of the work, which means you only pay for the final 20% of lawyer time. This makes our services 60-80% cheaper than traditional law firms." },
  { question: "Is my data secure?", answer: "Absolutely. We use end-to-end encryption, comply with DPDPA (Digital Personal Data Protection Act, 2023), and store all data on Indian servers. Attorney-client privilege is maintained on every matter." },
  { question: "What types of legal matters can I submit?", answer: "Contracts (NDA, MSA, employment, freelancer, rental, MoU, PoA), compliance (GST, ROC, TDS, PF/ESI), corporate matters (incorporation, equity, ESOP), legal research, RTI applications, and more. If it's a legal need, we can help." },
  { question: "How fast is the turnaround?", answer: "Most matters are delivered same-day. AI-generated drafts are ready in minutes, and lawyer review typically completes within 24 hours. Our average turnaround is under 18 hours." },
  { question: "Is there a free trial?", answer: "Yes! Your first legal matter is completely free on the Naagrik plan. Submit any legal need — a contract, a compliance question, legal research — and experience the platform before committing." },
];

/* ─── Animated Counter Hook ─── */
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return { count, ref };
}

/* ─── Floating Particle ─── */
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [0, -30, 0, 30, 0],
        x: [0, 20, 0, -20, 0],
        scale: [1, 1.1, 1, 0.9, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Law-Themed Floating Icons ─── */
const lawIcons = [
  // Scale of Justice
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v19" /><path d="M5 7l7-4 7 4" />
      <path d="M2 12l3-5 3 5a4.5 4.5 0 0 1-6 0z" /><path d="M16 12l3-5 3 5a4.5 4.5 0 0 1-6 0z" />
    </svg>
  ),
  // Gavel
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 3L9.5 8M6 11l-3 3 4 4 3-3" />
      <path d="M11 6l5 5-7 7-5-5z" /><path d="M3 21h18" />
    </svg>
  ),
  // Document/Scroll
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h8" /><path d="M8 9h2" />
    </svg>
  ),
  // Shield
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  // Paragraph / Section symbol
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 4v16" /><path d="M17 4v16" /><path d="M17 4H10a4 4 0 0 0 0 8h3" />
    </svg>
  ),
  // Book / Law Book
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" /><path d="M8 11h6" />
    </svg>
  ),
  // Handshake / Contract
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
  // Columns / Pillars
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3h18v2H3zM3 19h18v2H3z" />
      <path d="M6 5v14" /><path d="M10 5v14" /><path d="M14 5v14" /><path d="M18 5v14" />
    </svg>
  ),
];

interface FloatingLawIconProps {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  opacity: number;
}

function FloatingLawIcon({ icon: Icon, x, y, size, duration, delay, rotate, opacity }: FloatingLawIconProps) {
  return (
    <motion.div
      className="absolute pointer-events-none text-primary"
      style={{ left: x, top: y, opacity }}
      animate={{
        y: [0, -20, 0, 15, 0],
        x: [0, 10, 0, -10, 0],
        rotate: [rotate, rotate + 8, rotate, rotate - 8, rotate],
        scale: [1, 1.05, 1, 0.95, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      <Icon width={size} height={size} />
    </motion.div>
  );
}

/* ─── Floating Law Icons Background ─── */
function LegalGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating law icons scattered across the page */}
      <FloatingLawIcon icon={lawIcons[0]} x="5%" y="8%" size={28} duration={16} delay={0} rotate={-5} opacity={0.06} />
      <FloatingLawIcon icon={lawIcons[1]} x="88%" y="12%" size={22} duration={18} delay={2} rotate={10} opacity={0.05} />
      <FloatingLawIcon icon={lawIcons[2]} x="75%" y="25%" size={20} duration={14} delay={1} rotate={-8} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[3]} x="15%" y="35%" size={24} duration={20} delay={4} rotate={5} opacity={0.05} />
      <FloatingLawIcon icon={lawIcons[4]} x="92%" y="40%" size={26} duration={15} delay={3} rotate={-12} opacity={0.06} />
      <FloatingLawIcon icon={lawIcons[5]} x="8%" y="55%" size={22} duration={17} delay={5} rotate={8} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[6]} x="82%" y="58%" size={20} duration={19} delay={1.5} rotate={-6} opacity={0.05} />
      <FloatingLawIcon icon={lawIcons[7]} x="20%" y="72%" size={24} duration={16} delay={2.5} rotate={10} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[0]} x="70%" y="78%" size={26} duration={18} delay={6} rotate={-10} opacity={0.05} />
      <FloatingLawIcon icon={lawIcons[3]} x="45%" y="85%" size={20} duration={14} delay={3.5} rotate={7} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[1]} x="55%" y="15%" size={18} duration={20} delay={7} rotate={-15} opacity={0.03} />
      <FloatingLawIcon icon={lawIcons[5]} x="35%" y="45%" size={22} duration={16} delay={4.5} rotate={12} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[2]} x="60%" y="65%" size={20} duration={17} delay={5.5} rotate={-8} opacity={0.03} />
      <FloatingLawIcon icon={lawIcons[7]} x="90%" y="75%" size={18} duration={15} delay={8} rotate={6} opacity={0.04} />
      <FloatingLawIcon icon={lawIcons[4]} x="3%" y="90%" size={24} duration={19} delay={2} rotate={-5} opacity={0.05} />
    </div>
  );
}

/* ─── Hero Scales of Justice Animation ─── */
function HeroScalesAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large centered scale watermark behind hero */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <svg width="500" height="500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v19" />
          <path d="M5 7l7-4 7 4" />
          <path d="M2 12l3-5 3 5a4.5 4.5 0 0 1-6 0z" />
          <path d="M16 12l3-5 3 5a4.5 4.5 0 0 1-6 0z" />
        </svg>
      </motion.div>

      {/* Animated balance motion on scale pans */}
      <motion.div
        className="absolute top-[42%] left-[calc(50%-140px)] w-3 h-3 rounded-full bg-primary/[0.06]"
        animate={{ y: [0, 8, 0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[42%] left-[calc(50%+130px)] w-3 h-3 rounded-full bg-primary/[0.06]"
        animate={{ y: [0, -8, 0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Radiating rings from center */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.04]"
          style={{ width: ring * 250, height: ring * 250 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: ring * 0.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Shimmer Button ─── */
function ShimmerButton({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link href={href} className={`relative overflow-hidden group ${className}`}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
      />
    </Link>
  );
}

/* ─── Magnetic Hover Card ─── */
function MagneticCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    setPosition({ x, y });
  };

  const handleLeave = () => setPosition({ x: 0, y: 0 });

  const springX = useSpring(position.x, { stiffness: 150, damping: 15 });
  const springY = useSpring(position.y, { stiffness: 150, damping: 15 });

  useEffect(() => {
    springX.set(position.x);
    springY.set(position.y);
  }, [position, springX, springY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section Reveal ─── */
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Shining Border Card ─── */
function ShiningBorderCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative ${className}`}
      style={{ padding: "2px", borderRadius: "0.75rem" }}
    >
      {/* Animated shining border layer */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.95), rgba(220,225,232,0.7) 20%, rgba(180,190,200,0.45) 40%, rgba(140,150,165,0.2) 60%, transparent 80%)`,
        }}
      />
      {/* Secondary shimmer ring */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 0.7 : 0,
          background: `conic-gradient(from ${Math.atan2(mousePos.y - 100, mousePos.x - 150) * (180 / Math.PI)}deg at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(255,255,255,0.6) 10%, transparent 20%, rgba(200,210,220,0.3) 40%, transparent 50%)`,
        }}
      />
      {/* Resting silver border */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.3 : 1,
          background: "linear-gradient(135deg, rgba(200,205,215,0.35), rgba(170,178,190,0.15) 50%, rgba(200,205,215,0.35))",
        }}
      />
      {/* Inner glow on hover */}
      <div
        className="absolute inset-[2px] rounded-[10px] transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), rgba(200,210,220,0.04) 40%, transparent 60%)`,
          boxShadow: isHovered
            ? `inset 0 0 30px rgba(200,210,220,0.08), 0 0 15px rgba(200,210,220,0.05)`
            : "none",
        }}
      />
      {/* Content */}
      <div className="relative rounded-[10px] bg-card h-full">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Stagger Container ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Main Component ─── */
export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);

  const heroParallax = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const navBg = useTransform(scrollY, [0, 100], [0, 1]);
  const scaleProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowBackToTop(latest > 400);
  });

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // Stats with animated counters
  const stat1 = useCounter(16, 1500);
  const stat2 = useCounter(100, 1500);
  const stat3 = useCounter(500, 1500);
  const stat4 = useCounter(18, 1500);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* ─── Scroll Progress Bar ─── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[60] origin-left"
        style={{ scaleX: scaleProgress }}
      />

      {/* ─── Interactive Dot Grid Background (from 21st.dev) ─── */}
      <InteractiveDots
        dotColor="#004E64"
        gridSpacing={32}
        animationSpeed={0.004}
      />

      {/* ─── Animated Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Gradient orbs */}
        <FloatingOrb className="w-[600px] h-[600px] bg-primary/[0.04] top-[-200px] left-[-100px]" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] bg-primary/[0.03] top-[30%] right-[-150px]" delay={3} />
        <FloatingOrb className="w-[400px] h-[400px] bg-accent/[0.05] bottom-[10%] left-[20%]" delay={6} />
        {/* Law-themed floating legal icons */}
        <LegalGridBackground />
      </div>

      {/* ─── Navigation ─── */}
      <motion.nav
        className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50"
        style={{ backgroundColor: `rgba(245, 247, 249, ${navBg})` }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
              <Image src="/logo.png" alt="JurisGPT" width={30} height={30} />
            </motion.div>
            <span className="text-xl font-bold text-foreground">JurisGPT</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {[
              { id: "solutions", label: "Solutions" },
              { id: "how-it-works", label: "How it Works" },
              { id: "pricing", label: "Pricing" },
              { id: "testimonials", label: "Testimonials" },
              { id: "faq", label: "Questions" },
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Login
            </Link>
            <ShimmerButton
              href="/dashboard"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              Dashboard
            </ShimmerButton>
            <button
              className="md:hidden p-2 text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/50 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {[
                  { label: "Solutions", id: "solutions" },
                  { label: "How it Works", id: "how-it-works" },
                  { label: "Pricing", id: "pricing" },
                  { label: "Testimonials", id: "testimonials" },
                  { label: "Questions", id: "faq" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-2"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── Back to Top ─── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.15, boxShadow: "0 8px 30px rgba(0,78,100,0.3)" }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ======================== HERO ======================== */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden" ref={heroRef}>
        {/* Hero law watermark */}
        <HeroScalesAnimation />
        <motion.div style={{ y: heroParallax, opacity: heroOpacity }} className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-14">

            {/* ─── Left: Video ─── */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="w-full max-w-sm mx-auto lg:mx-0 lg:w-[38%] flex-shrink-0"
            >
              <div className="relative group">
                {/* Video glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Video container */}
                <motion.div
                  className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-primary/10"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto block rounded-2xl"
                  >
                    <source src="/hero-video1.mp4" type="video/mp4" />
                  </video>

                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>

                {/* Floating badge on video */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -bottom-4 -right-4 md:bottom-4 md:right-4 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-4 py-3 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-foreground">500+ Startups Served</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* ─── Right: Text Content ─── */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-8"
              >
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </motion.div>
                <span className="text-xs font-medium text-primary tracking-wide">
                  AI-Native Legal Platform for India
                </span>
              </motion.div>

              {/* Heading with word-by-word animation */}
              <div className="mb-6">
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] tracking-tight"
                  initial="hidden"
                  animate="visible"
                  variants={stagger}
                >
                  {["Legal", "for", "Indian"].map((word, i) => (
                    <motion.span key={i} variants={fadeUp} className="inline-block mr-[0.3em]">
                      {word}
                    </motion.span>
                  ))}
                  <br />
                  {["startups."].map((word, i) => (
                    <motion.span key={i} variants={fadeUp} className="inline-block mr-[0.3em]">
                      {word}
                    </motion.span>
                  ))}
                  <motion.span
                    variants={fadeUp}
                    className="inline-block text-primary relative"
                  >
                    Done right.
                    <motion.span
                      className="absolute -bottom-2 left-0 h-1 bg-primary/30 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                    />
                  </motion.span>
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0"
              >
                AI-powered legal designed for Indian startups and MSMEs. Our AI
                handles 80% of the work. Elite lawyers finalize the rest.
                Same-day delivery. Fixed pricing.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex gap-4 justify-center lg:justify-start flex-wrap"
              >
                <ShimmerButton
                  href="/agreements/new"
                  className="px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  Start Your First Matter — Free
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </ShimmerButton>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3.5 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 hover:border-primary/20 transition-all inline-block"
                  >
                    Book a Demo
                  </Link>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </motion.div>

        {/* Hero bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
      </section>

      {/* ======================== STATS BAR ======================== */}
      <section className="relative z-10 py-16 border-y border-border/30 bg-primary/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "M+", label: "Indian Judgments" },
              { ref: stat2.ref, count: stat2.count, suffix: "+", label: "Verified Lawyers" },
              { ref: stat3.ref, count: stat3.count, suffix: "+", label: "Startups Served" },
              { ref: stat4.ref, count: stat4.count, suffix: "hrs", label: "Avg. Turnaround" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                ref={stat.ref}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-foreground tabular-nums">
                  {stat.count}{stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== SERVICES ======================== */}
      <section id="solutions" className="relative z-10 py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-16">
              <motion.span
                className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                viewport={{ once: true }}
              >
                Solutions
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                AI-powered legal designed for startups
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From contracts to compliance to corporate structuring — everything
                your business needs, powered by AI and verified by lawyers.
              </p>
            </RevealSection>

            {/* ─── Bento Grid ─── */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {/* ── Row 1: Two asymmetric cards (5 + 7) ── */}

              {/* Contracts — left, 5 cols */}
              <motion.div variants={fadeUp} className="md:col-span-5">
                <Link href={services[0].href} className="block h-full">
                  <ShiningBorderCard className="h-full">
                    <div className="group p-7 md:p-8 h-full min-h-[260px] flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-all duration-300"
                          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        >
                          <FileText className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                          {services[0].title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {services[0].desc}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </ShiningBorderCard>
                </Link>
              </motion.div>

              {/* Compliance — right, 7 cols */}
              <motion.div variants={fadeUp} className="md:col-span-7">
                <Link href={services[1].href} className="block h-full">
                  <ShiningBorderCard className="h-full">
                    <div className="group p-7 md:p-8 h-full min-h-[260px] flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-all duration-300"
                          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        >
                          <Shield className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                          {services[1].title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {services[1].desc}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </ShiningBorderCard>
                </Link>
              </motion.div>

              {/* ── Row 2: Three equal cards (4 + 4 + 4) ── */}

              {/* Corporate */}
              <motion.div variants={fadeUp} className="md:col-span-4">
                <Link href={services[2].href} className="block h-full">
                  <ShiningBorderCard className="h-full">
                    <div className="group p-7 md:p-8 h-full min-h-[240px] flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-all duration-300"
                          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        >
                          <Building2 className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                          {services[2].title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {services[2].desc}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </ShiningBorderCard>
                </Link>
              </motion.div>

              {/* Employment */}
              <motion.div variants={fadeUp} className="md:col-span-4">
                <Link href={services[3].href} className="block h-full">
                  <ShiningBorderCard className="h-full">
                    <div className="group p-7 md:p-8 h-full min-h-[240px] flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-all duration-300"
                          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        >
                          <Users className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                          {services[3].title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {services[3].desc}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </ShiningBorderCard>
                </Link>
              </motion.div>

              {/* Legal Research */}
              <motion.div variants={fadeUp} className="md:col-span-4">
                <Link href={services[4].href} className="block h-full">
                  <ShiningBorderCard className="h-full">
                    <div className="group p-7 md:p-8 h-full min-h-[240px] flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-all duration-300"
                          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        >
                          <Search className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                          {services[4].title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {services[4].desc}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </ShiningBorderCard>
                </Link>
              </motion.div>
            </motion.div>

            <RevealSection className="text-center mt-12">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
              >
                Explore all services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ======================== HOW IT WORKS ======================== */}
      <section id="how-it-works" className="relative z-10 py-28 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-20">
              <motion.span
                className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Process
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Simple, fast, and reliable. From submission to delivery.
              </p>
            </RevealSection>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Animated connecting line */}
              <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                />
              </div>

              {howItWorks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative text-center"
                  >
                    <motion.div
                      className="relative inline-block mb-6"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="w-16 h-16 bg-card border-2 border-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
                        whileInView={{ borderColor: "rgba(0,78,100,0.4)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                      >
                        <Icon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <motion.div
                        className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-md"
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + index * 0.2, type: "spring" }}
                      >
                        {item.step}
                      </motion.div>
                    </motion.div>
                    <h3 className="text-base font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== DONE RIGHT ======================== */}
      <section className="relative z-10 py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-16">
              <motion.span
                className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Why JurisGPT
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Done Right
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI does the heavy lifting. Lawyers ensure perfection. You get
                results at a fraction of the cost and time.
              </p>
            </RevealSection>

            <motion.div
              className="grid md:grid-cols-2 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {[
                { icon: Zap, title: "80% AI, 20% Lawyer", desc: "Our AI workflows draft, research, and analyze. Lawyers focus on what matters — review and finalization." },
                { icon: IndianRupee, title: "60-80% Cost Savings", desc: "Same quality as top law firms at a fraction of the price. Fixed upfront pricing — no hourly surprises." },
                { icon: Clock, title: "Same-Day Turnaround", desc: "AI-generated drafts in minutes. Lawyer review within hours. Most matters delivered the same day." },
                { icon: Award, title: "Elite Lawyer Network", desc: "Bar Council verified lawyers from top Indian law firms. Every deliverable professionally reviewed." },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div key={index} variants={fadeUp}>
                    <motion.div
                      className="flex gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
                      whileHover={{ x: 4 }}
                    >
                      <motion.div
                        className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== COMPARISON ======================== */}
      <section className="relative z-10 py-28 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                JurisGPT vs Traditional Law Firms
              </h2>
              <p className="text-lg text-muted-foreground">
                See why Indian startups choose us
              </p>
            </RevealSection>

            <RevealSection>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-4 md:p-5 text-sm font-semibold">Feature</th>
                      <th className="text-center p-4 md:p-5 text-sm font-semibold text-primary">JurisGPT</th>
                      <th className="text-center p-4 md:p-5 text-sm font-semibold text-muted-foreground">Traditional Firms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Contract Price", jurisgpt: "From ₹999", traditional: "₹15,000 - ₹50,000" },
                      { feature: "Turnaround Time", jurisgpt: "Same day", traditional: "2-4 weeks" },
                      { feature: "AI-Powered", jurisgpt: true, traditional: false },
                      { feature: "Lawyer Review", jurisgpt: true, traditional: true },
                      { feature: "Compliance Tracking", jurisgpt: true, traditional: false },
                      { feature: "Legal Research (16M+ cases)", jurisgpt: true, traditional: false },
                      { feature: "Fixed Pricing", jurisgpt: true, traditional: false },
                      { feature: "Unlimited Revisions", jurisgpt: true, traditional: false },
                    ].map((row, index) => (
                      <motion.tr
                        key={index}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4 md:p-5 text-sm font-medium">{row.feature}</td>
                        <td className="p-4 md:p-5 text-center">
                          {typeof row.jurisgpt === "boolean" ? (
                            row.jurisgpt ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
                              >
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              </motion.div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            <span className="text-sm font-semibold text-primary">{row.jurisgpt}</span>
                          )}
                        </td>
                        <td className="p-4 md:p-5 text-center">
                          {typeof row.traditional === "boolean" ? (
                            row.traditional ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.traditional}</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ======================== PRICING ======================== */}
      <section id="pricing" className="relative z-10 py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-16">
              <motion.span
                className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Pricing
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Flexible pricing that scales with you
              </h2>
              <p className="text-lg text-muted-foreground">
                Platform access is separate from individual case quotes. No hidden fees.
              </p>
            </RevealSection>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
                  className={`p-6 rounded-2xl border ${
                    plan.highlighted
                      ? "border-primary bg-primary/[0.02] shadow-lg ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/20"
                  } flex flex-col transition-all duration-300 hover:shadow-lg`}
                >
                  {plan.highlighted && (
                    <motion.div
                      className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 w-fit mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Most Popular
                    </motion.div>
                  )}
                  <div className="mb-1">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                  </div>
                  <div className="mt-4 mb-2">
                    {plan.price === "Free" || plan.price === "Custom" ? (
                      <span className="text-3xl font-bold">{plan.price}</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">₹{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.highlighted ? (
                    <ShimmerButton
                      href="/agreements/new"
                      className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center"
                    >
                      {plan.cta}
                    </ShimmerButton>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="w-full py-2.5 rounded-lg text-sm font-medium text-center block bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section id="testimonials" className="relative z-10 py-28 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                See why founders love using JurisGPT
              </h2>
            </RevealSection>

            <motion.div
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="p-6 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== SECURITY ======================== */}
      <section className="relative z-10 py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Enterprise-grade security
              </h2>
              <p className="text-lg text-muted-foreground">
                Your data is protected. Attorney-client privilege is maintained.
              </p>
            </RevealSection>

            <motion.div
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {[
                { icon: Lock, title: "End-to-End Encryption", desc: "All documents encrypted in transit and at rest using AES-256." },
                { icon: Shield, title: "DPDPA Compliant", desc: "Full compliance with India's Digital Personal Data Protection Act, 2023." },
                { icon: Globe, title: "Indian Data Residency", desc: "All data stored on Indian servers. Never shared with third parties." },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div key={index} variants={fadeUp}>
                    <motion.div
                      className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                      whileHover={{ y: -4 }}
                    >
                      <motion.div
                        className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </motion.div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== FAQ ======================== */}
      <section id="faq" className="relative z-10 py-28 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-12">
              <motion.span
                className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                FAQ
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Questions
              </h2>
            </RevealSection>

            <RevealSection>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-border/50"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium hover:text-primary transition-colors py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ======================== CTA ======================== */}
      <section className="relative z-10 py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto text-center p-12 md:p-16 bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-3xl border border-border shadow-lg relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/logo.png" alt="JurisGPT" width={48} height={48} className="mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Submit your first legal matter for free. No credit card required.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <ShimmerButton
                  href="/agreements/new"
                  className="px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </ShimmerButton>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3.5 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 transition-all inline-block"
                  >
                    Book a Demo
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================== FOOTER ======================== */}
      <footer className="border-t border-border bg-card relative z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <motion.div
                className="flex items-center gap-2 mb-4"
                whileHover={{ x: 2 }}
              >
                <Image src="/logo.png" alt="JurisGPT" width={24} height={24} />
                <span className="font-semibold text-lg">JurisGPT</span>
              </motion.div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered legal services platform for Indian startups, MSMEs,
                and individuals. Bridging the justice gap with technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: "Legal Forms", href: "/dashboard/forms" },
                  { label: "Legal Research", href: "/dashboard/search" },
                  { label: "Compliance", href: "/dashboard/compliance" },
                  { label: "AI Chat", href: "/dashboard/chat" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary transition-colors hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: "Support", href: "/dashboard/support" },
                  { label: "About", href: "/dashboard/team" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary transition-colors hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Privacy Policy", "Terms of Service", "Trust Portal"].map((label) => (
                  <li key={label}>
                    <Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <div className="flex flex-col items-center gap-4">
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary/70" />
                  <span>Bar Council Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary/70" />
                  <span>DPDPA Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary/70" />
                  <span>Indian Data Residency</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                &copy; 2026 JurisGPT. All rights reserved. JurisGPT connects
                users with independent attorneys and is not a law firm.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
