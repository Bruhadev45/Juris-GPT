"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Scale, Loader2, BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { chatApi, ChatMessageResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatMessageResponse["sources"];
  suggestions?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ category: string; questions: string[] }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.getSuggestions().then((data) => {
      setSuggestions(data.suggestions);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(text.trim());
      const assistantMsg: Message = {
        role: "assistant",
        content: response.message,
        sources: response.sources,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Scale className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">NyayaSetu Legal Assistant</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Link href="/agreements/new">
            <Button size="sm">New Agreement</Button>
          </Link>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Ask me anything about Indian law</h2>
              <p className="text-muted-foreground mb-8">
                I can help with company formation, founder agreements, compliance, and more.
              </p>

              {suggestions.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                  {suggestions.map((cat) => (
                    <Card key={cat.category} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">{cat.category}</h3>
                      </div>
                      <div className="space-y-2">
                        {cat.questions.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="block w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-secondary px-2 py-1.5 rounded transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs font-medium mb-2 opacity-70">Sources:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {s.title || s.source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs font-medium mb-2 opacity-70">Follow-up questions:</p>
                    <div className="space-y-1">
                      {msg.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => sendMessage(s)}
                          className="block text-xs text-primary hover:underline"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-6 py-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Indian company law, compliance, agreements..."
            className="flex-1 px-4 py-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
