/**
 * Offer Letter — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — Section 4 (offer & acceptance), Section 5 (revocation)
 *  - Background verification under Indian common practice
 *  - Code on Wages, 2019 / Code on Social Security, 2020
 *
 * An Offer Letter is a conditional, time-limited offer of employment.
 * It is a precursor to the Employment Contract and is binding upon
 * acceptance unless revoked before acceptance per Section 5 ICA.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatDate,
  asMonths,
  todayIN,
} from "./shared";

export const renderOfferLetter: TemplateRenderer = (formData): TemplateOutput => {
  const company = val(formData, "companyName");
  const compAddr = val(formData, "companyAddress");
  const hr = val(formData, "hrName");
  const hrEmail = val(formData, "hrEmail");

  const candidate = val(formData, "candidateName");
  const candEmail = val(formData, "candidateEmail");
  const candAddr = val(formData, "candidateAddress");

  const designation = val(formData, "designation");
  const department = val(formData, "department");
  const joining = formatDate(formData["joiningDate"]);
  const workLoc = val(formData, "workLocation");
  const ctc = formatINR(formData["ctc"]);
  const probation = asMonths(formData["probationPeriod"]);
  const validity = formatDate(formData["offerValidity"]);
  const bgvRequired = formData["bgvRequired"] !== false;
  const docs = val(formData, "documentsRequired", "");

  return {
    title: "Letter of Offer",
    lawReference:
      "Issued pursuant to the Indian Contract Act, 1872 (Sections 4 & 5)",
    dateLine: todayIN(),
    preamble: [
      `**To,**`,
      `**${candidate}**`,
      candAddr,
      `Email: ${candEmail}`,
      ``,
      `Subject: **Offer of Employment — ${designation}, ${department}**`,
      ``,
      `Dear ${candidate},`,
      ``,
      `On behalf of **${company}**, having its registered office at ${compAddr}, we are pleased to ` +
        `extend to you a conditional offer of employment for the position of **${designation}** in the ` +
        `${department} department, on the following terms:`,
    ],
    clauses: [
      {
        heading: "1. Position and Joining",
        body:
          `(a) **Designation**: ${designation}\n` +
          `(b) **Department**: ${department}\n` +
          `(c) **Date of Joining**: ${joining}\n` +
          `(d) **Place of Posting**: ${workLoc}\n\n` +
          `Your joining is subject to your acceptance of this offer and submission of all documents listed in Clause 5 below.`,
      },
      {
        heading: "2. Compensation",
        body:
          `Your annual Cost-to-Company (CTC) shall be **${ctc}**, structured into Basic, HRA, ` +
          `allowances, and statutory contributions in accordance with the Code on Wages, 2019. ` +
          `A detailed salary structure (Annexure A) shall be provided at the time of joining. All ` +
          `payments shall be subject to deduction of TDS under the Income Tax Act, 1961.`,
      },
      {
        heading: "3. Probation",
        body:
          `You will be on probation for a period of **${probation}** from the date of joining. ` +
          `Confirmation as a permanent employee shall be at the sole discretion of the Company based on ` +
          `your performance, conduct, and adherence to Company policies. During the probation period, ` +
          `either party may terminate the engagement with fifteen (15) days' written notice.`,
      },
      {
        heading: "4. Validity of Offer",
        body:
          `This offer is valid until **${validity}** (the "**Offer Validity Date**"). If you do not ` +
          `accept this offer in writing on or before the Offer Validity Date, this offer shall ` +
          `automatically lapse and stand revoked under Section 5 of the Indian Contract Act, 1872. ` +
          `${bgvRequired ? "This offer is conditional upon successful completion of background verification, including verification of educational qualifications, prior employment, criminal record, and reference checks." : ""}`,
      },
      ...(has(formData, "documentsRequired")
        ? [
            {
              heading: "5. Documents Required at Joining",
              body:
                `On the date of joining, please bring the following documents (originals for verification, ` +
                `along with one set of self-attested photocopies):\n\n${docs}\n\n` +
                `Failure to produce any of these documents may result in withdrawal of this offer or ` +
                `delay in onboarding.`,
            },
          ]
        : []),
      {
        heading: `${has(formData, "documentsRequired") ? "6" : "5"}. Confidentiality of this Offer`,
        body:
          `The terms of this offer are strictly confidential. Disclosure to any third party (other than ` +
          `your immediate family and professional advisors) shall be a ground for withdrawal of this ` +
          `offer.`,
      },
      {
        heading: `${has(formData, "documentsRequired") ? "7" : "6"}. Definitive Employment Agreement`,
        body:
          `Upon your acceptance and joining, you shall execute a definitive Employment Contract that ` +
          `shall set out the complete terms and conditions of your employment, including confidentiality, ` +
          `non-solicitation, intellectual property assignment, and termination provisions, in compliance ` +
          `with applicable Indian labour and employment laws.`,
      },
      {
        heading: `${has(formData, "documentsRequired") ? "8" : "7"}. Acceptance`,
        body:
          `Please indicate your acceptance of this offer by signing and returning a copy of this letter ` +
          `to the undersigned at ${hrEmail} on or before ${validity}.`,
      },
    ],
    operativeIntro:
      `We look forward to welcoming you to the team and are confident that your skills and experience will be a valuable addition to ${company === PLACEHOLDER ? "the Company" : company}.\n\nSincerely,`,
    signatures: [
      {
        label: "For and on behalf of " + (company === PLACEHOLDER ? "the Company" : company),
        name: hr === PLACEHOLDER ? "" : hr,
        designation: "Human Resources",
      },
      {
        label: "Accepted by",
        name: candidate === PLACEHOLDER ? "" : candidate,
        designation: "Date: ____________",
      },
    ],
    footer:
      "This is an offer letter and constitutes a conditional offer of employment. " +
      "It is subject to background verification, document submission, and execution of a definitive Employment Contract on or before the date of joining.",
  };
};
