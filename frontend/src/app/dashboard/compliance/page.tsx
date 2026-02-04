"use client";

import { CheckCircle, AlertTriangle, Clock, TrendingUp, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const complianceItems = [
  {
    id: "1",
    title: "Companies Act Compliance",
    status: "Compliant",
    lastChecked: "2025-02-01",
    nextDue: "2025-03-01",
    progress: 100,
  },
  {
    id: "2",
    title: "Labor Law Compliance",
    status: "Review Required",
    lastChecked: "2025-01-15",
    nextDue: "2025-02-15",
    progress: 75,
  },
  {
    id: "3",
    title: "Tax Compliance",
    status: "Compliant",
    lastChecked: "2025-01-30",
    nextDue: "2025-02-28",
    progress: 100,
  },
  {
    id: "4",
    title: "Data Protection Compliance",
    status: "Pending",
    lastChecked: "2024-12-20",
    nextDue: "2025-02-20",
    progress: 45,
  },
];

export default function CompliancePage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Compliant":
        return "bg-green-100 text-green-800 border-green-200";
      case "Review Required":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Compliant":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Review Required":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const overallCompliance = Math.round(
    complianceItems.reduce((sum, item) => sum + item.progress, 0) / complianceItems.length
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Compliance View</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Overall Compliance</p>
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{overallCompliance}%</p>
                  <Progress value={overallCompliance} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Compliant</p>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {complianceItems.filter((item) => item.status === "Compliant").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">of {complianceItems.length} areas</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Review Required</p>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {complianceItems.filter((item) => item.status === "Review Required").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">needs attention</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {complianceItems.filter((item) => item.status === "Pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">action needed</p>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Items */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Compliance Areas</h2>
              {complianceItems.map((item) => (
                <Card key={item.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(item.status)}
                          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Compliance Progress</span>
                            <span className="text-foreground font-medium">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Last Checked:</span> {item.lastChecked}
                          </div>
                          <div>
                            <span className="font-medium">Next Due:</span> {item.nextDue}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">View Details</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
