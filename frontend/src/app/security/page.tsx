import type { Metadata } from "next";

import { LegalPlaceholderPage } from "@/components/legal/placeholder-page";

export const metadata: Metadata = {
  title: "Security (draft placeholder) — JurisGPT",
  robots: { index: false, follow: false },
};

export default function SecurityPage() {
  return (
    <LegalPlaceholderPage
      eyebrow="SECURITY"
      title="Security"
      intro="This page lists controls that are present in the code today. It is not a security assurance, and no independent audit, penetration test or certification is claimed here."
      sections={[
        {
          heading: "Controls present in the code",
          items: [
            "Authentication is delegated to Clerk. The API validates its own JWTs and refuses to start in production unless the signing secret and storage credentials are configured.",
            "State-changing API requests require a CSRF token: the backend sets a csrf_token cookie with SameSite=Strict and Secure, and the client echoes it in an X-CSRF-Token header.",
            "Rate limiting middleware runs across the API, and the public demo route adds a per-IP limit of its own.",
            "Cross-origin access is restricted to an explicit allowlist configured through an environment variable.",
            "Every frontend response carries Content-Security-Policy, Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy and Permissions-Policy headers.",
            "The in-memory request audit log redacts values that look like API keys or service credentials.",
          ],
        },
        {
          heading: "What this page does not say",
          body: "It makes no claim about encryption specifics, key management, backups, staff access, or the security posture of any third-party service this product depends on. Those need to be established and verified before they can be described.",
        },
      ]}
      notDocumented={[
        "Encryption at rest and in transit, stated precisely and verifiably",
        "Key management and secret rotation",
        "Backup, restore and disaster recovery",
        "A vulnerability disclosure route and expected response times",
        "Incident detection, response and customer notification",
        "Internal access control and least-privilege review",
        "Security review of sub-processors",
      ]}
    />
  );
}
