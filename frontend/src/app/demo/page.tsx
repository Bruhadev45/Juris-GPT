"use client";

/**
 * Public demo. No sign-in, by design — this is the page a conference audience
 * opens on their phone.
 *
 * It posts to /api/demo/chat, a same-origin Route Handler that proxies to the
 * backend. See that file for why the browser does not call the backend
 * directly (SameSite=Strict CSRF cookie cannot cross sites).
 */

import { useCallback, useRef, useState } from "react";

const C = {
  cream: "#FAF6EF",
  paper: "#FFFFFF",
  warmGray: "#F4EFE5",
  ink: "#0A0A0A",
  textSub: "#6B6B6B",
  textMuted: "#9A9A9A",
  border: "#E8E2D5",
  borderSoft: "#F0EBE0",
  burgundy: "#7B1E2E",
  gold: "#B8884D",
  sage: "#4A6B5C",
  sagePale: "#E8EFE9",
} as const;

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

/** One per benchmark category, so the demo exercises what the paper measured. */
const SAMPLE_QUESTIONS: readonly string[] = [
  "What is Section 7 of the Companies Act, 2013?",
  "What is equity vesting, and how does it work?",
  "What are the annual compliance requirements for a private limited company?",
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

type ConfidenceTone = { label: string; fg: string; bg: string };

function confidenceTone(confidence: string): ConfidenceTone {
  switch (confidence) {
    case "high":
      return { label: "High confidence", fg: C.sage, bg: C.sagePale };
    case "medium":
      return { label: "Medium confidence", fg: C.gold, bg: "#F5EBD8" };
    case "low":
      return { label: "Low confidence", fg: C.burgundy, bg: "#F6E7E9" };
    default:
      return { label: "Insufficient evidence", fg: C.textSub, bg: C.warmGray };
  }
}

export default function DemoPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openCitation, setOpenCitation] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = useCallback(async (text: string) => {
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
    } catch {
      setErrorMessage("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const tone = response ? confidenceTone(response.confidence) : null;

  return (
    <main style={{ minHeight: "100vh", background: C.cream, padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: C.burgundy, fontWeight: 700 }}>
            JURISGPT · LIVE DEMO
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "8px 0 10px", lineHeight: 1.15 }}>
            Ask a question about Indian startup law.
          </h1>
          <p style={{ fontSize: 15.5, color: C.textSub, lineHeight: 1.6, margin: 0 }}>
            Every answer is generated only from a corpus of 47,867 Indian legal documents, and every
            claim shows the section it came from. No sign-in needed.
          </p>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
          style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is equity vesting?"
            aria-label="Your legal question"
            maxLength={2000}
            style={{
              flex: "1 1 320px", padding: "14px 16px", fontSize: 15.5, color: C.ink,
              background: C.paper, border: `1px solid ${C.border}`, borderRadius: 8, outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            style={{
              padding: "14px 24px", fontSize: 15, fontWeight: 700, color: C.paper,
              background: isLoading || !question.trim() ? C.textMuted : C.burgundy,
              border: "none", borderRadius: 8,
              cursor: isLoading || !question.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Searching…" : "Ask"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setQuestion(sample);
                void ask(sample);
              }}
              disabled={isLoading}
              style={{
                padding: "8px 13px", fontSize: 13, color: C.textSub, background: C.paper,
                border: `1px solid ${C.border}`, borderRadius: 999,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {sample}
            </button>
          ))}
        </div>

        {isLoading && (
          <p style={{ fontFamily: MONO, fontSize: 13, color: C.textSub }}>
            Retrieving sources and composing a grounded answer…
          </p>
        )}

        {errorMessage && (
          <div role="alert" style={{ padding: "16px 18px", background: "#F6E7E9", border: `1px solid ${C.burgundy}33`, borderRadius: 8, color: C.burgundy, fontSize: 14.5 }}>
            {errorMessage}
          </div>
        )}

        {response && tone && (
          <article style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: "26px 26px 22px" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: tone.fg, background: tone.bg, padding: "5px 10px", borderRadius: 4 }}>
                {tone.label.toUpperCase()}
              </span>
              {response.corpus_as_of && (
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.textMuted, background: C.warmGray, padding: "5px 10px", borderRadius: 4 }}>
                  CORPUS AS OF {response.corpus_as_of.toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ fontSize: 16, lineHeight: 1.7, color: C.ink, whiteSpace: "pre-wrap" }}>
              {response.answer}
            </div>

            {response.citations.length > 0 && (
              <section style={{ marginTop: 24, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.burgundy, marginBottom: 12 }}>
                  SOURCES ({response.citations.length})
                </div>
                {response.citations.map((citation, index) => {
                  const isOpen = openCitation === index;
                  return (
                    <div key={`${citation.title}-${index}`} style={{ marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => setOpenCitation(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%", textAlign: "left", padding: "11px 14px", background: C.warmGray,
                          border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer",
                          fontSize: 13.5, color: C.ink, display: "flex", justifyContent: "space-between", gap: 12,
                        }}
                      >
                        <span>
                          <strong style={{ fontFamily: MONO, color: C.burgundy }}>[{index + 1}]</strong>{" "}
                          {citation.act ?? citation.source}
                          {citation.section ? ` · Section ${citation.section}` : ""}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>
                          {isOpen ? "hide" : "show"}
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "13px 15px", fontSize: 13.5, lineHeight: 1.6, color: C.textSub, background: C.paper, border: `1px solid ${C.borderSoft}`, borderTop: "none", borderRadius: "0 0 6px 6px" }}>
                          <div style={{ fontWeight: 700, color: C.ink, marginBottom: 6 }}>{citation.title}</div>
                          {citation.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {response.limitations && (
              <p style={{ marginTop: 20, padding: "13px 15px", background: C.warmGray, borderLeft: `3px solid ${C.gold}`, borderRadius: "0 6px 6px 0", fontSize: 13.5, lineHeight: 1.6, color: C.textSub }}>
                <strong style={{ color: C.ink }}>Limitations: </strong>
                {response.limitations}
              </p>
            )}

            {response.follow_up_questions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, marginBottom: 10 }}>
                  TRY A FOLLOW-UP
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {response.follow_up_questions.map((followUp) => (
                    <button
                      key={followUp}
                      type="button"
                      onClick={() => {
                        setQuestion(followUp);
                        void ask(followUp);
                      }}
                      disabled={isLoading}
                      style={{
                        padding: "8px 13px", fontSize: 13, color: C.textSub, background: C.paper,
                        border: `1px solid ${C.border}`, borderRadius: 999,
                        cursor: isLoading ? "not-allowed" : "pointer",
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

        <footer style={{ marginTop: 34, paddingTop: 18, borderTop: `1px solid ${C.border}`, fontSize: 12.5, lineHeight: 1.6, color: C.textMuted }}>
          JurisGPT is an informational support tool. It does not give legal advice and does not create
          a lawyer–client relationship. A qualified professional should review its output before anyone
          acts on it.
        </footer>
      </div>
    </main>
  );
}
