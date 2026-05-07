"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auto-close the mobile drawer whenever the route changes so a tap on a
  // nav link returns the user to the content view immediately.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Chat page uses its own layout with LeftSidebar
  if (pathname?.includes("/dashboard/chat")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden under md breakpoint where it would
          devour ~50% of the viewport. */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile slide-in drawer + dim backdrop */}
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-200 ease-out ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileNavOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only top bar with hamburger */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            type="button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="JurisGPT" width={22} height={22} />
            <span className="text-base font-semibold tracking-tight text-foreground">JurisGPT</span>
          </div>
          <span aria-hidden className="h-9 w-9" />
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
