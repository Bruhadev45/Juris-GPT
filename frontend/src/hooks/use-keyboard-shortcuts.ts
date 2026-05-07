"use client";

import { useEffect, useCallback } from "react";

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (unless specifically handled)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For shortcuts with modifiers, allow them even in inputs
        const hasModifier = shortcut.ctrl || shortcut.meta || shortcut.alt;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          // Skip if in input and no modifier
          if (isInput && !hasModifier) continue;

          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Utility to detect Mac for showing correct shortcuts
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

// Format shortcut for display
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  const mac = isMac();

  if (shortcut.ctrl) parts.push(mac ? "⌃" : "Ctrl");
  if (shortcut.meta) parts.push(mac ? "⌘" : "Ctrl");
  if (shortcut.alt) parts.push(mac ? "⌥" : "Alt");
  if (shortcut.shift) parts.push(mac ? "⇧" : "Shift");

  // Format the key
  const keyMap: Record<string, string> = {
    escape: "Esc",
    enter: "↵",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    " ": "Space",
    "/": "/",
    k: "K",
  };

  parts.push(keyMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase());

  return parts.join(mac ? "" : "+");
}
