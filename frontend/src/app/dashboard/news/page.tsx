"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper, Loader2, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { newsApi } from "@/lib/api";

const CATEGORIES = [
  "All",
  "Supreme Court",
  "High Courts",
  "Legislative Updates",
  "SEBI",
  "RBI",
  "MCA",
  "Tax",
  "Data Privacy",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Supreme Court": "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300",
  "High Courts": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
  "Legislative Updates": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  SEBI: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300",
  RBI: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300",
  MCA: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300",
  Tax: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Data Privacy": "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300";
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  published_at: string;
  tags?: string[];
  url?: string;
}

// Sample data for when the API is not available
const SAMPLE_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Supreme Court Upholds Constitutional Validity of GST Amendments",
    summary: "In a landmark ruling, the Supreme Court of India has upheld the constitutional validity of recent amendments to the Goods and Services Tax Act. The five-judge constitution bench delivered a unanimous verdict, addressing concerns raised by multiple petitioners regarding the retrospective applicability of certain provisions.",
    category: "Supreme Court",
    source: "LiveLaw",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ["GST", "Constitutional Law", "Taxation"],
  },
  {
    id: "2",
    title: "SEBI Introduces New Framework for ESG Rating Providers",
    summary: "The Securities and Exchange Board of India has released a comprehensive regulatory framework for Environmental, Social, and Governance rating providers. The new guidelines mandate registration, transparency in methodology, and conflict of interest management for all ESG rating agencies operating in India.",
    category: "SEBI",
    source: "Economic Times",
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tags: ["ESG", "Securities", "Regulation"],
  },
  {
    id: "3",
    title: "Delhi High Court Sets New Precedent on Digital Privacy Rights",
    summary: "The Delhi High Court has delivered a significant judgment expanding the scope of digital privacy rights under Article 21 of the Constitution. The ruling establishes stricter requirements for government surveillance and mandates judicial oversight for data collection by enforcement agencies.",
    category: "High Courts",
    source: "Bar & Bench",
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ["Privacy", "Digital Rights", "Article 21"],
  },
  {
    id: "4",
    title: "RBI Revises Guidelines on Digital Lending and Fintech Regulations",
    summary: "The Reserve Bank of India has announced revised guidelines for digital lending platforms and fintech companies. The new framework addresses consumer protection, data privacy, and fair lending practices, requiring all digital lenders to obtain explicit consent before data collection.",
    category: "RBI",
    source: "Mint",
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    tags: ["Fintech", "Digital Lending", "Banking"],
  },
  {
    id: "5",
    title: "Parliament Passes Amendments to Companies Act, 2013",
    summary: "The Indian Parliament has passed significant amendments to the Companies Act, 2013, aimed at improving ease of doing business and corporate governance. Key changes include simplified compliance requirements for startups, revised thresholds for CSR obligations, and enhanced whistleblower protections.",
    category: "Legislative Updates",
    source: "The Hindu",
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Companies Act", "Corporate Governance", "Startups"],
  },
  {
    id: "6",
    title: "MCA Mandates Enhanced Corporate Social Responsibility Reporting",
    summary: "The Ministry of Corporate Affairs has issued new directives requiring enhanced CSR reporting for companies meeting specified thresholds. The updated reporting framework includes impact assessment mandates and standardized disclosure templates aligned with international sustainability reporting standards.",
    category: "MCA",
    source: "Business Standard",
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    tags: ["CSR", "Reporting", "Corporate Affairs"],
  },
  {
    id: "7",
    title: "Direct Tax Code Reforms: Key Changes in Income Tax Rules",
    summary: "The Central Board of Direct Taxes has announced major reforms under the direct tax code, including simplified tax slabs for individuals, revised TDS rates for professionals, and new provisions for taxation of cryptocurrency transactions. The changes are effective from the upcoming financial year.",
    category: "Tax",
    source: "Financial Express",
    published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    tags: ["Income Tax", "Direct Tax", "Crypto"],
  },
  {
    id: "8",
    title: "India's Data Protection Board Issues First Enforcement Orders",
    summary: "The Data Protection Board of India, established under the Digital Personal Data Protection Act, 2023, has issued its first enforcement orders against companies found violating data protection norms. The orders mandate corrective actions and impose significant penalties for non-compliance.",
    category: "Data Privacy",
    source: "Inc42",
    published_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    tags: ["DPDP Act", "Data Protection", "Enforcement"],
  },
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PAGE_SIZE = 10;

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNews = useCallback(async (category: string, currentOffset: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const categoryParam = category === "All" ? undefined : category;
      const resp = await newsApi.list({
        category: categoryParam,
        limit: PAGE_SIZE,
        offset: currentOffset,
      });

      const items: NewsItem[] = resp.data || resp.news || resp.items || resp;
      const total: number = resp.total ?? items.length;

      if (append) {
        setNews((prev) => [...prev, ...items]);
      } else {
        setNews(items);
      }
      setHasMore(currentOffset + items.length < total);
    } catch {
      // Fallback to sample data
      const filtered =
        category === "All"
          ? SAMPLE_NEWS
          : SAMPLE_NEWS.filter((n) => n.category === category);
      const slice = filtered.slice(currentOffset, currentOffset + PAGE_SIZE);
      if (append) {
        setNews((prev) => [...prev, ...slice]);
      } else {
        setNews(slice);
      }
      setHasMore(currentOffset + slice.length < filtered.length);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    fetchNews(activeCategory, 0, false);
  }, [activeCategory, fetchNews]);

  function handleLoadMore() {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchNews(activeCategory, newOffset, true);
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Legal News</h1>
                <p className="text-sm text-muted-foreground">
                  Latest updates from Indian courts and regulators
                </p>
              </div>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading legal news...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Legal News</h1>
                <p className="text-sm text-muted-foreground">
                  Latest updates from Indian courts and regulators
                </p>
              </div>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load news</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => fetchNews(activeCategory, 0, false)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Newspaper className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Legal News</h1>
              <p className="text-sm text-muted-foreground">
                Latest updates from Indian courts and regulators
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* News List */}
            {news.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No news articles found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try selecting a different category
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {news.map((item) => (
                  <Card
                    key={item.id}
                    className="shadow-sm border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-3">
                        {/* Header: Category + Time */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeAgo(item.published_at)}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground leading-snug">
                          {item.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>

                        {/* Footer: Source + Tags */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Source:</span>
                            <span className="font-medium text-foreground">{item.source}</span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-2 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && news.length > 0 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
