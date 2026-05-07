/**
 * Consultant / Freelancer Agreement — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872
 *  - Income Tax Act, 1961 — Section 194J (TDS @ 10% on professional fees, threshold INR 50,000 from FY 2025-26)
 *  - CGST/SGST Act, 2017 — GST @ 18% on most services (turnover threshold INR 20 lakh)
 *  - Section 27 ICA — restraint of trade (so use non-solicitation, not non-compete)
 *  - Copyright Act, 1957 — work-for-hire IP assignment
 *  - DPDP Act, 2023 — personal data
 *
 * Crucial distinction from employment: Consultant is an INDEPENDENT
 * CONTRACTOR, not an employee. No PF, no gratuity, no employment benefits.
 * Misclassification can lead to retrospective employment claims.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  formatDate,
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
  ipAssignmentClause,
  nonSolicitationClause,
  gstClause,
  tds194JClause,
  forceMajeureClause,
  indemnityClause,
} from "./shared";

export const renderConsultantAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const compAddr = val(formData, "companyAddress");
  const compPan = val(formData, "companyPAN");
  const compGstin = val(formData, "companyGSTIN");
  const contact = val(formData, "contactPerson");

  const consultant = val(formData, "consultantName");
  const consultantType = val(formData, "consultantType", "Individual");
  const consAddr = val(formData, "consultantAddress");
  const consPan = val(formData, "consultantPAN");
  const consGstin = val(formData, "consultantGSTIN", "");
  const consEmail = val(formData, "consultantEmail");
  const consPhone = val(formData, "consultantPhone");

  const project = val(formData, "projectTitle");
  const scope = val(formData, "scopeOfWork");
  const deliverables = val(formData, "deliverables");
  const startDate = formatDate(formData["startDate"]);
  const endDate = formatDate(formData["endDate"]);
  const workLoc = val(formData, "workLocation", "Remote");

  const feeStructure = val(formData, "feeStructure", "Fixed Fee");
  const totalFee = formatINR(formData["totalFee"]);
  const paymentTerms = val(formData, "paymentTerms", "Monthly");
  const tdsRate = Number(formData["tdsRate"]) || 10;
  const gstApplicable = formData["gstApplicable"] !== false;
  const gstRate = Number(formData["gstRate"]) || 18;
  const invoiceFreq = val(formData, "invoiceFrequency", "Monthly");
  const ipOwnership = val(formData, "ipOwnership", "Company owns all IP");

  return {
    title: "Consultant / Independent Contractor Agreement",
    lawReference:
      "Executed under the Indian Contract Act, 1872; tax treatment under Section 194J of the Income Tax Act, 1961",
    stampNote: stampDutyNote,
    dateLine: `This Consultant Agreement is made and entered into on **${todayIN()}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      `**${company}**, a company incorporated under the Companies Act, 2013, having its registered ` +
        `office at ${compAddr}, bearing PAN ${compPan}, GSTIN ${compGstin}, represented by ${contact} ` +
        `(hereinafter referred to as the "**Client**" or the "**Company**");`,
      `AND`,
      `**${consultant}**, a ${consultantType.toLowerCase()}, having its address at ${consAddr}, ` +
        `bearing PAN ${consPan}` +
        (has(formData, "consultantGSTIN") ? `, GSTIN ${consGstin}` : "") +
        `, Email: ${consEmail}, Mobile: ${consPhone} (hereinafter referred to as the "**Consultant**" ` +
        `or "**Independent Contractor**").`,
      `(The Client and the Consultant are individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Client desires to engage the Consultant to provide certain professional services in connection with the project titled "*${project}*";`,
      `WHEREAS, the Consultant has the requisite skills, experience, and expertise to provide such services and represents itself as an independent contractor and not as an employee of the Client;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Engagement and Independent Contractor Relationship",
        body:
          `(a) The Client hereby engages the Consultant as an **independent contractor** to provide ` +
          `the services described in Clause 2 below (the "**Services**").\n\n` +
          `(b) Nothing in this Agreement shall create or be deemed to create an employer-employee ` +
          `relationship, partnership, joint venture, or agency between the Parties. The Consultant ` +
          `shall not be entitled to any employment benefits including provident fund, gratuity, leave, ` +
          `medical insurance, or any benefits available to employees of the Client.\n\n` +
          `(c) The Consultant shall be solely responsible for its own income tax, professional tax, GST ` +
          `compliance, and shall furnish a No-Objection Certificate (NOC) on request that it does not ` +
          `claim any employee status.`,
      },
      {
        heading: "2. Scope of Services",
        body:
          `(a) **Project**: ${project}\n\n` +
          `(b) **Scope of Work**: ${scope}\n\n` +
          `(c) **Key Deliverables**: ${deliverables}\n\n` +
          `(d) The Consultant shall perform the Services in a professional and workmanlike manner, ` +
          `in accordance with industry standards and applicable law, and shall meet all timelines and ` +
          `quality standards set out herein or as agreed from time to time.`,
      },
      {
        heading: "3. Term",
        body:
          `This Agreement shall commence on **${startDate}** and shall continue until **${endDate}**, ` +
          `unless terminated earlier in accordance with Clause 11. The Parties may extend the Term by ` +
          `mutual written agreement. Place of performance: ${workLoc}.`,
      },
      {
        heading: "4. Fees",
        body:
          `(a) **Fee Structure**: ${feeStructure}.\n\n` +
          `(b) **Total Fee / Rate**: ${totalFee}.\n\n` +
          `(c) **Payment Terms**: ${paymentTerms}.\n\n` +
          `(d) The Consultant shall raise invoices on a **${invoiceFreq.toLowerCase()}** basis. Invoices ` +
          `shall be paid within thirty (30) days of receipt, subject to acceptance of deliverables.\n\n` +
          `(e) Out-of-pocket expenses (travel, accommodation, etc.) shall be reimbursed only with prior ` +
          `written approval and on production of original bills.`,
      },
      {
        heading: `5. TDS under Section 194J of the Income Tax Act, 1961`,
        body:
          `${tds194JClause.replace("at the rate of 10%", `at the rate of ${tdsRate}%`)} ` +
          `\n\nWhere the aggregate payment to the Consultant in a financial year does not exceed INR ` +
          `50,000 (Rupees Fifty Thousand), no TDS shall be deducted in accordance with the threshold ` +
          `under Section 194J. If the Consultant fails to furnish a valid PAN, TDS shall be deducted at ` +
          `20% under Section 206AA.`,
      },
      ...(gstApplicable
        ? [
            {
              heading: "6. Goods and Services Tax (GST)",
              body: gstClause(gstRate),
            },
          ]
        : []),
      {
        heading: `${gstApplicable ? "7" : "6"}. Intellectual Property`,
        body:
          ipOwnership.includes("Company owns")
            ? ipAssignmentClause
            : ipOwnership.includes("Consultant retains")
            ? `The Consultant shall retain ownership of all pre-existing intellectual property and any ` +
              `intellectual property created during the engagement, but hereby grants to the Client a ` +
              `perpetual, royalty-free, worldwide, non-exclusive license to use such intellectual ` +
              `property for the Client's business purposes.`
            : `Intellectual property created during the engagement shall be jointly owned by the Parties. ` +
              `Each Party shall have the right to use, license, and exploit such joint IP without ` +
              `accounting to the other.`,
      },
      {
        heading: `${gstApplicable ? "8" : "7"}. Confidentiality`,
        body: confidentialityClause,
      },
      {
        heading: `${gstApplicable ? "9" : "8"}. Non-Solicitation`,
        body: nonSolicitationClause,
      },
      {
        heading: `${gstApplicable ? "10" : "9"}. Indemnification`,
        body: indemnityClause,
      },
      {
        heading: `${gstApplicable ? "11" : "10"}. Termination`,
        body:
          `(a) Either Party may terminate this Agreement by giving thirty (30) days' prior written notice.\n\n` +
          `(b) Either Party may terminate immediately for material breach not cured within fifteen (15) ` +
          `days of written notice, or for fraud, dishonesty, or insolvency of the other Party.\n\n` +
          `(c) On termination, the Consultant shall (i) deliver all work-in-progress and completed ` +
          `deliverables, (ii) return all Confidential Information and Client property, and (iii) issue ` +
          `a final invoice for Services rendered up to the date of termination, against which the ` +
          `Client shall pay within fifteen (15) days.`,
      },
      {
        heading: `${gstApplicable ? "12" : "11"}. Force Majeure`,
        body: forceMajeureClause,
      },
      {
        heading: `${gstApplicable ? "13" : "12"}. Governing Law`,
        body: governingLawClause("Karnataka"),
      },
      {
        heading: `${gstApplicable ? "14" : "13"}. Dispute Resolution`,
        body: arbitrationClause("Bengaluru"),
      },
      {
        heading: `${gstApplicable ? "15" : "14"}. Notices`,
        body: noticeClause,
      },
      {
        heading: `${gstApplicable ? "16" : "15"}. Severability and Entire Agreement`,
        body: `${severabilityClause} ${entireAgreementClause} ${amendmentClause}`,
      },
      {
        heading: `${gstApplicable ? "17" : "16"}. Counterparts and Electronic Execution`,
        body: counterpartsClause,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties have executed this Consultant Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Client",
        name: contact === PLACEHOLDER ? "" : contact,
        designation: "Authorized Signatory",
        org: company === PLACEHOLDER ? "" : company,
      },
      {
        label: "Consultant",
        name: consultant === PLACEHOLDER ? "" : consultant,
        designation: consultantType === PLACEHOLDER ? "" : consultantType,
      },
    ],
    footer:
      "TAX & COMPLIANCE NOTE: The Consultant is responsible for its own income tax filing (ITR-3 or ITR-4) " +
      "and GST returns (GSTR-1, GSTR-3B). The Client shall issue Form 16A within the prescribed timelines. " +
      "Misclassification of an employee as a consultant is a serious risk under Indian labour law and tax law — " +
      "the Consultant must have genuine independence in how, when, and where work is performed.",
  };
};
