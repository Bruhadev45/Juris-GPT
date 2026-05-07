/**
 * Shared Indian legal boilerplate.
 *
 * Reusable clauses, statutory references, and helpers used across all
 * contract templates. Each clause is grounded in actual Indian statute.
 *
 * Statutory references used:
 *  - Indian Contract Act, 1872 — general contract validity (Sections 10, 23, 25, 27)
 *  - Indian Stamp Act, 1899    — stamp duty admissibility
 *  - Companies Act, 2013       — corporate governance, ESOP (Section 62), SHA
 *  - Companies (Share Capital and Debentures) Rules, 2014 — Rule 12 ESOP
 *  - Indian Partnership Act, 1932 — partnership deed
 *  - Income Tax Act, 1961       — TDS Section 194J (professional/technical fees)
 *  - CGST/SGST Act, 2017        — GST on services
 *  - Arbitration & Conciliation Act, 1996 — arbitration clause
 *  - Information Technology Act, 2000 — electronic records / e-signatures
 *  - DPDP Act, 2023             — personal data
 *  - Industrial Disputes Act, 1947 — employment notice/termination
 *  - Payment of Gratuity Act, 1972 — gratuity (5-year rule for permanent employees)
 *  - Employees' Provident Funds Act, 1952 — PF contributions
 *  - Code on Social Security, 2020 / Code on Wages, 2019 — new labour codes effective 2026
 */

export type FormData = Record<string, unknown>;

export const PLACEHOLDER = "____________";

export function val(formData: FormData, key: string, fallback = PLACEHOLDER): string {
  const v = formData[key];
  if (v === undefined || v === null || v === "") return fallback;
  return String(v);
}

export function has(formData: FormData, key: string): boolean {
  const v = formData[key];
  return v !== undefined && v !== null && v !== "" && v !== false;
}

export function formatDate(value: unknown): string {
  if (!value) return PLACEHOLDER;
  const str = String(value);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayIN(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function asYears(value: unknown): string {
  const n = Number(value);
  if (!value || isNaN(n)) return PLACEHOLDER;
  return `${n} (${numberInWords(n)}) year${n === 1 ? "" : "s"}`;
}

export function asMonths(value: unknown): string {
  const n = Number(value);
  if (!value || isNaN(n)) return PLACEHOLDER;
  return `${n} (${numberInWords(n)}) month${n === 1 ? "" : "s"}`;
}

export function asDays(value: unknown): string {
  const n = Number(value);
  if (!value || isNaN(n)) return PLACEHOLDER;
  return `${n} (${numberInWords(n)}) day${n === 1 ? "" : "s"}`;
}

export function formatINR(value: unknown): string {
  const n = Number(value);
  if (!value || isNaN(n)) return PLACEHOLDER;
  return `INR ${n.toLocaleString("en-IN")} (Rupees ${numberInWords(n)} only)`;
}

export function formatINRShort(value: unknown): string {
  const n = Number(value);
  if (!value || isNaN(n)) return PLACEHOLDER;
  return `INR ${n.toLocaleString("en-IN")}`;
}

/**
 * Convert a number to words (Indian English convention).
 * Used for legal documents which conventionally write amounts in words.
 * Handles up to 99,99,99,999 (99 crore 99 lakh 99 thousand 999).
 */
export function numberInWords(num: number): string {
  if (num === 0) return "Zero";
  if (!isFinite(num)) return String(num);
  num = Math.floor(num);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function below100(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function below1000(n: number): string {
    if (n < 100) return below100(n);
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below100(n % 100) : "");
  }

  let result = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  if (crore > 0) result += below1000(crore) + " Crore ";
  if (lakh > 0) result += below1000(lakh) + " Lakh ";
  if (thousand > 0) result += below1000(thousand) + " Thousand ";
  if (rest > 0) result += below1000(rest);
  return result.trim();
}

/* ─────────────────────────────────────────────────────────────────
 * Reusable Indian boilerplate clauses
 * ───────────────────────────────────────────────────────────────── */

/**
 * Standard governing law clause — Indian Contract Act, 1872.
 */
export function governingLawClause(state?: string): string {
  const s = state && state !== PLACEHOLDER ? state : "Karnataka";
  return (
    `This Agreement shall be governed by, and construed in accordance with, the laws of India, ` +
    `including without limitation the Indian Contract Act, 1872. The Parties hereby submit to the ` +
    `exclusive jurisdiction of the competent courts at ${s}.`
  );
}

/**
 * Arbitration clause under Arbitration and Conciliation Act, 1996.
 */
export function arbitrationClause(seat?: string): string {
  const s = seat && seat !== PLACEHOLDER ? seat : "Bengaluru";
  return (
    `Any dispute, controversy or claim arising out of or relating to this Agreement, including its ` +
    `existence, validity, interpretation, performance, breach or termination, shall be referred to and ` +
    `finally resolved by arbitration administered in accordance with the Arbitration and Conciliation ` +
    `Act, 1996, as amended from time to time. The seat and venue of arbitration shall be ${s}, India. ` +
    `The arbitration shall be conducted by a sole arbitrator mutually appointed by the Parties, in the ` +
    `English language. The arbitral award shall be final and binding upon the Parties.`
  );
}

/**
 * Force majeure clause — standard in Indian commercial contracts.
 */
export const forceMajeureClause =
  "Neither Party shall be liable for any failure or delay in performance of its obligations under " +
  "this Agreement to the extent such failure or delay is caused by an event of Force Majeure, " +
  "including but not limited to acts of God, war, riots, civil commotion, strikes, lockouts, " +
  "epidemics, pandemics, fire, flood, earthquake, governmental action, or any other event beyond the " +
  "reasonable control of such Party. The affected Party shall notify the other Party within seven (7) " +
  "days of the occurrence of such event.";

/**
 * Notice clause — communications under Indian Contract Act and IT Act, 2000.
 */
export const noticeClause =
  "All notices, requests, demands, and other communications under this Agreement shall be in writing " +
  "and shall be deemed duly given (a) when delivered personally, (b) on the third business day after " +
  "being sent by registered post with acknowledgment due, or (c) on the date of confirmed transmission " +
  "by email at the addresses set out above. Notices delivered by electronic means shall be valid under " +
  "the Information Technology Act, 2000.";

/**
 * Severability clause.
 */
export const severabilityClause =
  "If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of " +
  "competent jurisdiction, such provision shall be severed from this Agreement, and the remaining " +
  "provisions shall continue in full force and effect.";

/**
 * Entire agreement / merger clause.
 */
export const entireAgreementClause =
  "This Agreement, together with its schedules and annexures (if any), constitutes the entire " +
  "understanding between the Parties with respect to the subject matter hereof and supersedes all " +
  "prior negotiations, representations, and agreements, whether oral or written.";

/**
 * Amendment clause.
 */
export const amendmentClause =
  "No amendment, modification, or waiver of any provision of this Agreement shall be effective unless " +
  "made in writing and signed by both Parties.";

/**
 * Counterparts and electronic execution clause.
 */
export const counterpartsClause =
  "This Agreement may be executed in any number of counterparts, each of which when executed and " +
  "delivered shall constitute an original, and all counterparts together shall constitute one and the " +
  "same instrument. Execution via electronic signature in compliance with the Information Technology " +
  "Act, 2000, shall be legally valid and binding.";

/**
 * Stamp duty note — must be appropriately stamped under Indian Stamp Act, 1899.
 */
export const stampDutyNote =
  "This Agreement is to be executed on non-judicial stamp paper of appropriate value as per the " +
  "Indian Stamp Act, 1899, and the applicable State Stamp Act of the State in which it is executed. " +
  "Inadequate stamping may render the document inadmissible as evidence in legal proceedings.";

/**
 * Confidentiality clause — Indian Contract Act + DPDP Act, 2023.
 */
export const confidentialityClause =
  "Each Party shall maintain in strict confidence all Confidential Information of the other Party and " +
  "shall not disclose, publish, or use such Confidential Information for any purpose other than the " +
  "performance of this Agreement. The obligations of confidentiality shall survive the termination " +
  "of this Agreement. Where personal data is involved, both Parties shall comply with the Digital " +
  "Personal Data Protection Act, 2023.";

/**
 * IP assignment clause — work-for-hire under Copyright Act, 1957.
 */
export const ipAssignmentClause =
  "All intellectual property created, conceived, developed, or reduced to practice in connection with " +
  "this Agreement shall be the sole and exclusive property of the Company. The other Party hereby " +
  "irrevocably assigns to the Company all right, title, and interest, including all moral rights to " +
  "the extent permitted under the Copyright Act, 1957, in and to such intellectual property, free of " +
  "any claim or encumbrance.";

/**
 * Section 27 awareness — Indian Contract Act prohibits restraint of trade.
 * Use a non-solicitation framing instead of post-employment non-compete.
 */
export const nonSolicitationClause =
  "During the term of this Agreement and for a period of twelve (12) months thereafter, the receiving " +
  "Party shall not, directly or indirectly, solicit any employee, consultant, customer, or supplier " +
  "of the disclosing Party. This clause is intended to operate as a permissible non-solicitation " +
  "covenant under Indian law and shall not be construed as a restraint of trade contrary to Section " +
  "27 of the Indian Contract Act, 1872.";

/**
 * GST clause — services subject to CGST/SGST/IGST under GST Act, 2017.
 */
export function gstClause(rate?: number): string {
  const r = rate && !isNaN(rate) ? rate : 18;
  return (
    `All fees and charges payable under this Agreement are exclusive of Goods and Services Tax (GST). ` +
    `GST shall be charged additionally at the prevailing rate of ${r}% (or such other rate as may be ` +
    `applicable under the Central Goods and Services Tax Act, 2017 and the corresponding State GST Act). ` +
    `The service provider shall issue a tax invoice in compliance with applicable GST rules.`
  );
}

/**
 * TDS clause — TDS Section 194J for professional/technical services @ 10%.
 */
export const tds194JClause =
  "The Client shall deduct Tax Deducted at Source (TDS) at the rate of 10% (or such other rate as " +
  "applicable from time to time) on professional fees under Section 194J of the Income Tax Act, 1961, " +
  "and shall furnish a TDS certificate (Form 16A) to the Consultant within the prescribed timeline. " +
  "TDS shall be calculated on the base amount excluding GST, provided the GST component is shown " +
  "separately on the invoice.";

/**
 * Standard termination clause for fixed-term contracts.
 */
export function terminationClause(days?: number): string {
  const d = days && !isNaN(Number(days)) ? Number(days) : 30;
  return (
    `Either Party may terminate this Agreement by giving ${d} (${numberInWords(d)}) days' prior ` +
    `written notice to the other Party. The Agreement may also be terminated immediately by either ` +
    `Party in the event of (a) a material breach not cured within fifteen (15) days of written notice, ` +
    `(b) insolvency, winding-up, or bankruptcy of the other Party, or (c) any act of fraud or ` +
    `dishonesty by the other Party.`
  );
}

/**
 * Indemnification clause (Section 124 of Indian Contract Act, 1872).
 */
export const indemnityClause =
  "Each Party shall indemnify, defend, and hold harmless the other Party, its officers, directors, " +
  "and employees from and against any and all claims, losses, damages, liabilities, costs, and " +
  "expenses (including reasonable attorneys' fees) arising out of or in connection with any breach of " +
  "this Agreement, gross negligence, willful misconduct, or violation of applicable law by the " +
  "indemnifying Party, in accordance with Section 124 of the Indian Contract Act, 1872.";
