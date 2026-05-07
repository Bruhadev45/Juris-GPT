"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  Search,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Archive,
  FileSignature,
  FileSearch,
  Newspaper,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Workspace", href: "/dashboard" },
  { icon: Scale, label: "Legal Assistant", href: "/dashboard/chat" },
  { icon: Search, label: "Legal Research", href: "/dashboard/search" },
];

const workflowNav: NavItem[] = [
  { icon: ShieldCheck, label: "Compliance", href: "/dashboard/compliance" },
  { icon: CalendarDays, label: "Calendar", href: "/dashboard/calendar" },
  { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts" },
  { icon: Archive, label: "Vault", href: "/dashboard/vault" },
];

const reviewNav: NavItem[] = [
  { icon: FileText, label: "Document Review", href: "/dashboard/review" },
  { icon: FileSearch, label: "Contract Analyzer", href: "/dashboard/analyzer" },
];

const otherNav: NavItem[] = [
  { icon: Newspaper, label: "Legal News", href: "/dashboard/news" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Support", href: "/dashboard/support" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-5">
      {!collapsed && (
        <div className="mb-2 px-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-primary relative"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
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
            <h1 className="text-xl font-bold tracking-tight text-sidebar-accent-foreground">JurisGPT</h1>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image src="/logo.png" alt="JurisGPT" width={26} height={26} />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors flex-shrink-0"
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
        <NavSection title="Main" items={mainNav} />
        <NavSection title="Workflows" items={workflowNav} />
        <NavSection title="Analysis" items={reviewNav} />
        <NavSection title="Other" items={otherNav} />
      </ScrollArea>

      {/* User identity + logout */}
      <div className="border-t border-sidebar-border p-2 space-y-1 flex-shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {user.full_name}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors w-full",
            collapsed && "justify-center px-0 py-2.5"
          )}
        >
          <LogOut className={cn("h-[18px] w-[18px] flex-shrink-0", collapsed && "h-5 w-5")} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
