import type { NextConfig } from "next";

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
          // to the Render backend + Supabase. Tighten further once the app is
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
              // API calls: our backend, Supabase, Clerk Frontend API + analytics.
              "connect-src 'self' https://jurisgpt-backend.onrender.com https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://*.vercel-insights.com",
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
