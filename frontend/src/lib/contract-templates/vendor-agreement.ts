/**
 * Vendor Agreement — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — base contractual validity
 *  - Sale of Goods Act, 1930 — for goods supply (Sections 16, 30, 41)
 *  - Consumer Protection Act, 2019 — defective goods/services
 *  - CGST/SGST Act, 2017 — GST compliance
 *  - Income Tax Act, 1961 — TDS Section 194C (contract work, 1%/2%)
 *  - Indian Stamp Act, 1899 — execution on stamp paper
 *  - Foreign Exchange Management Act, 1999 — for cross-border transactions
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
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
  forceMajeureClause,
  indemnityClause,
  gstClause,
} from "./shared";

export const renderVendorAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const compAddr = val(formData, "companyAddress");
  const compPan = val(formData, "companyPAN");
  const compGstin = val(formData, "companyGSTIN");

  const vendor = val(formData, "vendorName");
  const vendorType = val(formData, "vendorType", "Service Provider");
  const vendorAddr = val(formData, "vendorAddress");
  const vendorPan = val(formData, "vendorPAN");
  const vendorGstin = val(formData, "vendorGSTIN");

  const products = val(formData, "productsServices");
  const quality = val(formData, "qualityStandards", "");
  const delivery = val(formData, "deliveryTerms");
  const paymentTerms = val(formData, "paymentTerms", "Net 30");
  const warranty = asMonths(formData["warrantyPeriod"]);
  const exclusivity = formData["exclusivity"] === true;

  return {
    title: "Vendor Agreement",
    lawReference:
      "Executed under the Indian Contract Act, 1872 and the Sale of Goods Act, 1930",
    stampNote: stampDutyNote,
    dateLine: `This Vendor Agreement is made and entered into on **${todayIN()}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      `**${company}**, a company incorporated under the Companies Act, 2013, having its registered ` +
        `office at ${compAddr}, bearing PAN ${compPan}, GSTIN ${compGstin} (the "**Company**" or the "**Buyer**");`,
      `AND`,
      `**${vendor}**, a ${vendorType.toLowerCase()}, having its place of business at ${vendorAddr}, ` +
        `bearing PAN ${vendorPan}, GSTIN ${vendorGstin} (the "**Vendor**" or the "**Supplier**").`,
      `(The Company and the Vendor are individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Company is engaged in business and requires certain products / services as more particularly described herein;`,
      `WHEREAS, the Vendor is in the business of supplying / providing such products / services and represents that it has the requisite resources and competence;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Scope of Supply",
        body:
          `The Vendor shall supply / provide to the Company the following products and / or services ` +
          `(collectively, the "**Products / Services**"): ${products}.\n\n` +
          `The Company shall issue Purchase Orders ("**POs**") from time to time specifying the quantity, ` +
          `delivery date, and any specific requirements. Each PO shall be deemed an integral part of this ` +
          `Agreement and governed by its terms.`,
      },
      ...(has(formData, "qualityStandards")
        ? [
            {
              heading: "2. Quality Standards",
              body:
                `The Products / Services supplied shall meet the following quality standards: ${quality}. ` +
                `The Vendor warrants that the Products are of merchantable quality and fit for the ` +
                `purpose specified, in accordance with Sections 16 and 17 of the Sale of Goods Act, 1930. ` +
                `The Company shall have the right to reject any Products that fail to meet such standards ` +
                `within fifteen (15) days of receipt.`,
            },
          ]
        : []),
      {
        heading: `${has(formData, "qualityStandards") ? "3" : "2"}. Delivery`,
        body:
          `${delivery}\n\n` +
          `Time shall be of the essence in respect of delivery. Risk in the Products shall pass to the ` +
          `Company on delivery to the Company's premises (or as otherwise specified in the PO), but ` +
          `title shall pass on full payment, in accordance with Sections 25 and 26 of the Sale of Goods Act, 1930.`,
      },
      {
        heading: `${has(formData, "qualityStandards") ? "4" : "3"}. Pricing and Payment`,
        body:
          `(a) The Vendor shall raise an invoice on each delivery in compliance with the GST Act, 2017. ` +
          `Invoices shall include description, quantity, rate, GST, total, and PO reference.\n\n` +
          `(b) **Payment Terms**: ${paymentTerms} (i.e., payment within the stated number of days from the date of receipt of valid invoice and acceptance of Products).\n\n` +
          `(c) Late payments shall bear interest at 1.5% per month or the maximum rate permitted by the ` +
          `Micro, Small and Medium Enterprises Development (MSMED) Act, 2006, where applicable.\n\n` +
          `(d) ${gstClause(18)}\n\n` +
          `(e) The Company shall deduct TDS at the applicable rate (typically 1% for individuals/HUF and ` +
          `2% for others under Section 194C of the Income Tax Act, 1961) on the invoice amount excluding GST.`,
      },
      ...(has(formData, "warrantyPeriod") && warranty !== "____________"
        ? [
            {
              heading: `${has(formData, "qualityStandards") ? "5" : "4"}. Warranty`,
              body:
                `The Vendor warrants the Products for a period of **${warranty}** from the date of ` +
                `delivery against defects in materials, workmanship, or design. During the warranty ` +
                `period, the Vendor shall, at its own cost, repair or replace defective Products within ` +
                `a reasonable time. This warranty is in addition to (and not in derogation of) the ` +
                `implied warranties under the Sale of Goods Act, 1930.`,
            },
          ]
        : []),
      ...(exclusivity
        ? [
            {
              heading: `${has(formData, "qualityStandards") ? "6" : "5"}. Exclusivity`,
              body:
                `During the term of this Agreement, the Vendor agrees that it shall supply the Products ` +
                `exclusively to the Company in the territory of India and shall not supply the same or ` +
                `substantially similar Products to any competitor of the Company without prior written consent.`,
            },
          ]
        : []),
      {
        heading: "Confidentiality",
        body: confidentialityClause,
      },
      {
        heading: "Intellectual Property",
        body:
          `Each Party shall retain ownership of its pre-existing intellectual property. Any custom ` +
          `designs, specifications, or technical drawings provided by the Company to the Vendor shall ` +
          `remain the exclusive property of the Company, and the Vendor shall not use such IP for any ` +
          `purpose other than fulfilling its obligations under this Agreement.`,
      },
      {
        heading: "Indemnification",
        body: indemnityClause,
      },
      {
        heading: "Limitation of Liability",
        body:
          `Neither Party shall be liable for any indirect, incidental, special, or consequential damages. ` +
          `The aggregate liability of the Vendor shall not exceed the value of the PO giving rise to the ` +
          `claim, except in cases of fraud, wilful misconduct, or breach of confidentiality.`,
      },
      {
        heading: "Term and Termination",
        body:
          `This Agreement shall be effective from the Effective Date and shall continue until terminated ` +
          `by either Party with thirty (30) days' prior written notice. Either Party may terminate ` +
          `immediately for material breach (not cured within fifteen (15) days), insolvency, or fraud ` +
          `of the other Party.`,
      },
      {
        heading: "Force Majeure",
        body: forceMajeureClause,
      },
      {
        heading: "Governing Law and Dispute Resolution",
        body: `${governingLawClause("Karnataka")}\n\n${arbitrationClause("Bengaluru")}`,
      },
      {
        heading: "Notices",
        body: noticeClause,
      },
      {
        heading: "General",
        body: `${severabilityClause} ${entireAgreementClause} ${amendmentClause} ${counterpartsClause}`,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties hereto have executed this Vendor Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Company",
        name: "",
        designation: "Authorized Signatory",
        org: company === PLACEHOLDER ? "" : company,
      },
      {
        label: "For and on behalf of the Vendor",
        name: "",
        designation: "Authorized Signatory",
        org: vendor === PLACEHOLDER ? "" : vendor,
      },
    ],
    witnesses: [{ label: "Witness 1", name: "" }, { label: "Witness 2", name: "" }],
    footer:
      "If the Vendor is a Micro/Small enterprise registered under the MSMED Act, 2006, payment must be made " +
      "within 45 days of acceptance of goods/services, failing which the Company is liable for compound interest " +
      "at three times the bank rate notified by RBI under Section 16 of the MSMED Act, 2006.",
  };
};
