/**
 * Non-Disclosure Agreement (NDA) — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — Section 10 (valid contract), Section 27 (restraint of trade)
 *  - Indian Stamp Act, 1899 — execution on stamp paper
 *  - Arbitration & Conciliation Act, 1996 — dispute resolution
 *  - DPDP Act, 2023 — personal data
 *
 * Drafting note: Section 27 of the Indian Contract Act voids agreements in
 * restraint of trade. Confidentiality NDAs are enforceable as they protect
 * legitimate proprietary information rather than restrain employment, but
 * post-termination non-compete clauses are generally NOT enforceable.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatDate,
  todayIN,
  asYears,
  governingLawClause,
  arbitrationClause,
  forceMajeureClause,
  noticeClause,
  severabilityClause,
  entireAgreementClause,
  amendmentClause,
  counterpartsClause,
  stampDutyNote,
} from "./shared";

export const renderNDA: TemplateRenderer = (formData): TemplateOutput => {
  const ndaType = val(formData, "ndaType", "Mutual (Two-Way)");
  const isMutual = ndaType.toLowerCase().includes("mutual");
  const includeArbitration = formData["arbitration"] !== false;

  const effectiveDate = has(formData, "effectiveDate")
    ? formatDate(formData["effectiveDate"])
    : todayIN();

  const dpName = val(formData, "disclosingPartyName");
  const dpType = val(formData, "disclosingPartyType", "company");
  const dpAddr = val(formData, "disclosingPartyAddress");
  const dpPan = val(formData, "disclosingPartyPAN");
  const dpGstin = val(formData, "disclosingPartyGSTIN", "");
  const dpSig = val(formData, "disclosingPartySignatory");
  const dpDes = val(formData, "disclosingPartyDesignation");

  const rpName = val(formData, "receivingPartyName");
  const rpType = val(formData, "receivingPartyType", "company");
  const rpAddr = val(formData, "receivingPartyAddress");
  const rpPan = val(formData, "receivingPartyPAN");
  const rpGstin = val(formData, "receivingPartyGSTIN", "");
  const rpSig = val(formData, "receivingPartySignatory");
  const rpDes = val(formData, "receivingPartyDesignation");

  const purpose = val(formData, "purpose");
  const confInfo = val(formData, "confidentialInfo");
  const period = asYears(formData["confidentialityPeriod"]);
  const govLaw = val(formData, "governingLaw", "Karnataka");
  const jurisdiction = val(formData, "jurisdiction", "Bengaluru");

  const dpEntityDesc =
    `**${dpName}**, a ${dpType} incorporated/constituted under the laws of India, ` +
    `having its registered office at ${dpAddr}, bearing PAN **${dpPan}**` +
    (has(formData, "disclosingPartyGSTIN") ? `, GSTIN ${dpGstin}` : "") +
    `, represented herein by its authorized signatory **${dpSig}**, ${dpDes} ` +
    `(hereinafter referred to as the "**Disclosing Party**", which expression shall, ` +
    `unless repugnant to the context or meaning thereof, mean and include its successors and permitted assigns)`;

  const rpEntityDesc =
    `**${rpName}**, a ${rpType} incorporated/constituted under the laws of India, ` +
    `having its registered office at ${rpAddr}, bearing PAN **${rpPan}**` +
    (has(formData, "receivingPartyGSTIN") ? `, GSTIN ${rpGstin}` : "") +
    `, represented herein by its authorized signatory **${rpSig}**, ${rpDes} ` +
    `(hereinafter referred to as the "**Receiving Party**", which expression shall, ` +
    `unless repugnant to the context or meaning thereof, mean and include its successors and permitted assigns)`;

  const partyShort = isMutual ? "each Party" : "the Receiving Party";
  const obligationParty = isMutual ? "Each Party" : "The Receiving Party";

  return {
    title: "Non-Disclosure Agreement",
    lawReference: "Executed under the Indian Contract Act, 1872",
    stampNote: stampDutyNote,
    dateLine: `This Agreement is made and entered into on this **${effectiveDate}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      dpEntityDesc + ";",
      `AND`,
      rpEntityDesc + ".",
      `The Disclosing Party and the Receiving Party are hereinafter individually referred to as "**Party**" and collectively as "**Parties**".`,
    ],
    recitals: [
      `WHEREAS, the Disclosing Party is engaged in business activities and possesses certain confidential and proprietary information;`,
      `WHEREAS, the Parties wish to explore a potential business relationship described herein as the "Purpose";`,
      `WHEREAS, in furtherance of such Purpose, ${partyShort} may disclose to the other certain confidential, proprietary, and trade-secret information;`,
      `NOW, THEREFORE, in consideration of the mutual covenants and undertakings set forth herein, and in accordance with Section 25 of the Indian Contract Act, 1872 (consideration), the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Definitions",
        body:
          `**"Confidential Information"** shall mean all non-public, proprietary, or confidential ` +
          `information disclosed by ${isMutual ? "either Party" : "the Disclosing Party"} to the other ` +
          `(whether disclosed orally, in writing, electronically, or by any other means, and whether or ` +
          `not marked or designated as confidential), including without limitation: ${confInfo}, business ` +
          `plans, financial information, customer and supplier data, technical data, trade secrets, ` +
          `software, source code, designs, processes, and any information that a reasonable person would ` +
          `understand to be confidential under the circumstances.`,
      },
      {
        heading: "2. Purpose",
        body:
          `The Parties wish to share Confidential Information for the limited and exclusive purpose of: ` +
          `*${purpose}* (the "**Purpose**"). The Receiving Party shall not use the Confidential ` +
          `Information for any purpose other than the Purpose without the prior written consent of the Disclosing Party.`,
      },
      {
        heading: "3. Obligations of Confidentiality",
        body:
          `${obligationParty} shall (a) hold all Confidential Information in strict confidence using ` +
          `at least the same degree of care as it uses to protect its own confidential information of a ` +
          `similar nature (and in no event less than reasonable care), (b) not disclose, publish, or ` +
          `disseminate any Confidential Information to any third party without prior written consent, ` +
          `(c) limit access to Confidential Information to its employees, directors, advisors, and ` +
          `professional consultants who have a bona fide need to know, and who are bound by ` +
          `obligations of confidentiality at least as protective as those set forth herein, and (d) use ` +
          `the Confidential Information solely for the Purpose.`,
      },
      {
        heading: "4. Exclusions",
        body:
          `The obligations of confidentiality shall not apply to information that: (a) is or becomes ` +
          `publicly available through no breach of this Agreement; (b) was known to the Receiving Party ` +
          `prior to disclosure, as evidenced by contemporaneous written records; (c) is independently ` +
          `developed by the Receiving Party without use of or reference to the Confidential Information; ` +
          `(d) is rightfully received from a third party without breach of any confidentiality ` +
          `obligation; or (e) is required to be disclosed by applicable law, court order, or governmental ` +
          `authority, provided that the Receiving Party gives prompt notice to the Disclosing Party.`,
      },
      {
        heading: "5. Term and Survival",
        body:
          `This Agreement shall commence on the Effective Date and shall remain in force for a period ` +
          `of **${period}**. The obligations of confidentiality set forth herein shall survive the ` +
          `expiry or termination of this Agreement and shall continue in perpetuity with respect to ` +
          `trade secrets and for the period stated above with respect to all other Confidential Information.`,
      },
      {
        heading: "6. Return or Destruction",
        body:
          `Upon expiry or termination of this Agreement or upon the written request of the Disclosing ` +
          `Party, the Receiving Party shall promptly return or destroy (at the Disclosing Party's option) ` +
          `all Confidential Information in its possession, custody, or control, including all copies, ` +
          `extracts, and derivatives thereof, and shall certify such return or destruction in writing.`,
      },
      {
        heading: "7. No Restraint of Trade",
        body:
          `Nothing in this Agreement shall be construed as a restraint of trade contrary to Section 27 ` +
          `of the Indian Contract Act, 1872. The obligations of confidentiality contained herein are ` +
          `intended to protect the legitimate proprietary interests of the Disclosing Party and shall ` +
          `not restrict the lawful business activities of the Receiving Party.`,
      },
      {
        heading: "8. Remedies",
        body:
          `The Parties acknowledge that any breach of this Agreement may cause irreparable harm for ` +
          `which monetary damages would be inadequate. Accordingly, the non-breaching Party shall be ` +
          `entitled to seek injunctive relief and specific performance under the Specific Relief Act, ` +
          `1963, in addition to any other remedies available at law or in equity.`,
      },
      {
        heading: "9. Governing Law and Jurisdiction",
        body: governingLawClause(govLaw),
      },
      ...(includeArbitration
        ? [
            {
              heading: "10. Arbitration",
              body: arbitrationClause(jurisdiction),
            },
          ]
        : []),
      {
        heading: `${includeArbitration ? "11" : "10"}. Notices`,
        body: noticeClause,
      },
      {
        heading: `${includeArbitration ? "12" : "11"}. Force Majeure`,
        body: forceMajeureClause,
      },
      {
        heading: `${includeArbitration ? "13" : "12"}. Severability`,
        body: severabilityClause,
      },
      {
        heading: `${includeArbitration ? "14" : "13"}. Entire Agreement and Amendment`,
        body: `${entireAgreementClause} ${amendmentClause}`,
      },
      {
        heading: `${includeArbitration ? "15" : "14"}. Counterparts and Electronic Execution`,
        body: counterpartsClause,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties hereto have executed this Non-Disclosure Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of Disclosing Party",
        name: dpSig === PLACEHOLDER ? "" : dpSig,
        designation: dpDes === PLACEHOLDER ? "" : dpDes,
        org: dpName === PLACEHOLDER ? "" : dpName,
      },
      {
        label: "For and on behalf of Receiving Party",
        name: rpSig === PLACEHOLDER ? "" : rpSig,
        designation: rpDes === PLACEHOLDER ? "" : rpDes,
        org: rpName === PLACEHOLDER ? "" : rpName,
      },
    ],
    witnesses: [
      { label: "Witness 1", name: "" },
      { label: "Witness 2", name: "" },
    ],
    footer:
      "This Agreement is intended to be a legally binding instrument under the Indian Contract Act, 1872. " +
      "It must be executed on non-judicial stamp paper of appropriate value as per the State Stamp Act applicable. " +
      "Parties are advised to seek independent legal counsel before execution.",
  };
};
