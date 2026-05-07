/**
 * ESOP Scheme Document — Indian template (unlisted private companies).
 *
 * Grounded in:
 *  - Companies Act, 2013 — Section 62(1)(b) (issue of shares to employees)
 *  - Companies (Share Capital and Debentures) Rules, 2014 — Rule 12 (ESOP procedural rules)
 *  - Form MGT-14 (filing of special resolution within 30 days)
 *  - Income Tax Act, 1961 — Section 17(2) (perquisite on exercise), Section 49(2AB) (capital gain)
 *  - SEBI (Share Based Employee Benefits and Sweat Equity) Regulations, 2021 — for listed companies
 *
 * Key statutory requirements:
 *  - Special resolution (75% shareholder majority) required
 *  - Minimum vesting period of 1 year between grant and vesting
 *  - Exercise price cannot be below face value
 *  - Promoters and 10%+ shareholders are not eligible (unless DPIIT-recognized startup)
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  asYears,
  asMonths,
  asDays,
  formatDate,
  todayIN,
  governingLawClause,
  noticeClause,
  severabilityClause,
  entireAgreementClause,
  stampDutyNote,
} from "./shared";

export const renderESOPScheme: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const cin = val(formData, "cin");
  const compAddr = val(formData, "companyAddress");
  const authCap = formatINR(formData["authorizedCapital"]);
  const paidCap = formatINR(formData["paidUpCapital"]);

  const poolName = val(formData, "poolName", "Employee Stock Option Plan 2026");
  const poolSize = val(formData, "poolSize");
  const totalOptions = val(formData, "totalOptions");
  const exercisePrice = formatINRShort(formData["exercisePrice"]);
  const exerciseMethod = val(formData, "exercisePriceMethod", "Fair Market Value");
  const eligibility = val(formData, "eligibility", "All Permanent Employees");

  const vestingPeriod = asMonths(formData["vestingPeriod"]);
  const cliff = asMonths(formData["cliffPeriod"]);
  const vestingFrequency = val(formData, "vestingSchedule", "Monthly");
  const accelerated = formData["acceleratedVesting"] !== false;
  const goodLeaver = val(formData, "goodLeaverVesting", "Vested Options Only");
  const badLeaver = val(formData, "badLeaverTreatment", "Forfeit All");

  const exerciseWindow = asDays(formData["exerciseWindow"]);
  const postTermExercise = asDays(formData["postTerminationExercise"]);
  const schemeDuration = asYears(formData["schemeDuration"]);
  const transferability = val(formData, "transferability", "Non-Transferable");
  const administrator = val(formData, "administrator", "ESOP Committee / HR Head");
  const boardDate = formatDate(formData["boardResolutionDate"]);

  return {
    title: poolName.toUpperCase(),
    lawReference:
      "Constituted under Section 62(1)(b) of the Companies Act, 2013, read with Rule 12 of the Companies (Share Capital and Debentures) Rules, 2014",
    stampNote: stampDutyNote,
    dateLine: `Effective Date: **${boardDate}** (date of approval by special resolution under Section 62(1)(b) of the Companies Act, 2013)`,
    preamble: [
      `**${company}**, a private limited company incorporated under the Companies Act, 2013, bearing ` +
        `CIN **${cin}**, having its registered office at ${compAddr} (the "**Company**"), authorised ` +
        `share capital ${authCap}, paid-up share capital ${paidCap}, has formulated this Employee ` +
        `Stock Option Plan to attract, retain, and motivate employees by providing them an opportunity ` +
        `to participate in the equity capital of the Company.`,
    ],
    recitals: [
      `WHEREAS, the Board of Directors approved this Plan vide its resolution dated ${boardDate}, and ` +
        `the shareholders approved the same by way of a special resolution at an Extra-Ordinary General ` +
        `Meeting held on ${boardDate};`,
      `WHEREAS, Form MGT-14 has been / shall be filed with the Registrar of Companies within thirty ` +
        `(30) days of the special resolution as required under Section 117 of the Companies Act, 2013;`,
      `NOW, THEREFORE, the Company hereby establishes this Plan on the following terms:`,
    ],
    clauses: [
      {
        heading: "1. Title, Effective Date and Duration",
        body:
          `(a) This Plan shall be called the "**${poolName}**" (the "**Plan**").\n\n` +
          `(b) The Plan shall be effective from ${boardDate} (the "**Effective Date**") and shall ` +
          `continue in force for a period of **${schemeDuration}** unless terminated earlier by the Board.\n\n` +
          `(c) No options shall be granted under this Plan after the expiry of the duration set out above, ` +
          `but options granted prior to such expiry shall continue to vest and be exercisable in accordance ` +
          `with the terms hereof.`,
      },
      {
        heading: "2. Definitions",
        body:
          `(a) "**Option**" means a stock option granted to an Eligible Employee entitling such Employee ` +
          `to subscribe to one equity share of the Company on payment of the Exercise Price.\n` +
          `(b) "**Grant Date**" means the date on which an Option is granted to an Eligible Employee.\n` +
          `(c) "**Vesting Date**" means the date on which an Option vests in the Eligible Employee, in ` +
          `accordance with the vesting schedule set out in Clause 5.\n` +
          `(d) "**Exercise Price**" means the price at which an Option Holder may subscribe to an equity share.\n` +
          `(e) "**Exercise Period**" means the period during which a vested Option may be exercised.\n` +
          `(f) "**ESOP Committee**" means the committee constituted by the Board to administer this Plan.\n` +
          `(g) "**Promoter**" shall have the meaning assigned in Section 2(69) of the Companies Act, 2013.`,
      },
      {
        heading: "3. ESOP Pool",
        body:
          `The total number of Options to be granted under this Plan shall not exceed **${totalOptions}**, ` +
          `representing approximately **${poolSize}%** of the fully diluted equity share capital of the ` +
          `Company as on the Effective Date (the "**ESOP Pool**"). The ESOP Pool may be augmented from ` +
          `time to time by way of a fresh special resolution of the shareholders.`,
      },
      {
        heading: "4. Eligibility",
        body:
          `(a) The Plan shall be open to **${eligibility}** of the Company, as may be identified by the ` +
          `ESOP Committee from time to time.\n\n` +
          `(b) Pursuant to Rule 12(1)(c) of the Companies (Share Capital and Debentures) Rules, 2014, ` +
          `the following persons are NOT eligible (unless the Company is a DPIIT-recognized startup ` +
          `availing the exemption under Section 62(1)(b) for startups):\n` +
          `   (i) Promoters or persons belonging to the promoter group;\n` +
          `   (ii) Directors holding (directly or indirectly) more than 10% of the outstanding equity ` +
          `   shares of the Company.`,
      },
      {
        heading: "5. Vesting Schedule",
        body:
          `(a) Options shall vest over a total period of **${vestingPeriod}**, with a minimum cliff ` +
          `period of **${cliff}** as required under Rule 12(6) of the Companies (Share Capital and ` +
          `Debentures) Rules, 2014 (which mandates a minimum gap of one year between grant and vesting).\n\n` +
          `(b) On expiry of the cliff, ${cliff === "12 (Twelve) months" ? "twenty-five percent (25%)" : "the proportionate amount"} ` +
          `of the Options shall vest, and the remaining Options shall vest on a **${vestingFrequency.toLowerCase()}** basis ` +
          `over the balance vesting period.\n\n` +
          `(c) Vesting is conditional upon the Option Holder remaining in continuous employment with the ` +
          `Company on each Vesting Date, save and except as provided under Clause 7 (Termination).`,
      },
      {
        heading: "6. Exercise Price and Exercise Period",
        body:
          `(a) The Exercise Price per equity share shall be **${exercisePrice}**, determined on the ` +
          `basis of **${exerciseMethod}**, in compliance with Rule 12(4) of the Companies (Share ` +
          `Capital and Debentures) Rules, 2014. The Exercise Price shall not be less than the face ` +
          `value of the equity shares of the Company.\n\n` +
          `(b) The Option Holder shall have a period of **${exerciseWindow}** from the Vesting Date to ` +
          `exercise the vested Options. Options not exercised within this period shall lapse.\n\n` +
          `(c) On exercise, the Option Holder shall pay the Exercise Price by way of cheque, demand ` +
          `draft, electronic transfer, or such other mode as the Company may approve.`,
      },
      {
        heading: "7. Termination of Employment",
        body:
          `(a) **Voluntary Resignation / Termination Without Cause (Good Leaver)**: The Option Holder ` +
          `shall be entitled to **${goodLeaver}**. Vested Options shall be exercisable within ` +
          `**${postTermExercise}** of cessation, failing which they shall lapse.\n\n` +
          `(b) **Termination for Cause (Bad Leaver)**: All Options (whether vested or unvested) shall ` +
          `be **${badLeaver.toLowerCase()}** as on the date of termination.\n\n` +
          `(c) **Death or Permanent Disability**: All unvested Options shall accelerate and vest in ` +
          `full. The legal heirs / nominee shall have one (1) year to exercise the Options.\n\n` +
          (accelerated
            ? `(d) **Liquidity Event**: In the event of an IPO, acquisition, or change of control, all ` +
              `unvested Options shall accelerate and vest in full ("**Single-Trigger Acceleration**").`
            : `(d) **Liquidity Event**: Unvested Options shall continue to vest as per the original schedule.`),
      },
      {
        heading: "8. Tax Treatment",
        body:
          `(a) **At Exercise**: The difference between the Fair Market Value (FMV) on the date of exercise ` +
          `and the Exercise Price shall be taxable as a perquisite under Section 17(2)(vi) of the Income ` +
          `Tax Act, 1961, in the hands of the Option Holder. The Company shall deduct TDS thereon.\n\n` +
          `(b) **At Sale**: Any gain on sale of shares acquired pursuant to exercise shall be taxable as ` +
          `capital gains under Section 49(2AB) read with Section 48 of the Income Tax Act, 1961.\n\n` +
          `(c) **Eligible Startup Deferral**: If the Company is a DPIIT-recognized eligible startup, ` +
          `Option Holders may defer payment of perquisite tax under Section 192(1C) of the Income Tax Act, 1961.`,
      },
      {
        heading: "9. Transferability",
        body:
          `Options granted under this Plan shall be **${transferability.toLowerCase()}**` +
          (transferability === "Non-Transferable"
            ? `. No Option Holder shall sell, pledge, hypothecate, or otherwise transfer any Option, ` +
              `except by operation of testamentary succession or laws of inheritance.`
            : `, subject to the conditions set out herein.`),
      },
      {
        heading: "10. Administration",
        body:
          `(a) The Plan shall be administered by the **${administrator}** (the "**ESOP Committee**"), ` +
          `which shall have full authority to:\n` +
          `   (i) determine Eligible Employees and the number of Options to be granted;\n` +
          `   (ii) determine vesting schedules within the framework of Clause 5;\n` +
          `   (iii) interpret the Plan and resolve disputes;\n` +
          `   (iv) issue grant letters and exercise certificates.\n\n` +
          `(b) The ESOP Committee shall maintain a register of Options granted, vested, exercised, ` +
          `lapsed, and forfeited, in compliance with Rule 12(11) of the Companies (Share Capital and ` +
          `Debentures) Rules, 2014.\n\n` +
          `(c) The Company shall make all required disclosures in the Directors' Report under Rule 12(9).`,
      },
      {
        heading: "11. Adjustments",
        body:
          `In the event of any bonus issue, share split, consolidation, rights issue, demerger, ` +
          `amalgamation, or other corporate action affecting the share capital of the Company, the ` +
          `number of Options outstanding and the Exercise Price shall be adjusted appropriately by the ` +
          `ESOP Committee to preserve the economic value of the Options.`,
      },
      {
        heading: "12. Compliance",
        body:
          `The Company shall comply with all applicable laws and regulations, including without ` +
          `limitation: (a) the Companies Act, 2013; (b) the Income Tax Act, 1961; (c) FEMA, 1999 (for ` +
          `non-resident employees); (d) the SEBI (Share Based Employee Benefits) Regulations, 2021 if ` +
          `the Company becomes listed; and (e) Rule 12 disclosure requirements.`,
      },
      {
        heading: "13. Governing Law",
        body: governingLawClause("Karnataka"),
      },
      {
        heading: "14. Notices",
        body: noticeClause,
      },
      {
        heading: "15. Severability and Entire Agreement",
        body: `${severabilityClause} ${entireAgreementClause}`,
      },
    ],
    operativeIntro:
      "Approved and adopted by the Board of Directors and Shareholders of the Company.",
    signatures: [
      {
        label: "For and on behalf of the Board",
        name: "",
        designation: "Director / Company Secretary",
        org: company === PLACEHOLDER ? "" : company,
      },
    ],
    footer:
      "Statutory filings required: Form MGT-14 within 30 days of special resolution; " +
      "Annual disclosures in Directors' Report (Rule 12(9)). " +
      "Each Eligible Employee shall be issued a separate **Grant Letter** in **Schedule A** format, " +
      "which shall record the number of Options, Grant Date, Vesting Schedule, and Exercise Price specific to such Employee.",
  };
};
