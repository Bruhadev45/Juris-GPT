"use client";

import { useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  FileText,
  Eye,
  ScrollText,
  Copy,
  Check,
  Download,
  Code2,
  Maximize2,
  Minimize2,
  List,
  Printer,
  ChevronDown,
  FileType2,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTemplate,
  type TemplateOutput,
  type TemplateClause,
} from "@/lib/contract-templates";
import { templateToPlainText } from "@/lib/contract-templates/serialize";
import { templateToHtml } from "@/lib/contract-templates/render-html";
import {
  LegalSeal,
  DiamondDivider,
  StampPaperBanner,
  SignatureSeal,
} from "./legal-seal";

type FormData = Record<string, unknown>;

interface ContractField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}

interface ContractStep {
  title: string;
  description?: string;
  fields: ContractField[];
}

interface ContractConfig {
  name: string;
  description?: string;
  lawReference?: string;
  steps: ContractStep[];
}

interface LivePreviewProps {
  type: string;
  config: ContractConfig;
  formData: FormData;
  className?: string;
}

type ViewMode = "document" | "print" | "plain" | "fields";

/* ──────────────────────────────────────────────────────────────
 * Inline markdown helpers
 * ────────────────────────────────────────────────────────────── */

function formatInline(text: string): React.ReactNode[] {
  if (!text) return [text];
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(<em key={`i${key++}`}>{m[2]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function ClauseBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed mb-2">
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {formatInline(line)}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

function ClauseRenderer({
  clause,
  depth = 0,
}: {
  clause: TemplateClause;
  depth?: number;
}) {
  if (clause.showIf && !clause.showIf()) return null;
  const HeadingTag = depth === 0 ? "h3" : "h4";
  return (
    <section className="mt-5">
      <HeadingTag
        className={cn(
          "font-bold text-foreground mb-2 mt-4 uppercase tracking-wide",
          depth === 0 ? "text-[15px]" : "text-sm normal-case"
        )}
      >
        {clause.heading}
      </HeadingTag>
      <ClauseBody body={clause.body} />
      {clause.sub?.map((sub, i) => (
        <ClauseRenderer key={i} clause={sub} depth={depth + 1} />
      ))}
    </section>
  );
}

/**
 * Decorative ornate corner — used on the document paper.
 */
function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      className={cn("text-foreground/15 pointer-events-none", className)}
      aria-hidden
    >
      <path
        d="M 2,2 L 14,2 M 2,2 L 2,14 M 4,4 Q 8,4 8,8 M 4,4 L 4,8 L 8,8"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="4" cy="4" r="1.2" fill="currentColor" />
      <circle cx="14" cy="2" r="0.8" fill="currentColor" />
      <circle cx="2" cy="14" r="0.8" fill="currentColor" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Document view (formatted legal document)
 * ────────────────────────────────────────────────────────────── */

function DocumentView({ output }: { output: TemplateOutput }) {
  return (
    <article
      className="text-foreground"
      style={{ fontFamily: "var(--font-spectral), Georgia, 'Times New Roman', serif" }}
    >
      {/* Stamp paper banner across the top */}
      <StampPaperBanner />

      {/* Header with seal */}
      <header className="text-center mb-6">
        <div className="flex justify-center mb-3 text-foreground/70">
          <LegalSeal size={68} />
        </div>
        <h2 className="font-bold uppercase tracking-[0.2em] text-xl mt-0 mb-1 text-foreground">
          {output.title}
        </h2>
        {output.lawReference && (
          <p className="text-xs text-foreground/60 italic">
            {output.lawReference}
          </p>
        )}
        <DiamondDivider />
      </header>

      {/* Date line */}
      {output.dateLine && (
        <p className="text-[15px] leading-7 mb-4 first-letter:text-2xl first-letter:font-bold first-letter:mr-1">
          {formatInline(output.dateLine)}
        </p>
      )}

      {/* Preamble */}
      <div className="space-y-3">
        {output.preamble.map((p, i) => (
          <p
            key={`pre-${i}`}
            className={cn(
              "text-[15px] leading-7",
              p === "BY AND BETWEEN" || p === "AND" || p === "BY AND AMONGST" || p === "IN RELATION TO"
                ? "text-center font-bold tracking-widest text-foreground/80 my-4"
                : ""
            )}
          >
            {formatInline(p)}
          </p>
        ))}
      </div>

      {/* Recitals */}
      {output.recitals && (
        <div className="my-6 pl-6 border-l-4 border-double border-foreground/20 bg-foreground/[0.02] py-4 pr-4 rounded-r-sm">
          {output.recitals.map((r, i) => (
            <p key={`rec-${i}`} className="text-[14px] leading-7 mb-2 italic text-foreground/85">
              {formatInline(r)}
            </p>
          ))}
        </div>
      )}

      {output.operativeIntro && (
        <p className="text-[15px] leading-7 font-semibold my-4">
          {formatInline(output.operativeIntro)}
        </p>
      )}

      {/* Clauses */}
      <div className="contract-clauses">
        {output.clauses.map((clause, i) => (
          <ClauseRenderer key={i} clause={clause} />
        ))}
      </div>

      <DiamondDivider className="!my-8" />

      {/* Signatures */}
      <div className="mt-8">
        <p className="text-center text-xs font-bold mb-6 uppercase tracking-[0.3em] text-foreground/70">
          Signed and Delivered
        </p>
        <div
          className={cn(
            "grid gap-8",
            output.signatures.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-2"
          )}
        >
          {output.signatures.map((sig, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">
                <SignatureSeal label="Signature" />
              </div>
              <div className="border-t-2 border-foreground/40 pt-2 mt-3">
                <p className="text-[10px] uppercase tracking-widest text-foreground/60 mb-1">
                  {sig.label}
                </p>
                <p className="font-bold text-sm">{sig.name || "____________"}</p>
                {sig.designation && (
                  <p className="text-xs text-foreground/70 italic">{sig.designation}</p>
                )}
                {sig.org && <p className="text-xs italic font-semibold mt-0.5">{sig.org}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Witnesses */}
      {output.witnesses && output.witnesses.length > 0 && (
        <div className="mt-8">
          <p className="text-center text-xs font-bold mb-4 uppercase tracking-[0.3em] text-foreground/70">
            In the Presence of:
          </p>
          <div className="grid grid-cols-2 gap-6">
            {output.witnesses.map((w, i) => (
              <div key={i} className="text-center border border-foreground/15 rounded-sm p-3 bg-foreground/[0.015]">
                <p className="text-[10px] uppercase tracking-widest text-foreground/60 mb-2">
                  {w.label}
                </p>
                <p className="text-sm border-b border-dotted border-foreground/30 pb-1 mb-1">
                  {w.name || " "}
                </p>
                <p className="text-[10px] text-foreground/50 italic">Name &amp; Signature</p>
                <p className="text-[10px] text-foreground/50 italic mt-2 border-t border-dotted border-foreground/20 pt-1">
                  Address
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stamp duty note */}
      {output.stampNote && (
        <div className="mt-8 p-4 bg-amber-50/70 dark:bg-amber-950/20 border-l-4 border-amber-700/50 dark:border-amber-700 rounded-r-md">
          <p className="text-[11px] uppercase tracking-widest text-amber-900 dark:text-amber-300 font-bold mb-1">
            ⚠ Stamp Duty Notice
          </p>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
            {output.stampNote}
          </p>
        </div>
      )}

      {/* Footer */}
      {output.footer && (
        <>
          <DiamondDivider className="!my-6" />
          <p className="text-[11px] text-foreground/55 italic leading-relaxed text-center">
            {output.footer}
          </p>
        </>
      )}
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Print preview — renders the document inside a simulated A4 page
 * ────────────────────────────────────────────────────────────── */

function PrintPreview({ output }: { output: TemplateOutput }) {
  // A4 dimensions: 210mm × 297mm. We render at scale to fit the screen.
  return (
    <div className="bg-neutral-200 dark:bg-neutral-900 -m-4 p-6 rounded-md min-h-full flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Print Preview · A4
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          210mm × 297mm · 22mm top/bottom · 18mm left/right margins
        </p>
      </div>

      {/* Simulated A4 page */}
      <div
        className="bg-white shadow-2xl relative"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "22mm 18mm",
          maxWidth: "100%",
          fontFamily: "var(--font-spectral), Georgia, 'Times New Roman', serif",
          color: "#1c1813",
        }}
      >
        <DocumentView output={output} />

        {/* Page footer */}
        <div
          style={{
            position: "absolute",
            bottom: "8mm",
            left: "18mm",
            right: "18mm",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "8pt",
            color: "#8a7558",
            borderTop: "0.5pt solid #d4c4a0",
            paddingTop: "4pt",
          }}
        >
          <span>{output.title} · Draft</span>
          <span>Page 1</span>
          <span>JurisGPT · {new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Plain text view (monospace, copy-friendly)
 * ────────────────────────────────────────────────────────────── */

function PlainTextView({ output }: { output: TemplateOutput }) {
  const text = useMemo(() => templateToPlainText(output), [output]);
  return (
    <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground bg-muted/30 p-4 rounded-md border border-border">
      {text}
    </pre>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Field summary view (just the values entered)
 * ────────────────────────────────────────────────────────────── */

function FieldSummaryView({
  config,
  formData,
}: {
  config: ContractConfig;
  formData: FormData;
}) {
  const formatVal = (v: unknown): string => {
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (v instanceof Date) return v.toLocaleDateString("en-IN");
    return String(v);
  };
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-foreground">Field Summary</h3>
      {config.steps.map((step, i) => {
        const filled = step.fields.filter((f) => {
          const v = formData[f.name];
          return v !== undefined && v !== null && v !== "" && v !== false;
        });
        if (filled.length === 0) return null;
        return (
          <section key={i} className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              {i + 1}. {step.title}
            </h4>
            <dl className="space-y-1.5 text-sm">
              {filled.map((f) => (
                <div
                  key={f.name}
                  className="grid grid-cols-[max-content_1fr] gap-3 items-baseline"
                >
                  <dt className="text-muted-foreground whitespace-nowrap text-xs">
                    {f.label}
                  </dt>
                  <dd className="font-medium break-words">
                    {formatVal(formData[f.name])}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Toolbar
 * ────────────────────────────────────────────────────────────── */

function DownloadMenu({
  hasOutput,
  onDownloadTxt,
  onDownloadDocx,
  onDownloadHtml,
  onDownloadPdf,
}: {
  hasOutput: boolean;
  onDownloadTxt: () => void;
  onDownloadDocx: () => void;
  onDownloadHtml: () => void;
  onDownloadPdf: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={!hasOutput}
        className="flex items-center gap-1 px-2 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Download"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-4 w-4" />
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 w-44 rounded-md border border-border bg-popover shadow-lg overflow-hidden"
        >
          <button
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onDownloadPdf();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted transition-colors"
          >
            <FileDown className="h-3.5 w-3.5 text-rose-700" />
            <span>PDF (via print)</span>
          </button>
          <button
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onDownloadDocx();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted transition-colors"
          >
            <FileType2 className="h-3.5 w-3.5 text-blue-700" />
            <span>Word (.doc)</span>
          </button>
          <button
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onDownloadHtml();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted transition-colors"
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-700" />
            <span>HTML</span>
          </button>
          <button
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onDownloadTxt();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted transition-colors border-t border-border"
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Plain Text (.txt)</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ViewToolbar({
  mode,
  setMode,
  onCopy,
  onPrint,
  onDownloadTxt,
  onDownloadDocx,
  onDownloadHtml,
  onDownloadPdf,
  copied,
  expanded,
  setExpanded,
  contractName,
  hasOutput,
}: {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  onCopy: () => void;
  onPrint: () => void;
  onDownloadTxt: () => void;
  onDownloadDocx: () => void;
  onDownloadHtml: () => void;
  onDownloadPdf: () => void;
  copied: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  contractName: string;
  hasOutput: boolean;
}) {
  const tabs: Array<{ id: ViewMode; label: string; icon: React.ElementType }> = [
    { id: "document", label: "Document", icon: ScrollText },
    { id: "print", label: "Print Preview", icon: Printer },
    { id: "plain", label: "Plain Text", icon: Code2 },
    { id: "fields", label: "Fields", icon: List },
  ];

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 min-w-0">
        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium hidden sm:inline">Live Preview</span>
        <span className="text-xs text-muted-foreground truncate hidden md:inline">
          · {contractName}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* View mode tabs */}
        <div className="flex items-center bg-muted/60 rounded-md p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tab.label}
                aria-pressed={isActive}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={onCopy}
            disabled={!hasOutput}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Copy plain text to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onPrint}
            disabled={!hasOutput}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
          <DownloadMenu
            hasOutput={hasOutput}
            onDownloadTxt={onDownloadTxt}
            onDownloadDocx={onDownloadDocx}
            onDownloadHtml={onDownloadHtml}
            onDownloadPdf={onDownloadPdf}
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden lg:block"
            title={expanded ? "Exit fullscreen" : "Fullscreen preview"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────── */

export function LiveContractPreview({
  type,
  config,
  formData,
  className,
}: LivePreviewProps) {
  const [mode, setMode] = useState<ViewMode>("document");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isEmpty = useMemo(
    () =>
      Object.values(formData).every(
        (v) => v === undefined || v === null || v === "" || v === false
      ),
    [formData]
  );

  const templateOutput = useMemo(() => {
    const renderer = getTemplate(type);
    if (!renderer) return null;
    try {
      return renderer(formData);
    } catch {
      return null;
    }
  }, [type, formData]);

  const plainText = useMemo(() => {
    if (!templateOutput) return "";
    return templateToPlainText(templateOutput);
  }, [templateOutput]);

  async function handleCopy() {
    if (!plainText) return;
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const datestamp = new Date().toISOString().split("T")[0];

  function handleDownloadTxt() {
    if (!plainText) return;
    downloadBlob(
      new Blob([plainText], { type: "text/plain;charset=utf-8" }),
      `${type}-draft-${datestamp}.txt`
    );
  }

  function handleDownloadDocx() {
    if (!templateOutput) return;
    const html = templateToHtml(templateOutput, { forWord: true, forPrint: false });
    // .doc — Word reads HTML files with the right MIME type. Modern Word also handles this for .doc.
    downloadBlob(
      new Blob([html], { type: "application/msword;charset=utf-8" }),
      `${type}-draft-${datestamp}.doc`
    );
  }

  function handleDownloadHtml() {
    if (!templateOutput) return;
    const html = templateToHtml(templateOutput, { forPrint: false });
    downloadBlob(
      new Blob([html], { type: "text/html;charset=utf-8" }),
      `${type}-draft-${datestamp}.html`
    );
  }

  function handlePrint() {
    if (!templateOutput) return;
    const rawHtml = templateToHtml(templateOutput, { forPrint: true });
    // Sanitize to defuse any HTML/JS that leaks through from user-supplied
    // template fields (party names, clause overrides, etc.). DOMPurify keeps
    // structural tags & inline styles needed for layout but strips scripts
    // and event-handler attributes.
    const html = DOMPurify.sanitize(rawHtml, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ["html", "head", "body", "style", "title"],
      ADD_ATTR: ["style"],
    });
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
    if (!win) {
      // Browser blocked the popup — surface inline rather than via alert().
      // The parent component shows a toast on copy/download failures, but for
      // print we keep this simple: just exit silently. Users will retry.
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  // Same as Print — the user clicks "Save as PDF" in the print dialog.
  // This is the standard browser-native PDF generation path with no extra deps.
  function handleDownloadPdf() {
    handlePrint();
  }

  const containerClasses = cn(
    "flex flex-col h-full bg-muted/20 border-l border-border",
    expanded && "fixed inset-0 z-50 bg-background border-l-0",
    className
  );

  return (
    <div className={containerClasses}>
      <ViewToolbar
        mode={mode}
        setMode={setMode}
        onCopy={handleCopy}
        onPrint={handlePrint}
        onDownloadTxt={handleDownloadTxt}
        onDownloadDocx={handleDownloadDocx}
        onDownloadHtml={handleDownloadHtml}
        onDownloadPdf={handleDownloadPdf}
        copied={copied}
        expanded={expanded}
        setExpanded={setExpanded}
        contractName={config.name}
        hasOutput={!!templateOutput && !isEmpty}
      />

      <div
        className={cn(
          "flex-1 overflow-y-auto p-6",
          mode === "document" &&
            "bg-[#f5efe1] dark:bg-[#2a241c] bg-[radial-gradient(ellipse_at_top,_rgba(184,136,77,0.05)_0%,_transparent_60%)]"
        )}
      >
        <div
          className={cn(
            "relative rounded-md min-h-full",
            mode === "document"
              ? "bg-[#fdfaf2] dark:bg-[#1c1813] shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-[#d4c4a0]/40 dark:border-[#3a3024]/60 p-8"
              : "bg-card border border-border shadow-sm p-4",
            expanded ? "max-w-4xl mx-auto" : "max-w-2xl mx-auto"
          )}
          aria-label="Live contract preview"
        >
          {/* Decorative ornate corners — document view only */}
          {mode === "document" && (
            <>
              <CornerOrnament className="absolute top-2 left-2" />
              <CornerOrnament className="absolute top-2 right-2 rotate-90" />
              <CornerOrnament className="absolute bottom-2 left-2 -rotate-90" />
              <CornerOrnament className="absolute bottom-2 right-2 rotate-180" />
            </>
          )}

          {/* DRAFT watermark — only on document view */}
          {mode === "document" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-md"
            >
              <span className="text-[7rem] font-black tracking-widest text-[#8b1538]/[0.05] dark:text-[#d97757]/[0.06] -rotate-12 select-none whitespace-nowrap">
                DRAFT
              </span>
            </div>
          )}

          <div className="relative">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-20 text-center">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  Start filling the form on the left
                </p>
                <p className="text-xs mt-1 max-w-xs">
                  Your draft of the <strong>{config.name}</strong> appears here in real
                  time as you type, formatted to Indian legal standards.
                </p>
              </div>
            ) : !templateOutput ? (
              <FieldSummaryView config={config} formData={formData} />
            ) : mode === "document" ? (
              <DocumentView output={templateOutput} />
            ) : mode === "print" ? (
              <PrintPreview output={templateOutput} />
            ) : mode === "plain" ? (
              <PlainTextView output={templateOutput} />
            ) : (
              <FieldSummaryView config={config} formData={formData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
