"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { ChatMessage, Conversation, ChatState } from "@/types/chat";

const STORAGE_KEY = "jurisgpt-chat-state";

function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/\n/g, " ");
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + "...";
}

function loadState(): ChatState {
  if (typeof window === "undefined") {
    return { conversations: [], activeConversationId: null };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { conversations: [], activeConversationId: null };
}

function saveState(state: ChatState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save chat state:", e);
  }
}

interface ChatContextValue {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  deleteConversation: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeConversation = useMemo(() => {
    if (!state.activeConversationId) return null;
    return (
      state.conversations.find((c) => c.id === state.activeConversationId) ??
      null
    );
  }, [state.conversations, state.activeConversationId]);

  const createNewConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeConversationId: null,
    }));
  }, []);

  const switchConversation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      activeConversationId: id,
    }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => {
      if (prev.activeConversationId) {
        // Add to existing conversation
        return {
          ...prev,
          conversations: prev.conversations.map((conv) =>
            conv.id === prev.activeConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        };
      } else {
        // Create new conversation with this message
        const newId = crypto.randomUUID();
        const title =
          message.role === "user"
            ? generateTitle(message.content)
            : "New chat";
        const newConversation: Conversation = {
          id: newId,
          title,
          messages: [message],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          conversations: [newConversation, ...prev.conversations],
          activeConversationId: newId,
        };
      }
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setState((prev) => ({
      conversations: prev.conversations.filter((c) => c.id !== id),
      activeConversationId:
        prev.activeConversationId === id ? null : prev.activeConversationId,
    }));
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
      activeConversation,
      createNewConversation,
      switchConversation,
      addMessage,
      deleteConversation,
    }),
    [
      state.conversations,
      state.activeConversationId,
      activeConversation,
      createNewConversation,
      switchConversation,
      addMessage,
      deleteConversation,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function useChatOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}
