"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/left-sidebar";
import { ChatProvider } from "./chat-context";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ChatProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        <LeftSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </ChatProvider>
  );
}
