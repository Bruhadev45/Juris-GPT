import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JurisGPT - AI-Powered Legal Services for Indian Startups & MSMEs",
  description: "India's AI-first legal platform. Generate legally compliant Founder Agreements, get instant legal guidance on Companies Act, Contract Act & more. Lawyer-reviewed. DPDPA compliant.",
  keywords: ["legal documents", "founder agreement", "AI legal services", "Indian startups", "MSME legal", "Companies Act", "lawyer review", "JurisGPT", "legal compliance India"],
  authors: [{ name: "JurisGPT" }],
  openGraph: {
    title: "JurisGPT - AI-Powered Legal Services for Indian Startups & MSMEs",
    description: "India's AI-first legal platform. Founder Agreements, legal Q&A, compliance guidance. Lawyer-reviewed.",
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
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} antialiased font-sans`}
        style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
