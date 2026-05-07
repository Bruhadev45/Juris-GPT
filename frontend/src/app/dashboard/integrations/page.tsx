"use client";

import { useEffect, useState } from "react";
import {
  Puzzle,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { integrationsApi } from "@/lib/api";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "connected" | "disconnected" | "pending" | "error";
  icon?: string;
  url?: string;
  last_sync?: string;
}

const INTEGRATION_ICONS: Record<string, string> = {
  digilocker: "/integrations/digilocker.svg",
  google: "/integrations/google.svg",
  slack: "/integrations/slack.svg",
  mca: "/integrations/mca.svg",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "connected":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    case "disconnected":
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
          <XCircle className="h-3 w-3 mr-1" />
          Not Connected
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      );
    case "error":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "Payment": "border-l-green-500",
    "Government": "border-l-blue-500",
    "Communication": "border-l-purple-500",
    "Storage": "border-l-orange-500",
    "Authentication": "border-l-cyan-500",
  };
  return colors[category] || "border-l-gray-500";
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await integrationsApi.getStatus();
      setIntegrations(result.integrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Puzzle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
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
              <Puzzle className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
                <p className="text-sm text-muted-foreground">
                  Connect JurisGPT with third-party services and government portals
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchIntegrations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Integrations</p>
                      <p className="text-2xl font-bold">{integrations.length}</p>
                    </div>
                    <Puzzle className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Connected</p>
                      <p className="text-2xl font-bold text-green-600">
                        {integrations.filter((i) => i.status === "connected").length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {integrations.filter((i) => i.status === "disconnected").length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-gray-500/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Categories */}
            {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryIntegrations.map((integration) => (
                    <Card
                      key={integration.id}
                      className={`border-l-4 ${getCategoryColor(category)}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              {integration.icon ? (
                                <img
                                  src={integration.icon}
                                  alt={integration.name}
                                  className="w-8 h-8"
                                />
                              ) : (
                                <Puzzle className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{integration.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {integration.description}
                              </p>
                              {integration.last_sync && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Last synced: {new Date(integration.last_sync).toLocaleString("en-IN")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>{getStatusBadge(integration.status)}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          {integration.status === "connected" ? (
                            <>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" className="flex-1">
                              Connect
                              {integration.url && <ExternalLink className="h-3 w-3 ml-2" />}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {integrations.length === 0 && !error && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Puzzle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Integrations Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Third-party integrations will be available soon. Check back later.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
