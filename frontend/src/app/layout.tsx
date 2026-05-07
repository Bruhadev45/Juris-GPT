import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Spectral } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

// Brand-tinted Clerk appearance — burgundy primary, cream backgrounds.
const clerkAppearance = {
  variables: {
    colorPrimary: "#7B1E2E",
    colorText: "#0A0A0A",
    colorTextSecondary: "#6B6B6B",
    colorBackground: "#FAF6EF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#0A0A0A",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
  },
  elements: {
    card: { boxShadow: "0 8px 32px rgba(10, 10, 10, 0.06)", border: "1px solid #E8E2D5" },
    formButtonPrimary: {
      backgroundColor: "#0A0A0A",
      "&:hover": { backgroundColor: "#7B1E2E" },
      borderRadius: "0.5rem",
      fontWeight: "600",
    },
    footerActionLink: { color: "#7B1E2E", fontWeight: "500" },
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JurisGPT - AI-Powered Legal Services for Indian Startups & MSMEs",
  description:
    "India's AI-first legal platform. Generate legally compliant Founder Agreements, get instant legal guidance on Companies Act, Contract Act & more. Lawyer-reviewed. DPDPA compliant.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.svg",
  },
  keywords: [
    "legal documents",
    "founder agreement",
    "AI legal services",
    "Indian startups",
    "MSME legal",
    "Companies Act",
    "lawyer review",
    "JurisGPT",
    "legal compliance India",
  ],
  authors: [{ name: "JurisGPT" }],
  openGraph: {
    title: "JurisGPT - AI-Powered Legal Services for Indian Startups & MSMEs",
    description:
      "India's AI-first legal platform. Founder Agreements, legal Q&A, compliance guidance. Lawyer-reviewed.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisGPT - AI-Powered Legal Services for India",
    description: "Generate legally compliant Founder Agreements in minutes. Lawyer-reviewed.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spectral.variable} ${jetBrainsMono.variable} antialiased font-sans`}
        style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
      >
        <ClerkProvider appearance={clerkAppearance}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AuthProvider>
          </ThemeProvider>
        </ClerkProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
