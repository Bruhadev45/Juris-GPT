import type { Metadata } from "next";

import { LegalPlaceholderPage } from "@/components/legal/placeholder-page";

export const metadata: Metadata = {
  title: "Cookies (draft placeholder) — JurisGPT",
  robots: { index: false, follow: false },
};

export default function CookiesPage() {
  return (
    <LegalPlaceholderPage
      eyebrow="COOKIES"
      title="Cookies"
      intro="An inventory of the cookies this codebase sets itself. It is a description of current behaviour, not a cookie policy, and it is not a complete inventory of everything a browser may end up storing."
      sections={[
        {
          heading: "Cookies this application sets",
          items: [
            "csrf_token — set by the API for CSRF protection, with SameSite=Strict, Secure and a 24-hour lifetime. It is deliberately readable by JavaScript so the client can echo it back in a request header.",
            "jurisgpt_session_active — set by the frontend to record that a session is active, with SameSite=Lax, a one-hour lifetime, and the Secure flag when served over HTTPS.",
            "sidebar_state — remembers whether the dashboard sidebar is expanded.",
          ],
        },
        {
          heading: "Cookies set by Clerk",
          body: "Clerk, the authentication provider, sets its own cookies to keep you signed in. They come from Clerk's SDK rather than from this codebase, so they are not enumerated here.",
        },
        {
          heading: "Related browser storage",
          body: "The signed-in application also keeps an access token in localStorage under jurisgpt.access_token. That is not a cookie, but it is data held in your browser.",
        },
        {
          heading: "Advertising and analytics",
          body: "This application's own code sets no advertising or analytics cookies, and no analytics SDK is bundled in the frontend.",
        },
      ]}
      notDocumented={[
        "Whether a consent mechanism is required, and what it would look like",
        "How to refuse or withdraw consent for non-essential cookies",
        "A full inventory of the cookies set by Clerk and any other third party",
        "Classification of each cookie as strictly necessary or otherwise",
      ]}
    />
  );
}
