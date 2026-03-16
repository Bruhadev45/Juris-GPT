"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Bell, Shield, Palette, Loader2, Save, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { settingsApi } from "@/lib/api";

interface ProfileData {
  name: string;
  email: string;
  company: string;
  role: string;
}

interface NotificationData {
  email_notifications: boolean;
  compliance_alerts: boolean;
  document_updates: boolean;
  weekly_digest: boolean;
}

interface AppearanceData {
  theme: "light";
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    company: "",
    role: "",
  });

  const [notifications, setNotifications] = useState<NotificationData>({
    email_notifications: true,
    compliance_alerts: true,
    document_updates: true,
    weekly_digest: false,
  });

  const [appearance, setAppearance] = useState<AppearanceData>({
    theme: "light",
    language: "en",
    timezone: "Asia/Kolkata",
  });

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await settingsApi.get();
      if (data.profile) setProfile(data.profile);
      if (data.notifications) setNotifications(data.notifications);
      if (data.appearance) setAppearance(data.appearance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showSaved = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2500);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError(null);
      await settingsApi.updateProfile(profile);
      showSaved("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      setError(null);
      await settingsApi.updateNotifications(notifications);
      showSaved("notifications");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save notifications"
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveAppearance = async () => {
    try {
      setSavingAppearance(true);
      setError(null);
      await settingsApi.updateAppearance(appearance);
      showSaved("appearance");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save appearance"
      );
    } finally {
      setSavingAppearance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage profile, preferences, notifications, security, and appearance</p>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto">
            {/* Error Banner */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={profile.company}
                          onChange={(e) =>
                            setProfile({ ...profile, company: e.target.value })
                          }
                          placeholder="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={profile.role}
                          onChange={(e) =>
                            setProfile({ ...profile, role: e.target.value })
                          }
                          placeholder="Your role"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : savedSection === "profile" ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6 mt-6">
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      {
                        key: "email_notifications" as const,
                        label: "Email Notifications",
                        desc: "Receive email updates about your account activity",
                      },
                      {
                        key: "compliance_alerts" as const,
                        label: "Compliance Alerts",
                        desc: "Get notified about upcoming compliance deadlines",
                      },
                      {
                        key: "document_updates" as const,
                        label: "Document Updates",
                        desc: "Notify when documents are reviewed or updated",
                      },
                      {
                        key: "weekly_digest" as const,
                        label: "Weekly Digest",
                        desc: "Receive a weekly summary of activity",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            {item.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifications[item.key]}
                          onClick={() =>
                            setNotifications({
                              ...notifications,
                              [item.key]: !notifications[item.key],
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[item.key]
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[item.key]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleSaveNotifications}
                        disabled={savingNotifications}
                      >
                        {savingNotifications ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : savedSection === "notifications" ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6 mt-6">
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" placeholder="Enter current password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" placeholder="Enter new password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                    </div>
                    <div className="pt-2">
                      <Button>Update Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6 mt-6">
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Language Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        value={appearance.language}
                        onChange={(e) =>
                          setAppearance({
                            ...appearance,
                            language: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="mr">Marathi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>

                    {/* Timezone Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={appearance.timezone}
                        onChange={(e) =>
                          setAppearance({
                            ...appearance,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">EST (UTC-5)</option>
                        <option value="America/Los_Angeles">PST (UTC-8)</option>
                        <option value="Europe/London">GMT (UTC+0)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleSaveAppearance}
                        disabled={savingAppearance}
                      >
                        {savingAppearance ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : savedSection === "appearance" ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Appearance
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
