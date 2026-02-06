"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Mail,
  Briefcase,
  Loader2,
  Trash2,
  Users,
  Building2,
  UserCheck,
  X,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { teamApi, type TeamMember } from "@/lib/api";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
  });

  const fetchMembers = useCallback(async () => {
    try {
      setError(null);
      const result = await teamApi.list();
      setMembers(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load team members"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      setError("Name and email are required.");
      return;
    }
    try {
      setAdding(true);
      setError(null);
      const result = await teamApi.add(newMember);
      const added = result.member || result.data || result;
      setMembers((prev) => [...prev, added]);
      setNewMember({ name: "", email: "", role: "", department: "" });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) {
      return;
    }
    try {
      setRemovingIds((prev) => new Set(prev).add(id));
      setError(null);
      await teamApi.remove(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const statusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Inactive
          </Badge>
        );
      case "invited":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Invited
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const activeCount = members.filter(
    (m) => m.status?.toLowerCase() === "active"
  ).length;
  const departments = new Set(members.map((m) => m.department).filter(Boolean));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading team members...
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
              <Users className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Team</h1>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              {showAddForm ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Members
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {members.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-foreground">
                        {activeCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Departments
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {departments.size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Member Form (inline) */}
            {showAddForm && (
              <Card className="shadow-sm border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add New Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Name *
                        </label>
                        <Input
                          value={newMember.name}
                          onChange={(e) =>
                            setNewMember({ ...newMember, name: e.target.value })
                          }
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={newMember.email}
                          onChange={(e) =>
                            setNewMember({
                              ...newMember,
                              email: e.target.value,
                            })
                          }
                          placeholder="email@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Role
                        </label>
                        <Input
                          value={newMember.role}
                          onChange={(e) =>
                            setNewMember({ ...newMember, role: e.target.value })
                          }
                          placeholder="e.g. Legal Associate"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Department
                        </label>
                        <Input
                          value={newMember.department}
                          onChange={(e) =>
                            setNewMember({
                              ...newMember,
                              department: e.target.value,
                            })
                          }
                          placeholder="e.g. Corporate Law"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={adding}>
                        {adding ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Team Members
              </h2>
              {members.length === 0 ? (
                <Card className="shadow-sm border-border">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No team members yet. Click &quot;Add Member&quot; to get
                        started.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <Card
                      key={member.id}
                      className="shadow-sm border-border hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {member.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {member.role}
                              </p>
                            </div>
                          </div>
                          {statusBadge(member.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.department && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4 flex-shrink-0" />
                              <span>{member.department}</span>
                            </div>
                          )}
                          {member.joined_at && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>
                                Joined{" "}
                                {new Date(
                                  member.joined_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={removingIds.has(member.id)}
                            onClick={() =>
                              handleRemove(member.id, member.name)
                            }
                          >
                            {removingIds.has(member.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
