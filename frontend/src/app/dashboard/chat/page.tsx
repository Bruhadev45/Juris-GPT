"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
  Search,
  FileText,
  FileSearch,
  Plus,
  SlidersHorizontal,
  ArrowUp,
  ArrowLeft,
  Bell,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Scale,
  BookOpen,
  Paperclip,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileDown,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  MessageSquare,
  Mic,
  Settings,
  MoreHorizontal,
  Share2,
  Bookmark,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Database,
  History,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "./chat-context";
import type { ChatMessage, Citation, ConfidenceLevel } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ActionCard {
  icon: React.ElementType;
  title: string;
  description: string;
  prompt: string;
  gradient: string;
  iconBg: string;
}

const actionCards: ActionCard[] = [
  {
    icon: Search,
    title: "Research A Question",
    description: "Ask about startup, corporate, contract, or compliance law in plain English",
    prompt: "What are the annual compliance requirements for a private limited company in India?",
    gradient: "from-primary/10 via-primary/5 to-transparent",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Find A Statute",
    description: "Look up a section, act, or legal provision with supporting source snippets",
    prompt: "What does Section 149 of the Companies Act say about directors?",
    gradient: "from-[#4A6B5C]/10 via-[#4A6B5C]/5 to-transparent",
    iconBg: "bg-[#E8EFE9] text-[#4A6B5C]",
  },
  {
    icon: FileSearch,
    title: "Check A Clause",
    description: "Understand enforceability, risk, and legal context before drafting or review",
    prompt: "Are non-compete clauses enforceable in India for startup employees?",
    gradient: "from-[#B8884D]/15 via-[#B8884D]/5 to-transparent",
    iconBg: "bg-[#F5EBD8] text-[#B8884D]",
  },
  {
    icon: ScrollText,
    title: "Route To Drafting",
    description: "Research the clauses first, then move into drafting workflows only when needed",
    prompt: "What clauses should be included in a founder agreement before I draft it?",
    gradient: "from-stone-500/10 via-stone-500/5 to-transparent",
    iconBg: "bg-stone-500/10 text-stone-700 dark:text-stone-200",
  },
];

const suggestedPrompts = [
  "What filings are due this quarter for a private limited company?",
  "What are the standard founder vesting terms for an Indian startup?",
  "What does the Companies Act require for appointment of directors?",
  "What clauses should I review before drafting a service agreement?",
];

/* ─── Animated Background ─── */
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "4px 4px",
        }}
      />
    </div>
  );
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 items-start"
    >
      <motion.div
        className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Image src="/logo.png" alt="AI" width={20} height={20} />
      </motion.div>
      <div className="bg-gradient-to-br from-card to-card/80 border border-border/60 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-lg shadow-black/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-gradient-to-t from-primary to-primary/60"
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="ml-1 text-sm text-muted-foreground font-medium">Analyzing...</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Copy Button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Copy response"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Document Helpers ─── */
function extractDocumentContent(content: string | undefined | null): { document: string; explanation: string } | null {
  if (!content || typeof content !== 'string') return null;

  const startMarker = "---DOCUMENT_START---";
  const endMarker = "---DOCUMENT_END---";

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const document = content.slice(startIndex + startMarker.length, endIndex).trim();
    const explanation = content.slice(endIndex + endMarker.length).trim();
    return { document: document || "", explanation: explanation || "" };
  }

  return null;
}

function getDocumentTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    nda: "Non-Disclosure Agreement",
    employment_letter: "Employment Letter",
    service_agreement: "Service Agreement",
    consulting_agreement: "Consulting Agreement",
    founder_agreement: "Founder Agreement",
    shareholders_agreement: "Shareholders Agreement",
    mou: "Memorandum of Understanding",
    partnership_deed: "Partnership Deed",
    legal_notice: "Legal Notice",
    power_of_attorney: "Power of Attorney",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    ip_assignment: "IP Assignment Agreement",
    lease_agreement: "Lease Agreement",
    investment_agreement: "Investment Agreement",
    affidavit: "Affidavit",
    legal_document: "Legal Document",
  };
  return labels[type || ""] || "Legal Document";
}

/* ─── Document Action Buttons ─── */
function DocumentActions({ documentContent, documentType }: { documentContent: string; documentType?: string }) {
  const [copied, setCopied] = useState(false);
  const content = documentContent || "";

  const handleCopyDocument = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = documentType
      ? `${documentType.replace(/_/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`
      : `legal-document-${new Date().toISOString().split("T")[0]}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = () => {
    if (!content) return;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${getDocumentTypeLabel(documentType)}</title>
<style>
body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
h1, h2, h3 { font-weight: bold; }
</style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif;">${content}</pre>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = documentType
      ? `${documentType.replace(/_/g, "-")}-${new Date().toISOString().split("T")[0]}.doc`
      : `legal-document-${new Date().toISOString().split("T")[0]}.doc`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40"
    >
      <motion.button
        onClick={handleCopyDocument}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm",
          copied
            ? "bg-green-500/10 text-green-600 border border-green-500/30"
            : "bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/15 hover:to-primary/10 border border-primary/20"
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Document
          </>
        )}
      </motion.button>

      <motion.button
        onClick={handleDownload}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border/40 transition-all shadow-sm"
      >
        <Download className="h-4 w-4" />
        Download .txt
      </motion.button>

      <motion.button
        onClick={handleDownloadDocx}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border/40 transition-all shadow-sm"
      >
        <FileDown className="h-4 w-4" />
        Download .doc
      </motion.button>
    </motion.div>
  );
}

/* ─── Confidence Badge ─── */
function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config: Record<ConfidenceLevel, { label: string; className: string; icon: React.ReactNode }> = {
    high: {
      label: "High Confidence",
      className: "bg-gradient-to-r from-green-500/15 to-green-500/5 text-green-700 border-green-500/30 dark:text-green-400",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    medium: {
      label: "Medium Confidence",
      className: "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-700 border-amber-500/30 dark:text-amber-400",
      icon: <Info className="h-3.5 w-3.5" />,
    },
    low: {
      label: "Low Confidence",
      className: "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-700 border-orange-500/30 dark:text-orange-400",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    insufficient: {
      label: "Insufficient Data",
      className: "bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-700 border-red-500/30 dark:text-red-400",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  };

  const { label, className, icon } = config[confidence];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm",
        className
      )}
    >
      {icon}
      {label}
    </motion.span>
  );
}

/* ─── Grounded Indicator ─── */
function GroundedIndicator({ grounded }: { grounded: boolean }) {
  if (!grounded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Grounded in citations
    </motion.div>
  );
}

/* ─── Data Source Badge ─── */
function DataSourceBadge({ modelUsed }: { modelUsed?: string }) {
  if (!modelUsed || modelUsed === "greeting" || modelUsed === "validation") return null;

  const sourceConfig: Record<string, { label: string; description: string; className: string }> = {
    "local_legal_llama": {
      label: "Local Legal LLM",
      description: "Indian Legal Llama (local GGUF)",
      className: "bg-gradient-to-r from-violet-500/15 to-violet-500/5 text-violet-700 border-violet-500/30 dark:text-violet-400",
    },
    "openai": {
      label: "OpenAI + RAG",
      description: "GPT-4o with corpus retrieval",
      className: "bg-gradient-to-r from-sky-500/15 to-sky-500/5 text-sky-700 border-sky-500/30 dark:text-sky-400",
    },
    "openai-gpt4o": {
      label: "OpenAI GPT-4o",
      description: "Direct OpenAI (no RAG corpus)",
      className: "bg-gradient-to-r from-sky-500/15 to-sky-500/5 text-sky-700 border-sky-500/30 dark:text-sky-400",
    },
    "local-lexical": {
      label: "Local Corpus",
      description: "Lexical search on local legal data",
      className: "bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 border-teal-500/30 dark:text-teal-400",
    },
    "retrieval-only": {
      label: "Retrieval Only",
      description: "Direct retrieval from legal corpus",
      className: "bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 border-teal-500/30 dark:text-teal-400",
    },
    "hardcoded-fallback": {
      label: "Offline",
      description: "Pre-configured offline response",
      className: "bg-gradient-to-r from-gray-500/15 to-gray-500/5 text-gray-700 border-gray-500/30 dark:text-gray-400",
    },
    "sample-faq": {
      label: "Sample FAQ",
      description: "Local sample legal FAQ data",
      className: "bg-gradient-to-r from-gray-500/15 to-gray-500/5 text-gray-700 border-gray-500/30 dark:text-gray-400",
    },
  };

  const config = sourceConfig[modelUsed] || {
    label: modelUsed,
    description: `Source: ${modelUsed}`,
    className: "bg-gradient-to-r from-gray-500/15 to-gray-500/5 text-gray-700 border-gray-500/30 dark:text-gray-400",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      title={config.description}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm cursor-help",
        config.className
      )}
    >
      <Zap className="h-3 w-3" />
      {config.label}
    </motion.span>
  );
}

/* ─── Citation Card ─── */
function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const relevancePercent = Math.round((citation?.relevance ?? 0) * 100);
  const content = citation?.content ?? "";

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return "bg-gradient-to-r from-green-500/15 to-green-500/5 text-green-700 border-green-500/30 dark:text-green-400";
    if (relevance >= 0.6) return "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-700 border-amber-500/30 dark:text-amber-400";
    return "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-700 border-orange-500/30 dark:text-orange-400";
  };

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength).trim() + "...";
  };

  // Flash highlight when scrolled to via inline citation link
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === `#citation-${index + 1}`) {
        setHighlighted(true);
        setTimeout(() => setHighlighted(false), 2000);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [index]);

  return (
    <motion.div
      id={`citation-${index + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: highlighted ? "0 0 0 2px hsl(var(--primary))" : "none",
      }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group border rounded-xl bg-gradient-to-br from-card to-card/50 overflow-hidden hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 scroll-mt-24",
        highlighted ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60"
      )}
    >
      <div className="p-4">
        {/* Header with title and relevance */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold flex items-center justify-center shadow-sm">
              {index + 1}
            </span>
            <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {citation?.title ?? "Untitled"}
            </h4>
          </div>
          <span
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm",
              getRelevanceColor(citation?.relevance ?? 0)
            )}
          >
            {relevancePercent}%
          </span>
        </div>

        {/* Doc type and source */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="px-2 py-1 rounded-md bg-secondary/80 text-secondary-foreground font-medium">
            {citation?.doc_type ?? "Document"}
          </span>
          {citation?.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-primary hover:underline font-medium flex items-center gap-1"
            >
              {citation?.source ?? "Source"}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="truncate text-muted-foreground">{citation?.source ?? "Unknown source"}</span>
          )}
        </div>

        {/* Section/Act info if available */}
        {(citation?.section || citation?.act) && (
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            {citation.act && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <Scale className="h-3 w-3 text-primary/70" />
                {citation.act}
              </span>
            )}
            {citation.section && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <FileText className="h-3 w-3 text-primary/70" />
                Section {citation.section}
              </span>
            )}
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {expanded ? content : truncateContent(content)}
        </div>

        {/* Expand/collapse button */}
        {content.length > 150 && (
          <motion.button
            onClick={() => setExpanded(!expanded)}
            whileHover={{ x: 2 }}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show more
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Inline Citation Marker ─── */
function InlineCitationMarker({ index }: { index: number }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(`citation-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Trigger hashchange for highlight effect
      window.location.hash = `citation-${index}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 hover:scale-110 transition-all cursor-pointer align-super border border-primary/20"
      title={`Jump to citation ${index}`}
    >
      {index}
    </button>
  );
}

/** Replace [1], [2], etc. in markdown text with clickable citation links */
function injectCitationLinks(content: string, citationCount: number): string {
  if (!content || citationCount === 0) return content;
  // Replace [N] patterns where N is 1..citationCount with markdown links
  return content.replace(/\[(\d+)\]/g, (match, numStr) => {
    const num = parseInt(numStr, 10);
    if (num >= 1 && num <= citationCount) {
      // Use a special anchor that we'll intercept in the custom renderer
      return `[<sup>${num}</sup>](#citation-${num})`;
    }
    return match;
  });
}

/* ─── Citations Section ─── */
function CitationsSection({ citations }: { citations: Citation[] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 pt-5 border-t border-border/40"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Citations
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {citations.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="p-1 rounded-lg group-hover:bg-secondary transition-colors"
        >
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 overflow-hidden"
          >
            {citations.filter(Boolean).map((citation, index) => (
              <CitationCard key={index} citation={citation} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Limitations Section ─── */
function LimitationsSection({ limitations }: { limitations: string }) {
  if (!limitations) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-amber-500/15">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Limitations</span>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{limitations}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Follow-up Questions / Suggestions ─── */
function FollowUpQuestions({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect: (question: string) => void;
}) {
  if (!questions || questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 pt-5 border-t border-border/40"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Suggested follow-ups</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-secondary to-secondary/80 hover:from-primary/10 hover:to-primary/5 text-secondary-foreground hover:text-primary border border-border/40 hover:border-primary/30 transition-all shadow-sm"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({
  message,
  isLatest,
  onFollowUpSelect,
}: {
  message: ChatMessage;
  isLatest: boolean;
  onFollowUpSelect?: (question: string) => void;
}) {
  // Early return for undefined message
  if (!message) return null;

  const isUser = message.role === "user";
  const messageContent = message.content ?? "";
  const time = new Date(message?.timestamp || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Check if this message contains a generated document
  const documentData = !isUser && messageContent ? extractDocumentContent(messageContent) : null;
  const isDocumentMessage = documentData !== null || message?.isDocument;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI Avatar */}
      {!isUser && (
        <motion.div
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mt-1 shadow-sm border border-primary/10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Image src="/logo.png" alt="AI" width={20} height={20} />
        </motion.div>
      )}

      <div className={cn("flex flex-col", isUser ? "items-end max-w-[75%]" : "items-start", isDocumentMessage && !isUser ? "max-w-[85%]" : "max-w-[75%]")}>
        {/* Document Header Badge */}
        {isDocumentMessage && !isUser && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 shadow-sm"
          >
            <ScrollText className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {getDocumentTypeLabel(message?.documentType)} Generated
            </span>
          </motion.div>
        )}

        <div
          className={cn(
            "rounded-2xl px-5 py-4 shadow-lg transition-all",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md shadow-primary/20"
              : isDocumentMessage
                ? "bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 text-card-foreground rounded-tl-md"
                : "bg-gradient-to-br from-card to-card/80 border border-border/60 text-card-foreground rounded-tl-md shadow-black/5"
          )}
        >
          {!isUser ? (
            <>
              {documentData && documentData.document ? (
                <>
                  {/* Document Content with Special Formatting */}
                  <div className="mb-4">
                    <div className="bg-muted/40 rounded-xl p-5 border border-border/40 font-mono text-[13px] leading-relaxed overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-foreground/90">{documentData.document || ""}</pre>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <DocumentActions
                    documentContent={documentData.document || ""}
                    documentType={message?.documentType}
                  />

                  {/* Explanation */}
                  {documentData.explanation && (
                    <div className="mt-5 pt-5 border-t border-border/40">
                      <div className="text-[14px] leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:my-3 prose-headings:text-primary prose-a:text-primary prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{documentData.explanation}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Confidence, Grounded, and Data Source indicators */}
                  {(message?.confidence || message?.grounded || message?.modelUsed) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {message?.confidence && (
                        <ConfidenceBadge confidence={message.confidence} />
                      )}
                      {message?.grounded && (
                        <GroundedIndicator grounded={message.grounded} />
                      )}
                      {message?.modelUsed && (
                        <DataSourceBadge modelUsed={message.modelUsed} />
                      )}
                    </div>
                  )}

                  {/* Main answer content */}
                  <div className="text-[14px] leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:my-3 prose-headings:text-primary prose-headings:font-semibold prose-a:text-primary prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-strong:text-foreground prose-strong:font-semibold">
                    <ReactMarkdown
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        a: ({ href, children, ...props }) => {
                          // Intercept citation anchor links
                          if (href?.startsWith("#citation-")) {
                            const num = href.replace("#citation-", "");
                            return (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const el = document.getElementById(href.slice(1));
                                  if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                                    window.location.hash = href.slice(1);
                                  }
                                }}
                                className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 hover:scale-110 transition-all cursor-pointer align-super border border-primary/20 no-underline"
                                title={`Jump to citation ${num}`}
                              >
                                {num}
                              </button>
                            );
                          }
                          return <a href={href} {...props}>{children}</a>;
                        },
                      }}
                    >
                      {injectCitationLinks(messageContent, message?.citations?.length ?? 0)}
                    </ReactMarkdown>
                  </div>

                  {/* Limitations */}
                  {message?.limitations && (
                    <LimitationsSection limitations={message.limitations} />
                  )}

                  {/* Citations */}
                  {message?.citations && message.citations.length > 0 && (
                    <CitationsSection citations={message.citations} />
                  )}

                  {/* Follow-up questions (new format) or suggestions (legacy format) */}
                  {(message?.followUpQuestions || message?.suggestions) && onFollowUpSelect && (
                    <FollowUpQuestions
                      questions={message.followUpQuestions || message.suggestions || []}
                      onSelect={onFollowUpSelect}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-[14px] leading-relaxed">{messageContent}</p>
          )}
        </div>

        {/* Message meta */}
        <div
          className={cn(
            "flex items-center gap-2 mt-2 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[11px] text-muted-foreground/50 font-medium">{time}</span>
          {!isUser && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={messageContent} />
              <motion.button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-green-600 hover:bg-green-500/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Helpful"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-500/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Not helpful"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Regenerate"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Avatar className="h-9 w-9 flex-shrink-0 mt-1 shadow-lg shadow-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
              S
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Chat Input Component ─── */
function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  compact = false,
}: {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  compact?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, compact ? 120 : 160)}px`;
    }
  }, [input, compact]);

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-2xl transition-all duration-300",
        isFocused || input.trim()
          ? "shadow-xl shadow-primary/10"
          : "shadow-lg shadow-black/5"
      )}
    >
      {/* Animated gradient border */}
      <div className={cn(
        "absolute -inset-[1px] rounded-2xl bg-gradient-to-r transition-all duration-500",
        isFocused || input.trim()
          ? "from-primary via-primary/60 to-primary opacity-100"
          : "from-border via-border/50 to-border opacity-60"
      )} />

      <div className={cn(
        "relative rounded-2xl bg-card",
        compact ? "p-3" : "p-4"
      )}>
        {/* Input Area */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask about company law, contracts, compliance, or draft documents..."
              className={cn(
                "resize-none border-0 bg-transparent p-0 placeholder:text-muted-foreground/40 focus-visible:ring-0 text-[15px] leading-relaxed",
                compact ? "min-h-[40px]" : "min-h-[60px]"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Attach document for review"
            >
              <Paperclip className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Attach</span>
            </motion.button>
            <div className="w-px h-5 bg-border/60 mx-1" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Quick templates"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Templates</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Hint Text */}
            <AnimatePresence>
              {input.trim() && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/50"
                >
                  <kbd className="px-2 py-1 rounded-lg bg-secondary text-[10px] font-semibold border border-border/50">↵</kbd>
                  <span>to send</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <motion.button
              onClick={onSubmit}
              disabled={!input.trim() || isLoading}
              whileHover={input.trim() && !isLoading ? { scale: 1.05, y: -1 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-300",
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                  : "bg-secondary/80 text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="hidden sm:inline">Thinking...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Send</span>
                  <ArrowUp className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Conversation Sidebar ─── */
function ConversationSidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const {
    conversations,
    activeConversationId,
    switchConversation,
    createNewConversation,
    deleteConversation,
  } = useChat();

  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative z-20 flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-lg overflow-hidden"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">History</span>
          <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
            {conversations.length}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <PanelLeftClose className="h-4 w-4" />
        </motion.button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={createNewConversation}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </motion.button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground/50">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <motion.div
              key={conv.id}
              whileHover={{ x: 2 }}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left",
                conv.id === activeConversationId
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchConversation(conv.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} &middot;{" "}
                  {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="p-1 rounded-md text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </motion.button>
            </motion.div>
          ))
        )}
      </div>

      {/* Sidebar Footer — corpus info */}
      <div className="px-4 py-3 border-t border-border/40 bg-secondary/30">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <Database className="h-3 w-3" />
          <span>Local corpus &middot; 183 legal docs</span>
        </div>
      </div>
    </motion.aside>
  );
}

/* ─── Chat Page Content ─── */
function ChatPageContent() {
  const { activeConversation, activeConversationId, addMessage, conversations, createNewConversation } = useChat();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const seededQuery = searchParams?.get("q");
    if (seededQuery && !hasMessages && !input.trim()) {
      setInput(seededQuery);
    }
  }, [searchParams, hasMessages, input]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    const savedInput = input;
    setInput("");
    setIsLoading(true);

    // Build conversation history for context
    const history = messages
      .filter(Boolean)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    // Try SSE streaming first, fall back to standard fetch
    const aiMessageId = crypto.randomUUID();
    let streamedContent = "";
    let streamStarted = false;
    let streamCompleted = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("Stream timeout"));
        }, 60000);

        fetch(`${API_BASE}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: savedInput,
            conversation_id: activeConversationId,
            conversation_history: history,
          }),
          signal: controller.signal,
        })
          .then(async (response) => {
            if (!response.ok || !response.body) {
              throw new Error("Stream not available");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let currentEvent = "";
            let citations: Citation[] | undefined;
            let metadata: {
              confidence?: string;
              limitations?: string;
              grounded?: boolean;
	              follow_up_questions?: string[];
	              model_used?: string;
	              is_document?: boolean;
	              document_type?: string;
	            } = {};

            // Add initial empty AI message for progressive rendering
            const initialAiMessage: ChatMessage = {
              id: aiMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date().toISOString(),
	            };
	            addMessage(initialAiMessage);
	            streamStarted = true;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7).trim();
                } else if (line.startsWith("data: ") && currentEvent) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    switch (currentEvent) {
                      case "token":
                        streamedContent += parsed.token;
                        // Update the existing message in-place
                        addMessage({
                          id: aiMessageId,
                          role: "assistant",
                          content: streamedContent,
                          timestamp: new Date().toISOString(),
                        });
                        break;
                      case "citations":
                        citations = parsed;
                        break;
                      case "metadata":
                        metadata = parsed;
                        break;
                      case "done":
                        // Final update with all metadata
                        addMessage({
                          id: aiMessageId,
                          role: "assistant",
                          content: streamedContent,
                          timestamp: new Date().toISOString(),
                          citations: citations,
                          confidence: metadata.confidence as ChatMessage["confidence"],
                          limitations: metadata.limitations,
                          grounded: metadata.grounded || false,
	                          followUpQuestions: metadata.follow_up_questions,
	                          modelUsed: metadata.model_used || undefined,
	                          isDocument: metadata.is_document || false,
	                          documentType: metadata.document_type || undefined,
	                        });
	                        streamCompleted = true;
	                        break;
                      case "error":
                        reject(new Error(parsed.error));
                        return;
                    }
                  } catch (parseErr) {
                    console.warn("Skipping malformed SSE JSON:", parseErr);
                  }
                  currentEvent = "";
                }
              }
            }

            clearTimeout(timeout);
            resolve();
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      });
    } catch (streamErr) {
	      console.warn("SSE streaming unavailable, falling back to fetch:", streamErr);
	      // Streaming failed or not available — fall back to standard fetch
	      if (!streamStarted || !streamCompleted) {
	        try {
	          const response = await fetch(`${API_BASE}/api/chat/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: savedInput,
              conversation_id: activeConversationId,
              conversation_history: history,
            }),
          });

          const data = await response.json();
          const messageContent = data.answer || data.message || "I couldn't process your request. Please try again.";

          const aiMessage: ChatMessage = {
            id: aiMessageId,
            role: "assistant",
            content: messageContent,
            timestamp: new Date().toISOString(),
            isDocument: data.is_document || false,
            documentType: data.document_type || undefined,
            citations: data.citations || undefined,
            confidence: data.confidence || undefined,
            limitations: data.limitations || undefined,
            grounded: data.grounded || false,
            followUpQuestions: data.follow_up_questions || undefined,
            modelUsed: data.model_used || undefined,
            suggestions: data.suggestions || undefined,
            sources: data.sources || undefined,
          };
	          addMessage(aiMessage);
	        } catch (error) {
	          console.error("Chat API error:", error);
	          addMessage({
	            id: aiMessageId,
	            role: "assistant",
	            content: streamStarted && streamedContent
	              ? `${streamedContent}\n\nSorry, the response stream ended before metadata could be verified. Please retry if citations are missing.`
	              : "Sorry, I couldn't connect to the server. Please make sure the backend is running on http://localhost:8000",
	            timestamp: new Date().toISOString(),
	          });
	        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, activeConversationId, messages]);

  const handleActionCard = (prompt: string) => {
    setInput(prompt);
  };

  const handleFollowUpSelect = useCallback((question: string) => {
    setInput(question);
  }, []);

  return (
    <div className="flex h-full flex-1 bg-background relative">
      {/* ─── Conversation Sidebar ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <ConversationSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col relative">
      <AnimatedBackground />

      {/* ─── Header ─── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-6 py-3"
      >
        <div className="flex items-center gap-2 md:gap-4">
          {/* Sidebar toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title={sidebarOpen ? "Close sidebar" : "Open chat history"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </motion.button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <motion.div whileHover={{ x: -2 }}>
              <ArrowLeft className="h-4 w-4" />
            </motion.div>
            <span className="font-medium hidden sm:inline">Dashboard</span>
          </Link>
          <div className="w-px h-5 bg-border/60" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-500/50 animate-ping" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              JurisGPT
            </span>
            {activeConversation?.title && (
              <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[200px]">
                — {activeConversation.title}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* New Chat */}
          {hasMessages && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createNewConversation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-all"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Share conversation"
          >
            <Share2 className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </motion.button>
          <Avatar className="h-8 w-8 cursor-pointer border-2 border-primary/20 transition-all hover:border-primary/50 hover:scale-105 shadow-lg shadow-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
              S
            </AvatarFallback>
          </Avatar>
        </div>
      </motion.header>

      {/* ─── Main Content ─── */}
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          /* ─── Empty State ─── */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-1 flex-col overflow-hidden"
          >
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="flex min-h-full flex-col items-center justify-center py-8">
            <div className="w-full max-w-2xl">
              {/* Logo + Greeting */}
              <motion.div
                className="mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 shadow-xl shadow-primary/20 border border-primary/10"
                  animate={{
                    y: [0, -6, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image src="/logo.png" alt="JurisGPT" width={40} height={40} />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{greeting},</span>{" "}
                  <span className="text-foreground">there</span>
                </h1>
                <motion.p
                  className="text-lg text-muted-foreground max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Citation-grounded legal research for Indian startup and corporate law
                </motion.p>
              </motion.div>

              {/* Action Cards */}
              <motion.div
                className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                }}
              >
                {actionCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleActionCard(card.prompt)}
                      className={cn(
                        "group flex flex-col items-start rounded-2xl border border-border/60 bg-gradient-to-br p-5 text-left transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
                        card.gradient
                      )}
                    >
                      <div className={cn(
                        "mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-sm",
                        card.iconBg
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-1.5 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground/80">
                        {card.description}
                      </p>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Suggested Prompts */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Zap className="h-3.5 w-3.5 text-primary/60" />
                  <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    Quick prompts
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInput(prompt)}
                      className="rounded-xl border border-border/50 bg-card/80 px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

            </div>
              </div>
            </div>

            {/* Input pinned at bottom */}
            <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4">
              <div className="max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                  />
                </motion.div>

                {/* Security */}
                <motion.div
                  className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-medium">All conversations are confidential and encrypted end-to-end</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Conversation View ─── */
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-1 flex-col overflow-hidden"
          >
            {/* Messages */}
            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto scroll-smooth"
            >
              <div className="max-w-3xl mx-auto px-4 py-8 space-y-6" aria-live="polite" aria-atomic="false">
                {/* Conversation start marker */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 py-6"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-xs text-muted-foreground/70 font-medium border border-border/40">
                    <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                    Conversation started
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                </motion.div>

                {messages.filter(Boolean).map((message, i) => (
                  <MessageBubble
                    key={message?.id || i}
                    message={message}
                    isLatest={i === messages.length - 1}
                    onFollowUpSelect={handleFollowUpSelect}
                  />
                ))}

                <AnimatePresence>
                  {isLoading && <TypingIndicator />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  compact
                />
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="font-medium">JurisGPT can make mistakes. Verify important legal information with a lawyer.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

/* ─── Main Chat Page with Suspense ─── */
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full flex-1 flex-col bg-background items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Scale className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="text-sm font-medium text-muted-foreground">Loading JurisGPT...</span>
        </motion.div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
