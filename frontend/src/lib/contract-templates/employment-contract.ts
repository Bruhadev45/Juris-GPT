/**
 * Employment Contract — Indian template.
 *
 * Grounded in:
 *  - Indian Contract Act, 1872 — base contractual validity
 *  - Code on Wages, 2019 — wages, bonus
 *  - Code on Social Security, 2020 — PF, gratuity, ESI
 *  - Industrial Relations Code, 2020 — termination, notice
 *  - Occupational Safety, Health and Working Conditions Code, 2020
 *  - Employees' Provident Funds and Miscellaneous Provisions Act, 1952
 *  - Payment of Gratuity Act, 1972 (5-year rule for permanent; 1-year for fixed-term)
 *  - Employees' State Insurance Act, 1948 (wages <= INR 21,000)
 *  - Section 27 ICA — restraint of trade prohibition
 *  - Maternity Benefit Act, 1961
 *  - DPDP Act, 2023 — employee personal data
 *
 * Note: The four Labour Codes were notified effective 21 November 2025 and
 * fully operational from 1 April 2026. The 50% wage rule applies — basic
 * salary + DA must be at least 50% of CTC for PF/gratuity calculations.
 */

import type { TemplateOutput, TemplateRenderer } from "./types";
import {
  PLACEHOLDER,
  val,
  has,
  formatINR,
  formatINRShort,
  formatDate,
  asDays,
  asMonths,
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
} from "./shared";

export const renderEmploymentContract: TemplateRenderer = (formData): TemplateOutput => {
  const employer = val(formData, "employerName");
  const empAddr = val(formData, "employerAddress");
  const empPan = val(formData, "employerPAN");
  const empGstin = val(formData, "employerGSTIN", "");
  const pfNo = val(formData, "pfRegistration", "");
  const esiNo = val(formData, "esiRegistration", "");

  const eName = val(formData, "employeeName");
  const eAddr = val(formData, "employeeAddress");
  const ePan = val(formData, "employeePAN");
  const eEmail = val(formData, "employeeEmail");
  const ePhone = val(formData, "employeePhone");
  const dob = formatDate(formData["dateOfBirth"]);

  const designation = val(formData, "designation");
  const department = val(formData, "department");
  const joiningDate = formatDate(formData["joiningDate"]);
  const empType = val(formData, "employmentType", "Permanent");
  const probation = asMonths(formData["probationPeriod"]);
  const workLoc = val(formData, "workLocation");
  const workMode = val(formData, "workMode", "On-site");
  const reporting = val(formData, "reportingManager");

  const ctc = formatINR(formData["ctc"]);
  const basic = formatINRShort(formData["basicSalary"]);
  const hra = has(formData, "hra") ? formatINRShort(formData["hra"]) : "";
  const noticePeriod = asDays(formData["noticePeriod"]);
  const leaveDays = val(formData, "leavePolicy", "24");
  const benefits = val(formData, "additionalBenefits", "");

  const isFixedTerm = empType.toLowerCase().includes("contract");
  const govLaw = "Karnataka"; // Default; could be parameterized
  const jurisdiction = workLoc !== PLACEHOLDER ? workLoc : "Bengaluru";

  return {
    title: "Employment Contract",
    lawReference:
      "Executed under the Indian Contract Act, 1872, the Code on Wages, 2019, and the Code on Social Security, 2020",
    stampNote: stampDutyNote,
    dateLine: `This Contract of Employment is entered into as of **${joiningDate}** (the "**Effective Date**")`,
    preamble: [
      `BY AND BETWEEN`,
      `**${employer}**, a company incorporated under the Companies Act, 2013, having its registered ` +
        `office at ${empAddr}, bearing PAN ${empPan}` +
        (has(formData, "employerGSTIN") ? `, GSTIN ${empGstin}` : "") +
        (has(formData, "pfRegistration") ? `, PF Code: ${pfNo}` : "") +
        (has(formData, "esiRegistration") ? `, ESI Code: ${esiNo}` : "") +
        ` (hereinafter referred to as the "**Employer**" or the "**Company**", which expression shall ` +
        `include its successors and assigns);`,
      `AND`,
      `**${eName}**, an Indian citizen, residing at ${eAddr}, holding PAN ${ePan}, born on ${dob}, ` +
        `with Email ${eEmail}, Mobile ${ePhone} (hereinafter referred to as the "**Employee**").`,
      `The Employer and the Employee are individually referred to as a "**Party**" and collectively as the "**Parties**".`,
    ],
    recitals: [
      `WHEREAS, the Employer is engaged in business and desires to engage the Employee for the position set out herein;`,
      `WHEREAS, the Employee has represented that he/she has the requisite qualifications, skills, and experience for such position;`,
      `NOW, THEREFORE, in consideration of the mutual covenants set forth herein, the Parties agree as follows:`,
    ],
    clauses: [
      {
        heading: "1. Position and Duties",
        body:
          `The Employer hereby appoints the Employee to the position of **${designation}** in the ` +
          `${department} department, reporting to **${reporting}**, with effect from ${joiningDate}. ` +
          `The Employee shall perform such duties as are customary for the position and as may be ` +
          `assigned from time to time by the Employer. The Employee shall devote his/her entire ` +
          `business time, attention, and abilities exclusively to the affairs of the Company.`,
      },
      {
        heading: "2. Place and Mode of Work",
        body:
          `The Employee's place of work shall be **${workLoc}** (${workMode}). The Employer reserves the ` +
          `right to require the Employee to work from any other office, project site, or client location ` +
          `as may be reasonably required, and to change the work mode in accordance with Company policy.`,
      },
      {
        heading: "3. Term and Probation",
        body:
          `This Agreement is for ${empType.toLowerCase()} employment commencing on ${joiningDate}. ` +
          `The Employee shall be on probation for a period of **${probation}** from the Effective Date ` +
          `(the "**Probation Period**"). On successful completion of the Probation Period, the ` +
          `Employee shall be confirmed as a permanent employee, subject to satisfactory performance.` +
          (isFixedTerm
            ? ` As a fixed-term employee under the Industrial Relations Code, 2020, the Employee is entitled to gratuity proportionate to the period of service after one (1) year, in accordance with applicable law.`
            : ""),
      },
      {
        heading: "4. Compensation",
        body:
          `(a) The Employee shall be paid an annual Cost-To-Company (CTC) of **${ctc}**, of which the ` +
          `monthly Basic Salary shall be **${basic}**` +
          (hra ? ` and HRA shall be **${hra}**` : "") +
          `, with the balance comprising allowances, statutory contributions, and benefits as per the ` +
          `salary structure annexed hereto (Annexure A).\n\n` +
          `(b) Pursuant to the Code on Wages, 2019, the aggregate of allowances (excluding statutory ` +
          `contributions) shall not exceed fifty percent (50%) of the total remuneration; any excess ` +
          `shall be deemed wages for PF and gratuity calculation purposes.\n\n` +
          `(c) Salary shall be credited on or before the seventh (7th) day of the succeeding calendar ` +
          `month, after deduction of TDS under the Income Tax Act, 1961, and other statutory deductions.`,
      },
      {
        heading: "5. Statutory Benefits",
        body:
          `(a) **Provident Fund**: Both Employer and Employee shall contribute 12% of the basic wages ` +
          `(as defined under the EPF Act, 1952) to the EPFO, in accordance with the Code on Social ` +
          `Security, 2020.\n\n` +
          `(b) **Gratuity**: The Employee shall be eligible for gratuity ` +
          (isFixedTerm
            ? `proportionate to service period after one (1) year of continuous service, as a fixed-term employee.`
            : `after completing five (5) years of continuous service, as per the Payment of Gratuity Act, 1972.`) +
          `\n\n(c) **ESI**: ${formData["esiApplicable"] ? "Applicable" : "Not applicable, subject to wage threshold under the ESI Act, 1948 (currently INR 21,000/month)"}.\n\n` +
          `(d) **Insurance**: Group medical insurance shall be provided as per Company policy.\n\n` +
          `(e) **Maternity / Paternity**: As per the Maternity Benefit Act, 1961 and applicable Company policy.`,
      },
      {
        heading: "6. Working Hours and Leave",
        body:
          `The Employee shall work from Monday to Friday, with such working hours as may be specified ` +
          `by the Company, subject to the Occupational Safety, Health and Working Conditions Code, 2020. ` +
          `The Employee shall be entitled to **${leaveDays}** days of paid leave per annum, in addition ` +
          `to public holidays declared by the Company. Sick leave and casual leave shall be as per ` +
          `Company policy and applicable State Shops & Establishments Act.`,
      },
      {
        heading: "7. Notice Period and Termination",
        body:
          `(a) Either Party may terminate this Agreement by giving **${noticePeriod}** prior written ` +
          `notice, or by paying salary in lieu of notice. During the Probation Period, the notice period ` +
          `shall be fifteen (15) days from either side.\n\n` +
          `(b) The Employer may terminate the Agreement immediately, without notice or compensation, ` +
          `in the event of (i) misconduct, fraud, or theft, (ii) material breach of this Agreement or ` +
          `Company policies, (iii) conviction of an offence involving moral turpitude, or (iv) absence ` +
          `without leave for more than seven (7) consecutive days.\n\n` +
          `(c) On termination, the Employee shall return all Company property, including documents, ` +
          `equipment, access cards, and Confidential Information. Final settlement shall be paid within ` +
          `forty-five (45) days as required by law.`,
      },
      {
        heading: "8. Confidentiality",
        body: confidentialityClause,
      },
      {
        heading: "9. Intellectual Property",
        body: ipAssignmentClause,
      },
      {
        heading: "10. Non-Solicitation",
        body: nonSolicitationClause,
      },
      {
        heading: "11. Data Protection",
        body:
          `The Employer shall process the Employee's personal data, including biometric and financial ` +
          `information, in accordance with the Digital Personal Data Protection Act, 2023, and applicable ` +
          `rules. The Employee consents to such processing for the purposes of employment, payroll, ` +
          `statutory compliance, and welfare benefits.`,
      },
      {
        heading: "12. Code of Conduct and POSH",
        body:
          `The Employee shall abide by the Company's Code of Conduct, Anti-Bribery and Anti-Corruption ` +
          `Policy, and the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) ` +
          `Act, 2013 ("**POSH Act**"). Any violation may result in disciplinary action up to and ` +
          `including termination.`,
      },
      {
        heading: "13. Governing Law",
        body: governingLawClause(govLaw),
      },
      {
        heading: "14. Dispute Resolution",
        body: arbitrationClause(jurisdiction),
      },
      {
        heading: "15. Notices",
        body: noticeClause,
      },
      {
        heading: "16. Severability and Entire Agreement",
        body: `${severabilityClause} ${entireAgreementClause} ${amendmentClause}`,
      },
      {
        heading: "17. Counterparts and Electronic Execution",
        body: counterpartsClause,
      },
    ],
    operativeIntro:
      "IN WITNESS WHEREOF, the Parties hereto have executed this Employment Contract on the date and year first written above.",
    signatures: [
      {
        label: "For and on behalf of the Employer",
        name: "",
        designation: "Authorized Signatory",
        org: employer === PLACEHOLDER ? "" : employer,
      },
      {
        label: "Employee",
        name: eName === PLACEHOLDER ? "" : eName,
        designation: designation === PLACEHOLDER ? "" : designation,
      },
    ],
    witnesses: [{ label: "Witness 1", name: "" }, { label: "Witness 2", name: "" }],
    footer:
      "This Employment Contract complies with the Code on Wages, 2019, the Code on Social Security, 2020, " +
      "and the Industrial Relations Code, 2020 (notified November 2025, operational April 2026). " +
      "Annexure A (Salary Structure) and Annexure B (Job Description) shall be attached separately." +
      (benefits ? `\n\nAdditional Benefits: ${benefits}` : ""),
  };
};
