/**
 * Shareholders' Agreement (SHA) — Indian template.
 *
 * Grounded in:
 *  - Companies Act, 2013 — Section 58 (transfer), Section 149 (directors), Section 173 (board), Section 188 (related party)
 *  - SEBI Notification (October 2013) — pre-emption, ROFR, tag-along, drag-along permitted in shareholders' agreements
 *  - Securities Contracts (Regulation) Act, 1956 — for listed companies
 *  - Indian Contract Act, 1872
 *  - FEMA, 1999 — for foreign investors / non-resident shareholders
 *  - Arbitration & Conciliation Act, 1996
 *
 * SHA terms must align with the Articles of Association (AOA) — any
 * conflict will see the AOA prevail in shareholder disputes (V.B. Rangaraj
 * v. V.B. Gopalakrishnan, 1992 SC).
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
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
  confidentialityClause,
} from "./shared";

export const renderShareholderAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const cin = val(formData, "cin");
  const compAddr = val(formData, "companyAddress");
  const compPan = val(formData, "companyPAN");
  const authCap = formatINR(formData["authorizedCapital"]);
  const paidCap = formatINR(formData["paidUpCapital"]);

  const shName = val(formData, "shareholderName");
  const shType = val(formData, "shareholderType", "Individual");
  const shAddr = val(formData, "shareholderAddress");
  const shPan = val(formData, "shareholderPAN");
  const shPercent = val(formData, "sharePercentage");
  const shClass = val(formData, "shareClass", "Equity");

  const preEmptive = formData["preEmptiveRights"] !== false;
  const antiDilution = val(formData, "antiDilution", "Weighted Average (Broad)");
  const tagAlong = formData["tagAlong"] !== false;
  const dragAlong = formData["dragAlong"] !== false;
  const dragThreshold = val(formData, "dragAlongThreshold", "75");
  const rofr = formData["rofr"] !== false;
  const lockIn = asMonths(formData["lockInPeriod"]);

  const boardSeats = val(formData, "boardSeats", "1");
  const reservedMatters = val(formData, "reservedMatters");
  const infoRights = val(formData, "informationRights", "Quarterly Reports");
  const exitOptions = val(formData, "exitOptions", "IPO");
  const valuation = val(formData, "valuationMethod", "Fair Market Value");
  const govLaw = val(formData, "governingLaw", "Karnataka");
  const dr = val(formData, "disputeResolution", "Arbitration (MCIA)");

  return {
    title: "Shareholders' Agreement",
    lawReference:
      "Executed under the Companies Act, 2013 and the Indian Contract Act, 1872",
    stampNote: stampDutyNote,
    dateLine: `This Shareholders' Agreement is made and entered into on **${todayIN()}**`,
    preamble: [
      `BY AND AMONGST`,
      `**${company}**, a private limited company incorporated under the Companies Act, 2013, bearing CIN **${cin}**, having its registered office at ${compAddr}, PAN ${compPan} (the "**Company**");`,
      `AND`,
      `**${shName}**, a ${shType.toLowerCase()}, residing/registered at ${shAddr}, PAN ${shPan} (the "**Shareholder**");`,
      `AND`,
      `the other shareholders of the Company as set out in **Schedule I** (collectively with the Shareholder, the "**Shareholders**").`,
      `(The Company and the Shareholders are individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Company has an authorized share capital of ${authCap} and a paid-up share capital of ${paidCap};`,
      `WHEREAS, the Shareholders are the registered and beneficial owners of the equity shares of the Company in the proportions set out in **Schedule II**;`,
      `WHEREAS, the Shareholders desire to record the terms governing their relationship inter se and with the Company, including matters of governance, transfer of shares, exit, and dispute resolution;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Definitions and Interpretation",
        body:
          `In this Agreement, unless the context otherwise requires, capitalized terms shall have the ` +
          `meanings set out in **Schedule III**. References to the "Articles" mean the Articles of ` +
          `Association of the Company. In the event of any conflict between this Agreement and the ` +
          `Articles, the Shareholders shall promptly cause the Articles to be amended to reflect this ` +
          `Agreement, in compliance with the principle in *V.B. Rangaraj v. V.B. Gopalakrishnan* (1992).`,
      },
      {
        heading: "2. Shareholding",
        body:
          `As of the date of this Agreement, **${shName}** holds **${shPercent}%** of the issued and ` +
          `paid-up share capital of the Company in the form of ${shClass} shares. The complete cap ` +
          `table is set out in **Schedule II** and shall be updated from time to time.`,
      },
      {
        heading: "3. Board Composition",
        body:
          `(a) The Board of Directors shall comprise such number of directors as may be specified in the ` +
          `Articles, in compliance with Section 149 of the Companies Act, 2013.\n\n` +
          `(b) The Shareholder shall have the right to nominate **${boardSeats}** director(s) to the ` +
          `Board (the "**Investor Director**" or "**Nominee Director**"), so long as the Shareholder ` +
          `holds at least 5% of the share capital.\n\n` +
          `(c) Quorum for Board meetings shall require the presence of the Investor Director, save and ` +
          `except after two adjourned meetings.`,
      },
      {
        heading: "4. Reserved Matters (Affirmative Vote Items)",
        body:
          `The following matters shall not be undertaken by the Company without the prior written ` +
          `consent of the Shareholder, notwithstanding any provision in the Articles: ${reservedMatters}. ` +
          `Each such matter is hereinafter a "**Reserved Matter**". This affirmative vote right is ` +
          `enforceable under the Companies Act, 2013, read with the SEBI Notification dated 3 October 2013.`,
      },
      ...(preEmptive
        ? [
            {
              heading: "5. Pre-emptive Rights",
              body:
                `In the event of any further issue of equity shares, debentures, or any other security ` +
                `convertible into equity by the Company, the Shareholder shall have the right (but not ` +
                `the obligation) to subscribe to such issue pro-rata to its existing shareholding, on ` +
                `the same terms offered by the Company. This right is in addition to the rights under ` +
                `Section 62 of the Companies Act, 2013.`,
            },
          ]
        : []),
      {
        heading: `${preEmptive ? "6" : "5"}. Anti-Dilution Protection`,
        body:
          `In the event of any future issue of shares at a price per share lower than the price paid ` +
          `by the Shareholder ("**Down Round**"), the Shareholder shall be entitled to anti-dilution ` +
          `protection on a **${antiDilution}** basis. The Company shall issue such number of additional ` +
          `equity shares (or adjust the conversion ratio of preference shares) so as to provide the ` +
          `Shareholder with the agreed economic protection.`,
      },
      ...(rofr
        ? [
            {
              heading: `${preEmptive ? "7" : "6"}. Right of First Refusal (ROFR)`,
              body:
                `If any Shareholder ("**Selling Shareholder**") proposes to transfer any of its shares ` +
                `to a third party, the Selling Shareholder shall first offer such shares to the other ` +
                `Shareholders, pro-rata to their existing shareholding, at the same price and on the ` +
                `same terms offered by the third party. Only if the other Shareholders do not exercise ` +
                `this right within thirty (30) days may the Selling Shareholder transfer to the third ` +
                `party. This ROFR is expressly permitted under the SEBI Notification dated 3 October 2013.`,
            },
          ]
        : []),
      ...(tagAlong
        ? [
            {
              heading: `${preEmptive && rofr ? "8" : preEmptive || rofr ? "7" : "6"}. Tag-Along Right`,
              body:
                `If a Shareholder proposes to transfer shares to a third party, the other Shareholders ` +
                `shall have the right to "tag along" and require the buyer to purchase, on the same ` +
                `terms, such number of their shares as represents the same proportion of their holding ` +
                `that the selling Shareholder is selling.`,
            },
          ]
        : []),
      ...(dragAlong
        ? [
            {
              heading: `Drag-Along Right`,
              body:
                `If Shareholders holding **${dragThreshold}%** or more of the equity capital approve a ` +
                `bona fide offer for the sale of 100% of the share capital of the Company to a third ` +
                `party at a price not less than the agreed minimum, such Shareholders shall have the ` +
                `right to require ("drag along") the remaining Shareholders to sell their shares on the ` +
                `same terms. This drag-along right is enforceable subject to compliance with applicable law.`,
            },
          ]
        : []),
      {
        heading: "Lock-In",
        body:
          `Each Shareholder agrees that it shall not transfer, sell, or pledge any shares of the Company ` +
          `for a period of **${lockIn}** from the date of this Agreement, save and except with the prior ` +
          `written consent of the other Shareholders.`,
      },
      {
        heading: "Information Rights",
        body:
          `The Shareholder shall be entitled to **${infoRights}** information rights, including: ` +
          `(a) audited annual financial statements within ninety (90) days of financial year-end; ` +
          `(b) unaudited quarterly financials within forty-five (45) days of quarter-end; ` +
          `(c) annual budget and business plan; (d) inspection rights of books and records on reasonable ` +
          `notice; (e) right to attend Board meetings as observer if the Shareholder does not have a ` +
          `Nominee Director.`,
      },
      {
        heading: "Exit",
        body:
          `(a) The Parties shall use commercially reasonable efforts to provide the Shareholder with ` +
          `liquidity by way of an Exit by the seventh (7th) anniversary of this Agreement.\n\n` +
          `(b) Permitted Exit options include: ${exitOptions}, in priority order.\n\n` +
          `(c) The valuation of the Company for any Exit shall be determined on a **${valuation}** basis ` +
          `by an independent registered valuer in accordance with Section 247 of the Companies Act, 2013.`,
      },
      {
        heading: "Confidentiality",
        body: confidentialityClause,
      },
      {
        heading: "Governing Law",
        body: governingLawClause(govLaw),
      },
      {
        heading: "Dispute Resolution",
        body:
          dr.toLowerCase().includes("arbitration")
            ? arbitrationClause(govLaw)
            : `Disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts at ${govLaw}.`,
      },
      {
        heading: "Notices",
        body: noticeClause,
      },
      {
        heading: "Severability and Entire Agreement",
        body: `${severabilityClause} ${entireAgreementClause} ${amendmentClause}`,
      },
      {
        heading: "Counterparts and Electronic Execution",
        body: counterpartsClause,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties hereto have executed this Shareholders' Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Company",
        name: "",
        designation: "Authorized Signatory (Director)",
        org: company === PLACEHOLDER ? "" : company,
      },
      {
        label: "Shareholder",
        name: shName === PLACEHOLDER ? "" : shName,
        designation: "",
      },
    ],
    witnesses: [{ label: "Witness 1", name: "" }, { label: "Witness 2", name: "" }],
    footer:
      "Schedules I (Parties), II (Cap Table), and III (Definitions) shall be attached. " +
      "The Articles of Association of the Company shall be amended to reflect the rights granted herein, " +
      "as the Articles will prevail in any conflict in shareholder enforcement matters.",
  };
};
