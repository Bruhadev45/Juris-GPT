"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  FileText,
  BarChart3,
  ClipboardList,
  Users,
  Puzzle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  MessageSquare,
  CalendarDays,
  Calculator,
  FileEdit,
  Newspaper,
  Archive,
  FileScan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FolderOpen, label: "Cases", href: "/dashboard/cases" },
  { icon: Search, label: "Legal Search", href: "/dashboard/search" },
  { icon: FileText, label: "Smart Review", href: "/dashboard/review" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
  { icon: FileEdit, label: "RTI Assistant", href: "/dashboard/rti" },
];

const analyticsNav: NavItem[] = [
  { icon: BarChart3, label: "Compliance View", href: "/dashboard/compliance" },
  { icon: CalendarDays, label: "Compliance Calendar", href: "/dashboard/calendar" },
  { icon: ClipboardList, label: "Legal Forms", href: "/dashboard/forms" },
  { icon: FileText, label: "Agreements", href: "/agreements/new" },
  { icon: FileScan, label: "Contract Analyzer", href: "/dashboard/analyzer" },
  { icon: Calculator, label: "Legal Calculator", href: "/dashboard/calculator" },
];

const managementNav: NavItem[] = [
  { icon: Archive, label: "Document Vault", href: "/dashboard/vault" },
  { icon: Users, label: "Team", href: "/dashboard/team" },
  { icon: Puzzle, label: "Integrations", href: "/dashboard/integrations" },
];

const otherNav: NavItem[] = [
  { icon: Newspaper, label: "Legal News", href: "/dashboard/news" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Support Center", href: "/dashboard/support" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-6">
      <div className="px-4 mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/")) ||
            (item.href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary rounded-lg"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary rounded-lg"
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-background border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo and collapse toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="JurisGPT" width={28} height={28} />
            <h1 className="text-2xl font-bold tracking-tight text-primary">JurisGPT</h1>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center mx-auto">
            <Image src="/logo.png" alt="JurisGPT" width={28} height={28} />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <NavSection title="MAIN" items={mainNav} />
        <NavSection title="ANALYTICS" items={analyticsNav} />
        <NavSection title="MANAGEMENT" items={managementNav} />
        <NavSection title="OTHER" items={otherNav} />
      </ScrollArea>

      {/* Bottom logout */}
      <div className="border-t border-border p-4">
        <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-lg transition-colors w-full">
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
