"use client";

import { useState } from "react";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  CheckCircle,
  Radio,
  Home,
  Landmark,
  HeartPulse,
  GraduationCap,
  Train,
  Building2,
  TreePine,
  Scale,
  ShoppingCart,
  Briefcase,
  Leaf,
  Microscope,
  Shield,
  Wheat,
  Wifi,
  Tv,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { rtiApi } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  icon: React.ReactNode;
  pioAddress: string;
}

const DEPARTMENTS: Department[] = [
  { id: "info-broadcasting", name: "Information & Broadcasting", icon: <Tv className="h-6 w-6" />, pioAddress: "PIO, Ministry of Information & Broadcasting, Shastri Bhawan, New Delhi - 110001" },
  { id: "home-affairs", name: "Home Affairs", icon: <Home className="h-6 w-6" />, pioAddress: "PIO, Ministry of Home Affairs, North Block, New Delhi - 110001" },
  { id: "finance", name: "Finance", icon: <Landmark className="h-6 w-6" />, pioAddress: "PIO, Ministry of Finance, North Block, New Delhi - 110001" },
  { id: "health", name: "Health & Family Welfare", icon: <HeartPulse className="h-6 w-6" />, pioAddress: "PIO, Ministry of Health & Family Welfare, Nirman Bhawan, New Delhi - 110011" },
  { id: "education", name: "Education", icon: <GraduationCap className="h-6 w-6" />, pioAddress: "PIO, Ministry of Education, Shastri Bhawan, New Delhi - 110001" },
  { id: "railways", name: "Railways", icon: <Train className="h-6 w-6" />, pioAddress: "PIO, Ministry of Railways, Rail Bhawan, New Delhi - 110001" },
  { id: "urban-dev", name: "Urban Development", icon: <Building2 className="h-6 w-6" />, pioAddress: "PIO, Ministry of Urban Development, Nirman Bhawan, New Delhi - 110011" },
  { id: "rural-dev", name: "Rural Development", icon: <TreePine className="h-6 w-6" />, pioAddress: "PIO, Ministry of Rural Development, Krishi Bhawan, New Delhi - 110001" },
  { id: "law-justice", name: "Law & Justice", icon: <Scale className="h-6 w-6" />, pioAddress: "PIO, Ministry of Law & Justice, Shastri Bhawan, New Delhi - 110001" },
  { id: "commerce", name: "Commerce & Industry", icon: <ShoppingCart className="h-6 w-6" />, pioAddress: "PIO, Ministry of Commerce & Industry, Udyog Bhawan, New Delhi - 110011" },
  { id: "labour", name: "Labour & Employment", icon: <Briefcase className="h-6 w-6" />, pioAddress: "PIO, Ministry of Labour & Employment, Shram Shakti Bhawan, New Delhi - 110001" },
  { id: "environment", name: "Environment", icon: <Leaf className="h-6 w-6" />, pioAddress: "PIO, Ministry of Environment, Forest & Climate Change, Indira Paryavaran Bhawan, New Delhi - 110003" },
  { id: "science-tech", name: "Science & Technology", icon: <Microscope className="h-6 w-6" />, pioAddress: "PIO, Ministry of Science & Technology, Technology Bhawan, New Delhi - 110016" },
  { id: "defence", name: "Defence", icon: <Shield className="h-6 w-6" />, pioAddress: "PIO, Ministry of Defence, South Block, New Delhi - 110011" },
  { id: "agriculture", name: "Agriculture", icon: <Wheat className="h-6 w-6" />, pioAddress: "PIO, Ministry of Agriculture & Farmers Welfare, Krishi Bhawan, New Delhi - 110001" },
  { id: "telecom", name: "Telecommunications", icon: <Wifi className="h-6 w-6" />, pioAddress: "PIO, Department of Telecommunications, Sanchar Bhawan, New Delhi - 110001" },
];

interface RTIForm {
  department: string;
  subject: string;
  informationRequested: string;
  purpose: string;
  fullName: string;
  address: string;
  phone: string;
  email: string;
  pioAddress: string;
}

const INITIAL_FORM: RTIForm = {
  department: "",
  subject: "",
  informationRequested: "",
  purpose: "",
  fullName: "",
  address: "",
  phone: "",
  email: "",
  pioAddress: "",
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i + 1 < current
                ? "bg-primary text-primary-foreground"
                : i + 1 === current
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i + 1 < current ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
      <span className="ml-3 text-sm text-muted-foreground">
        Step {current} of {total}
      </span>
    </div>
  );
}

export default function RTIPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RTIForm>(INITIAL_FORM);
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDept = DEPARTMENTS.find((d) => d.id === form.department);

  function updateForm(partial: Partial<RTIForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function selectDepartment(deptId: string) {
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    updateForm({
      department: deptId,
      pioAddress: dept?.pioAddress || "",
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return !!form.department;
      case 2:
        return !!form.subject.trim() && !!form.informationRequested.trim();
      case 3:
        return !!form.fullName.trim() && !!form.address.trim();
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const resp = await rtiApi.generate({
        department: selectedDept?.name || form.department,
        subject: form.subject,
        information_requested: form.informationRequested,
        purpose: form.purpose || undefined,
        applicant_name: form.fullName,
        applicant_address: form.address,
        applicant_phone: form.phone || undefined,
        applicant_email: form.email || undefined,
      });
      setGeneratedText(
        resp.application ||
          resp.text ||
          resp.content ||
          generateLocalRTI()
      );
    } catch {
      // Fallback: generate locally if API fails
      setGeneratedText(generateLocalRTI());
    } finally {
      setGenerating(false);
    }
  }

  function generateLocalRTI(): string {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `RIGHT TO INFORMATION APPLICATION
Under Section 6(1) of the RTI Act, 2005

Date: ${today}

To,
The Public Information Officer,
${selectedDept?.name || form.department}
${form.pioAddress}

Subject: ${form.subject}

Dear Sir/Madam,

I, ${form.fullName}, am an Indian citizen and I am requesting the following information under the Right to Information Act, 2005:

INFORMATION REQUESTED:
${form.informationRequested}
${form.purpose ? `\nPURPOSE/REASON:\n${form.purpose}\n` : ""}
I am ready to pay the prescribed fees as required under the RTI Act, 2005.

I request that the above information be provided to me within 30 days as stipulated under Section 7(1) of the RTI Act, 2005.

If the information requested is held by or closely connected with the function of another public authority, I request that this application be transferred to the concerned authority under Section 6(3) of the RTI Act, 2005.

Applicant Details:
Name: ${form.fullName}
Address: ${form.address}${form.phone ? `\nPhone: ${form.phone}` : ""}${form.email ? `\nEmail: ${form.email}` : ""}

Thanking you,

${form.fullName}

Enclosure: IPO/DD of Rs. 10/- (RTI Application Fee)`;
  }

  function handleDownload() {
    if (!generatedText) return;
    const blob = new Blob([generatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RTI_Application_${form.subject.replace(/\s+/g, "_").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">RTI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Generate Right to Information applications
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Step indicator */}
            {!generatedText && (
              <Card>
                <CardContent className="p-4">
                  <StepIndicator current={step} total={4} />
                </CardContent>
              </Card>
            )}

            {/* Step 1: Select Department */}
            {step === 1 && !generatedText && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Department</CardTitle>
                  <CardDescription>
                    Choose the government department you want to file the RTI application with
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => selectDepartment(dept.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-md text-center ${
                          form.department === dept.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            form.department === dept.id
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {dept.icon}
                        </div>
                        <span className="text-sm font-medium text-foreground">{dept.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Provide Details */}
            {step === 2 && !generatedText && (
              <Card>
                <CardHeader>
                  <CardTitle>Provide Details</CardTitle>
                  <CardDescription>
                    Enter the subject and details of the information you are requesting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g., Details of road construction project in XYZ area"
                      value={form.subject}
                      onChange={(e) => updateForm({ subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Information Requested <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Describe in detail the information you are requesting. Be specific about dates, departments, and documents."
                      value={form.informationRequested}
                      onChange={(e) => updateForm({ informationRequested: e.target.value })}
                      className="min-h-[160px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose / Reason (optional)</Label>
                    <Textarea
                      placeholder="Why are you requesting this information? (optional)"
                      value={form.purpose}
                      onChange={(e) => updateForm({ purpose: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Applicant Info */}
            {step === 3 && !generatedText && (
              <Card>
                <CardHeader>
                  <CardTitle>Applicant Information</CardTitle>
                  <CardDescription>
                    Enter your personal details for the RTI application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) => updateForm({ fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Enter your full address"
                      value={form.address}
                      onChange={(e) => updateForm({ address: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        value={form.phone}
                        onChange={(e) => updateForm({ phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={form.email}
                        onChange={(e) => updateForm({ email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PIO Address (auto-filled)</Label>
                    <Textarea
                      value={form.pioAddress}
                      onChange={(e) => updateForm({ pioAddress: e.target.value })}
                      className="min-h-[60px] bg-muted/50"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Generate */}
            {step === 4 && !generatedText && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Generate</CardTitle>
                  <CardDescription>
                    Review your application details before generating the RTI application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p className="text-foreground flex items-center gap-2 mt-1">
                          {selectedDept?.icon}
                          {selectedDept?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Subject</p>
                        <p className="text-foreground mt-1">{form.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Information Requested</p>
                        <p className="text-foreground mt-1 whitespace-pre-wrap">{form.informationRequested}</p>
                      </div>
                      {form.purpose && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                          <p className="text-foreground mt-1">{form.purpose}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Applicant Name</p>
                        <p className="text-foreground mt-1">{form.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                        <p className="text-foreground mt-1 whitespace-pre-wrap">{form.address}</p>
                      </div>
                      {form.phone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="text-foreground mt-1">{form.phone}</p>
                        </div>
                      )}
                      {form.email && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="text-foreground mt-1">{form.email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">PIO Address</p>
                        <p className="text-foreground mt-1 whitespace-pre-wrap">{form.pioAddress}</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    size="lg"
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating RTI Application...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate RTI Application
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Generated RTI Application */}
            {generatedText && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle>RTI Application Generated</CardTitle>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      Ready
                    </Badge>
                  </div>
                  <CardDescription>
                    Your RTI application has been generated. Review and download below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 rounded-lg bg-muted/50 border font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {generatedText}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Application
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedText(null);
                        setStep(1);
                        setForm(INITIAL_FORM);
                      }}
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Create New Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {!generatedText && (
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {step < 4 && (
                  <Button
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
