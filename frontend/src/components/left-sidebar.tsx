"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  FileText,
  FolderOpen,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Check,
  X,
  Archive,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatOptional } from "@/app/dashboard/chat/chat-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation } from "@/types/chat";

interface LeftSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

// Helper to group conversations by time
function groupConversationsByTime(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { label: string; conversations: Conversation[] }[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Previous 7 days", conversations: [] },
    { label: "Previous 30 days", conversations: [] },
    { label: "Older", conversations: [] },
  ];

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      groups[0].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (date >= lastWeek) {
      groups[2].conversations.push(conv);
    } else if (date >= lastMonth) {
      groups[3].conversations.push(conv);
    } else {
      groups[4].conversations.push(conv);
    }
  });

  return groups.filter((g) => g.conversations.length > 0);
}

// Conversation item component with rename functionality
function ConversationItem({
  conv,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(conv.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/40">
        <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary/60" />
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
        />
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-primary/10 text-primary"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-destructive/10 text-sidebar-foreground/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground/80 hover:bg-sidebar-accent"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary/60" />
      <span className="flex-1 truncate">{conv.title}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-accent transition-all",
              "opacity-0 group-hover:opacity-100",
              isActive && "opacity-100"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function LeftSidebar({ collapsed = false, onToggle }: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const chat = useChatOptional();

  const sortedConversations = useMemo(() => {
    if (!chat || !chat.hydrated) return [];
    return [...chat.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [chat, chat?.hydrated, chat?.conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return sortedConversations;
    const query = searchQuery.toLowerCase();
    return sortedConversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  }, [sortedConversations, searchQuery]);

  const groupedConversations = useMemo(
    () => groupConversationsByTime(filteredConversations),
    [filteredConversations]
  );

  const handleNewChat = () => {
    chat?.createNewConversation();
  };

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-center py-4">
          <button
            onClick={onToggle}
            className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-primary transition-colors"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 px-2">
          <button
            onClick={handleNewChat}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            title="New chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="JurisGPT" width={26} height={26} />
          <span className="text-xl font-bold tracking-tight text-primary">JurisGPT</span>
        </Link>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-sidebar-border">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Search */}
      {sortedConversations.length > 3 && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/70" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-sidebar-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {groupedConversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-sidebar-foreground/70/30 mb-3" />
              <p className="text-sm text-sidebar-foreground/70">No conversations yet</p>
              <p className="text-xs text-sidebar-foreground/70/70 mt-1">
                Start a new chat to get legal assistance
              </p>
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-3 py-2 text-[11px] font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={chat?.activeConversationId === conv.id}
                      onSelect={() => chat?.switchConversation(conv.id)}
                      onDelete={() => chat?.deleteConversation(conv.id)}
                      onRename={(newTitle) => chat?.renameConversation(conv.id, newTitle)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <NavItem
          icon={Search}
          label="Legal Search"
          href="/dashboard/search"
          active={pathname === "/dashboard/search"}
        />
        <NavItem
          icon={FileText}
          label="Documents"
          href="/dashboard/documents"
          active={pathname === "/dashboard/documents"}
        />
        <NavItem
          icon={Settings}
          label="Settings"
          href="/dashboard/settings"
          active={pathname === "/dashboard/settings"}
        />

        {sortedConversations.length > 0 && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear all conversations?")) {
                  chat?.clearAllConversations();
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors"
            >
              <Archive className="h-4 w-4" />
              Clear all chats
            </button>
          </>
        )}

        <div className="my-2 border-t border-sidebar-border" />
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to dashboard
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
  const className = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-primary/10 text-primary font-medium"
      : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
