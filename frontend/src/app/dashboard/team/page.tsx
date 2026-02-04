"use client";

import { UserPlus, Mail, Phone, Briefcase, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  {
    id: "1",
    name: "Anna K.",
    role: "Senior Legal Associate",
    email: "anna@legalwork.com",
    phone: "+91 98765 43210",
    department: "Corporate Law",
    avatar: "AK",
  },
  {
    id: "2",
    name: "John D.",
    role: "Legal Analyst",
    email: "john@legalwork.com",
    phone: "+91 98765 43211",
    department: "Compliance",
    avatar: "JD",
  },
  {
    id: "3",
    name: "Sarah M.",
    role: "Document Reviewer",
    email: "sarah@legalwork.com",
    phone: "+91 98765 43212",
    department: "Review",
    avatar: "SM",
  },
];

export default function TeamPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Team</h1>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-foreground">{teamMembers.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-foreground">{teamMembers.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Departments</p>
                  <p className="text-3xl font-bold text-foreground">3</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">This Month</p>
                  <p className="text-3xl font-bold text-foreground">+2</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{member.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{member.department}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
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
