/**
 * Server-quality HTML renderer for contract templates.
 *
 * Produces a self-contained HTML document with inline CSS suitable for:
 *  - Browser print (window.open + window.print)
 *  - .doc/.docx download (Word reads HTML files with Times New Roman)
 *  - PDF generation via browser print-to-PDF
 *
 * The HTML mirrors the on-screen DocumentView (parchment, seal, stamp banner,
 * Spectral serif, ornate corners) but uses self-contained styles so it
 * renders identically when opened in a new window or in MS Word.
 */

import type { TemplateOutput, TemplateClause } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  // **bold** → <strong>, *italic* → <em>
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function paragraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 0.6em 0;line-height:1.7;">${inlineMarkdown(p)}</p>`)
    .join("");
}

function clauseHtml(clause: TemplateClause, depth = 0): string {
  if (clause.showIf && !clause.showIf()) return "";
  const heading =
    depth === 0
      ? `<h3 style="font-size:13pt;font-weight:bold;margin:18pt 0 6pt 0;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(clause.heading)}</h3>`
      : `<h4 style="font-size:11pt;font-weight:bold;margin:12pt 0 6pt 0;">${escapeHtml(clause.heading)}</h4>`;
  let out = heading;
  out += paragraphs(clause.body);
  if (clause.sub) for (const sub of clause.sub) out += clauseHtml(sub, depth + 1);
  return `<section style="margin-top:8pt;">${out}</section>`;
}

const SEAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 100 100">
  <defs><path id="c" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" fill="none"/></defs>
  <circle cx="50" cy="50" r="48" fill="none" stroke="#3d2817" stroke-width="0.6"/>
  <circle cx="50" cy="50" r="44" fill="none" stroke="#3d2817" stroke-width="0.4"/>
  <text font-size="6" fill="#3d2817" letter-spacing="2" font-family="serif" font-weight="600">
    <textPath href="#c" startOffset="14%">INDIAN LEGAL DOCUMENT</textPath>
  </text>
  <text font-size="5" fill="#3d2817" letter-spacing="1.5" font-family="serif" opacity="0.7">
    <textPath href="#c" startOffset="62%">★ DRAFT ★ JURISGPT ★</textPath>
  </text>
  <g transform="translate(50, 50)" stroke="#3d2817">
    <line x1="0" y1="-18" x2="0" y2="14" stroke-width="1.4"/>
    <circle cx="0" cy="-18" r="1.6" fill="#3d2817"/>
    <line x1="-14" y1="-12" x2="14" y2="-12" stroke-width="1.2"/>
    <line x1="-12" y1="-12" x2="-12" y2="-6" stroke-width="0.6"/>
    <line x1="-12" y1="-12" x2="-7" y2="-6" stroke-width="0.6"/>
    <line x1="-12" y1="-12" x2="-17" y2="-6" stroke-width="0.6"/>
    <path d="M -18,-6 Q -12,-2 -6,-6" fill="#3d2817" fill-opacity="0.15" stroke-width="0.8"/>
    <line x1="12" y1="-12" x2="12" y2="-6" stroke-width="0.6"/>
    <line x1="12" y1="-12" x2="7" y2="-6" stroke-width="0.6"/>
    <line x1="12" y1="-12" x2="17" y2="-6" stroke-width="0.6"/>
    <path d="M 6,-6 Q 12,-2 18,-6" fill="#3d2817" fill-opacity="0.15" stroke-width="0.8"/>
    <rect x="-6" y="14" width="12" height="2" fill="#3d2817" stroke="none"/>
    <rect x="-9" y="16" width="18" height="1.2" fill="#3d2817" stroke="none"/>
  </g>
  <text x="50" y="84" text-anchor="middle" font-size="4.5" fill="#3d2817" font-family="serif" font-weight="700">JurisGPT</text>
</svg>`;

const STAMP_BANNER = `<table style="width:100%;border-bottom:2px solid #c9a96e;padding:8pt 0;margin-bottom:18pt;font-size:8pt;color:#5a4a30;text-transform:uppercase;letter-spacing:0.15em;font-weight:600;">
  <tr>
    <td style="text-align:left;line-height:1.6;">
      Government of India<br/>
      Non-Judicial Stamp<br/>
      <span style="display:inline-block;border:1px solid #5a4a30;padding:2pt 6pt;margin-top:3pt;font-weight:bold;font-size:9pt;">₹ 100</span>
    </td>
    <td style="text-align:right;line-height:1.6;">
      Indian Stamp Act, 1899<br/>
      State Schedule Applicable<br/>
      <span style="font-style:italic;font-weight:normal;text-transform:none;letter-spacing:normal;font-size:7.5pt;color:#8a7558;">(To be affixed before execution)</span>
    </td>
  </tr>
</table>`;

const DIVIDER = `<div style="text-align:center;margin:18pt 0;color:#a08c66;letter-spacing:8pt;">◆ ◇ ◆</div>`;

function signatureBlock(sig: TemplateOutput["signatures"][number]): string {
  return `
    <td style="width:50%;padding:0 12pt;text-align:center;vertical-align:top;">
      <div style="display:inline-block;width:60pt;height:60pt;border-radius:50%;border:2px dashed #8a7558;background:#fdfaf2;line-height:60pt;font-size:7pt;letter-spacing:2pt;font-weight:bold;color:#8a7558;text-transform:uppercase;margin-bottom:8pt;">SEAL</div>
      <div style="border-top:2px solid #3d2817;padding-top:6pt;margin-top:8pt;">
        <div style="font-size:8pt;text-transform:uppercase;letter-spacing:0.15em;color:#5a4a30;margin-bottom:3pt;">${escapeHtml(sig.label)}</div>
        <div style="font-weight:bold;font-size:11pt;">${escapeHtml(sig.name || "____________")}</div>
        ${sig.designation ? `<div style="font-size:9pt;font-style:italic;color:#5a4a30;">${escapeHtml(sig.designation)}</div>` : ""}
        ${sig.org ? `<div style="font-size:9pt;font-style:italic;font-weight:600;margin-top:2pt;">${escapeHtml(sig.org)}</div>` : ""}
      </div>
    </td>`;
}

export interface RenderHtmlOptions {
  /** Title shown in browser tab and as document title */
  documentTitle?: string;
  /** When true, includes @media print CSS for clean printing */
  forPrint?: boolean;
  /** When true, marks output for Word (.doc) consumption */
  forWord?: boolean;
}

export function templateToHtml(
  output: TemplateOutput,
  opts: RenderHtmlOptions = {}
): string {
  const { documentTitle, forPrint = true, forWord = false } = opts;
  const title = documentTitle || output.title;

  const preambleHtml = output.preamble
    .map((p) => {
      const isMarker = ["BY AND BETWEEN", "AND", "BY AND AMONGST", "IN RELATION TO"].includes(p.trim());
      if (isMarker) {
        return `<p style="text-align:center;font-weight:bold;letter-spacing:0.25em;margin:14pt 0;font-size:11pt;color:#3d2817;">${escapeHtml(p)}</p>`;
      }
      return `<p style="margin:0 0 8pt 0;line-height:1.7;text-align:justify;">${inlineMarkdown(p)}</p>`;
    })
    .join("");

  const recitalsHtml = output.recitals
    ? `<div style="border-left:3pt double #a08c66;padding:10pt 14pt;margin:14pt 0;background:rgba(184,136,77,0.04);">
        ${output.recitals
          .map(
            (r) =>
              `<p style="margin:0 0 6pt 0;line-height:1.7;font-style:italic;color:#3d2817;">${inlineMarkdown(r)}</p>`
          )
          .join("")}
      </div>`
    : "";

  const operativeHtml = output.operativeIntro
    ? `<p style="font-weight:600;margin:14pt 0;line-height:1.7;text-align:justify;">${inlineMarkdown(output.operativeIntro)}</p>`
    : "";

  const clausesHtml = output.clauses.map((c) => clauseHtml(c)).join("");

  const sigCols = output.signatures.length === 1 ? 1 : 2;
  const sigsHtml = `
    ${DIVIDER}
    <p style="text-align:center;font-size:9pt;text-transform:uppercase;letter-spacing:0.3em;font-weight:bold;color:#5a4a30;margin:18pt 0 14pt 0;">Signed and Delivered</p>
    <table style="width:100%;border-collapse:collapse;margin-top:14pt;">
      <tr>${output.signatures.map(signatureBlock).join("")}${sigCols === 1 ? '<td style="width:50%;"></td>' : ""}</tr>
    </table>`;

  const witnessesHtml =
    output.witnesses && output.witnesses.length > 0
      ? `<p style="text-align:center;font-size:9pt;text-transform:uppercase;letter-spacing:0.3em;font-weight:bold;color:#5a4a30;margin:24pt 0 12pt 0;">In the Presence of:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>${output.witnesses
            .map(
              (w) => `
            <td style="width:50%;padding:8pt;text-align:center;border:1px solid #d4c4a0;background:rgba(184,136,77,0.02);">
              <div style="font-size:8pt;text-transform:uppercase;letter-spacing:0.15em;color:#5a4a30;margin-bottom:8pt;">${escapeHtml(w.label)}</div>
              <div style="border-bottom:1px dotted #5a4a30;padding-bottom:3pt;margin-bottom:3pt;font-size:10pt;">${escapeHtml(w.name || " ")}</div>
              <div style="font-size:8pt;font-style:italic;color:#5a4a30;">Name &amp; Signature</div>
              <div style="font-size:8pt;font-style:italic;color:#5a4a30;margin-top:8pt;border-top:1px dotted #a08c66;padding-top:4pt;">Address</div>
            </td>`
            )
            .join("")}</tr>
        </table>`
      : "";

  const stampHtml = output.stampNote
    ? `<div style="margin-top:24pt;padding:10pt 14pt;background:rgba(245,222,179,0.4);border-left:4pt solid #b8884d;border-radius:2pt 4pt 4pt 2pt;">
        <div style="font-size:8pt;text-transform:uppercase;letter-spacing:0.2em;font-weight:bold;color:#7a5028;margin-bottom:4pt;">⚠ Stamp Duty Notice</div>
        <p style="margin:0;font-size:9pt;line-height:1.6;font-style:italic;color:#5a3d18;">${escapeHtml(output.stampNote)}</p>
      </div>`
    : "";

  const footerHtml = output.footer
    ? `${DIVIDER}<p style="text-align:center;font-size:8.5pt;font-style:italic;color:#7a6845;line-height:1.6;margin-top:14pt;">${escapeHtml(output.footer)}</p>`
    : "";

  // CSS — Spectral fallback to Georgia/serif; A4 page size; print-friendly
  const css = `
    ${forWord ? "" : "@page { size: A4; margin: 22mm 18mm; }"}
    * { box-sizing: border-box; }
    body {
      font-family: 'Spectral', Georgia, 'Times New Roman', serif;
      color: #1c1813;
      font-size: 11pt;
      line-height: 1.7;
      max-width: 180mm;
      margin: 0 auto;
      padding: 14mm;
      background: #fdfaf2;
    }
    h2 {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin: 4pt 0;
      color: #3d2817;
    }
    .subtitle {
      text-align: center;
      font-size: 9pt;
      font-style: italic;
      color: #5a4a30;
      margin-bottom: 4pt;
    }
    .seal-wrap {
      text-align: center;
      margin: 8pt 0 12pt 0;
    }
    .date-line {
      margin: 14pt 0;
      line-height: 1.7;
      text-align: justify;
    }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      h3 { page-break-after: avoid; }
      section { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
    }
  `;

  // Word documents need a special header
  const wordHeader = forWord
    ? `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
       <head>
         <meta charset="utf-8"/>
         <title>${escapeHtml(title)}</title>
         <xml>
           <w:WordDocument>
             <w:View>Print</w:View>
             <w:Zoom>100</w:Zoom>
             <w:DoNotOptimizeForBrowser/>
           </w:WordDocument>
         </xml>
         <style>${css}</style>
       </head>`
    : `<html lang="en">
       <head>
         <meta charset="utf-8"/>
         <meta name="viewport" content="width=device-width, initial-scale=1"/>
         <title>${escapeHtml(title)}</title>
         <link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&display=swap" rel="stylesheet"/>
         <style>${css}</style>
       </head>`;

  const printScript = forPrint && !forWord
    ? `<script>
         window.addEventListener('load', () => {
           setTimeout(() => { window.print(); }, 500);
         });
       </script>`
    : "";

  return `<!DOCTYPE html>
${wordHeader}
<body>
${STAMP_BANNER}
<div class="seal-wrap">${SEAL_SVG}</div>
<h2>${escapeHtml(output.title)}</h2>
${output.lawReference ? `<p class="subtitle">${escapeHtml(output.lawReference)}</p>` : ""}
${DIVIDER}
${output.dateLine ? `<p class="date-line">${inlineMarkdown(output.dateLine)}</p>` : ""}
${preambleHtml}
${recitalsHtml}
${operativeHtml}
${clausesHtml}
${sigsHtml}
${witnessesHtml}
${stampHtml}
${footerHtml}
${printScript}
</body>
</html>`;
}
