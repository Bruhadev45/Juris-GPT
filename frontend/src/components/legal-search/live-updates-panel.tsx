"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Radio,
  RefreshCw,
  Scale,
  Newspaper,
  ExternalLink,
  Filter,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POLL_INTERVAL_MS = 60_000; // 60 seconds

export interface LiveUpdateItem {
  id: string;
  type: "judgment" | "news";
  title: string;
  summary: string;
  source: string;
  published_at: string;
  url?: string;
  category?: string;
  court?: string;
  citation?: string;
  tags?: string[];
}

interface LiveUpdatesResponse {
  items: LiveUpdateItem[];
  total: number;
  fetched_at: string;
  sources: string[];
}

type FeedFilter = "all" | "judgments" | "news";

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}

export function LiveUpdatesPanel({
  className,
  maxItems = 12,
}: {
  className?: string;
  maxItems?: number;
}) {
  const [items, setItems] = useState<LiveUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const [_tick, setTick] = useState(0); // forces re-render of "X ago" labels

  const fetchUpdates = useCallback(
    async (silent = false) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!silent) setLoading(true);
      try {
        const types =
          filter === "all"
            ? ""
            : filter === "judgments"
            ? "&types=judgments"
            : "&types=news";
        const res = await fetch(
          `${API_BASE}/api/legal/live-updates?limit=${maxItems * 2}${types}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LiveUpdatesResponse = await res.json();
        if (controller.signal.aborted) return;

        // Track which IDs are new since last fetch
        const newlySeen = data.items.filter(
          (item) => !seenIdsRef.current.has(item.id)
        );
        if (seenIdsRef.current.size > 0) {
          setNewCount((prev) => prev + newlySeen.length);
        }
        for (const item of data.items) seenIdsRef.current.add(item.id);

        setItems(data.items.slice(0, maxItems));
        setLastFetched(new Date(data.fetched_at));
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!silent) {
          setError(err instanceof Error ? err.message : "Failed to fetch updates");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filter, maxItems]
  );

  // Initial fetch + polling
  useEffect(() => {
    fetchUpdates(false);
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchUpdates(true);
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchUpdates, autoRefresh]);

  // Tick "X ago" label every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setNewCount(0);
    fetchUpdates(false);
  };

  return (
    <Card className={cn("shadow-sm border-border", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border bg-card/40">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio
                className={cn(
                  "h-4 w-4",
                  autoRefresh ? "text-rose-600" : "text-muted-foreground"
                )}
              />
              {autoRefresh && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
              )}
              {autoRefresh && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-600" />
              )}
            </div>
            <span className="text-sm font-semibold">Live Legal Feed</span>
            {newCount > 0 && (
              <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-1.5 h-4">
                {newCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {lastFetched && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                {timeAgo(lastFetched.toISOString())}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh((v) => !v)}
              title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
              className="h-7 px-2 text-xs"
            >
              {autoRefresh ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="h-7 w-7 p-0"
              title="Refresh now"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-border/50 bg-muted/20">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {(
            [
              { id: "all", label: "All" },
              { id: "judgments", label: "Judgments" },
              { id: "news", label: "News" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full transition-colors",
                filter === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
          {error && items.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              <p>Couldn&rsquo;t fetch live updates.</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}

          {loading && items.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading live updates…
            </div>
          )}

          {items.length === 0 && !loading && !error && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No updates available.
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              className="px-5 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "mt-0.5 flex-shrink-0 p-1.5 rounded-md",
                    item.type === "judgment"
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : "bg-amber-50 dark:bg-amber-950/30"
                  )}
                >
                  {item.type === "judgment" ? (
                    <Scale className="h-3 w-3 text-blue-700 dark:text-blue-400" />
                  ) : (
                    <Newspaper className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-tight mb-0.5 line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5 leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(item.published_at)}
                    </span>
                    <span>·</span>
                    <span className="font-medium">{item.source}</span>
                    {item.citation && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{item.citation}</span>
                      </>
                    )}
                    {item.category && (
                      <>
                        <span>·</span>
                        <Badge
                          variant="outline"
                          className="h-4 text-[9px] px-1 py-0"
                        >
                          {item.category}
                        </Badge>
                      </>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-primary hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Auto-refreshes every 60s · Curated Indian legal sources</span>
          {lastFetched && (
            <span className="font-mono">
              {lastFetched.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
