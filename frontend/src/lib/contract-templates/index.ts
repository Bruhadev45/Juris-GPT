/**
 * Indian contract template registry.
 *
 * Each template is grounded in actual Indian statutory law:
 *  - Indian Contract Act, 1872
 *  - Companies Act, 2013 (& 2014 Rules)
 *  - Indian Partnership Act, 1932
 *  - Income Tax Act, 1961 (Sections 194C, 194J, 17(2), 49(2AB), 184, 40(b))
 *  - CGST/SGST Act, 2017
 *  - Indian Stamp Act, 1899
 *  - Arbitration & Conciliation Act, 1996
 *  - Code on Wages, 2019 / Code on Social Security, 2020 / Industrial Relations Code, 2020
 *  - DPDP Act, 2023
 *  - Sale of Goods Act, 1930
 *  - Information Technology Act, 2000
 *  - SEBI Notifications (October 2013 — pre-emption rights)
 *
 * Sources consulted (2026):
 *  - StartupIndia.gov.in (SHA template, Founder Agreement template)
 *  - Treelife, EquityList, Singhania, Sterling & Partners (founder/SHA practice)
 *  - LiveLaw, iPleaders (legal critique of Section 27)
 *  - LegalDocs, IndiaFilings, Vakilsearch (standard formats)
 *  - Ministry of Labour & Employment FAQs on Labour Codes (March 2026)
 *  - ICMAI Partnership Deed sample
 */

import type { TemplateRenderer } from "./types";
import { renderNDA } from "./nda";
import { renderFoundersAgreement } from "./founders-agreement";
import { renderEmploymentContract } from "./employment-contract";
import { renderOfferLetter } from "./offer-letter";
import { renderShareholderAgreement } from "./shareholder-agreement";
import { renderESOPScheme } from "./esop-scheme";
import { renderConsultantAgreement } from "./consultant-agreement";
import { renderServiceAgreement } from "./service-agreement";
import { renderPartnershipDeed } from "./partnership-deed";
import { renderVendorAgreement } from "./vendor-agreement";
import { renderInternshipAgreement } from "./internship-agreement";
import { renderMOU } from "./mou-loi";

export const TEMPLATE_REGISTRY: Record<string, TemplateRenderer> = {
  nda: renderNDA,
  "founders-agreement": renderFoundersAgreement,
  "employment-contract": renderEmploymentContract,
  "offer-letter": renderOfferLetter,
  "shareholder-agreement": renderShareholderAgreement,
  "esop-scheme": renderESOPScheme,
  "consultant-agreement": renderConsultantAgreement,
  "service-agreement": renderServiceAgreement,
  "partnership-deed": renderPartnershipDeed,
  "vendor-agreement": renderVendorAgreement,
  "internship-agreement": renderInternshipAgreement,
  "mou-loi": renderMOU,
};

export function getTemplate(type: string): TemplateRenderer | null {
  return TEMPLATE_REGISTRY[type] ?? null;
}

export type { TemplateOutput, TemplateRenderer, TemplateClause, TemplatePartyBlock, FormData } from "./types";
