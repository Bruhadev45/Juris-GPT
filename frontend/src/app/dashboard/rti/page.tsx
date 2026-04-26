"use client";

import { useEffect, useState } from "react";
import {
  FileQuestion,
  Loader2,
  AlertCircle,
  Download,
  Send,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rtiApi } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  description: string;
}

interface RTIApplication {
  id: string;
  department: string;
  subject: string;
  status: string;
  created_at: string;
  content?: string;
}

export default function RTIPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applications, setApplications] = useState<RTIApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Form state
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [informationRequested, setInformationRequested] = useState("");
  const [purpose, setPurpose] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptRes, appRes] = await Promise.all([
          rtiApi.getDepartments(),
          rtiApi.list(),
        ]);
        setDepartments(deptRes.departments || []);
        setApplications(appRes.applications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!department || !subject || !informationRequested || !applicantName || !applicantAddress) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setGenerating(true);

      const result = await rtiApi.generate({
        department,
        subject,
        information_requested: informationRequested,
        purpose: purpose || undefined,
        applicant_name: applicantName,
        applicant_address: applicantAddress,
        applicant_phone: applicantPhone || undefined,
        applicant_email: applicantEmail || undefined,
      });

      setGeneratedContent(result.content);
      setSuccess("RTI application generated successfully!");

      // Refresh applications list
      const appRes = await rtiApi.list();
      setApplications(appRes.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setDepartment("");
    setSubject("");
    setInformationRequested("");
    setPurpose("");
    setApplicantName("");
    setApplicantAddress("");
    setApplicantPhone("");
    setApplicantEmail("");
    setGeneratedContent(null);
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <FileQuestion className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">RTI Assistant</h1>
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
          <div className="flex items-center gap-3">
            <FileQuestion className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">RTI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Generate Right to Information applications for any government department
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-md p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Create RTI Application</CardTitle>
                <CardDescription>
                  Fill in the details below to generate an RTI application under the Right to Information Act, 2005
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Department and Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department *
                    </Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief subject of your RTI"
                    />
                  </div>
                </div>

                {/* Information Requested */}
                <div className="space-y-2">
                  <Label>Information Requested *</Label>
                  <Textarea
                    value={informationRequested}
                    onChange={(e) => setInformationRequested(e.target.value)}
                    placeholder="Describe the information you are seeking in detail..."
                    rows={4}
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label>Purpose (Optional)</Label>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Why do you need this information?"
                  />
                </div>

                {/* Applicant Details */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Applicant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address *
                      </Label>
                      <Textarea
                        value={applicantAddress}
                        onChange={(e) => setApplicantAddress(e.target.value)}
                        placeholder="Your complete postal address"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Generate RTI Application
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generated RTI Application
                  </CardTitle>
                  <CardDescription>Review and download your RTI application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download as PDF
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Previous Applications */}
            {applications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Applications</CardTitle>
                  <CardDescription>Your recently generated RTI applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium">{app.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.department} - {new Date(app.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
