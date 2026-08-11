import type { Metadata } from "next";

import { LegalPlaceholderPage } from "@/components/legal/placeholder-page";

export const metadata: Metadata = {
  title: "DPDP (draft placeholder) — JurisGPT",
  robots: { index: false, follow: false },
};

export default function DpdpPage() {
  return (
    <LegalPlaceholderPage
      eyebrow="DPDP"
      title="Digital Personal Data Protection Act, 2023"
      intro="This page makes no claim of compliance with the DPDP Act. No gap assessment has been carried out or published, and nothing here should be read as a representation of compliance to a user, customer, investor or regulator."
      sections={[
        {
          heading: "Why this page says so little",
          body: "A DPDP notice has specific required contents. Drafting plausible-looking versions of them without legal review would misrepresent the product's actual position, which is worse than an empty page. The items below describe only what the code does today.",
        },
        {
          heading: "What exists in the codebase today",
          items: [
            "Sign-in is delegated to Clerk; application records are stored in Supabase.",
            "Questions submitted to the assistant are sent to a third-party language model provider to generate an answer.",
            "Clerk telemetry and vector store telemetry are both disabled.",
            "API request logging is in-memory, size-bounded, and redacts values that look like secrets.",
          ],
        },
      ]}
      notDocumented={[
        "Which processing activities fall in scope of the Act, and in what role",
        "The notice and consent flow, and whether a Consent Manager is used",
        "Whether a Data Protection Officer or grievance officer is required, who it is, and how to reach them",
        "Retention and erasure schedules",
        "The personal data breach assessment and notification process",
        "Handling of children's data and verifiable parental consent",
        "Whether any Significant Data Fiduciary obligations apply",
        "Cross-border transfer positions",
      ]}
    />
  );
}
