import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JurisGPT - AI-Powered Legal Services for Indian Startups",
  description: "Generate legally compliant Founder Agreements in minutes with AI assistance and expert lawyer review. Trusted by 500+ Indian startups. Get your documents within 24 hours.",
  keywords: ["legal documents", "founder agreement", "AI legal services", "Indian startups", "legal compliance", "lawyer review", "startup legal"],
  authors: [{ name: "JurisGPT" }],
  openGraph: {
    title: "JurisGPT - AI-Powered Legal Services for Indian Startups",
    description: "Generate legally compliant Founder Agreements in minutes with AI assistance and expert lawyer review.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisGPT - AI-Powered Legal Services",
    description: "Generate legally compliant Founder Agreements in minutes.",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans`}
        style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
