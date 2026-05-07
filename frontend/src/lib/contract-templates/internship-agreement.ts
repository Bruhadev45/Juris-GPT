/**
 * Internship Agreement — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872
 *  - Apprentices Act, 1961 (where applicable for technical training)
 *  - Code on Wages, 2019 — minimum wage / stipend
 *  - DPDP Act, 2023 — student data
 *  - Section 27 ICA — non-compete prohibition
 *  - POSH Act, 2013 — applies to interns at workplaces with 10+ workers
 *
 * Important: An intern is NOT an employee. The internship must have a
 * primarily educational character to avoid being recharacterized as
 * employment under the Industrial Relations Code, 2020. Stipend-only
 * internships are typically permitted; the Code on Wages applies only
 * if the intern is doing work substantially similar to employees.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINRShort,
  formatDate,
  todayIN,
  governingLawClause,
  noticeClause,
  severabilityClause,
  entireAgreementClause,
  stampDutyNote,
  confidentialityClause,
} from "./shared";

export const renderInternshipAgreement: TemplateRenderer = (formData): TemplateOutput => {
  const org = val(formData, "orgName");
  const orgAddr = val(formData, "orgAddress");
  const supervisor = val(formData, "supervisorName");
  const supEmail = val(formData, "supervisorEmail");
  const dept = val(formData, "department");

  const intern = val(formData, "internName");
  const internAddr = val(formData, "internAddress");
  const internEmail = val(formData, "internEmail");
  const internPhone = val(formData, "internPhone");
  const institution = val(formData, "institution", "");
  const course = val(formData, "course", "");

  const internshipType = val(formData, "internshipType", "Stipend Based");
  const stipend = has(formData, "stipend") ? formatINRShort(formData["stipend"]) : "";
  const startDate = formatDate(formData["startDate"]);
  const endDate = formatDate(formData["endDate"]);
  const workingDays = val(formData, "workingDays", "5");
  const workingHours = val(formData, "workingHours", "8");
  const responsibilities = val(formData, "responsibilities");
  const learning = val(formData, "learningObjectives");
  const conversion = formData["conversionPossible"] !== false;

  return {
    title: "Internship Agreement",
    lawReference: "Executed under the Indian Contract Act, 1872",
    stampNote: stampDutyNote,
    dateLine: `This Internship Agreement is made on **${todayIN()}**`,
    preamble: [
      `BY AND BETWEEN`,
      `**${org}**, having its place of business at ${orgAddr}, represented herein by **${supervisor}** ` +
        `(${dept} Department), Email: ${supEmail} (the "**Organization**" or the "**Company**");`,
      `AND`,
      `**${intern}**, residing at ${internAddr}, Email: ${internEmail}, Mobile: ${internPhone}` +
        (institution ? `, currently pursuing ${course} at ${institution}` : "") +
        ` (the "**Intern**").`,
      `(The Organization and the Intern are individually referred to as a "**Party**" and collectively as the "**Parties**".)`,
    ],
    recitals: [
      `WHEREAS, the Intern desires to undergo internship training with the Organization for the purpose of practical learning and skill development;`,
      `WHEREAS, the Organization is willing to offer such internship under the supervision of its qualified personnel;`,
      `WHEREAS, the Parties acknowledge that this Agreement shall NOT constitute an employment relationship and that the Intern is not an employee of the Organization;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Nature of Engagement",
        body:
          `(a) The Intern is engaged purely for the purpose of training, learning, and skill development. ` +
          `Nothing in this Agreement shall be construed as creating an employer-employee relationship.\n\n` +
          `(b) The Intern shall not be entitled to any employee benefits including provident fund, ` +
          `gratuity, ESI, leave encashment, bonus, or any other statutory or non-statutory employment benefits.\n\n` +
          `(c) The Intern shall not be considered a "worker" under the Industrial Relations Code, 2020, ` +
          `or any State Shops & Establishments Act, provided the engagement remains primarily educational ` +
          `in character.`,
      },
      {
        heading: "2. Duration",
        body:
          `The internship shall commence on **${startDate}** and shall conclude on **${endDate}** ` +
          `(the "**Internship Period**"). Either Party may terminate the internship earlier by giving ` +
          `seven (7) days' written notice.`,
      },
      {
        heading: "3. Working Schedule",
        body:
          `The Intern shall report to the Organization on **${workingDays}** working days per week, for ` +
          `**${workingHours}** hours per working day. The exact schedule shall be communicated by the ` +
          `Supervisor. The Intern shall be entitled to public holidays declared by the Organization.`,
      },
      {
        heading: "4. Responsibilities",
        body:
          `(a) **Key Responsibilities**: ${responsibilities}\n\n` +
          `(b) The Intern shall perform such tasks under the direct supervision of **${supervisor}** ` +
          `(the "**Supervisor**"), with the principal objective of learning and skill development rather ` +
          `than productive output.\n\n` +
          `(c) The Intern shall conduct himself/herself with diligence, professionalism, and in ` +
          `compliance with the Organization's policies and applicable law.`,
      },
      {
        heading: "5. Learning Objectives",
        body:
          `The Internship aims to provide the Intern with the following learning outcomes: ${learning}. ` +
          `The Supervisor shall provide regular feedback and a final evaluation at the conclusion of ` +
          `the Internship Period.`,
      },
      {
        heading: "6. Stipend",
        body:
          internshipType.toLowerCase().includes("unpaid")
            ? `This is an unpaid internship. The Intern shall not be entitled to any monetary remuneration. ` +
              `Reasonable out-of-pocket expenses incurred for assigned tasks shall be reimbursed on ` +
              `production of bills, subject to prior approval.`
            : stipend
            ? `The Organization shall pay the Intern a monthly stipend of **${stipend}** as a token of ` +
              `appreciation for the time and effort put in by the Intern, in accordance with Section ` +
              `13(1)(a) of the Code on Wages, 2019. TDS shall not be applicable on stipends below the ` +
              `taxable threshold.`
            : `Stipend, if any, shall be communicated to the Intern in writing prior to the commencement of the Internship.`,
      },
      {
        heading: "7. Confidentiality",
        body: confidentialityClause,
      },
      {
        heading: "8. Intellectual Property",
        body:
          `Any work product, reports, code, designs, or other intellectual property created by the ` +
          `Intern during the Internship Period in the course of and arising out of the Internship ` +
          `shall vest in the Organization. The Intern hereby irrevocably assigns all such IP to the ` +
          `Organization, and shall execute such documents as may be required to perfect such assignment.`,
      },
      {
        heading: "9. Code of Conduct and POSH",
        body:
          `The Intern shall comply with the Organization's Code of Conduct and the Sexual Harassment of ` +
          `Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013. The Intern is entitled ` +
          `to file complaints with the Organization's Internal Complaints Committee (ICC) and is ` +
          `protected by the POSH Act during the Internship.`,
      },
      {
        heading: "10. Data Protection",
        body:
          `The Organization shall handle the personal data of the Intern (including academic records, ` +
          `address, and bank details) in accordance with the Digital Personal Data Protection Act, 2023.`,
      },
      {
        heading: "11. Conversion to Employment",
        body:
          conversion
            ? `On successful completion of the Internship, the Organization may, at its sole discretion, ` +
              `extend an offer of full-time employment to the Intern. Any such offer shall be governed ` +
              `by a separate Employment Contract. There is no guarantee or commitment of conversion to ` +
              `employment under this Agreement.`
            : `This Internship is for training purposes only and does not create any expectation, right, ` +
              `or commitment for full-time employment with the Organization.`,
      },
      {
        heading: "12. Termination",
        body:
          `Either Party may terminate this Agreement by giving seven (7) days' written notice. The ` +
          `Organization may terminate immediately for misconduct, breach of confidentiality, or violation ` +
          `of the Code of Conduct. On termination, the Intern shall return all Organization property ` +
          `and Confidential Information.`,
      },
      {
        heading: "13. Certificate",
        body:
          `On successful completion of the Internship Period, the Organization shall issue an Internship ` +
          `Completion Certificate to the Intern, which shall set out the duration, nature of work, and a ` +
          `summary of the Intern's performance.`,
      },
      {
        heading: "14. Governing Law",
        body: governingLawClause("Karnataka"),
      },
      {
        heading: "15. Notices",
        body: noticeClause,
      },
      {
        heading: "16. Severability and Entire Agreement",
        body: `${severabilityClause} ${entireAgreementClause}`,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties have executed this Internship Agreement on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Organization",
        name: supervisor === PLACEHOLDER ? "" : supervisor,
        designation: "Supervisor",
        org: org === PLACEHOLDER ? "" : org,
      },
      {
        label: "Intern",
        name: intern === PLACEHOLDER ? "" : intern,
        designation: institution || "",
      },
    ],
    footer:
      "Note: If the Intern is a minor (below 18 years), this Agreement must be countersigned by the " +
      "Intern's parent or guardian under Section 11 of the Indian Contract Act, 1872. The internship " +
      "shall comply with the Child Labour (Prohibition and Regulation) Amendment Act, 2016 if the " +
      "Intern is between 14 and 18 years of age.",
  };
};
