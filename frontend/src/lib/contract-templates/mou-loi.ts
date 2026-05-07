/**
 * Memorandum of Understanding (MOU) / Letter of Intent (LOI) — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — Section 10 (essentials of valid contract)
 *  - General principle: MOU is typically NON-BINDING except for confidentiality, exclusivity, governing law
 *  - Indian Stamp Act, 1899 — applicable if any binding obligations
 *  - DPDP Act, 2023
 *
 * Key drafting principle: An MOU expresses INTENT, not commitment. Indian
 * courts have consistently held that whether an MOU is binding depends on
 * the subjective intention of the parties as expressed in the document
 * (Kollipara Sriramulu v. T. Aswatha Narayana, AIR 1968 SC 1028).
 *
 * Best practice: explicitly demarcate "binding" and "non-binding" provisions.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatDate,
  todayIN,
  governingLawClause,
  noticeClause,
  confidentialityClause,
} from "./shared";

export const renderMOU: TemplateRenderer = (formData): TemplateOutput => {
  const p1Name = val(formData, "party1Name");
  const p1Type = val(formData, "party1Type", "Company");
  const p1Addr = val(formData, "party1Address");
  const p1Rep = val(formData, "party1Representative");
  const p1Email = val(formData, "party1Email");

  const p2Name = val(formData, "party2Name");
  const p2Type = val(formData, "party2Type", "Company");
  const p2Addr = val(formData, "party2Address");
  const p2Rep = val(formData, "party2Representative");
  const p2Email = val(formData, "party2Email");

  const purpose = val(formData, "purpose");
  const scope = val(formData, "scope", "");
  const startDate = formatDate(formData["startDate"]);
  const endDate = formatDate(formData["endDate"]);
  const exclusivity = formData["exclusivity"] === true;
  const binding = val(formData, "bindingNature", "Non-Binding (with binding confidentiality)");

  const isBinding = binding.toLowerCase().includes("binding") && !binding.toLowerCase().includes("non");

  return {
    title: "Memorandum of Understanding (MOU)",
    lawReference: "Drawn up under the Indian Contract Act, 1872",
    dateLine: `This Memorandum of Understanding is executed on **${todayIN()}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      `**${p1Name}**, a ${p1Type.toLowerCase()}, having its registered office at ${p1Addr}, ` +
        `represented herein by **${p1Rep}**, Email: ${p1Email} (the "**First Party**");`,
      `AND`,
      `**${p2Name}**, a ${p2Type.toLowerCase()}, having its registered office at ${p2Addr}, ` +
        `represented herein by **${p2Rep}**, Email: ${p2Email} (the "**Second Party**").`,
      `(The First Party and the Second Party are hereinafter individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Parties have engaged in preliminary discussions concerning a potential collaboration / transaction described herein as the "**Purpose**";`,
      `WHEREAS, the Parties wish to record their mutual understanding and intent to explore the Purpose, subject to further definitive documentation;`,
      `NOW, THEREFORE, the Parties hereby record the following understandings:`,
    ],
    clauses: [
      {
        heading: "1. Purpose and Scope",
        body:
          `(a) **Purpose**: ${purpose}\n\n` +
          (scope ? `(b) **Scope of Discussions**: ${scope}\n\n` : "") +
          `(c) The Parties intend to explore the Purpose in good faith and shall use commercially ` +
          `reasonable efforts to negotiate and execute definitive agreements within a mutually agreed timeline.`,
      },
      {
        heading: "2. Nature of this MOU",
        body:
          isBinding
            ? `(a) This MOU is intended to be a legally binding agreement between the Parties under the ` +
              `Indian Contract Act, 1872.\n\n` +
              `(b) The Parties acknowledge that this MOU contains all the essential terms and conditions ` +
              `for the proposed transaction.`
            : `(a) **Except as expressly stated in Clauses 4 (Confidentiality), 5 (Exclusivity, if applicable), ` +
              `and 7 (Governing Law and Dispute Resolution), this MOU is NON-BINDING and is intended only ` +
              `to record the present understanding and intent of the Parties.**\n\n` +
              `(b) Neither Party shall have any legal obligation to enter into a definitive agreement, ` +
              `and either Party may withdraw at any time, without liability, save for breach of the ` +
              `binding clauses identified above.\n\n` +
              `(c) Any subsequent definitive agreement shall be in writing, signed by authorised ` +
              `representatives of the Parties, and shall supersede this MOU.`,
      },
      {
        heading: "3. Term",
        body:
          `This MOU shall be effective from **${startDate}** and shall continue until **${endDate}**, ` +
          `unless terminated earlier by mutual written consent or upon the execution of definitive ` +
          `agreements in respect of the Purpose.`,
      },
      {
        heading: "4. Confidentiality (BINDING)",
        body:
          `Notwithstanding the non-binding nature of this MOU as a whole, the obligations of ` +
          `confidentiality set out in this clause are intended to be legally binding. ` +
          confidentialityClause +
          ` This obligation shall survive the termination or expiry of this MOU for a period of two (2) years.`,
      },
      ...(exclusivity
        ? [
            {
              heading: "5. Exclusivity (BINDING)",
              body:
                `During the Term of this MOU, neither Party shall directly or indirectly solicit, ` +
                `negotiate, or enter into discussions with any third party in respect of a transaction ` +
                `substantially similar to the Purpose. This exclusivity obligation is intended to be ` +
                `legally binding and breach shall entitle the non-breaching Party to seek injunctive ` +
                `relief and damages.`,
            },
          ]
        : []),
      {
        heading: `${exclusivity ? "6" : "5"}. Costs`,
        body:
          `Each Party shall bear its own costs and expenses (including legal, financial advisory, and due ` +
          `diligence costs) incurred in connection with this MOU and any further negotiations.`,
      },
      {
        heading: `${exclusivity ? "7" : "6"}. Governing Law and Dispute Resolution (BINDING)`,
        body:
          `${governingLawClause("Karnataka")}\n\n` +
          `Notwithstanding the non-binding nature of this MOU, the governing law and jurisdiction ` +
          `provisions in this clause are intended to be legally binding for the limited purpose of ` +
          `resolving any disputes arising from the binding clauses of this MOU.`,
      },
      {
        heading: `${exclusivity ? "8" : "7"}. Notices`,
        body: noticeClause,
      },
      {
        heading: `${exclusivity ? "9" : "8"}. No Partnership / No Agency`,
        body:
          `Nothing in this MOU shall be construed as creating a partnership, joint venture, agency, ` +
          `or employer-employee relationship between the Parties. Neither Party shall represent itself ` +
          `as an agent of the other or have authority to bind the other in any manner.`,
      },
      {
        heading: `${exclusivity ? "10" : "9"}. Counterparts`,
        body:
          `This MOU may be executed in counterparts, including by way of electronic signature, each of ` +
          `which shall be deemed an original. Execution by electronic means shall be valid under the ` +
          `Information Technology Act, 2000.`,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties have executed this Memorandum of Understanding on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of First Party",
        name: p1Rep === PLACEHOLDER ? "" : p1Rep,
        designation: "Authorized Representative",
        org: p1Name === PLACEHOLDER ? "" : p1Name,
      },
      {
        label: "For and on behalf of Second Party",
        name: p2Rep === PLACEHOLDER ? "" : p2Rep,
        designation: "Authorized Representative",
        org: p2Name === PLACEHOLDER ? "" : p2Name,
      },
    ],
    footer:
      "Indian courts will determine the binding nature of an MOU based on the language used and the " +
      "intent of the parties (Kollipara Sriramulu v. T. Aswatha Narayana, AIR 1968 SC 1028). To avoid " +
      "ambiguity, the Parties have explicitly identified which clauses are binding and which are not. " +
      "Definitive agreements shall be required before any rights or obligations beyond the scope of " +
      "this MOU come into existence.",
  };
};
