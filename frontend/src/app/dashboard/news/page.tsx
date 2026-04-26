"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Newspaper,
  Loader2,
  AlertCircle,
  Calendar,
  Tag,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { newsApi } from "@/lib/api";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  url?: string;
  published_at: string;
  image_url?: string;
}

const CATEGORIES = ["All", "Supreme Court", "High Courts", "Legislation", "Corporate", "Tax", "Criminal"];

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "Supreme Court": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    "High Courts": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    "Legislation": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    "Corporate": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    "Tax": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    "Criminal": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchNews = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await newsApi.list({
        category: activeCategory !== "All" ? activeCategory : undefined,
        limit: 20,
      });
      setArticles(result.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  if (loading && articles.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Legal News</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Legal News</h1>
                <p className="text-sm text-muted-foreground">
                  Stay updated with the latest legal developments in India
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNews(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Category Filter */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="flex-wrap h-auto gap-1">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* News Articles */}
            {articles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Newspaper className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No News Available</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeCategory === "All"
                      ? "No news articles found. Check back later for updates."
                      : `No news found in the "${activeCategory}" category.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Featured Article */}
                {articles.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="md:flex">
                      {articles[0].image_url && (
                        <div className="md:w-1/3 h-48 md:h-auto bg-muted">
                          <img
                            src={articles[0].image_url}
                            alt={articles[0].title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(articles[0].category)}>
                            {articles[0].category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(articles[0].published_at)}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          {articles[0].title}
                        </h2>
                        <p className="text-muted-foreground mb-4">{articles[0].summary}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{articles[0].source}</span>
                          {articles[0].url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={articles[0].url} target="_blank" rel="noopener noreferrer">
                                Read More
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Other Articles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.slice(1).map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(article.category)}>
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(article.published_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{article.source}</span>
                          {article.url && (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-sm hover:underline flex items-center gap-1"
                            >
                              Read
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
