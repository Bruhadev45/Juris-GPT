"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { companiesApi, mattersApi } from "@/lib/api";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  state: z.string().min(1, "State is required"),
  authorized_capital: z.number().min(0.01, "Authorized capital must be greater than 0"),
});

const founderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
  equity_percentage: z.number().min(0.01).max(100),
  vesting_months: z.number().min(12).max(120).default(48),
  cliff_months: z.number().min(0).max(48).default(12),
});

const preferencesSchema = z.object({
  non_compete: z.boolean().default(true),
  non_compete_months: z.number().min(0).max(60).default(12),
  dispute_resolution: z.enum(["arbitration", "court", "mediation"]).default("arbitration"),
  governing_law: z.string().default("india"),
  additional_terms: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;
type FounderFormData = z.infer<typeof founderSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function NewAgreementPage() {
  const [step, setStep] = useState(1);
  const [founders, setFounders] = useState<FounderFormData[]>([
    { name: "", email: "", role: "", equity_percentage: 0, vesting_months: 48, cliff_months: 12 },
    { name: "", email: "", role: "", equity_percentage: 0, vesting_months: 48, cliff_months: 12 },
  ]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      non_compete: true,
      non_compete_months: 12,
      dispute_resolution: "arbitration",
      governing_law: "india",
    },
  });

  const handleCompanySubmit = async (data: CompanyFormData) => {
    try {
      const company = await companiesApi.create(data);
      setCompanyId(company.id);
      setStep(2);
    } catch (error) {
      console.error("Failed to create company:", error);
      toast.error("Failed to create company. Please try again.");
    }
  };

  const handleMatterSubmit = async () => {
    if (!companyId) return;

    const totalEquity = founders.reduce((sum, f) => sum + f.equity_percentage, 0);
    if (Math.abs(totalEquity - 100) > 0.01) {
      toast.error("Total equity must equal 100%");
      return;
    }

    try {
      const preferences = preferencesForm.getValues();
      const matter = await mattersApi.create({
        matter_data: { company_id: companyId },
        founders: founders,
        preferences: preferences,
      });
      
      window.location.href = `/agreements/${matter.id}`;
    } catch (error) {
      console.error("Failed to create matter:", error);
      toast.error("Failed to create agreement. Please try again.");
    }
  };

  const addFounder = () => {
    if (founders.length < 4) {
      setFounders([...founders, { name: "", email: "", role: "", equity_percentage: 0, vesting_months: 48, cliff_months: 12 }]);
    }
  };

  const removeFounder = (index: number) => {
    if (founders.length > 2) {
      setFounders(founders.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Create Founder Agreement</h1>
        <p className="text-muted-foreground mb-8">Fill in the details to generate your legal document</p>

        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex-1 flex items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary/10" : "border-border"}`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-sm">Step 1</div>
                <div className="text-xs text-muted-foreground">Company Details</div>
              </div>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? "bg-primary" : "bg-border"}`}></div>
            <div className={`flex-1 flex items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary/10" : "border-border"}`}>
                {step > 2 ? "✓" : "2"}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-sm">Step 2</div>
                <div className="text-xs text-muted-foreground">Founders</div>
              </div>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? "bg-primary" : "bg-border"}`}></div>
            <div className={`flex-1 flex items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-primary bg-primary/10" : "border-border"}`}>
                3
              </div>
              <div className="ml-3">
                <div className="font-semibold text-sm">Step 3</div>
                <div className="text-xs text-muted-foreground">Preferences</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Company Details */}
        {step === 1 && (
          <Card className="shadow-sm">
            <CardHeader className="border-l-4 border-primary">
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Enter your company details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <Input {...companyForm.register("name")} />
                  {companyForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    {...companyForm.register("description")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input {...companyForm.register("state")} placeholder="e.g., Maharashtra" />
                  {companyForm.formState.errors.state && (
                    <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.state.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Authorized Capital (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...companyForm.register("authorized_capital", { valueAsNumber: true })}
                  />
                  {companyForm.formState.errors.authorized_capital && (
                    <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.authorized_capital.message}</p>
                  )}
                </div>
                <Button type="submit">Next: Add Founders</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Founders */}
        {step === 2 && (
          <Card className="shadow-sm">
            <CardHeader className="border-l-4 border-accent">
              <CardTitle>Founder Information</CardTitle>
              <CardDescription>Add 2-4 founders with their equity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {founders.map((founder, index) => (
                  <div key={index} className="border border-border p-6 rounded-lg space-y-3 bg-card shadow-sm">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Founder {index + 1}</h3>
                      {founders.length > 2 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFounder(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input
                          value={founder.name}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].name = e.target.value;
                            setFounders(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                          type="email"
                          value={founder.email}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].email = e.target.value;
                            setFounders(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <Input
                          value={founder.role}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].role = e.target.value;
                            setFounders(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Equity %</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={founder.equity_percentage}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].equity_percentage = parseFloat(e.target.value) || 0;
                            setFounders(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vesting (months)</label>
                        <Input
                          type="number"
                          value={founder.vesting_months}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].vesting_months = parseInt(e.target.value) || 48;
                            setFounders(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cliff (months)</label>
                        <Input
                          type="number"
                          value={founder.cliff_months}
                          onChange={(e) => {
                            const updated = [...founders];
                            updated[index].cliff_months = parseInt(e.target.value) || 12;
                            setFounders(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  {founders.length < 4 && (
                    <Button type="button" variant="outline" onClick={addFounder}>
                      Add Founder
                    </Button>
                  )}
                  <div className="ml-auto">
                    <p className="text-sm text-muted-foreground">
                      Total Equity: {founders.reduce((sum, f) => sum + f.equity_percentage, 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>Next: Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <Card className="shadow-sm">
            <CardHeader className="border-l-4 border-primary">
              <CardTitle>Legal Preferences</CardTitle>
              <CardDescription>Configure legal terms and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(handleMatterSubmit)} className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...preferencesForm.register("non_compete")}
                    className="rounded"
                  />
                  <label>Include Non-Compete Clause</label>
                </div>
                {preferencesForm.watch("non_compete") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Non-Compete Period (months)</label>
                    <Input
                      type="number"
                      {...preferencesForm.register("non_compete_months", { valueAsNumber: true })}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Dispute Resolution</label>
                  <select
                    {...preferencesForm.register("dispute_resolution")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="arbitration">Arbitration</option>
                    <option value="court">Court</option>
                    <option value="mediation">Mediation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Terms</label>
                  <textarea
                    {...preferencesForm.register("additional_terms")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="submit">Create Agreement</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
