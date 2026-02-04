"use client";

import { useState } from "react";
import { Search, Plus, Filter, FileText, Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const cases = [
  {
    id: "1",
    title: "Nova Systems Corp vs. TechSoft",
    type: "Contract Dispute",
    status: "Active",
    client: "Nova Systems Corp",
    date: "2025-01-15",
    priority: "High",
  },
  {
    id: "2",
    title: "Confidentiality Agreement Review",
    type: "Document Review",
    status: "In Review",
    client: "ABC Industries",
    date: "2025-02-01",
    priority: "Medium",
  },
  {
    id: "3",
    title: "Employment Contract Draft",
    type: "Drafting",
    status: "Draft",
    client: "XYZ Corp",
    date: "2025-02-03",
    priority: "Low",
  },
];

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Cases</h1>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search and Filters */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-border"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cases List */}
            <div className="grid gap-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">{case_.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>{case_.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{case_.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{case_.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                        <Badge className={getPriorityColor(case_.priority)}>{case_.priority}</Badge>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {cases.length === 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No cases found</p>
                  <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Your First Case
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
