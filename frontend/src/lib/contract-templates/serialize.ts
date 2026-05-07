/**
 * Serialize a structured TemplateOutput into plain text suitable for
 * copying to clipboard, downloading as .txt, or feeding into the backend
 * AI pipeline as a base draft.
 */

import type { TemplateOutput, TemplateClause } from "./types";

function clauseToText(clause: TemplateClause, depth = 0): string {
  if (clause.showIf && !clause.showIf()) return "";
  const indent = "  ".repeat(depth);
  let out = `\n${indent}${clause.heading}\n`;
  out += stripMarkdown(clause.body)
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
  if (clause.sub) {
    for (const sub of clause.sub) out += clauseToText(sub, depth + 1);
  }
  return out + "\n";
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

export function templateToPlainText(output: TemplateOutput): string {
  const lines: string[] = [];
  const sep = "═".repeat(70);

  lines.push(sep);
  lines.push(output.title.toUpperCase().split("").join(" "));
  if (output.lawReference) lines.push(`(${output.lawReference})`);
  lines.push(sep);
  lines.push("");

  if (output.dateLine) lines.push(stripMarkdown(output.dateLine));
  lines.push("");

  for (const p of output.preamble) lines.push(stripMarkdown(p));
  lines.push("");

  if (output.recitals) {
    for (const r of output.recitals) lines.push(stripMarkdown(r));
    lines.push("");
  }

  if (output.operativeIntro) {
    lines.push(stripMarkdown(output.operativeIntro));
    lines.push("");
  }

  for (const clause of output.clauses) {
    lines.push(clauseToText(clause));
  }

  lines.push("");
  lines.push("─".repeat(70));
  lines.push("SIGNED AND DELIVERED:");
  lines.push("");
  for (const sig of output.signatures) {
    lines.push(`  ${sig.label}`);
    lines.push(`  ${"_".repeat(40)}`);
    if (sig.name) lines.push(`  ${sig.name}`);
    if (sig.designation) lines.push(`  ${sig.designation}`);
    if (sig.org) lines.push(`  ${sig.org}`);
    lines.push("");
  }

  if (output.witnesses && output.witnesses.length > 0) {
    lines.push("IN THE PRESENCE OF:");
    lines.push("");
    for (const w of output.witnesses) {
      lines.push(`  ${w.label}: ${w.name || "_".repeat(30)}`);
      lines.push(`  Address: ${"_".repeat(40)}`);
      lines.push("");
    }
  }

  if (output.stampNote) {
    lines.push("─".repeat(70));
    lines.push("STAMP DUTY:");
    lines.push(stripMarkdown(output.stampNote));
    lines.push("");
  }

  if (output.footer) {
    lines.push("─".repeat(70));
    lines.push(stripMarkdown(output.footer));
  }

  return lines.join("\n");
}
