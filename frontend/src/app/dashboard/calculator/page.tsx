"use client";

import { useState } from "react";
import { Calculator, IndianRupee, Percent, Building2, Scale, Briefcase, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// ---------- Stamp Duty Calculator ----------

const STAMP_DUTY_RATES: Record<string, Record<string, { duty: number; registration: number }>> = {
  Maharashtra: {
    "Sale Deed": { duty: 5, registration: 1 },
    "Lease Agreement": { duty: 2, registration: 1 },
    "Gift Deed": { duty: 3, registration: 1 },
    "Mortgage Deed": { duty: 5, registration: 1 },
    "Power of Attorney": { duty: 3, registration: 1 },
    "Partnership Deed": { duty: 1, registration: 1 },
  },
  Karnataka: {
    "Sale Deed": { duty: 5, registration: 1 },
    "Lease Agreement": { duty: 1, registration: 0.5 },
    "Gift Deed": { duty: 5, registration: 1 },
    "Mortgage Deed": { duty: 5, registration: 1 },
    "Power of Attorney": { duty: 5, registration: 1 },
    "Partnership Deed": { duty: 3, registration: 1 },
  },
  Delhi: {
    "Sale Deed": { duty: 6, registration: 1 },
    "Lease Agreement": { duty: 2, registration: 1 },
    "Gift Deed": { duty: 4, registration: 1 },
    "Mortgage Deed": { duty: 4, registration: 1 },
    "Power of Attorney": { duty: 4, registration: 1 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
  "Tamil Nadu": {
    "Sale Deed": { duty: 7, registration: 1 },
    "Lease Agreement": { duty: 1, registration: 1 },
    "Gift Deed": { duty: 7, registration: 1 },
    "Mortgage Deed": { duty: 4, registration: 1 },
    "Power of Attorney": { duty: 4, registration: 1 },
    "Partnership Deed": { duty: 1, registration: 1 },
  },
  "Uttar Pradesh": {
    "Sale Deed": { duty: 5, registration: 1 },
    "Lease Agreement": { duty: 2, registration: 1 },
    "Gift Deed": { duty: 5, registration: 1 },
    "Mortgage Deed": { duty: 5, registration: 1 },
    "Power of Attorney": { duty: 5, registration: 1 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
  Gujarat: {
    "Sale Deed": { duty: 4.9, registration: 1 },
    "Lease Agreement": { duty: 1, registration: 1 },
    "Gift Deed": { duty: 4.9, registration: 1 },
    "Mortgage Deed": { duty: 4.9, registration: 1 },
    "Power of Attorney": { duty: 4.9, registration: 1 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
  Rajasthan: {
    "Sale Deed": { duty: 5, registration: 1 },
    "Lease Agreement": { duty: 2, registration: 1 },
    "Gift Deed": { duty: 5, registration: 1 },
    "Mortgage Deed": { duty: 5, registration: 1 },
    "Power of Attorney": { duty: 5, registration: 1 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
  "West Bengal": {
    "Sale Deed": { duty: 6, registration: 1 },
    "Lease Agreement": { duty: 1, registration: 0.5 },
    "Gift Deed": { duty: 5, registration: 1 },
    "Mortgage Deed": { duty: 5, registration: 1 },
    "Power of Attorney": { duty: 5, registration: 1 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
  Telangana: {
    "Sale Deed": { duty: 5, registration: 0.5 },
    "Lease Agreement": { duty: 0.4, registration: 0.1 },
    "Gift Deed": { duty: 5, registration: 0.5 },
    "Mortgage Deed": { duty: 5, registration: 0.5 },
    "Power of Attorney": { duty: 5, registration: 0.5 },
    "Partnership Deed": { duty: 2, registration: 0.5 },
  },
  Kerala: {
    "Sale Deed": { duty: 8, registration: 2 },
    "Lease Agreement": { duty: 2, registration: 1 },
    "Gift Deed": { duty: 5, registration: 2 },
    "Mortgage Deed": { duty: 5, registration: 2 },
    "Power of Attorney": { duty: 5, registration: 2 },
    "Partnership Deed": { duty: 2, registration: 1 },
  },
};

const STATES = Object.keys(STAMP_DUTY_RATES);
const DOCUMENT_TYPES = [
  "Sale Deed",
  "Lease Agreement",
  "Gift Deed",
  "Mortgage Deed",
  "Power of Attorney",
  "Partnership Deed",
];

function StampDutyCalculator() {
  const [state, setState] = useState("");
  const [docType, setDocType] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ duty: number; registration: number; total: number } | null>(null);

  function calculate() {
    const v = parseFloat(value);
    if (!state || !docType || isNaN(v) || v <= 0) return;
    const rates = STAMP_DUTY_RATES[state]?.[docType];
    if (!rates) return;
    const duty = (v * rates.duty) / 100;
    const registration = (v * rates.registration) / 100;
    setResult({ duty, registration, total: duty + registration });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Property Value (in Rupees)</Label>
        <Input
          type="number"
          placeholder="Enter property value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button onClick={calculate} disabled={!state || !docType || !value}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Stamp Duty
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Stamp Duty Calculation Result</CardTitle>
            <CardDescription>
              {docType} in {state} for property value of {"\u20B9"}{fmt(parseFloat(value))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Stamp Duty Amount</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.duty)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Registration Fee</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.registration)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total Payable</p>
                <p className="text-2xl font-bold text-primary">{"\u20B9"}{fmt(result.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Court Fees Calculator ----------

const COURT_FEE_RATES: Record<string, Record<string, { feePercent: number; minFee: number; maxFee: number; advocatePercent: number }>> = {
  "Supreme Court": {
    "Civil Suit": { feePercent: 2, minFee: 5000, maxFee: 500000, advocatePercent: 5 },
    "Criminal Appeal": { feePercent: 1, minFee: 3000, maxFee: 300000, advocatePercent: 5 },
    "Writ Petition": { feePercent: 1.5, minFee: 5000, maxFee: 500000, advocatePercent: 5 },
    "Company Petition": { feePercent: 2, minFee: 10000, maxFee: 500000, advocatePercent: 5 },
  },
  "High Court": {
    "Civil Suit": { feePercent: 1.5, minFee: 2000, maxFee: 300000, advocatePercent: 4 },
    "Criminal Appeal": { feePercent: 0.5, minFee: 1000, maxFee: 200000, advocatePercent: 4 },
    "Writ Petition": { feePercent: 1, minFee: 2000, maxFee: 300000, advocatePercent: 4 },
    "Company Petition": { feePercent: 1.5, minFee: 5000, maxFee: 300000, advocatePercent: 4 },
  },
  "District Court": {
    "Civil Suit": { feePercent: 1, minFee: 500, maxFee: 150000, advocatePercent: 3 },
    "Criminal Appeal": { feePercent: 0.5, minFee: 200, maxFee: 50000, advocatePercent: 3 },
    "Writ Petition": { feePercent: 1, minFee: 500, maxFee: 100000, advocatePercent: 3 },
    "Company Petition": { feePercent: 1, minFee: 1000, maxFee: 150000, advocatePercent: 3 },
  },
  "Consumer Forum": {
    "Civil Suit": { feePercent: 0.5, minFee: 100, maxFee: 50000, advocatePercent: 2 },
    "Criminal Appeal": { feePercent: 0.5, minFee: 100, maxFee: 25000, advocatePercent: 2 },
    "Writ Petition": { feePercent: 0.5, minFee: 100, maxFee: 50000, advocatePercent: 2 },
    "Company Petition": { feePercent: 0.5, minFee: 200, maxFee: 50000, advocatePercent: 2 },
  },
};

const COURT_TYPES = Object.keys(COURT_FEE_RATES);
const CASE_TYPES = ["Civil Suit", "Criminal Appeal", "Writ Petition", "Company Petition"];

function CourtFeesCalculator() {
  const [courtType, setCourtType] = useState("");
  const [caseType, setCaseType] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ courtFee: number; advocateFee: number; total: number } | null>(null);

  function calculate() {
    const v = parseFloat(amount);
    if (!courtType || !caseType || isNaN(v) || v <= 0) return;
    const rates = COURT_FEE_RATES[courtType]?.[caseType];
    if (!rates) return;
    const rawFee = (v * rates.feePercent) / 100;
    const courtFee = Math.min(Math.max(rawFee, rates.minFee), rates.maxFee);
    const advocateFee = (v * rates.advocatePercent) / 100;
    setResult({ courtFee, advocateFee, total: courtFee + advocateFee });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Court Type</Label>
          <Select value={courtType} onValueChange={setCourtType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select court type" />
            </SelectTrigger>
            <SelectContent>
              {COURT_TYPES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Case Type</Label>
          <Select value={caseType} onValueChange={setCaseType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select case type" />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Claim Amount (in Rupees)</Label>
        <Input
          type="number"
          placeholder="Enter claim amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button onClick={calculate} disabled={!courtType || !caseType || !amount}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Court Fees
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Court Fees Calculation Result</CardTitle>
            <CardDescription>
              {caseType} at {courtType} for claim of {"\u20B9"}{fmt(parseFloat(amount))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Court Fee</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.courtFee)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Advocate Fee (Estimated)</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.advocateFee)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total Estimated Cost</p>
                <p className="text-2xl font-bold text-primary">{"\u20B9"}{fmt(result.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- GST Calculator ----------

const GST_RATES = [
  { label: "5%", value: 5 },
  { label: "12%", value: 12 },
  { label: "18%", value: 18 },
  { label: "28%", value: 28 },
];

function GSTCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [result, setResult] = useState<{ cgst: number; sgst: number; totalGst: number; grand: number } | null>(null);

  function calculate() {
    const v = parseFloat(amount);
    const r = parseFloat(rate);
    if (isNaN(v) || v <= 0 || isNaN(r)) return;
    const totalGst = (v * r) / 100;
    const half = totalGst / 2;
    setResult({ cgst: half, sgst: half, totalGst, grand: v + totalGst });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (in Rupees)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>GST Rate</Label>
          <Select value={rate} onValueChange={setRate}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select GST rate" />
            </SelectTrigger>
            <SelectContent>
              {GST_RATES.map((r) => (
                <SelectItem key={r.value} value={r.value.toString()}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} disabled={!amount || !rate}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate GST
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">GST Calculation Result</CardTitle>
            <CardDescription>
              GST at {rate}% on {"\u20B9"}{fmt(parseFloat(amount))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">CGST ({parseFloat(rate) / 2}%)</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.cgst)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">SGST ({parseFloat(rate) / 2}%)</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.sgst)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total GST</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.totalGst)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Grand Total</p>
                <p className="text-2xl font-bold text-primary">{"\u20B9"}{fmt(result.grand)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- TDS Calculator ----------

const TDS_SECTIONS = [
  { label: "194A - Interest", value: "194A", rate: 10 },
  { label: "194C - Contractor", value: "194C", rate: 2 },
  { label: "194H - Commission", value: "194H", rate: 5 },
  { label: "194I - Rent", value: "194I", rate: 10 },
  { label: "194J - Professional Fees", value: "194J", rate: 10 },
];

function TDSCalculator() {
  const [section, setSection] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ rate: number; tds: number; net: number } | null>(null);

  function calculate() {
    const v = parseFloat(amount);
    if (!section || isNaN(v) || v <= 0) return;
    const sec = TDS_SECTIONS.find((s) => s.value === section);
    if (!sec) return;
    const tds = (v * sec.rate) / 100;
    setResult({ rate: sec.rate, tds, net: v - tds });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>TDS Section</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select TDS section" />
            </SelectTrigger>
            <SelectContent>
              {TDS_SECTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (in Rupees)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={calculate} disabled={!section || !amount}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate TDS
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">TDS Calculation Result</CardTitle>
            <CardDescription>
              Section {section} on {"\u20B9"}{fmt(parseFloat(amount))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">TDS Rate</p>
                <p className="text-2xl font-bold text-foreground">{result.rate}%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">TDS Amount</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.tds)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
                <p className="text-2xl font-bold text-primary">{"\u20B9"}{fmt(result.net)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Gratuity Calculator ----------

function GratuityCalculator() {
  const [salary, setSalary] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState<{ gratuity: number; capped: boolean } | null>(null);

  function calculate() {
    const s = parseFloat(salary);
    const y = parseFloat(years);
    if (isNaN(s) || s <= 0 || isNaN(y) || y < 0) return;
    const cap = 2500000;
    const raw = (s * 15 * y) / 26;
    const gratuity = Math.min(raw, cap);
    setResult({ gratuity, capped: raw > cap });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Last Drawn Basic Salary + DA (monthly, in Rupees)</Label>
          <Input
            type="number"
            placeholder="Enter basic salary + DA"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Years of Service</Label>
          <Input
            type="number"
            placeholder="Enter years of service"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={calculate} disabled={!salary || !years}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Gratuity
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Gratuity Calculation Result</CardTitle>
            <CardDescription>
              Formula: (Basic Salary + DA) x 15 / 26 x Years of Service
              {result.capped && " (Capped at \u20B925,00,000)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground mb-1">Gratuity Amount</p>
              <p className="text-3xl font-bold text-primary">{"\u20B9"}{fmt(result.gratuity)}</p>
              {result.capped && (
                <p className="text-xs text-orange-600 mt-2">
                  Note: Gratuity amount is capped at {"\u20B9"}25,00,000 as per the Payment of Gratuity Act.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- EMI Calculator ----------

function EMICalculator() {
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [result, setResult] = useState<{ emi: number; totalInterest: number; totalPayable: number } | null>(null);

  function calculate() {
    const p = parseFloat(principal);
    const annualRate = parseFloat(interestRate);
    const n = parseFloat(tenure);
    if (isNaN(p) || p <= 0 || isNaN(annualRate) || annualRate <= 0 || isNaN(n) || n <= 0) return;
    const r = annualRate / 12 / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - p;
    setResult({ emi, totalInterest, totalPayable });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Loan Amount (in Rupees)</Label>
          <Input
            type="number"
            placeholder="Enter loan amount"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Interest Rate (% per annum)</Label>
          <Input
            type="number"
            placeholder="Enter interest rate"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Tenure (months)</Label>
          <Input
            type="number"
            placeholder="Enter tenure in months"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={calculate} disabled={!principal || !interestRate || !tenure}>
        <Calculator className="h-4 w-4 mr-2" />
        Calculate EMI
      </Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">EMI Calculation Result</CardTitle>
            <CardDescription>
              Loan of {"\u20B9"}{fmt(parseFloat(principal))} at {interestRate}% for {tenure} months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
                <p className="text-2xl font-bold text-primary">{"\u20B9"}{fmt(result.emi)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.totalInterest)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total Payable</p>
                <p className="text-2xl font-bold text-foreground">{"\u20B9"}{fmt(result.totalPayable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Main Page ----------

export default function CalculatorPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Legal Calculator</h1>
              <p className="text-sm text-muted-foreground">
                Calculate stamp duty, court fees, GST, TDS, and more
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            <Tabs defaultValue="stamp-duty">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="stamp-duty" className="gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Stamp Duty
                </TabsTrigger>
                <TabsTrigger value="court-fees" className="gap-1.5">
                  <Scale className="h-4 w-4" />
                  Court Fees
                </TabsTrigger>
                <TabsTrigger value="gst" className="gap-1.5">
                  <Percent className="h-4 w-4" />
                  GST
                </TabsTrigger>
                <TabsTrigger value="tds" className="gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  TDS
                </TabsTrigger>
                <TabsTrigger value="gratuity" className="gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  Gratuity
                </TabsTrigger>
                <TabsTrigger value="emi" className="gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  EMI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stamp-duty">
                <Card>
                  <CardHeader>
                    <CardTitle>Stamp Duty Calculator</CardTitle>
                    <CardDescription>
                      Calculate stamp duty and registration charges for property documents across Indian states
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StampDutyCalculator />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="court-fees">
                <Card>
                  <CardHeader>
                    <CardTitle>Court Fees Calculator</CardTitle>
                    <CardDescription>
                      Estimate court fees and advocate charges for filing cases in Indian courts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CourtFeesCalculator />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gst">
                <Card>
                  <CardHeader>
                    <CardTitle>GST Calculator</CardTitle>
                    <CardDescription>
                      Calculate CGST, SGST and total GST on any amount
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GSTCalculator />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tds">
                <Card>
                  <CardHeader>
                    <CardTitle>TDS Calculator</CardTitle>
                    <CardDescription>
                      Calculate Tax Deducted at Source for various income types
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TDSCalculator />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gratuity">
                <Card>
                  <CardHeader>
                    <CardTitle>Gratuity Calculator</CardTitle>
                    <CardDescription>
                      Calculate gratuity amount under the Payment of Gratuity Act, 1972
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GratuityCalculator />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emi">
                <Card>
                  <CardHeader>
                    <CardTitle>EMI Calculator</CardTitle>
                    <CardDescription>
                      Calculate Equated Monthly Installments for loans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EMICalculator />
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
