"use client";

import Link from "next/link";
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
} from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";

const services = [
  {
    icon: FileText,
    title: "Contracts",
    desc: "NDA, MSA, employment, freelancer agreements, MoU, rental and more",
  },
  {
    icon: Shield,
    title: "Compliance",
    desc: "GST, ROC filings, TDS, PF/ESI, Shops Act and state-wise tracking",
  },
  {
    icon: Building2,
    title: "Corporate",
    desc: "Incorporation, DPIIT registration, equity, ESOP pools, board resolutions",
  },
  {
    icon: Users,
    title: "Employment",
    desc: "Offer letters, employment contracts, ESOP, contractor setup, policies",
  },
  {
    icon: Search,
    title: "Legal Research",
    desc: "AI-powered search across 16M+ Indian judgments, statutes and case law",
  },
  {
    icon: UserCheck,
    title: "Fractional GC",
    desc: "On-demand general counsel for your day-to-day legal needs",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Submit a legal matter",
    desc: "Share your legal need at no cost. Contracts, compliance, research — anything.",
    icon: Send,
  },
  {
    step: "02",
    title: "Get fixed pricing",
    desc: "Transparent upfront pricing in INR. No hourly billing, no surprises.",
    icon: IndianRupee,
  },
  {
    step: "03",
    title: "AI gets to work",
    desc: "Our AI handles 80% of the work — drafting, research, analysis. You pay only for the final 20%.",
    icon: Zap,
  },
  {
    step: "04",
    title: "Lawyer reviews",
    desc: "Experienced Indian lawyers review and finalize every deliverable. Same-day turnaround.",
    icon: Scale,
  },
];

const pricingPlans = [
  {
    name: "Naagrik",
    subtitle: "Citizen",
    price: "Free",
    period: "",
    description: "Get started with your first legal matter",
    features: [
      "Submit your first legal matter free",
      "Basic legal information & rights guide",
      "Secure document storage",
      "Connect with a verified lawyer",
      "Pay per case after first matter",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Udyami",
    subtitle: "Entrepreneur",
    price: "999",
    period: "/mo",
    description: "For startups and small businesses",
    features: [
      "Everything in Naagrik",
      "5 contracts per month",
      "Compliance deadline alerts",
      "AI legal research access",
      "Free 1:1 lawyer consultation",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Vyapar",
    subtitle: "Business",
    price: "4,999",
    period: "/mo",
    description: "For growing companies",
    features: [
      "Everything in Udyami",
      "Unlimited contracts",
      "Full compliance tracking & filing",
      "Contract analyzer & risk scoring",
      "Document vault with version history",
      "Priority lawyer review",
      "Phone & chat support",
    ],
    cta: "Get in Touch",
    highlighted: false,
  },
  {
    name: "Nigam",
    subtitle: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Everything in Vyapar",
      "Dedicated account manager",
      "Custom workflows & playbooks",
      "API access & integrations",
      "Advanced security controls",
      "Team management & RBAC",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Co-founder, TechStart",
    content:
      "JurisGPT delivered our founder agreement the same day for under ₹1,000. They move at startup speed and keep costs founder-friendly.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Founder, HealthTech India",
    content:
      "The AI handles the heavy lifting and the lawyer review catches everything. We moved fast without worrying about legal risk.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "CEO, FinServ Solutions",
    content:
      "JurisGPT delivered fast, actionable guidance on a complex corporate structuring issue. Their compliance tracking alone saves us hours.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "What is JurisGPT?",
    answer:
      "JurisGPT is an AI-powered legal services platform for India. We combine advanced AI that handles 80% of legal work with experienced Indian lawyers who finalize the remaining 20% — delivering fast, affordable, and reliable legal services.",
  },
  {
    question: "What does 'lawyer review' mean?",
    answer:
      "Every legal deliverable is reviewed by an experienced Indian lawyer before it reaches you. Our lawyers are Bar Council verified and bound by professional duties including confidentiality and attorney-client privilege.",
  },
  {
    question: "How is pricing determined?",
    answer:
      "We provide fixed, upfront pricing for every matter — no hourly billing, no surprises. Our AI handles 80% of the work, which means you only pay for the final 20% of lawyer time. This makes our services 60-80% cheaper than traditional law firms.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use end-to-end encryption, comply with DPDPA (Digital Personal Data Protection Act, 2023), and store all data on Indian servers. Attorney-client privilege is maintained on every matter.",
  },
  {
    question: "What types of legal matters can I submit?",
    answer:
      "Contracts (NDA, MSA, employment, freelancer, rental, MoU, PoA), compliance (GST, ROC, TDS, PF/ESI), corporate matters (incorporation, equity, ESOP), legal research, RTI applications, and more. If it's a legal need, we can help.",
  },
  {
    question: "How fast is the turnaround?",
    answer:
      "Most matters are delivered same-day. AI-generated drafts are ready in minutes, and lawyer review typically completes within 24 hours. Our average turnaround is under 18 hours.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Your first legal matter is completely free on the Naagrik plan. Submit any legal need — a contract, a compliance question, legal research — and experience the platform before committing.",
  },
];

export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowBackToTop(latest > 400);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background relative">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Navigation — Arcline-style sticky nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">JurisGPT</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("solutions")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Questions
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Login
            </Link>
            <Link
              href="/agreements/new"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Back to Top */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: showBackToTop ? 1 : 0,
          opacity: showBackToTop ? 1 : 0,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
      >
        <ArrowUp className="h-4 w-4" />
      </motion.button>

      {/* ======================== HERO ======================== */}
      <section className="relative z-10 pt-20 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                AI-Native Legal Platform for India
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight"
            >
              Legal for Indian
              <br />
              startups.{" "}
              <span className="text-primary">Done right.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              AI-powered legal designed for Indian startups and MSMEs. Our AI
              handles 80% of the work. Elite lawyers finalize the rest.
              Same-day delivery. Fixed pricing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link
                href="/agreements/new"
                className="px-8 py-3.5 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                Start Your First Matter — Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3.5 bg-background border border-border text-foreground rounded-md font-medium hover:bg-secondary/50 transition-all"
              >
                Book a Demo
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>Bar Council Verified Lawyers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" />
                <span>DPDPA Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                <span>Indian Data Residency</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== STATS BAR ======================== */}
      <section className="relative z-10 py-12 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
            {[
              { value: "16M+", label: "Indian Judgments" },
              { value: "100+", label: "Verified Lawyers" },
              { value: "500+", label: "Startups Served" },
              { value: "18hrs", label: "Avg. Turnaround" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== SERVICES GRID ======================== */}
      <section id="solutions" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI-powered legal designed for startups
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From contracts to compliance to corporate structuring — everything
                your business needs, powered by AI and verified by lawyers.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="group p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Explore all services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== HOW IT WORKS ======================== */}
      <section className="relative z-10 py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Simple, fast, and reliable. From submission to delivery.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative text-center"
                  >
                    <div className="relative inline-block mb-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== DONE RIGHT (Value Prop) ======================== */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Done Right
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI does the heavy lifting. Lawyers ensure perfection. You get
                results at a fraction of the cost and time.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: Zap,
                  title: "80% AI, 20% Lawyer",
                  desc: "Our AI workflows draft, research, and analyze. Lawyers focus on what matters — review and finalization.",
                },
                {
                  icon: IndianRupee,
                  title: "60-80% Cost Savings",
                  desc: "Same quality as top law firms at a fraction of the price. Fixed upfront pricing — no hourly surprises.",
                },
                {
                  icon: Clock,
                  title: "Same-Day Turnaround",
                  desc: "AI-generated drafts in minutes. Lawyer review within hours. Most matters delivered the same day.",
                },
                {
                  icon: Award,
                  title: "Elite Lawyer Network",
                  desc: "Bar Council verified lawyers from top Indian law firms. Every deliverable professionally reviewed.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-4 p-5 rounded-xl border border-border hover:border-primary/20 hover:bg-card transition-all"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== COMPARISON TABLE ======================== */}
      <section className="relative z-10 py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                JurisGPT vs Traditional Law Firms
              </h2>
              <p className="text-lg text-muted-foreground">
                See why Indian startups choose us
              </p>
            </motion.div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 text-sm font-semibold">
                      Feature
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-primary">
                      JurisGPT
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">
                      Traditional Firms
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Contract Price",
                      jurisgpt: "From ₹999",
                      traditional: "₹15,000 - ₹50,000",
                    },
                    {
                      feature: "Turnaround Time",
                      jurisgpt: "Same day",
                      traditional: "2-4 weeks",
                    },
                    {
                      feature: "AI-Powered",
                      jurisgpt: true,
                      traditional: false,
                    },
                    {
                      feature: "Lawyer Review",
                      jurisgpt: true,
                      traditional: true,
                    },
                    {
                      feature: "Compliance Tracking",
                      jurisgpt: true,
                      traditional: false,
                    },
                    {
                      feature: "Legal Research (16M+ cases)",
                      jurisgpt: true,
                      traditional: false,
                    },
                    {
                      feature: "Fixed Pricing",
                      jurisgpt: true,
                      traditional: false,
                    },
                    {
                      feature: "Unlimited Revisions",
                      jurisgpt: true,
                      traditional: false,
                    },
                  ].map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="p-4 text-sm font-medium">
                        {row.feature}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.jurisgpt === "boolean" ? (
                          row.jurisgpt ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {row.jurisgpt}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.traditional === "boolean" ? (
                          row.traditional ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {row.traditional}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== PRICING ======================== */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Flexible pricing that scales with you
              </h2>
              <p className="text-lg text-muted-foreground">
                Platform access is separate from individual case quotes.
                No hidden fees.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={`p-6 rounded-xl border ${
                    plan.highlighted
                      ? "border-primary bg-primary/[0.02] shadow-md ring-1 ring-primary/20"
                      : "border-border bg-card"
                  } flex flex-col`}
                >
                  {plan.highlighted && (
                    <div className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 w-fit mb-4">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-1">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {plan.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 mb-2">
                    {plan.price === "Free" || plan.price === "Custom" ? (
                      <span className="text-3xl font-bold">{plan.price}</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          ₹{plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.highlighted ? "/agreements/new" : "/dashboard"}
                    className={`w-full py-2.5 rounded-md text-sm font-medium text-center block transition-colors ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section className="relative z-10 py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See why founders love using JurisGPT
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-card rounded-xl border border-border"
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== SECURITY ======================== */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Enterprise-grade security
              </h2>
              <p className="text-lg text-muted-foreground">
                Your data is protected. Attorney-client privilege is maintained.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Lock,
                  title: "End-to-End Encryption",
                  desc: "All documents encrypted in transit and at rest using AES-256.",
                },
                {
                  icon: Shield,
                  title: "DPDPA Compliant",
                  desc: "Full compliance with India's Digital Personal Data Protection Act, 2023.",
                },
                {
                  icon: Globe,
                  title: "Indian Data Residency",
                  desc: "All data stored on Indian servers. Never shared with third parties.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="p-5 rounded-xl border border-border bg-card"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== FAQ ======================== */}
      <section id="faq" className="relative z-10 py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Questions
              </h2>
            </motion.div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-border/50"
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:text-primary transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ======================== CTA ======================== */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-12 bg-card rounded-2xl border border-border shadow-sm"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Submit your first legal matter for free. No credit card required.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/agreements/new"
                className="px-8 py-3.5 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3.5 bg-background border border-border text-foreground rounded-md font-medium hover:bg-secondary/50 transition-all"
              >
                Book a Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================== FOOTER ======================== */}
      <footer className="border-t border-border bg-card relative z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">JurisGPT</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered legal services platform for Indian startups, MSMEs,
                and individuals. Bridging the justice gap with technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/dashboard/forms"
                    className="hover:text-primary transition-colors"
                  >
                    Legal Forms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/search"
                    className="hover:text-primary transition-colors"
                  >
                    Legal Research
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/compliance"
                    className="hover:text-primary transition-colors"
                  >
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/chat"
                    className="hover:text-primary transition-colors"
                  >
                    AI Chat
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/dashboard/support"
                    className="hover:text-primary transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/team"
                    className="hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Trust Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-muted-foreground">
                &copy; 2026 JurisGPT. All rights reserved. JurisGPT connects
                users with independent attorneys and is not a law firm.
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
