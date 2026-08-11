/**
 * Shared shell for the placeholder legal pages (/privacy, /terms, /dpdp,
 * /security, /cookies).
 *
 * These pages exist only so the footer's legal links resolve instead of 404ing.
 * They are NOT policies. The draft banner and the site disclaimer are rendered
 * from this one place so their wording cannot drift between pages — for a
 * legal-technology product, five subtly different disclaimers would be worse
 * than none.
 *
 * Rule for anything added to a page that uses this shell: state only what the
 * codebase demonstrably does. No retention periods, no compliance assertions,
 * no contact points, no commitments of any kind — those need a lawyer, not a
 * developer.
 */

/** Same palette and mono face as frontend/src/app/demo/page.tsx. */
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
} as const;

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

export interface LegalSection {
  readonly heading: string;
  /** One or two short factual sentences. Optional when `items` carries the content. */
  readonly body?: string;
  readonly items?: readonly string[];
}

export interface LegalPlaceholderPageProps {
  /** Short label above the title, e.g. "PRIVACY". */
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
  /** Things a real policy would settle and this draft deliberately does not. */
  readonly notDocumented: readonly string[];
}

export function LegalPlaceholderPage({
  eyebrow,
  title,
  intro,
  sections,
  notDocumented,
}: LegalPlaceholderPageProps) {
  return (
    <main style={{ minHeight: "100vh", background: C.cream, padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          role="note"
          style={{
            background: "#F6E7E9",
            border: `1px solid ${C.burgundy}33`,
            borderLeft: `4px solid ${C.burgundy}`,
            borderRadius: 8,
            padding: "16px 18px",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: C.burgundy,
              marginBottom: 7,
            }}
          >
            DRAFT PLACEHOLDER — NOT A POLICY
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: C.ink }}>
            This page is scaffolding. It has not been drafted or reviewed by a lawyer, it is not in
            force, and it must not be relied upon by anyone. It exists so this link resolves while a
            real policy is prepared. Nothing here is a commitment, a representation of compliance, or
            a statement of your rights.
          </p>
        </div>

        <header style={{ marginBottom: 30 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.1em",
              color: C.burgundy,
              fontWeight: 700,
            }}
          >
            JURISGPT · {eyebrow}
          </div>
          <h1
            style={{
              fontSize: "clamp(26px,4vw,36px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: C.ink,
              margin: "8px 0 10px",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 15.5, color: C.textSub, lineHeight: 1.6, margin: 0 }}>{intro}</p>
        </header>

        <article
          style={{
            background: C.paper,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "26px 26px 22px",
          }}
        >
          {sections.map((section, index) => (
            <section
              key={section.heading}
              style={{
                marginTop: index === 0 ? 0 : 24,
                paddingTop: index === 0 ? 0 : 20,
                borderTop: index === 0 ? "none" : `1px solid ${C.borderSoft}`,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.ink,
                  margin: "0 0 10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {section.heading}
              </h2>
              {section.body && (
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: C.textSub }}>
                  {section.body}
                </p>
              )}
              {section.items && (
                <ul
                  style={{
                    margin: section.body ? "10px 0 0" : 0,
                    paddingLeft: 20,
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    color: C.textSub,
                  }}
                >
                  {section.items.map((item) => (
                    <li key={item} style={{ marginBottom: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section
            style={{
              marginTop: 24,
              padding: "15px 17px",
              background: C.warmGray,
              borderLeft: `3px solid ${C.gold}`,
              borderRadius: "0 6px 6px 0",
            }}
          >
            <h2
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: C.ink,
                margin: "0 0 10px",
              }}
            >
              NOT DECIDED OR DOCUMENTED YET
            </h2>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, lineHeight: 1.65, color: C.textSub }}>
              Deliberately left blank rather than filled with plausible-sounding text. Each item
              needs a decision and legal review before it can appear here.
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: C.textSub,
              }}
            >
              {notDocumented.map((item) => (
                <li key={item} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <footer
          style={{
            marginTop: 34,
            paddingTop: 18,
            borderTop: `1px solid ${C.border}`,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: C.textMuted,
          }}
        >
          JurisGPT is an informational support tool. It does not give legal advice and does not create
          a lawyer–client relationship. A qualified professional should review its output before anyone
          acts on it.
        </footer>
      </div>
    </main>
  );
}
