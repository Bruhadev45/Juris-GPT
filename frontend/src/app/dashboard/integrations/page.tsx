"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Zap,
  Mail,
  FolderOpen,
  MessageSquare,
  Link2,
  CheckCircle,
  XCircle,
  Loader2,
  Plug,
  Globe,
  FileText,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { integrationsApi } from "@/lib/api";

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "available";
  category: string;
  last_sync?: string;
}

const iconMap: Record<string, React.ElementType> = {
  supabase: Database,
  openai: Zap,
  resend: Mail,
  "google drive": FolderOpen,
  slack: MessageSquare,
  stripe: Globe,
  github: FileText,
  auth0: Shield,
};

function getIcon(name: string) {
  const key = name.toLowerCase();
  for (const [match, Icon] of Object.entries(iconMap)) {
    if (key.includes(match)) return Icon;
  }
  return Plug;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const result = await integrationsApi.getStatus();
      setIntegrations(result.data || result.integrations || result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load integrations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        );
      case "available":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Available
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Disconnected
          </Badge>
        );
    }
  };

  const connected = integrations.filter(
    (i) => i.status?.toLowerCase() === "connected"
  );
  const notConnected = integrations.filter(
    (i) => i.status?.toLowerCase() !== "connected"
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading integrations...
            </p>
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
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                Integrations
              </h1>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {connected.length} of {integrations.length} connected
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            {/* Connected Integrations */}
            {connected.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Connected Integrations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connected.map((integration) => {
                    const Icon = getIcon(integration.name);
                    return (
                      <Card
                        key={integration.id}
                        className="shadow-sm border-border hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {integration.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {integration.description}
                                </p>
                              </div>
                            </div>
                            {statusBadge(integration.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {integration.category}
                              </Badge>
                              {integration.last_sync && (
                                <span className="text-xs text-muted-foreground">
                                  Last sync:{" "}
                                  {new Date(
                                    integration.last_sync
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              Configure
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available / Disconnected Integrations */}
            {notConnected.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Available Integrations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notConnected.map((integration) => {
                    const Icon = getIcon(integration.name);
                    return (
                      <Card
                        key={integration.id}
                        className="shadow-sm border-border hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {integration.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {integration.description}
                                </p>
                              </div>
                            </div>
                            {statusBadge(integration.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {integration.category}
                            </Badge>
                            <Button
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Link2 className="h-4 w-4" />
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {integrations.length === 0 && !error && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Plug className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No integrations found.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
