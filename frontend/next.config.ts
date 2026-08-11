import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// In dev, allow connections to localhost backend ports (FastAPI) and the
// Next dev server's own websocket/HMR origin. Production stays strict.
const devConnectSrc = isDev
  ? "http://localhost:8000 http://localhost:8001 http://127.0.0.1:8000 http://127.0.0.1:8001 ws://localhost:* ws://127.0.0.1:*"
  : "";

/**
 * Origin of the backend API, for the CSP connect-src directive.
 *
 * Derived from NEXT_PUBLIC_API_URL rather than hardcoded so that changing
 * hosts cannot leave the CSP allowlisting a dead origin while the browser
 * silently blocks the live one. Only the origin is emitted — a CSP source
 * expression must not carry a path. Falsy or malformed values yield an empty
 * string, which keeps the policy strict rather than failing the build.
 */
const apiOrigin = ((): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sgp1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Strict transport for HTTPS clients. Browsers ignore this on HTTP.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Content-Security-Policy. 'unsafe-inline' on style-src is required
          // for Tailwind's inline styles + Next.js dev injection; 'unsafe-eval'
          // is required for Next's dev runtime. connect-src allows API calls
          // to the backend + Supabase. Tighten further once the app is
          // closer to a stable surface.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Clerk loads its SDK from <instance>.clerk.accounts.dev (dev) and js.clerk.com (prod).
              // Vercel insights/analytics scripts also need to be allowlisted.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.clerk.com https://challenges.cloudflare.com https://*.vercel-insights.com https://*.vercel-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Clerk avatar images come from img.clerk.com; user uploads from Supabase + DO Spaces.
              "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co https://*.digitaloceanspaces.com",
              // API calls: the backend origin, Supabase, Clerk Frontend API +
              // analytics. The backend origin is derived from
              // NEXT_PUBLIC_API_URL rather than hardcoded, so moving hosts does
              // not silently leave the CSP pointing at a dead origin while the
              // browser blocks the live one.
              // In dev, also allow localhost backend ports + HMR websockets.
              `connect-src 'self' ${apiOrigin} https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://*.vercel-insights.com ${devConnectSrc}`
                .replace(/\s+/g, " ")
                .trim(),
              // Clerk shows captcha challenges in iframes from challenges.cloudflare.com.
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
