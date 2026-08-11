import type { Metadata } from "next";

import { LegalPlaceholderPage } from "@/components/legal/placeholder-page";

// Draft scaffolding should not be indexed as if it were a published policy.
export const metadata: Metadata = {
  title: "Privacy (draft placeholder) — JurisGPT",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPlaceholderPage
      eyebrow="PRIVACY"
      title="Privacy"
      intro="A privacy policy has not been written yet. What follows is only a factual description of what the current codebase does, so that the eventual policy starts from something true."
      sections={[
        {
          heading: "Third-party services this product relies on",
          items: [
            "Clerk provides sign-in and account management for the application.",
            "Supabase (hosted PostgreSQL) is the application database. The current schema defines tables for user profiles, companies, founders, legal matters, documents, lawyer reviews and legal preferences.",
            "Questions submitted to the assistant are sent to a third-party large language model provider — OpenAI or Anthropic, depending on how the deployment is configured — which generates the answer text.",
            "Retrieval runs against a local vector index built from public Indian legal documents.",
          ],
        },
        {
          heading: "Telemetry and analytics",
          items: [
            "Clerk's telemetry is explicitly disabled where the application is initialised.",
            "The vector store client is configured with anonymised telemetry switched off.",
            "No product analytics or advertising SDK is bundled in the frontend: the project has no Google Analytics, PostHog, Mixpanel, Segment or Vercel Analytics dependency.",
            "For completeness: the Content-Security-Policy still allowlists Vercel Insights hosts even though no such package is installed.",
          ],
        },
        {
          heading: "Request logging",
          body: "The API records each request in a bounded, in-memory audit log: request id, timestamp, client IP, HTTP method, path, status code, response time and, for signed-in requests, user id and email. Values that look like secrets are redacted. This log lives in process memory and is not written to the database.",
        },
        {
          heading: "The public demo",
          body: "The demo requires no account. Questions are proxied through this site's server to the backend; the demo does not ask for or attach an identity.",
        },
      ]}
      notDocumented={[
        "What is retained, where, and for how long",
        "How to request access, correction, export or deletion",
        "The lawful basis for each kind of processing, and how consent is captured",
        "A named contact route for privacy questions or grievances",
        "A complete sub-processor list and where each one stores data",
        "Whether and how data crosses borders",
      ]}
    />
  );
}
