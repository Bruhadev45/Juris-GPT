"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  Search,
  FileText,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  Wrench,
  Gavel,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Archive,
  FileSignature,
  FileSearch,
  FileQuestion,
  Newspaper,
  Puzzle,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Workspace", href: "/dashboard" },
  { icon: Scale, label: "Legal Assistant", href: "/dashboard/chat" },
  { icon: Search, label: "Source Search", href: "/dashboard/search" },
];

const toolsNav: NavItem[] = [
  { icon: Wrench, label: "Tools", href: "/dashboard/tools" },
  { icon: FileSearch, label: "Analyzer", href: "/dashboard/analyzer" },
  { icon: FileQuestion, label: "RTI Assistant", href: "/dashboard/rti" },
];

const lawyersNav: NavItem[] = [
  { icon: FileText, label: "Review Queue", href: "/dashboard/review" },
  { icon: Gavel, label: "Lawyer Review", href: "/dashboard/lawyer-review" },
];

const managementNav: NavItem[] = [
  { icon: ShieldCheck, label: "Compliance", href: "/dashboard/compliance" },
  { icon: CalendarDays, label: "Calendar", href: "/dashboard/calendar" },
  { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts" },
  { icon: FolderOpen, label: "Documents", href: "/dashboard/documents" },
  { icon: Archive, label: "Vault", href: "/dashboard/vault" },
  { icon: Users, label: "Team", href: "/dashboard/team" },
];

const otherNav: NavItem[] = [
  { icon: Newspaper, label: "Legal News", href: "/dashboard/news" },
  { icon: Puzzle, label: "Integrations", href: "/dashboard/integrations" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Support", href: "/dashboard/support" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-5">
      {!collapsed && (
        <div className="mb-2 px-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      )}
      {collapsed && <div className="mb-2 border-t border-sidebar-border/70 mx-2" />}
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/")) ||
            (item.href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0 py-2.5",
                isActive
                  ? "bg-secondary text-foreground before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-primary relative"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", collapsed && "h-5 w-5")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[252px]"
      )}
    >
      {/* Logo and collapse toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="JurisGPT" width={26} height={26} />
            <h1 className="text-xl font-bold tracking-tight text-foreground">JurisGPT</h1>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image src="/logo.png" alt="JurisGPT" width={26} height={26} />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Scrollable nav area */}
      <ScrollArea className="flex-1 py-3 overflow-hidden">
        <NavSection title="Research" items={mainNav} />
        <NavSection title="Workflows" items={managementNav} />
        <NavSection title="Review" items={lawyersNav} />
        <NavSection title="Utilities" items={toolsNav} />
        <NavSection title="Other" items={otherNav} />
      </ScrollArea>

      {/* Bottom logout */}
      <div className="border-t border-sidebar-border p-2 flex-shrink-0">
        <button
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full",
            collapsed && "justify-center px-0 py-2.5"
          )}
        >
          <LogOut className={cn("h-[18px] w-[18px] flex-shrink-0", collapsed && "h-5 w-5")} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
