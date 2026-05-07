/**
 * Master Service Agreement (MSA) — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872
 *  - CGST/SGST Act, 2017 — GST on services
 *  - Income Tax Act, 1961 — TDS Section 194C / 194J
 *  - Sale of Goods Act, 1930 — for goods component
 *  - Arbitration & Conciliation Act, 1996
 *  - DPDP Act, 2023 — data protection
 *  - Information Technology Act, 2000 — electronic records and reasonable security practices
 *  - Section 73 ICA — compensation for breach
 *  - Section 124 ICA — indemnity
 *
 * MSA is the umbrella; Statements of Work (SOWs) are issued per project.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  asMonths,
  asDays,
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
  forceMajeureClause,
  indemnityClause,
  gstClause,
} from "./shared";

export const renderServiceAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const provider = val(formData, "providerName");
  const providerType = val(formData, "providerType", "Pvt Ltd");
  const provAddr = val(formData, "providerAddress");
  const provPan = val(formData, "providerPAN");
  const provGstin = val(formData, "providerGSTIN");
  const provEmail = val(formData, "providerEmail");

  const client = val(formData, "clientName");
  const clientType = val(formData, "clientType", "Pvt Ltd");
  const clientAddr = val(formData, "clientAddress");
  const clientPan = val(formData, "clientPAN");
  const clientGstin = val(formData, "clientGSTIN", "");
  const clientEmail = val(formData, "clientEmail");

  const services = val(formData, "serviceDescription");
  const deliverables = val(formData, "deliverables");
  const sla = val(formData, "slaTerms", "");
  const term = asMonths(formData["agreementTerm"]);
  const autoRenewal = formData["autoRenewal"] !== false;
  const renewalNotice = asDays(formData["renewalNoticeDays"]);

  const fee = formatINR(formData["feeAmount"]);
  const feeType = val(formData, "feeType", "Monthly Retainer");
  const paymentDays = asDays(formData["paymentTerms"]);
  const gstRate = Number(formData["gstRate"]) || 18;
  const tds = formData["tdsApplicable"] !== false;
  const liabilityCap = has(formData, "liabilityCap") ? formatINR(formData["liabilityCap"]) : null;
  const termNotice = asDays(formData["terminationNoticeDays"]);
  const govLaw = val(formData, "governingLaw", "Karnataka");
  const dr = val(formData, "disputeResolution", "Arbitration");

  return {
    title: "Master Services Agreement (MSA)",
    lawReference:
      "Executed under the Indian Contract Act, 1872, the GST Act, 2017, and the Arbitration and Conciliation Act, 1996",
    stampNote: stampDutyNote,
    dateLine: `This Master Services Agreement is made and entered into on **${todayIN()}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      `**${provider}**, a ${providerType} incorporated under applicable Indian laws, having its ` +
        `registered office at ${provAddr}, bearing PAN ${provPan}, GSTIN ${provGstin}, Email: ` +
        `${provEmail} (the "**Service Provider**");`,
      `AND`,
      `**${client}**, a ${clientType} incorporated under applicable Indian laws, having its registered ` +
        `office at ${clientAddr}, bearing PAN ${clientPan}` +
        (has(formData, "clientGSTIN") ? `, GSTIN ${clientGstin}` : "") +
        `, Email: ${clientEmail} (the "**Client**").`,
      `(The Service Provider and the Client are individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Client desires to engage the Service Provider to provide certain services as more ` +
        `particularly described in this Agreement and in the Statements of Work (SOWs) issued from time to time;`,
      `WHEREAS, the Service Provider has the requisite skills, infrastructure, and resources to provide such services;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Scope of Services",
        body:
          `(a) The Service Provider shall provide the following services to the Client (the "**Services**"): ${services}.\n\n` +
          `(b) **Key Deliverables**: ${deliverables}\n\n` +
          `(c) The Services may be more particularly defined and amended from time to time by way of ` +
          `Statements of Work ("**SOWs**") executed by both Parties. Each SOW shall form an integral ` +
          `part of this Agreement and shall be governed by its terms. In the event of conflict between ` +
          `this Agreement and an SOW, this Agreement shall prevail unless the SOW expressly provides ` +
          `otherwise.`,
      },
      ...(has(formData, "slaTerms")
        ? [
            {
              heading: "2. Service Level Agreement (SLA)",
              body:
                `The Service Provider shall meet the following service levels: ${sla}. Failure to ` +
                `meet the SLAs shall entitle the Client to service credits or fee adjustments as set out ` +
                `in **Schedule II** (Service Level Agreement).`,
            },
          ]
        : []),
      {
        heading: `${has(formData, "slaTerms") ? "3" : "2"}. Term and Renewal`,
        body:
          `(a) This Agreement shall commence on the Effective Date and shall continue for an initial ` +
          `term of **${term}** (the "**Initial Term**"), unless terminated earlier as provided herein.\n\n` +
          (autoRenewal
            ? `(b) On expiry of the Initial Term, this Agreement shall automatically renew for ` +
              `successive periods of one (1) year each (each a "**Renewal Term**"), unless either Party ` +
              `gives not less than **${renewalNotice}** prior written notice of non-renewal.`
            : `(b) On expiry of the Initial Term, this Agreement shall stand terminated unless renewed ` +
              `by mutual written agreement.`),
      },
      {
        heading: `${has(formData, "slaTerms") ? "4" : "3"}. Fees and Payment`,
        body:
          `(a) The Client shall pay the Service Provider a fee of **${fee}** on a **${feeType.toLowerCase()}** basis.\n\n` +
          `(b) Invoices shall be payable within **${paymentDays}** of receipt. Late payments shall ` +
          `bear interest at 1.5% per month or the maximum permitted by law, whichever is lower.\n\n` +
          `(c) ${gstClause(gstRate)}\n\n` +
          (tds
            ? `(d) The Client shall deduct TDS at the applicable rate (typically 2% under Section 194C ` +
              `for contractual services, or 10% under Section 194J for professional services) on the base ` +
              `fee amount excluding GST, in accordance with the Income Tax Act, 1961, and shall furnish ` +
              `Form 16A to the Service Provider.`
            : ""),
      },
      {
        heading: `${has(formData, "slaTerms") ? "5" : "4"}. Confidentiality and Data Protection`,
        body: confidentialityClause,
      },
      {
        heading: `${has(formData, "slaTerms") ? "6" : "5"}. Intellectual Property`,
        body:
          `(a) Each Party shall retain all pre-existing intellectual property. No license is granted ` +
          `except as expressly set out in this Agreement or any SOW.\n\n` +
          `(b) Unless an SOW specifies otherwise, the deliverables created specifically for the Client ` +
          `under an SOW shall, upon full payment, be assigned to the Client. The Service Provider shall ` +
          `retain ownership of all general tools, methodologies, and know-how used in delivering the Services.`,
      },
      {
        heading: `${has(formData, "slaTerms") ? "7" : "6"}. Warranties and Representations`,
        body:
          `Each Party represents and warrants that: (a) it has the full corporate power and authority ` +
          `to execute this Agreement; (b) the execution and performance of this Agreement does not ` +
          `violate any other agreement to which it is a party; (c) it shall comply with all applicable ` +
          `laws, including labour, tax, and data protection laws.`,
      },
      {
        heading: `${has(formData, "slaTerms") ? "8" : "7"}. Limitation of Liability`,
        body:
          `(a) Neither Party shall be liable for any indirect, incidental, special, consequential, or ` +
          `punitive damages, including loss of profits, revenue, or data, even if advised of the ` +
          `possibility thereof.\n\n` +
          (liabilityCap
            ? `(b) The aggregate liability of either Party under this Agreement shall not exceed ${liabilityCap} ` +
              `or the fees paid by the Client in the twelve (12) months preceding the claim, whichever is lower.`
            : `(b) The aggregate liability of either Party shall be limited to the fees paid by the Client ` +
              `in the twelve (12) months preceding the claim.`) +
          `\n\n(c) The limitations in this clause shall not apply to (i) breaches of confidentiality, ` +
          `(ii) indemnification obligations, (iii) wilful misconduct or fraud, or (iv) liability that ` +
          `cannot be limited under applicable law.`,
      },
      {
        heading: `${has(formData, "slaTerms") ? "9" : "8"}. Indemnification`,
        body: indemnityClause,
      },
      {
        heading: `${has(formData, "slaTerms") ? "10" : "9"}. Termination`,
        body:
          `(a) Either Party may terminate this Agreement for convenience by giving **${termNotice}** ` +
          `prior written notice.\n\n` +
          `(b) Either Party may terminate immediately upon (i) material breach not cured within thirty ` +
          `(30) days of written notice, (ii) insolvency, winding-up, or bankruptcy of the other Party, ` +
          `or (iii) violation of confidentiality or applicable law.\n\n` +
          `(c) Upon termination: (i) the Service Provider shall complete all in-progress Services and ` +
          `deliver the same to the Client; (ii) the Client shall pay all outstanding fees up to the ` +
          `effective date of termination; (iii) each Party shall return or destroy all Confidential ` +
          `Information of the other Party.`,
      },
      {
        heading: `${has(formData, "slaTerms") ? "11" : "10"}. Force Majeure`,
        body: forceMajeureClause,
      },
      {
        heading: `${has(formData, "slaTerms") ? "12" : "11"}. Governing Law`,
        body: governingLawClause(govLaw),
      },
      {
        heading: `${has(formData, "slaTerms") ? "13" : "12"}. Dispute Resolution`,
        body:
          dr.toLowerCase().includes("arbitration")
            ? arbitrationClause(govLaw)
            : `Disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts at ${govLaw}.`,
      },
      {
        heading: `${has(formData, "slaTerms") ? "14" : "13"}. Notices`,
        body: noticeClause,
      },
      {
        heading: `${has(formData, "slaTerms") ? "15" : "14"}. General`,
        body: `${severabilityClause} ${entireAgreementClause} ${amendmentClause} ${counterpartsClause}`,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties hereto have executed this Master Services Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Service Provider",
        name: "",
        designation: "Authorized Signatory",
        org: provider === PLACEHOLDER ? "" : provider,
      },
      {
        label: "For and on behalf of the Client",
        name: "",
        designation: "Authorized Signatory",
        org: client === PLACEHOLDER ? "" : client,
      },
    ],
    witnesses: [{ label: "Witness 1", name: "" }, { label: "Witness 2", name: "" }],
    footer:
      "Schedule I (Statement of Work template), Schedule II (SLA), and Schedule III (Pricing) shall be attached. " +
      "Each project / engagement shall be initiated by way of a separate SOW signed by both Parties.",
  };
};
