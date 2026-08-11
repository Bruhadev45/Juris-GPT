"use client";

/**
 * Public demo. No sign-in, by design — this is the page a conference audience
 * opens on their phone.
 *
 * Posts to /api/demo/chat, a same-origin Route Handler that proxies to the
 * backend. See that file for why the browser does not call the backend
 * directly (SameSite=Strict CSRF cookie cannot cross sites).
 *
 * The model replies in Markdown, so the answer is rendered with react-markdown
 * (already a project dependency, and what the dashboard chat uses) rather than
 * dumped into a <pre>. Inline [1] references are rewritten into superscript
 * anchors that scroll to and briefly highlight the matching source card —
 * the whole point of the product is that a claim can be traced to its section.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

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
  gold: "#B8884D",
  goldPale: "#F5EBD8",
  sage: "#4A6B5C",
  sagePale: "#E8EFE9",
} as const;

const MONO = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace";
const SERIF = "var(--font-spectral), Georgia, serif";

/** One per benchmark category, so the demo exercises what the paper measured. */
const SAMPLE_QUESTIONS: readonly string[] = [
  "What is Section 7 of the Companies Act, 2013?",
  "What is equity vesting, and how does it work?",
  "Annual compliance for a private limited company?",
  "What makes a contract valid under the Indian Contract Act?",
  "What is the Section 80-IAC startup tax exemption?",
  "What are the minimum wage requirements in India?",
];

interface Citation {
  title: string;
  content: string;
  doc_type: string;
  source: string;
  relevance: number;
  section?: string | null;
  act?: string | null;
}

interface ChatResponse {
  success: boolean;
  answer: string;
  citations: Citation[];
  confidence: string;
  limitations: string;
  follow_up_questions: string[];
  grounded: boolean;
  corpus_as_of?: string | null;
  error?: string | null;
}

interface ConfidenceTone {
  label: string;
  fg: string;
  bg: string;
  note: string;
}

function confidenceTone(confidence: string): ConfidenceTone {
  switch (confidence) {
    case "high":
      return {
        label: "High confidence",
        fg: C.sage,
        bg: C.sagePale,
        note: "Several sources agree and match the question's legal category.",
      };
    case "medium":
      return {
        label: "Medium confidence",
        fg: C.gold,
        bg: C.goldPale,
        note: "At least two qualifying sources support this answer.",
      };
    case "low":
      return {
        label: "Low confidence",
        fg: C.burgundy,
        bg: "#F6E7E9",
        note: "Weak supporting evidence — verify against the sources below.",
      };
    default:
      return {
        label: "Insufficient evidence",
        fg: C.textSub,
        bg: C.warmGray,
        note: "Not enough in the corpus to answer. The system declines rather than speculate.",
      };
  }
}

/**
 * Strip the fenced separators and stray leading markers the model sometimes
 * emits, then rewrite [1] into a superscript link the renderer can intercept.
 * Only indices that actually have a citation are linked, so a stray [7] stays
 * literal text rather than becoming a dead anchor.
 */
function prepareAnswer(answer: string, citationCount: number): string {
  const cleaned = answer
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (citationCount === 0) return cleaned;

  return cleaned.replace(/\[(\d+)\]/g, (match, numStr: string) => {
    const num = Number.parseInt(numStr, 10);
    return num >= 1 && num <= citationCount ? `[${num}](#src-${num})` : match;
  });
}

function docTypeLabel(docType: string): string {
  const map: Record<string, string> = {
    statute: "Statute",
    faq: "FAQ",
    case: "Case law",
    clause: "Clause",
    compliance: "Compliance",
    news: "Update",
  };
  return map[docType] ?? docType;
}

export default function DemoPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openCitation, setOpenCitation] = useState<number | null>(null);
  const [flashedCitation, setFlashedCitation] = useState<number | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setIsLoading(true);
      setErrorMessage("");
      setResponse(null);
      setOpenCitation(null);

      try {
        const res = await fetch("/api/demo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(
            typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.",
          );
          return;
        }
        setResponse(data as ChatResponse);
        requestAnimationFrame(() => {
          answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch {
        setErrorMessage("Could not reach the server. Check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  /** Scroll to a source card, open it, and flash it so the jump is legible. */
  const jumpToSource = useCallback((index: number) => {
    setOpenCitation(index);
    setFlashedCitation(index);
    window.setTimeout(() => setFlashedCitation(null), 1400);
    requestAnimationFrame(() => {
      document.getElementById(`src-${index + 1}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  const tone = response ? confidenceTone(response.confidence) : null;

  const preparedAnswer = useMemo(
    () => (response ? prepareAnswer(response.answer, response.citations.length) : ""),
    [response],
  );

  const markdownComponents = useMemo(
    () => ({
      h1: (props: React.ComponentProps<"h2">) => (
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ink, margin: "22px 0 8px", letterSpacing: "-0.01em" }} {...props} />
      ),
      h2: (props: React.ComponentProps<"h3">) => (
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "20px 0 7px", letterSpacing: "-0.01em" }} {...props} />
      ),
      h3: (props: React.ComponentProps<"h4">) => (
        <h4 style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.burgundy, margin: "20px 0 7px" }} {...props} />
      ),
      p: (props: React.ComponentProps<"p">) => (
        <p style={{ fontSize: 16, lineHeight: 1.72, color: C.inkSoft, margin: "0 0 13px" }} {...props} />
      ),
      ul: (props: React.ComponentProps<"ul">) => (
        <ul style={{ margin: "0 0 13px", paddingLeft: 20 }} {...props} />
      ),
      ol: (props: React.ComponentProps<"ol">) => (
        <ol style={{ margin: "0 0 13px", paddingLeft: 22 }} {...props} />
      ),
      li: (props: React.ComponentProps<"li">) => (
        <li style={{ fontSize: 16, lineHeight: 1.68, color: C.inkSoft, margin: "0 0 6px" }} {...props} />
      ),
      strong: (props: React.ComponentProps<"strong">) => (
        <strong style={{ fontWeight: 700, color: C.ink }} {...props} />
      ),
      hr: () => <hr style={{ border: "none", borderTop: `1px solid ${C.borderSoft}`, margin: "20px 0" }} />,
      code: (props: React.ComponentProps<"code">) => (
        <code style={{ fontFamily: MONO, fontSize: 13.5, background: C.warmGray, padding: "1px 5px", borderRadius: 3, color: C.burgundy }} {...props} />
      ),
      blockquote: (props: React.ComponentProps<"blockquote">) => (
        <blockquote style={{ margin: "0 0 13px", padding: "2px 0 2px 14px", borderLeft: `3px solid ${C.border}`, color: C.textSub }} {...props} />
      ),
      // Inline [n] citation references, rewritten by prepareAnswer.
      a: ({ href, children, ...rest }: React.ComponentProps<"a">) => {
        const match = typeof href === "string" ? href.match(/^#src-(\d+)$/) : null;
        if (!match) {
          return <a href={href} style={{ color: C.burgundy }} {...rest}>{children}</a>;
        }
        const index = Number.parseInt(match[1], 10) - 1;
        return (
          <button
            type="button"
            onClick={() => jumpToSource(index)}
            title={`Jump to source ${index + 1}`}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 17, height: 17, padding: "0 4px", margin: "0 2px",
              verticalAlign: "super", fontFamily: MONO, fontSize: 10, fontWeight: 700,
              color: C.burgundy, background: "#F6E7E9", border: "none", borderRadius: 3,
              cursor: "pointer", lineHeight: 1,
            }}
          >
            {index + 1}
          </button>
        );
      },
    }),
    [jumpToSource],
  );

  return (
    <main style={{ minHeight: "100vh", background: C.cream, padding: "40px 20px 90px" }}>
      <style>{`
        @keyframes jg-pulse { 0%,100% { opacity: .45 } 50% { opacity: .85 } }
        @keyframes jg-rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .jg-rise { animation: jg-rise 320ms cubic-bezier(.22,.61,.36,1) both; }
        .jg-skel { background: ${C.warmGray}; border-radius: 4px; animation: jg-pulse 1.3s ease-in-out infinite; }
        .jg-chip:hover { border-color: ${C.burgundy} !important; color: ${C.ink} !important; }
        @media (prefers-reduced-motion: reduce) {
          .jg-rise, .jg-skel { animation: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <header style={{ marginBottom: 26 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.11em", color: C.burgundy, fontWeight: 700 }}>
            JURISGPT · LIVE DEMO
          </div>
          <h1 style={{ fontSize: "clamp(30px,4.4vw,42px)", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, margin: "10px 0 12px", lineHeight: 1.12 }}>
            Ask a question about{" "}
            <em style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: C.burgundy }}>
              Indian startup law.
            </em>
          </h1>
          <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.62, margin: 0, maxWidth: 620 }}>
            Answers are generated only from a corpus of 47,867 Indian legal documents. Every claim
            carries a numbered citation you can open to read the source. No sign-in.
          </p>
        </header>

        <form
          onSubmit={(event) => { event.preventDefault(); void ask(question); }}
          style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is equity vesting?"
            aria-label="Your legal question"
            maxLength={500}
            style={{
              flex: "1 1 340px", padding: "15px 17px", fontSize: 16, color: C.ink,
              background: C.paper, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            style={{
              padding: "15px 28px", fontSize: 15.5, fontWeight: 700, color: C.paper,
              background: isLoading || !question.trim() ? C.textMuted : C.burgundy,
              border: "none", borderRadius: 9,
              cursor: isLoading || !question.trim() ? "not-allowed" : "pointer",
              transition: "background 160ms ease",
            }}
          >
            {isLoading ? "Searching…" : "Ask"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample}
              type="button"
              className="jg-chip"
              onClick={() => { setQuestion(sample); void ask(sample); }}
              disabled={isLoading}
              style={{
                padding: "8px 14px", fontSize: 13, color: C.textSub, background: C.paper,
                border: `1px solid ${C.border}`, borderRadius: 999,
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "border-color 140ms ease, color 140ms ease",
              }}
            >
              {sample}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="jg-rise" style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 28px 24px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <div className="jg-skel" style={{ width: 128, height: 24 }} />
              <div className="jg-skel" style={{ width: 168, height: 24 }} />
            </div>
            {[97, 92, 78, 88, 62].map((w, i) => (
              <div key={i} className="jg-skel" style={{ width: `${w}%`, height: 13, marginBottom: 11 }} />
            ))}
            <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.textMuted, margin: "18px 0 0", letterSpacing: "0.04em" }}>
              RETRIEVING SOURCES · COMPOSING A GROUNDED ANSWER
            </p>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="jg-rise" style={{ padding: "17px 19px", background: "#F6E7E9", border: `1px solid ${C.burgundy}33`, borderRadius: 10, color: C.burgundy, fontSize: 15 }}>
            {errorMessage}
          </div>
        )}

        {response && tone && (
          <article ref={answerRef} className="jg-rise" style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 30px 24px" }}>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: tone.fg, background: tone.bg, padding: "6px 11px", borderRadius: 5 }}>
                {tone.label.toUpperCase()}
              </span>
              {response.corpus_as_of && (
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.textMuted, background: C.warmGray, padding: "6px 11px", borderRadius: 5 }}>
                  CORPUS AS OF {response.corpus_as_of.toUpperCase()}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
              {tone.note}
            </p>

            <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 20 }}>
              <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
                {preparedAnswer}
              </ReactMarkdown>
            </div>

            {response.citations.length > 0 && (
              <section style={{ marginTop: 26, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", color: C.burgundy, marginBottom: 14 }}>
                  SOURCES ({response.citations.length})
                </div>
                {response.citations.map((citation, index) => {
                  const isOpen = openCitation === index;
                  const isFlashed = flashedCitation === index;
                  const relevancePct = Math.round((citation.relevance ?? 0) * 100);
                  return (
                    <div key={`${citation.title}-${index}`} id={`src-${index + 1}`} style={{ marginBottom: 9 }}>
                      <button
                        type="button"
                        onClick={() => setOpenCitation(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%", textAlign: "left", padding: "12px 15px",
                          background: isFlashed ? C.goldPale : C.warmGray,
                          border: `1px solid ${isFlashed ? C.gold : C.border}`,
                          borderRadius: isOpen ? "7px 7px 0 0" : 7,
                          cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                          transition: "background 400ms ease, border-color 400ms ease",
                        }}
                      >
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.burgundy, background: C.paper, minWidth: 22, height: 22, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {index + 1}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 14, color: C.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {citation.act ?? citation.source}
                            {citation.section ? ` · Section ${citation.section}` : ""}
                          </span>
                          <span style={{ display: "block", fontFamily: MONO, fontSize: 10.5, color: C.textMuted, marginTop: 3 }}>
                            {docTypeLabel(citation.doc_type)} · {relevancePct}% match
                          </span>
                        </span>
                        <span aria-hidden style={{ width: 44, height: 4, background: C.borderSoft, borderRadius: 2, flexShrink: 0, overflow: "hidden" }}>
                          <span style={{ display: "block", width: `${relevancePct}%`, height: "100%", background: C.gold }} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="jg-rise" style={{ padding: "14px 16px", fontSize: 14, lineHeight: 1.66, color: C.textSub, background: C.paper, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 7px 7px" }}>
                          <div style={{ fontWeight: 700, color: C.ink, marginBottom: 7 }}>{citation.title}</div>
                          {citation.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {response.limitations && (
              <p style={{ marginTop: 22, padding: "14px 16px", background: C.warmGray, borderLeft: `3px solid ${C.gold}`, borderRadius: "0 7px 7px 0", fontSize: 14, lineHeight: 1.62, color: C.textSub }}>
                <strong style={{ color: C.ink }}>Limitations: </strong>
                {response.limitations}
              </p>
            )}

            {response.follow_up_questions.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", color: C.textMuted, marginBottom: 11 }}>
                  TRY A FOLLOW-UP
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {response.follow_up_questions.map((followUp) => (
                    <button
                      key={followUp}
                      type="button"
                      className="jg-chip"
                      onClick={() => { setQuestion(followUp); void ask(followUp); }}
                      disabled={isLoading}
                      style={{
                        padding: "8px 14px", fontSize: 13, color: C.textSub, background: C.paper,
                        border: `1px solid ${C.border}`, borderRadius: 999,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "border-color 140ms ease, color 140ms ease",
                      }}
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}

        <footer style={{ marginTop: 38, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontSize: 12.5, lineHeight: 1.62, color: C.textMuted }}>
          JurisGPT is an informational support tool. It does not give legal advice and does not create
          a lawyer–client relationship. A qualified professional should review its output before anyone
          acts on it.
        </footer>
      </div>
    </main>
  );
}
