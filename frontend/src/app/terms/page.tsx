import type { Metadata } from "next";

import { LegalPlaceholderPage } from "@/components/legal/placeholder-page";

export const metadata: Metadata = {
  title: "Terms (draft placeholder) — JurisGPT",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPlaceholderPage
      eyebrow="TERMS"
      title="Terms of use"
      intro="No terms of service are in force. This page does not form an agreement with anyone, and nothing on it is an offer, a warranty, or a limitation of liability."
      sections={[
        {
          heading: "What the product does",
          body: "JurisGPT answers questions by retrieving passages from a corpus of Indian legal documents and having a language model compose an answer from them, showing the sources each answer drew on. The signed-in application additionally exposes document, contract, matter and company features.",
        },
        {
          heading: "Access controls that exist today",
          items: [
            "The public demo needs no account. It accepts questions up to 2,000 characters and is rate limited per client IP.",
            "The rest of the application requires an account, handled by Clerk.",
            "The API applies its own rate limiting across endpoints.",
          ],
        },
        {
          heading: "Output is generated, not verified",
          body: "Answers are produced by a language model from retrieved sources. They can be incomplete or wrong, and the corpus has a fixed cut-off date. Nothing produced here has been checked by a lawyer before it reaches you.",
        },
      ]}
      notDocumented={[
        "Acceptable use, and what happens when it is breached",
        "Pricing, billing, renewal and refunds",
        "Warranties, disclaimers and limitation of liability",
        "Suspension and termination of accounts",
        "Who owns generated output, and what rights each side has in it",
        "Governing law, jurisdiction and dispute resolution",
      ]}
    />
  );
}
