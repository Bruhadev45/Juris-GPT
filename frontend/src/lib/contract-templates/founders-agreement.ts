/**
 * Founders' Agreement — Indian startup template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — contractual validity (Section 25 consideration)
 *  - Companies Act, 2013       — Section 149 directors, Section 173 board meetings
 *  - Section 27 ICA            — non-compete vs non-solicitation distinction
 *  - Specific Relief Act, 1963 — equitable remedies
 *
 * Standard market practice for Indian startups (sourced from StartupIndia, EquityList,
 * Treelife): 4-year vesting with 1-year cliff, good leaver / bad leaver provisions,
 * mandatory IP assignment, and reserved matters requiring unanimous consent.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  asMonths,
  todayIN,
  governingLawClause,
  arbitrationClause,
  noticeClause,
  severabilityClause,
  entireAgreementClause,
  amendmentClause,
  counterpartsClause,
  stampDutyNote,
  ipAssignmentClause,
  nonSolicitationClause,
  confidentialityClause,
} from "./shared";

export const renderFoundersAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const cin = val(formData, "cin", "(to be incorporated)");
  const companyAddr = val(formData, "companyAddress");
  const companyPan = val(formData, "companyPAN");
  const authCapital = formatINR(formData["authorizedCapital"]);
  const business = val(formData, "businessActivity");

  const f1Name = val(formData, "founder1Name");
  const f1Addr = val(formData, "founder1Address");
  const f1Pan = val(formData, "founder1PAN");
  const f1Email = val(formData, "founder1Email", "");
  const f1Equity = val(formData, "founder1Equity");
  const f1Role = val(formData, "founder1Role");
  const f1Inv = formatINRShort(formData["founder1Investment"]);

  const hasF2 = has(formData, "founder2Name");
  const f2Name = val(formData, "founder2Name", "");
  const f2Addr = val(formData, "founder2Address", "");
  const f2Pan = val(formData, "founder2PAN", "");
  const f2Equity = val(formData, "founder2Equity", "");
  const f2Role = val(formData, "founder2Role", "");
  const f2Inv = has(formData, "founder2Investment") ? formatINRShort(formData["founder2Investment"]) : PLACEHOLDER;

  const vestingPeriod = asMonths(formData["vestingPeriod"]);
  const cliff = asMonths(formData["cliffPeriod"]);
  const decisionMaking = val(formData, "decisionMaking", "majority consent");
  const reservedMatters = val(formData, "reservedMatters");
  const govLaw = val(formData, "governingLaw", "Karnataka");
  const jurisdiction = val(formData, "jurisdiction", "Bengaluru");

  return {
    title: "Founders' Agreement",
    lawReference:
      "Executed under the Indian Contract Act, 1872 and the Companies Act, 2013",
    stampNote: stampDutyNote,
    dateLine: `This Founders' Agreement (the "**Agreement**") is made and entered into on **${todayIN()}**`,
    preamble: [
      `BY AND BETWEEN`,
      `**${f1Name}**, son/daughter of __________, aged about __ years, residing at ${f1Addr}, holding PAN ${f1Pan} (hereinafter referred to as the "**Founder 1**");`,
      ...(hasF2
        ? [
            `AND`,
            `**${f2Name}**, son/daughter of __________, aged about __ years, residing at ${f2Addr}, holding PAN ${f2Pan} (hereinafter referred to as the "**Founder 2**");`,
          ]
        : []),
      `(Founder 1 ${hasF2 ? "and Founder 2" : ""} are hereinafter individually referred to as a "**Founder**" and collectively as the "**Founders**".)`,
      `IN RELATION TO`,
      `**${company}**, a private limited company ${has(formData, "cin") ? `bearing CIN ${cin}` : "(proposed to be incorporated)"} under the Companies Act, 2013, having its registered office at ${companyAddr}, PAN ${companyPan} (hereinafter referred to as the "**Company**").`,
    ],
    recitals: [
      `WHEREAS, the Founders intend to incorporate / have incorporated the Company for the purpose of carrying on the business of *${business}*;`,
      `WHEREAS, the Founders wish to set out the terms governing their respective rights, obligations, equity, and roles in the Company;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, and pursuant to Section 25 of the Indian Contract Act, 1872, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. The Company",
        body:
          `The Company shall be engaged in the business of *${business}*. The authorized share capital ` +
          `of the Company shall be ${authCapital}, divided into equity shares of face value INR 10/- each. ` +
          `The Company shall be governed by its Memorandum of Association (MOA), Articles of Association ` +
          `(AOA), the Companies Act, 2013, and the Companies (Share Capital and Debentures) Rules, 2014.`,
      },
      {
        heading: "2. Equity Distribution",
        body:
          `Subject to vesting in Clause 3 below, the equity holding of the Founders in the Company shall be:` +
          `\n\n- **${f1Name}**: ${f1Equity}% (Initial Capital Contribution: ${f1Inv})` +
          (hasF2
            ? `\n- **${f2Name}**: ${f2Equity}% (Initial Capital Contribution: ${f2Inv})`
            : "") +
          `\n\nThe Founders shall execute all necessary documents (including Form PAS-3 and SH-4) to give effect to this allotment.`,
      },
      {
        heading: "3. Founder Vesting",
        body:
          `The shares allotted to each Founder shall vest over a total period of **${vestingPeriod}**, ` +
          `with a cliff period of **${cliff}**. No shares shall vest during the cliff period; on the ` +
          `expiry of the cliff, ${cliff === "12 (Twelve) months" ? "twenty-five percent (25%)" : "the proportionate amount"} ` +
          `of the shares shall vest, and the remaining shares shall vest in equal monthly instalments ` +
          `over the balance vesting period. Any unvested shares as on the date of cessation of a ` +
          `Founder's engagement with the Company shall be forfeited or transferred to the Company at par ` +
          `value, in accordance with the Articles of Association.`,
      },
      {
        heading: "4. Roles and Responsibilities",
        body:
          `Each Founder shall serve the Company in the following capacity on a full-time basis:` +
          `\n\n- **${f1Name}**: ${f1Role}` +
          (hasF2 ? `\n- **${f2Name}**: ${f2Role}` : "") +
          `\n\nEach Founder shall devote his/her full business time, attention, and energies to the affairs of the Company.`,
      },
      {
        heading: "5. Good Leaver / Bad Leaver",
        body:
          `(a) A "**Good Leaver**" means a Founder who ceases to be associated with the Company due to ` +
          `death, permanent disability, or termination without cause. A Good Leaver shall retain all ` +
          `vested shares as on the date of cessation.\n\n` +
          `(b) A "**Bad Leaver**" means a Founder who resigns voluntarily prior to the expiry of the ` +
          `vesting period, is terminated for cause (including fraud, dishonesty, or material breach), or ` +
          `materially breaches this Agreement. A Bad Leaver shall forfeit all unvested shares; in addition, ` +
          `the Company (or other Founders) shall have a right to repurchase the vested shares at the lower ` +
          `of par value or fair market value as determined by an independent registered valuer.`,
      },
      {
        heading: "6. Intellectual Property Assignment",
        body:
          `Each Founder hereby irrevocably assigns to the Company, free of any encumbrance, all right, ` +
          `title, and interest (including all moral rights to the extent permitted under the Copyright ` +
          `Act, 1957) in and to all intellectual property created, conceived, developed, or contributed ` +
          `by such Founder, whether prior to or during the term of this Agreement, that relates to or ` +
          `arises out of the business of the Company. The Founders shall execute all documents necessary ` +
          `to perfect such assignment.`,
      },
      {
        heading: "7. Board and Governance",
        body:
          `The Board of Directors of the Company shall be constituted in accordance with Section 149 of ` +
          `the Companies Act, 2013. Each Founder shall be entitled to be appointed as a Director and ` +
          `shall not be removed without the prior written consent of such Founder, except for cause. ` +
          `Decisions of the Board shall be taken by ${decisionMaking}, except for the Reserved Matters ` +
          `under Clause 8 below.`,
      },
      {
        heading: "8. Reserved Matters",
        body:
          `The following matters shall require the unanimous written consent of all Founders, ` +
          `notwithstanding any provision of the Articles of Association: ${reservedMatters}. Any action ` +
          `taken in violation of this clause shall be null and void.`,
      },
      {
        heading: "9. Confidentiality",
        body: confidentialityClause,
      },
      {
        heading: "10. Non-Solicitation (Section 27 Compliant)",
        body: nonSolicitationClause,
      },
      {
        heading: "11. Restriction on Transfer of Shares",
        body:
          `No Founder shall transfer, sell, pledge, encumber, or otherwise alienate any shares held in ` +
          `the Company without the prior written consent of the other Founders, save and except in ` +
          `accordance with the Articles of Association and the Companies Act, 2013, and subject to a ` +
          `Right of First Refusal in favour of the other Founders and the Company.`,
      },
      {
        heading: "12. Drag-Along and Tag-Along",
        body:
          `In the event of a bona fide offer to acquire 100% of the share capital of the Company, the ` +
          `Founders holding a majority of the equity shares may "drag along" the remaining Founders ` +
          `provided the terms are equal for all. Conversely, if any Founder proposes to sell shares to a ` +
          `third party, the other Founders shall have a "tag-along" right to participate in the sale on ` +
          `the same terms, pro-rata to their shareholding.`,
      },
      {
        heading: "13. Dispute Resolution",
        body: arbitrationClause(jurisdiction),
      },
      {
        heading: "14. Governing Law",
        body: governingLawClause(govLaw),
      },
      {
        heading: "15. Notices",
        body: noticeClause,
      },
      {
        heading: "16. Severability",
        body: severabilityClause,
      },
      {
        heading: "17. Entire Agreement & Amendment",
        body: `${entireAgreementClause} ${amendmentClause}`,
      },
      {
        heading: "18. Counterparts and Electronic Execution",
        body: counterpartsClause,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Founders have executed this Founders' Agreement on the date and year first written above.",
    signatures: [
      {
        label: "Founder 1",
        name: f1Name === PLACEHOLDER ? "" : f1Name,
        designation: f1Role === PLACEHOLDER ? "" : f1Role,
      },
      ...(hasF2
        ? [
            {
              label: "Founder 2",
              name: f2Name === PLACEHOLDER ? "" : f2Name,
              designation: f2Role === PLACEHOLDER ? "" : f2Role,
            },
          ]
        : []),
    ],
    witnesses: [
      { label: "Witness 1", name: "" },
      { label: "Witness 2", name: "" },
    ],
    footer:
      "Drafting note: This Agreement should be executed BEFORE shares are allotted to the Founders. " +
      "Vesting applied retrospectively to already-issued shares is procedurally difficult. " +
      "Founders are advised to obtain independent legal counsel and to ensure that the Articles of " +
      "Association of the Company are amended to reflect the rights and restrictions herein.",
  };
};
