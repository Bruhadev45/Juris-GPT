/**
 * Partnership Deed — Indian template.
 *
 * Grounded in:
 *  - Indian Partnership Act, 1932 — primary statute (Sections 4, 11, 13, 14, 18, 32, 39 et seq.)
 *  - Indian Contract Act, 1872
 *  - Indian Stamp Act, 1899 — partnership deeds attract stamp duty per State Schedule
 *  - Income Tax Act, 1961 — Section 184 (taxation of firms), Section 40(b) (interest & remuneration limits)
 *
 * Note: A partnership firm is NOT a separate legal entity (unlike LLP under LLP Act 2008).
 * Registration of partnership is optional but highly recommended (Section 69 disqualifies
 * unregistered firms from suing for enforcement of contractual rights against third parties).
 *
 * Section 40(b) Income Tax Act limits on partner remuneration (FY 2025-26):
 *  - Up to first INR 6 lakh of book profit: INR 3 lakh OR 90% (whichever higher)
 *  - On balance: 60%
 *  - Interest on capital cap: 12% per annum
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  formatDate,
  asMonths,
  todayIN,
  governingLawClause,
  arbitrationClause,
  noticeClause,
  severabilityClause,
  stampDutyNote,
} from "./shared";

export const renderPartnershipDeed: TemplateRenderer = (formData): TemplateOutput => {
  const firmName = val(formData, "firmName");
  const firmAddr = val(formData, "firmAddress");
  const business = val(formData, "businessNature");
  const commencement = formatDate(formData["commencementDate"]);
  const firmPan = val(formData, "firmPAN", "(to be applied for)");

  const p1Name = val(formData, "partner1Name");
  const p1Addr = val(formData, "partner1Address");
  const p1Pan = val(formData, "partner1PAN");
  const p1Capital = formatINR(formData["partner1Capital"]);
  const p1Profit = val(formData, "partner1ProfitShare");
  const p1Salary = has(formData, "partner1Salary") ? formatINRShort(formData["partner1Salary"]) : "";

  const p2Name = val(formData, "partner2Name");
  const p2Addr = val(formData, "partner2Address");
  const p2Pan = val(formData, "partner2PAN");
  const p2Capital = formatINR(formData["partner2Capital"]);
  const p2Profit = val(formData, "partner2ProfitShare");
  const p2Salary = has(formData, "partner2Salary") ? formatINRShort(formData["partner2Salary"]) : "";

  const banking = val(formData, "bankingArrangement", "Either Partner Can Operate");
  const interestCapital = val(formData, "interestOnCapital", "12");
  const interestDrawings = val(formData, "interestOnDrawings", "0");
  const decisionMaking = val(formData, "decisionMaking", "Unanimous");
  const admission = val(formData, "admissionOfPartner", "Unanimous Consent Required");
  const retirementNotice = asMonths(formData["retirementNotice"]);
  const dissolutionTerms = val(formData, "dissolutionTerms");
  const includeArbitration = formData["arbitration"] !== false;

  return {
    title: "Deed of Partnership",
    lawReference:
      "Executed under the Indian Partnership Act, 1932, and the Indian Contract Act, 1872",
    stampNote: stampDutyNote,
    dateLine: `This Deed of Partnership is made on **${todayIN()}** at ${firmAddr.split(",")[0] || "____"}`,
    preamble: [
      `BY AND BETWEEN`,
      `1. **${p1Name}**, son/daughter of __________, aged about __ years, residing at ${p1Addr}, holding PAN ${p1Pan} (hereinafter referred to as the "**First Party**" or "**Partner of the First Part**");`,
      `2. **${p2Name}**, son/daughter of __________, aged about __ years, residing at ${p2Addr}, holding PAN ${p2Pan} (hereinafter referred to as the "**Second Party**" or "**Partner of the Second Part**");`,
      `(The First Party and the Second Party are hereinafter individually referred to as a "**Partner**" and collectively as the "**Partners**".)`,
    ],
    recitals: [
      `WHEREAS, the Partners are desirous of carrying on business in partnership in the name and style of **"${firmName}"** for the conduct of business of *${business}*, with effect from **${commencement}**;`,
      `WHEREAS, the Partners are desirous of reducing into writing the terms and conditions agreed amongst themselves for the conduct of the said partnership;`,
      `NOW THIS DEED WITNESSETH AND IT IS HEREBY AGREED, declared and reduced into writing as follows:`,
    ],
    clauses: [
      {
        heading: "1. Name and Style of the Firm",
        body:
          `That the partnership business carried on by the Partners shall be conducted under the name ` +
          `and style of **"${firmName}"** (the "**Firm**") or such other name(s) as the Partners may ` +
          `mutually agree upon from time to time.`,
      },
      {
        heading: "2. Principal Place of Business",
        body:
          `That the principal place of business of the Firm shall be at ${firmAddr}. The Partners may ` +
          `also conduct business at such other place(s) as may be mutually decided from time to time.`,
      },
      {
        heading: "3. Nature of Business",
        body:
          `That the business of the Firm shall be: *${business}*, and any other business or businesses ` +
          `as the Partners may mutually agree upon in writing from time to time.`,
      },
      {
        heading: "4. Date of Commencement",
        body:
          `That the partnership shall be deemed to have commenced with effect from **${commencement}**, ` +
          `and shall continue at-will until dissolved in the manner provided herein.`,
      },
      {
        heading: "5. Capital Contribution",
        body:
          `That the initial capital of the Firm shall be contributed by the Partners as follows:\n\n` +
          `(a) **${p1Name}** (First Party): ${p1Capital}\n` +
          `(b) **${p2Name}** (Second Party): ${p2Capital}\n\n` +
          `The Partners may contribute additional capital from time to time as mutually agreed. The ` +
          `capital accounts of the Partners shall be maintained in the books of the Firm.`,
      },
      {
        heading: "6. Profit and Loss Sharing",
        body:
          `That the net profits or losses of the Firm, as ascertained at the end of each financial year ` +
          `(31st March) after providing for all expenses, depreciation, and statutory dues, shall be ` +
          `shared between the Partners in the following ratio:\n\n` +
          `(a) **${p1Name}**: ${p1Profit}%\n` +
          `(b) **${p2Name}**: ${p2Profit}%`,
      },
      {
        heading: "7. Interest on Capital",
        body:
          `That a simple interest at the rate of **${interestCapital}% per annum** shall be allowed on ` +
          `the capital contribution of each Partner, in accordance with Section 40(b) of the Income Tax ` +
          `Act, 1961, which permits interest up to 12% per annum as a deductible expense. Interest on ` +
          `capital shall be credited to the respective capital accounts at the end of each financial year.`,
      },
      ...(Number(interestDrawings) > 0
        ? [
            {
              heading: "8. Interest on Drawings",
              body:
                `That interest at the rate of **${interestDrawings}% per annum** shall be charged on the ` +
                `drawings of each Partner, computed on the basis of the period for which the amounts ` +
                `remained drawn during the financial year.`,
            },
          ]
        : []),
      ...(p1Salary || p2Salary
        ? [
            {
              heading: `${Number(interestDrawings) > 0 ? "9" : "8"}. Remuneration to Partners`,
              body:
                `That the Partners shall be entitled to monthly remuneration / salary as follows for ` +
                `their services rendered to the Firm:\n\n` +
                (p1Salary ? `(a) **${p1Name}**: ${p1Salary} per month\n` : "") +
                (p2Salary ? `(b) **${p2Name}**: ${p2Salary} per month\n\n` : "") +
                `The remuneration shall be subject to the limits prescribed under Section 40(b) of the ` +
                `Income Tax Act, 1961, viz.: (i) on the first INR 6,00,000 of book profit or in case of ` +
                `loss — INR 3,00,000 or 90% of book profit, whichever is higher; (ii) on the balance of ` +
                `book profit — 60%. Any excess shall be added back for tax computation.`,
            },
          ]
        : []),
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 8}. Banking Arrangements`,
        body:
          `That the Firm shall open and operate one or more bank accounts in the name of the Firm with ` +
          `any scheduled commercial bank. The said account(s) shall be operated as follows: ` +
          `**${banking}**. All cheques, demand drafts, and other negotiable instruments shall be signed ` +
          `accordingly.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 9}. Books of Account and Audit`,
        body:
          `That proper books of account shall be maintained at the principal place of business of the ` +
          `Firm. The books shall be open to inspection by all Partners at all reasonable times. The ` +
          `accounts of the Firm shall be audited annually if required under the Income Tax Act, 1961 ` +
          `(Section 44AB), or by mutual agreement.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 10}. Decision Making`,
        body:
          `That all decisions concerning the management and affairs of the Firm shall be taken by ` +
          `**${decisionMaking.toLowerCase()}**. Each Partner shall be the agent of the Firm and the ` +
          `other Partner(s) for the purposes of the business of the Firm, in accordance with Section ` +
          `18 of the Indian Partnership Act, 1932.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 11}. Admission of New Partner`,
        body:
          `That no new Partner shall be admitted to the Firm except by way of **${admission}**. The ` +
          `terms of admission, capital contribution, and profit/loss share of any new Partner shall be ` +
          `set out in a supplementary deed.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 12}. Retirement and Death of a Partner`,
        body:
          `(a) Any Partner desirous of retiring shall give not less than **${retirementNotice}** prior ` +
          `written notice to the other Partner(s).\n\n` +
          `(b) On retirement, the retiring Partner's capital, undrawn profits, and accrued interest ` +
          `shall be settled within ninety (90) days of retirement, after preparing a balance sheet as ` +
          `on the date of retirement.\n\n` +
          `(c) On the death of any Partner, the legal heir(s) of the deceased Partner shall not ` +
          `automatically become a Partner; the surviving Partner(s) may either continue the business or ` +
          `dissolve the Firm. The amount due to the legal heirs shall be ascertained and paid in ` +
          `accordance with Section 37 of the Indian Partnership Act, 1932.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 13}. Dissolution`,
        body:
          `(a) The Firm may be dissolved by mutual consent of the Partners, in accordance with Section ` +
          `40 of the Indian Partnership Act, 1932. The dissolution terms agreed are: ${dissolutionTerms}.\n\n` +
          `(b) On dissolution, the assets of the Firm shall be applied in the following order: ` +
          `(i) discharge of debts and liabilities to third parties; (ii) repayment of advances by Partners; ` +
          `(iii) refund of capital contributions; and (iv) distribution of any surplus among the ` +
          `Partners in their profit-sharing ratio, as per Section 48 of the Indian Partnership Act, 1932.`,
      },
      ...(includeArbitration
        ? [
            {
              heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + 14}. Arbitration`,
              body: arbitrationClause(firmAddr.split(",")[0]?.trim() || "Bengaluru"),
            },
          ]
        : []),
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + (includeArbitration ? 15 : 14)}. Governing Law`,
        body: governingLawClause("Karnataka") + ` All matters not specifically dealt with herein shall be governed by the provisions of the Indian Partnership Act, 1932.`,
      },
      {
        heading: `${(p1Salary || p2Salary ? 1 : 0) + (Number(interestDrawings) > 0 ? 1 : 0) + (includeArbitration ? 16 : 15)}. Severability and Notices`,
        body: `${severabilityClause} ${noticeClause}`,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Partners hereto have set their respective hands and signatures on this Deed of Partnership on the day, month, and year first hereinabove written.",
    signatures: [
      { label: "First Party", name: p1Name === PLACEHOLDER ? "" : p1Name, designation: "" },
      { label: "Second Party", name: p2Name === PLACEHOLDER ? "" : p2Name, designation: "" },
    ],
    witnesses: [{ label: "Witness 1", name: "" }, { label: "Witness 2", name: "" }],
    footer:
      "REGISTRATION NOTE: While registration of a partnership firm with the Registrar of Firms is optional, " +
      "Section 69 of the Indian Partnership Act, 1932 disqualifies unregistered firms from suing for " +
      "enforcement of contractual rights against third parties. Partners are strongly advised to register " +
      "the Firm. Form 1 must be filed with the Registrar of Firms in the State, with prescribed fees and " +
      "the original Deed (or certified copy). Stamp duty applicable as per State Schedule of the Indian Stamp Act, 1899.",
  };
};
