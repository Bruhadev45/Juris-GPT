"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  FileText,
  FolderOpen,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const gettingStartedItems = [
  'Try: "Find Supreme Court c...',
  "Learn to draft a legal notic...",
  "Watch: How we ensure cit...",
];

interface LeftSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function LeftSidebar({ collapsed = false, onToggle }: LeftSidebarProps) {
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border bg-[#f8f7fc] transition-all duration-300",
        collapsed ? "w-0 overflow-hidden" : "w-60"
      )}
    >
      {/* Logo and collapse toggle */}
      <div className="flex items-center justify-between px-4 py-5">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-primary">
          Legalwork
        </Link>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {/* New chat */}
        <Link 
          href="/dashboard/chat"
          className="mb-6 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-semibold text-primary transition-all hover:bg-primary/5"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
            <Plus className="h-4 w-4" />
          </div>
          New chat
        </Link>

        {/* Getting started section */}
        <div className="mb-4">
          <div className="mb-2 px-3 text-xs font-medium text-muted-foreground">
            Getting started
          </div>
        <div className="space-y-2">
          {gettingStartedItems.map((item, idx) => (
            <button
              key={idx}
              className="w-full truncate rounded-lg px-3 py-1.5 text-left text-[14px] text-foreground/80 hover:bg-secondary transition-colors"
            >
              {item}
            </button>
          ))}
          <button className="px-3 py-1.5 text-[14px] font-semibold text-primary hover:opacity-80 transition-opacity">
            View all
          </button>
        </div>
        </div>

        {/* Main navigation */}
        <div className="space-y-1">
          <NavItem 
            icon={Search} 
            label="Research" 
            href="/dashboard/search"
            active={pathname === "/dashboard/search"}
          />
          <NavItem 
            icon={FileText} 
            label="Drafts" 
            href="/dashboard/review"
            active={pathname === "/dashboard/review"}
          />
          <NavItem 
            icon={FolderOpen} 
            label="Resources" 
            href="/dashboard/cases"
            active={pathname === "/dashboard/cases"}
          />
        </div>

        {/* Workspaces section */}
        <Collapsible
          open={workspacesOpen}
          onOpenChange={setWorkspacesOpen}
          className="mt-6"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-1 px-3 py-2 text-sm font-medium text-primary">
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                workspacesOpen && "rotate-90"
              )}
            />
            Workspaces
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mx-3 mt-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 transition-all hover:bg-primary/10 cursor-default">
              <p className="text-[14px] font-semibold text-primary">
                No workspaces yet
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground/80">
                Workspaces keep all your research, drafts, and documents
                organized by matter. Just start chatting, we'll create one
                automatically.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>

      {/* Bottom settings */}
      <div className="border-t border-border p-3">
        <Link 
          href="/dashboard/settings"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  active?: boolean;
}) {
  const Component = href ? Link : "button";
  const props = href ? { href } : {};
  
  return (
    <Component
      {...props}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
        active
          ? "bg-primary/5 text-primary"
          : "text-foreground/80 hover:bg-secondary hover:text-primary"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-primary/70")} />
      {label}
    </Component>
  );
}
