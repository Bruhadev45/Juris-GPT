/**
 * Indian legal contract template types.
 *
 * Each template is a structured document model that the LivePreview can
 * render and that can be serialized to plain text / DOCX / PDF on the
 * backend. Templates are grounded in Indian statutory law — see
 * shared.ts for citations.
 */

export type FormData = Record<string, unknown>;

export interface TemplatePartyBlock {
  /** Label shown above signature line, e.g. "Disclosing Party" */
  label: string;
  /** Authorized signatory name */
  name?: string;
  /** Designation (Director, CEO, etc.) */
  designation?: string;
  /** Organization name (if signing on behalf of entity) */
  org?: string;
}

export interface TemplateClause {
  /** Numbered heading, e.g. "1. Definitions" */
  heading: string;
  /** Body text — supports basic markdown (bold via **text**) */
  body: string;
  /** Optional sub-clauses */
  sub?: TemplateClause[];
  /** Show only if this returns true */
  showIf?: () => boolean;
}

export interface TemplateOutput {
  /** Document title (centered, uppercase) */
  title: string;
  /** Statutory reference shown under title, e.g. "Indian Contract Act, 1872" */
  lawReference?: string;
  /** Stamp duty / execution note */
  stampNote?: string;
  /** Date line at top (defaults to current date) */
  dateLine?: string;
  /** "BETWEEN" preamble paragraphs (parties & recitals) */
  preamble: string[];
  /** Recitals (the "WHEREAS" clauses) — optional */
  recitals?: string[];
  /** "NOW, THEREFORE..." operative clause introduction */
  operativeIntro?: string;
  /** Numbered clauses (1, 2, 3...) */
  clauses: TemplateClause[];
  /** Signature blocks at the end */
  signatures: TemplatePartyBlock[];
  /** Optional witness blocks */
  witnesses?: TemplatePartyBlock[];
  /** Footer notice (disclaimer, jurisdiction, etc.) */
  footer?: string;
}

export type TemplateRenderer = (formData: FormData) => TemplateOutput;
