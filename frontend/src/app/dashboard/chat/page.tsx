"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  FileText,
  FileSearch,
  Plus,
  SlidersHorizontal,
  ArrowUp,
  Bell,
  ShieldCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "./chat-context";
import type { ChatMessage } from "@/types/chat";

interface ActionCard {
  icon: React.ElementType;
  title: string;
  description: string;
}

const actionCards: ActionCard[] = [
  {
    icon: Search,
    title: "Research Case Law",
    description: "Search Supreme Court, High Courts & Tribunal judgments",
  },
  {
    icon: FileText,
    title: "Draft Document",
    description: "Create legal notices, petitions, contracts & opinions",
  },
  {
    icon: FileSearch,
    title: "Analyze Document",
    description: "Extract key points, risks & obligations from documents",
  },
];

export default function ChatPage() {
  const { activeConversation, activeConversationId, addMessage } = useChat();
  const [input, setInput] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversation_id: activeConversationId,
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data.message ||
          "I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMessage);
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I couldn't connect to the server. Please make sure the backend is running on http://localhost:8000",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-foreground/80">
            {activeConversation?.title ?? "New chat"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-muted-foreground/70 hover:bg-secondary hover:text-primary transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>
          <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary/10 transition-transform hover:scale-105">
            <AvatarFallback className="bg-primary text-white text-sm font-bold">
              S
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main content area */}
      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            {/* Greeting */}
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="text-primary/80">{greeting} Shankar,</span>
              </h1>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground/80">
                How can I help you today?
              </h2>
            </div>

            {/* Action cards */}
            <div className="mb-8 grid grid-cols-3 gap-5">
              {actionCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    className="group flex flex-col items-start rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/20 hover:shadow-md"
                  >
                    <Icon className="mb-4 h-7 w-7 text-primary/70 group-hover:text-primary transition-colors" />
                    <h3 className="mb-1.5 text-[15px] font-semibold text-primary">
                      {card.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground/80">
                      {card.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Input area */}
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-lg shadow-primary/5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a legal question, search for cases, or describe a document you need..."
                className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-[16px] placeholder:text-muted-foreground/60 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="rounded-xl p-2.5 text-muted-foreground/70 hover:bg-secondary hover:text-primary transition-colors">
                    <Plus className="h-5 w-5" />
                  </button>
                  <button className="rounded-xl p-2.5 text-muted-foreground/70 hover:bg-secondary hover:text-primary transition-colors">
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                    input.trim() && !isLoading
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105"
                      : "bg-secondary text-muted-foreground/50"
                  )}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <ArrowUp className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Security notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>All chats are confidential and encrypted</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-2xl rounded-lg p-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border border-border"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-primary">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      S
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border bg-card p-4">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-lg shadow-primary/5">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a legal question, search for cases, or describe a document you need..."
                  className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-[16px] placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="rounded-xl p-2.5 text-muted-foreground/70 hover:bg-secondary hover:text-primary transition-colors">
                      <Plus className="h-5 w-5" />
                    </button>
                    <button className="rounded-xl p-2.5 text-muted-foreground/70 hover:bg-secondary hover:text-primary transition-colors">
                      <SlidersHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                      input.trim() && !isLoading
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105"
                        : "bg-secondary text-muted-foreground/50"
                    )}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <ArrowUp className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
              {/* Security notice */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span>All chats are confidential and encrypted</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
