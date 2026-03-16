"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  FileText,
  FileSearch,
  Plus,
  SlidersHorizontal,
  ArrowUp,
  ArrowLeft,
  Bell,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Scale,
  BookOpen,
  Paperclip,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "./chat-context";
import type { ChatMessage } from "@/types/chat";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ActionCard {
  icon: React.ElementType;
  title: string;
  description: string;
  prompt: string;
}

const actionCards: ActionCard[] = [
  {
    icon: Search,
    title: "Research Case Law",
    description: "Search Supreme Court, High Courts & Tribunal judgments",
    prompt: "Find recent Supreme Court judgments on ",
  },
  {
    icon: FileText,
    title: "Draft Document",
    description: "Create legal notices, petitions, contracts & opinions",
    prompt: "Draft a legal ",
  },
  {
    icon: FileSearch,
    title: "Analyze Document",
    description: "Extract key points, risks & obligations from documents",
    prompt: "Analyze the following document for risks and key clauses: ",
  },
  {
    icon: Scale,
    title: "Legal Advice",
    description: "Get guidance on Indian business & startup law",
    prompt: "I need legal advice regarding ",
  },
];

const suggestedPrompts = [
  "What are the legal requirements for incorporating a startup in India?",
  "Explain Section 138 of the Negotiable Instruments Act",
  "What is the process for filing a trademark application?",
  "Compare Private Limited vs LLP for a tech startup",
];

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 items-start"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Image src="/logo.png" alt="AI" width={18} height={18} />
      </div>
      <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/50"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Copy Button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all"
      whileTap={{ scale: 0.9 }}
      title="Copy response"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({
  message,
  isLatest,
}: {
  message: ChatMessage;
  isLatest: boolean;
}) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI Avatar */}
      {!isUser && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Image src="/logo.png" alt="AI" width={18} height={18} />
        </motion.div>
      )}

      <div className={cn("max-w-[70%] flex flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm transition-all",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border/60 text-card-foreground rounded-tl-sm"
          )}
        >
          {!isUser ? (
            <div className="text-[14px] leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-primary prose-a:text-primary prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed">{message.content}</p>
          )}
        </div>

        {/* Message meta */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1.5 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[11px] text-muted-foreground/50">{time}</span>
          {!isUser && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
              <motion.button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all"
                whileTap={{ scale: 0.9 }}
                title="Helpful"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all"
                whileTap={{ scale: 0.9 }}
                title="Not helpful"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
            <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs font-semibold">
              S
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Chat Input Component ─── */
function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  compact = false,
}: {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  compact?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, compact ? 120 : 160)}px`;
    }
  }, [input, compact]);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/[0.03] transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-primary/[0.08]",
        compact ? "p-3" : "p-4"
      )}
    >
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a legal question, search cases, or describe a document you need..."
        className={cn(
          "resize-none border-0 bg-transparent p-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 text-[15px] leading-relaxed",
          compact ? "min-h-[48px]" : "min-h-[80px]"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-2 text-muted-foreground/60 hover:bg-secondary hover:text-primary transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-2 text-muted-foreground/60 hover:bg-secondary hover:text-primary transition-colors"
            title="Settings"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          {input.trim() && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-muted-foreground/40"
            >
              Enter to send, Shift+Enter for new line
            </motion.span>
          )}
          <motion.button
            onClick={onSubmit}
            disabled={!input.trim() || isLoading}
            whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isLoading ? { scale: 0.92 } : {}}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-secondary text-muted-foreground/40"
            )}
          >
            {isLoading ? (
              <motion.div
                className="h-4.5 w-4.5 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Chat Page ─── */
export default function ChatPage() {
  const { activeConversation, activeConversationId, addMessage } = useChat();
  const [input, setInput] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async () => {
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
      const response = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversation_id: activeConversationId,
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMessage);
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please make sure the backend is running on http://localhost:8000",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, activeConversationId]);

  const handleActionCard = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 py-3.5"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[14px] font-semibold text-foreground/80">
              AI Lawyer {activeConversation?.title ? `— ${activeConversation.title}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative rounded-full p-2 text-muted-foreground/60 hover:bg-secondary hover:text-primary transition-all"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </motion.button>
          <Avatar className="h-8 w-8 cursor-pointer border-2 border-primary/10 transition-all hover:border-primary/30 hover:scale-105">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              S
            </AvatarFallback>
          </Avatar>
        </div>
      </motion.header>

      {/* ─── Main Content ─── */}
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          /* ─── Empty State ─── */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-1 flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-2xl">
              {/* Logo + Greeting */}
              <motion.div
                className="mb-10 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image src="/logo.png" alt="JurisGPT" width={32} height={32} />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  <span className="text-primary">{greeting},</span>{" "}
                  <span className="text-foreground">Shankar</span>
                </h1>
                <motion.p
                  className="text-lg text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your AI legal assistant — ask questions, upload documents, get instant guidance
                </motion.p>
              </motion.div>

              {/* Action Cards */}
              <motion.div
                className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                }}
              >
                {actionCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ y: -3, transition: { type: "spring", stiffness: 300 } }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleActionCard(card.prompt)}
                      className="group flex flex-col items-start rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-4.5 w-4.5 text-primary/70 group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="mb-1 text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                        {card.description}
                      </p>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Suggested Prompts */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2.5 px-1">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInput(prompt)}
                      className="rounded-full border border-border/50 bg-card px-3.5 py-1.5 text-[12px] text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Security */}
              <motion.div
                className="mt-4 flex items-center justify-center gap-2 text-[12px] text-muted-foreground/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>All conversations are confidential and encrypted end-to-end</span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ─── Conversation View ─── */
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Messages */}
            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto scroll-smooth"
            >
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {/* Conversation start marker */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 py-4"
                >
                  <div className="h-px flex-1 bg-border/40" />
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground/60">
                    <Sparkles className="h-3 w-3" />
                    Conversation started
                  </div>
                  <div className="h-px flex-1 bg-border/40" />
                </motion.div>

                {messages.map((message, i) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLatest={i === messages.length - 1}
                  />
                ))}

                <AnimatePresence>
                  {isLoading && <TypingIndicator />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border/40 bg-background/60 backdrop-blur-xl px-4 py-3">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  compact
                />
                <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/40">
                  <ShieldCheck className="h-3 w-3" />
                  <span>JurisGPT can make mistakes. Verify important legal information with a lawyer.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
