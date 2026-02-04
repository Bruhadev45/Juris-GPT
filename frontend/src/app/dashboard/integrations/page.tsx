"use client";

import { Link2, CheckCircle, XCircle, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const integrations = [
  {
    id: "1",
    name: "Supabase",
    description: "Database and authentication",
    status: "Connected",
    category: "Database",
    icon: "🔷",
  },
  {
    id: "2",
    name: "OpenAI",
    description: "AI document generation",
    status: "Connected",
    category: "AI",
    icon: "🤖",
  },
  {
    id: "3",
    name: "Resend",
    description: "Email notifications",
    status: "Connected",
    category: "Communication",
    icon: "📧",
  },
  {
    id: "4",
    name: "Google Drive",
    description: "Document storage",
    status: "Not Connected",
    category: "Storage",
    icon: "📁",
  },
  {
    id: "5",
    name: "Slack",
    description: "Team notifications",
    status: "Not Connected",
    category: "Communication",
    icon: "💬",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Connected Integrations */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Connected Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations
                  .filter((int) => int.status === "Connected")
                  .map((integration) => (
                    <Card key={integration.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{integration.icon}</div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <CardDescription>{integration.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{integration.category}</Badge>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Available Integrations */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Available Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations
                  .filter((int) => int.status === "Not Connected")
                  .map((integration) => (
                    <Card key={integration.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{integration.icon}</div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <CardDescription>{integration.description}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Connected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{integration.category}</Badge>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
