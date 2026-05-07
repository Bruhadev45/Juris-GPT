"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  CheckCircle2,
  Download,
  Copy,
  Printer,
  Eye,
  Edit3,
  Sparkles,
  BookOpen,
  AlertCircle,
  Building,
  User,
  Calendar,
  CreditCard,
  FileSignature,
  Scale,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { contractsApi } from "@/lib/api";
import { LiveContractPreview } from "@/components/contracts/live-preview";
import { DraftControls } from "@/components/contracts/draft-controls";
import { cn } from "@/lib/utils";

// Contract field definitions for each type
const CONTRACT_CONFIGS: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
    lawReference: string;
    estimatedTime: string;
    steps: {
      title: string;
      description: string;
      icon: React.ElementType;
      fields: {
        name: string;
        label: string;
        type: "text" | "textarea" | "number" | "date" | "select" | "boolean" | "pan" | "gstin" | "email" | "phone";
        required: boolean;
        placeholder?: string;
        options?: string[];
        helpText?: string;
        validation?: RegExp;
        validationMessage?: string;
        step?: number;
        defaultValue?: string | number | boolean;
      }[];
    }[];
  }
> = {
  nda: {
    name: "Non-Disclosure Agreement (NDA)",
    description: "Protect confidential information shared between parties",
    category: "Startup Essentials",
    lawReference: "Indian Contract Act, 1872",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Disclosing Party Details",
        description: "Enter details of the party sharing confidential information",
        icon: Building,
        fields: [
          { name: "disclosingPartyName", label: "Company/Individual Name", type: "text", required: true, placeholder: "ABC Technologies Pvt. Ltd." },
          { name: "disclosingPartyType", label: "Party Type", type: "select", required: true, options: ["Company", "LLP", "Partnership Firm", "Individual", "Proprietorship"] },
          { name: "disclosingPartyAddress", label: "Registered Address", type: "textarea", required: true, placeholder: "123, Tech Park, Bengaluru, Karnataka - 560001" },
          { name: "disclosingPartyPAN", label: "PAN Number", type: "pan", required: true, placeholder: "ABCDE1234F", helpText: "10-character alphanumeric PAN" },
          { name: "disclosingPartyGSTIN", label: "GSTIN (if applicable)", type: "gstin", required: false, placeholder: "29ABCDE1234F1Z5", helpText: "15-character GSTIN" },
          { name: "disclosingPartyEmail", label: "Email Address", type: "email", required: true, placeholder: "legal@company.com" },
          { name: "disclosingPartySignatory", label: "Authorized Signatory Name", type: "text", required: true, placeholder: "John Doe" },
          { name: "disclosingPartyDesignation", label: "Designation", type: "text", required: true, placeholder: "Director" },
        ],
      },
      {
        title: "Receiving Party Details",
        description: "Enter details of the party receiving confidential information",
        icon: User,
        fields: [
          { name: "receivingPartyName", label: "Company/Individual Name", type: "text", required: true, placeholder: "XYZ Solutions Pvt. Ltd." },
          { name: "receivingPartyType", label: "Party Type", type: "select", required: true, options: ["Company", "LLP", "Partnership Firm", "Individual", "Proprietorship"] },
          { name: "receivingPartyAddress", label: "Registered Address", type: "textarea", required: true, placeholder: "456, Business Center, Mumbai, Maharashtra - 400001" },
          { name: "receivingPartyPAN", label: "PAN Number", type: "pan", required: true, placeholder: "FGHIJ5678K", helpText: "10-character alphanumeric PAN" },
          { name: "receivingPartyGSTIN", label: "GSTIN (if applicable)", type: "gstin", required: false, placeholder: "27FGHIJ5678K1Z2" },
          { name: "receivingPartyEmail", label: "Email Address", type: "email", required: true, placeholder: "contact@receiver.com" },
          { name: "receivingPartySignatory", label: "Authorized Signatory Name", type: "text", required: true, placeholder: "Jane Smith" },
          { name: "receivingPartyDesignation", label: "Designation", type: "text", required: true, placeholder: "CEO" },
        ],
      },
      {
        title: "Agreement Terms",
        description: "Define the scope and duration of confidentiality",
        icon: FileSignature,
        fields: [
          { name: "effectiveDate", label: "Effective Date", type: "date", required: true },
          { name: "confidentialityPeriod", label: "Confidentiality Period (Years)", type: "number", required: true, placeholder: "3", helpText: "How long should information remain confidential?", step: 1 },
          { name: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true, placeholder: "Evaluation of potential business partnership for software development services" },
          { name: "confidentialInfo", label: "Types of Confidential Information", type: "textarea", required: true, placeholder: "Technical specifications, business plans, customer data, financial information, trade secrets" },
          { name: "ndaType", label: "NDA Type", type: "select", required: true, options: ["Mutual (Two-Way)", "Unilateral (One-Way)"], defaultValue: "Mutual (Two-Way)" },
          { name: "governingLaw", label: "Governing Law (State)", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal", "Uttar Pradesh", "Rajasthan", "Other"] },
          { name: "jurisdiction", label: "Dispute Resolution Jurisdiction", type: "text", required: true, placeholder: "Bengaluru" },
          { name: "arbitration", label: "Include Arbitration Clause", type: "boolean", required: false, defaultValue: true, helpText: "Disputes to be resolved through arbitration under Arbitration and Conciliation Act, 1996" },
        ],
      },
    ],
  },
  "founders-agreement": {
    name: "Founder's Agreement",
    description: "Define roles, equity, vesting, and governance among co-founders",
    category: "Startup Essentials",
    lawReference: "Companies Act, 2013",
    estimatedTime: "15-20 min",
    steps: [
      {
        title: "Company Details",
        description: "Enter details of the startup company",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "TechStartup India Pvt. Ltd." },
          { name: "cin", label: "CIN (if incorporated)", type: "text", required: false, placeholder: "U72200KA2024PTC123456" },
          { name: "companyAddress", label: "Registered Office Address", type: "textarea", required: true, placeholder: "123, Innovation Hub, Bengaluru, Karnataka - 560001" },
          { name: "companyPAN", label: "Company PAN", type: "pan", required: true, placeholder: "AABCT1234D" },
          { name: "companyGSTIN", label: "GSTIN (if applicable)", type: "gstin", required: false, placeholder: "29AABCT1234D1ZK" },
          { name: "authorizedCapital", label: "Authorized Share Capital (INR)", type: "number", required: true, placeholder: "1000000" },
          { name: "businessActivity", label: "Primary Business Activity", type: "textarea", required: true, placeholder: "Software development and SaaS products" },
        ],
      },
      {
        title: "Founder 1 Details",
        description: "Enter details of the first founder",
        icon: User,
        fields: [
          { name: "founder1Name", label: "Full Legal Name", type: "text", required: true, placeholder: "Rajesh Kumar" },
          { name: "founder1Address", label: "Residential Address", type: "textarea", required: true, placeholder: "456, Green Park, New Delhi - 110016" },
          { name: "founder1PAN", label: "PAN Number", type: "pan", required: true, placeholder: "ABCPK1234F" },
          { name: "founder1Aadhaar", label: "Aadhaar Number (Last 4 digits)", type: "text", required: false, placeholder: "XXXX-XXXX-1234" },
          { name: "founder1Email", label: "Email Address", type: "email", required: true, placeholder: "rajesh@startup.com" },
          { name: "founder1Phone", label: "Mobile Number", type: "phone", required: true, placeholder: "+91 98765 43210" },
          { name: "founder1Equity", label: "Equity Percentage (%)", type: "number", required: true, placeholder: "50", step: 0.01 },
          { name: "founder1Role", label: "Designation/Role", type: "text", required: true, placeholder: "CEO & Director" },
          { name: "founder1Investment", label: "Initial Investment (INR)", type: "number", required: true, placeholder: "500000" },
        ],
      },
      {
        title: "Founder 2 Details",
        description: "Enter details of the second founder (leave blank if only one founder)",
        icon: User,
        fields: [
          { name: "founder2Name", label: "Full Legal Name", type: "text", required: false, placeholder: "Priya Sharma" },
          { name: "founder2Address", label: "Residential Address", type: "textarea", required: false, placeholder: "789, Lake View, Bengaluru - 560034" },
          { name: "founder2PAN", label: "PAN Number", type: "pan", required: false, placeholder: "DEFPS5678G" },
          { name: "founder2Email", label: "Email Address", type: "email", required: false, placeholder: "priya@startup.com" },
          { name: "founder2Phone", label: "Mobile Number", type: "phone", required: false, placeholder: "+91 87654 32109" },
          { name: "founder2Equity", label: "Equity Percentage (%)", type: "number", required: false, placeholder: "50", step: 0.01 },
          { name: "founder2Role", label: "Designation/Role", type: "text", required: false, placeholder: "CTO & Director" },
          { name: "founder2Investment", label: "Initial Investment (INR)", type: "number", required: false, placeholder: "500000" },
        ],
      },
      {
        title: "Vesting & Governance",
        description: "Define vesting schedule and governance terms",
        icon: Scale,
        fields: [
          { name: "vestingPeriod", label: "Vesting Period (Months)", type: "number", required: true, placeholder: "48", helpText: "Total vesting duration", step: 1 },
          { name: "cliffPeriod", label: "Cliff Period (Months)", type: "number", required: true, placeholder: "12", helpText: "Period before first vesting", step: 1 },
          { name: "vestingSchedule", label: "Vesting Schedule", type: "select", required: true, options: ["Monthly", "Quarterly", "Annually"] },
          { name: "ipAssignment", label: "IP Assignment to Company", type: "boolean", required: false, defaultValue: true, helpText: "All IP created by founders belongs to the company" },
          { name: "nonCompetePeriod", label: "Non-Compete Period (Months after exit)", type: "number", required: true, placeholder: "12", step: 1 },
          { name: "nonSolicitPeriod", label: "Non-Solicitation Period (Months)", type: "number", required: true, placeholder: "24", step: 1 },
          { name: "decisionMaking", label: "Major Decision Threshold (%)", type: "number", required: true, placeholder: "75", helpText: "Percentage required for major decisions", step: 1 },
          { name: "deadlockResolution", label: "Deadlock Resolution", type: "select", required: true, options: ["Mediation", "Arbitration", "Buyout Option", "Dissolution"] },
          { name: "governingState", label: "Governing Law (State)", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal"] },
        ],
      },
    ],
  },
  "shareholder-agreement": {
    name: "Shareholder Agreement (SHA)",
    description: "Comprehensive agreement for shareholders covering rights and obligations",
    category: "Startup Essentials",
    lawReference: "Companies Act, 2013",
    estimatedTime: "20-30 min",
    steps: [
      {
        title: "Company Information",
        description: "Enter company details",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "TechVenture India Pvt. Ltd." },
          { name: "cin", label: "Corporate Identity Number (CIN)", type: "text", required: true, placeholder: "U72200KA2024PTC123456" },
          { name: "companyAddress", label: "Registered Office", type: "textarea", required: true },
          { name: "companyPAN", label: "Company PAN", type: "pan", required: true },
          { name: "authorizedCapital", label: "Authorized Capital (INR)", type: "number", required: true },
          { name: "paidUpCapital", label: "Paid-up Capital (INR)", type: "number", required: true },
        ],
      },
      {
        title: "Shareholder Details",
        description: "Enter primary shareholder information",
        icon: User,
        fields: [
          { name: "shareholderName", label: "Shareholder Name", type: "text", required: true },
          { name: "shareholderType", label: "Shareholder Type", type: "select", required: true, options: ["Individual", "Company", "LLP", "Trust", "HUF"] },
          { name: "shareholderAddress", label: "Address", type: "textarea", required: true },
          { name: "shareholderPAN", label: "PAN", type: "pan", required: true },
          { name: "sharePercentage", label: "Shareholding (%)", type: "number", required: true, step: 0.01 },
          { name: "shareClass", label: "Class of Shares", type: "select", required: true, options: ["Equity", "Preference", "CCPS", "OCPS"] },
        ],
      },
      {
        title: "Rights & Restrictions",
        description: "Define shareholder rights and transfer restrictions",
        icon: FileSignature,
        fields: [
          { name: "preEmptiveRights", label: "Pre-emptive Rights", type: "boolean", required: false, defaultValue: true, helpText: "Right to participate in future funding rounds" },
          { name: "antiDilution", label: "Anti-Dilution Protection", type: "select", required: true, options: ["None", "Full Ratchet", "Weighted Average (Broad)", "Weighted Average (Narrow)"] },
          { name: "tagAlong", label: "Tag-Along Rights", type: "boolean", required: false, defaultValue: true },
          { name: "dragAlong", label: "Drag-Along Rights", type: "boolean", required: false, defaultValue: true },
          { name: "dragAlongThreshold", label: "Drag-Along Threshold (%)", type: "number", required: false, placeholder: "75" },
          { name: "rofr", label: "Right of First Refusal (ROFR)", type: "boolean", required: false, defaultValue: true },
          { name: "lockInPeriod", label: "Lock-in Period (Months)", type: "number", required: true, placeholder: "12" },
        ],
      },
      {
        title: "Governance & Exit",
        description: "Board composition and exit provisions",
        icon: Scale,
        fields: [
          { name: "boardSeats", label: "Board Seats for this Shareholder", type: "number", required: true, placeholder: "1" },
          { name: "reservedMatters", label: "Reserved Matters Requiring Consent", type: "textarea", required: true, placeholder: "Capital increase, M&A, change in business, related party transactions" },
          { name: "informationRights", label: "Information Rights", type: "select", required: true, options: ["Full", "Limited (Annual)", "Quarterly Reports", "Monthly MIS"] },
          { name: "exitOptions", label: "Exit Options", type: "select", required: true, options: ["IPO", "Strategic Sale", "Buyback", "Put Option", "Any"] },
          { name: "valuationMethod", label: "Valuation Method for Exit", type: "select", required: true, options: ["Fair Market Value", "Book Value", "Revenue Multiple", "EBITDA Multiple", "Negotiated"] },
          { name: "governingLaw", label: "Governing Law", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana"] },
          { name: "disputeResolution", label: "Dispute Resolution", type: "select", required: true, options: ["Arbitration (SIAC)", "Arbitration (MCIA)", "Arbitration (ICC)", "Court Jurisdiction"] },
        ],
      },
    ],
  },
  "esop-scheme": {
    name: "ESOP Scheme Document",
    description: "Employee Stock Option Plan for attracting and retaining talent",
    category: "Startup Essentials",
    lawReference: "Companies Act, 2013 (Section 62)",
    estimatedTime: "15-20 min",
    steps: [
      {
        title: "Company Details",
        description: "Enter company information for ESOP scheme",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "cin", label: "CIN", type: "text", required: true },
          { name: "companyAddress", label: "Registered Office", type: "textarea", required: true },
          { name: "authorizedCapital", label: "Authorized Share Capital (INR)", type: "number", required: true },
          { name: "paidUpCapital", label: "Paid-up Capital (INR)", type: "number", required: true },
        ],
      },
      {
        title: "ESOP Pool Details",
        description: "Define the ESOP pool and allocation",
        icon: CreditCard,
        fields: [
          { name: "poolName", label: "ESOP Scheme Name", type: "text", required: true, placeholder: "Employee Stock Option Plan 2024" },
          { name: "poolSize", label: "ESOP Pool Size (%)", type: "number", required: true, placeholder: "10", helpText: "Percentage of fully diluted capital" },
          { name: "totalOptions", label: "Total Number of Options", type: "number", required: true },
          { name: "exercisePrice", label: "Exercise Price per Share (INR)", type: "number", required: true, placeholder: "10" },
          { name: "exercisePriceMethod", label: "Exercise Price Determination", type: "select", required: true, options: ["Face Value", "Fair Market Value", "Discounted FMV", "Board Discretion"] },
          { name: "eligibility", label: "Eligible Employees", type: "select", required: true, options: ["All Permanent Employees", "Management Level and Above", "Key Employees Only", "Board Discretion"] },
        ],
      },
      {
        title: "Vesting Schedule",
        description: "Define vesting terms for options",
        icon: Calendar,
        fields: [
          { name: "vestingPeriod", label: "Total Vesting Period (Months)", type: "number", required: true, placeholder: "48" },
          { name: "cliffPeriod", label: "Cliff Period (Months)", type: "number", required: true, placeholder: "12" },
          { name: "vestingSchedule", label: "Vesting Frequency", type: "select", required: true, options: ["Monthly", "Quarterly", "Annually"] },
          { name: "acceleratedVesting", label: "Accelerated Vesting on Exit", type: "boolean", required: false, defaultValue: true, helpText: "Full vesting on acquisition/IPO" },
          { name: "goodLeaverVesting", label: "Good Leaver Vesting", type: "select", required: true, options: ["Vested Options Only", "Pro-rata Vesting", "Full Vesting"] },
          { name: "badLeaverTreatment", label: "Bad Leaver Treatment", type: "select", required: true, options: ["Forfeit All", "Forfeit Unvested Only", "Buyback at Cost"] },
        ],
      },
      {
        title: "Exercise & Administration",
        description: "Exercise window and administration details",
        icon: FileSignature,
        fields: [
          { name: "exerciseWindow", label: "Exercise Window after Vesting (Days)", type: "number", required: true, placeholder: "90" },
          { name: "postTerminationExercise", label: "Post-Termination Exercise Period (Days)", type: "number", required: true, placeholder: "90" },
          { name: "schemeDuration", label: "Scheme Duration (Years)", type: "number", required: true, placeholder: "10" },
          { name: "transferability", label: "Transferability", type: "select", required: true, options: ["Non-Transferable", "To Immediate Family", "With Board Approval"] },
          { name: "administrator", label: "ESOP Administrator", type: "text", required: true, placeholder: "ESOP Committee / HR Head" },
          { name: "boardResolutionDate", label: "Board Resolution Date", type: "date", required: true },
        ],
      },
    ],
  },
  "employment-contract": {
    name: "Employment Contract",
    description: "Full-time employment agreement compliant with Indian labour laws",
    category: "Employment & HR",
    lawReference: "Indian Labour Laws, PF Act, ESI Act",
    estimatedTime: "10-15 min",
    steps: [
      {
        title: "Employer Details",
        description: "Enter company/employer information",
        icon: Building,
        fields: [
          { name: "employerName", label: "Company Name", type: "text", required: true },
          { name: "employerAddress", label: "Registered Office Address", type: "textarea", required: true },
          { name: "employerPAN", label: "Company PAN", type: "pan", required: true },
          { name: "employerGSTIN", label: "GSTIN", type: "gstin", required: false },
          { name: "pfRegistration", label: "PF Registration Number", type: "text", required: false, placeholder: "MH/BAN/12345/000/1234567" },
          { name: "esiRegistration", label: "ESI Registration Number", type: "text", required: false },
        ],
      },
      {
        title: "Employee Details",
        description: "Enter employee information",
        icon: User,
        fields: [
          { name: "employeeName", label: "Full Legal Name", type: "text", required: true },
          { name: "employeeAddress", label: "Permanent Address", type: "textarea", required: true },
          { name: "employeePAN", label: "PAN Number", type: "pan", required: true },
          { name: "employeeAadhaar", label: "Aadhaar (Last 4 digits)", type: "text", required: false },
          { name: "employeeEmail", label: "Email Address", type: "email", required: true },
          { name: "employeePhone", label: "Mobile Number", type: "phone", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        ],
      },
      {
        title: "Employment Terms",
        description: "Define job role and compensation",
        icon: FileSignature,
        fields: [
          { name: "designation", label: "Designation/Title", type: "text", required: true, placeholder: "Software Engineer" },
          { name: "department", label: "Department", type: "text", required: true, placeholder: "Engineering" },
          { name: "joiningDate", label: "Date of Joining", type: "date", required: true },
          { name: "employmentType", label: "Employment Type", type: "select", required: true, options: ["Permanent", "Contractual", "Probationary"] },
          { name: "probationPeriod", label: "Probation Period (Months)", type: "number", required: false, placeholder: "6" },
          { name: "workLocation", label: "Work Location", type: "text", required: true, placeholder: "Bengaluru" },
          { name: "workMode", label: "Work Mode", type: "select", required: true, options: ["Work from Office", "Remote", "Hybrid"] },
          { name: "reportingManager", label: "Reporting Manager", type: "text", required: true },
        ],
      },
      {
        title: "Compensation & Benefits",
        description: "Define CTC and benefits structure",
        icon: CreditCard,
        fields: [
          { name: "ctc", label: "Annual CTC (INR)", type: "number", required: true },
          { name: "basicSalary", label: "Monthly Basic Salary (INR)", type: "number", required: true },
          { name: "hra", label: "HRA (Monthly INR)", type: "number", required: false },
          { name: "pfContribution", label: "PF Contribution (Employee + Employer)", type: "boolean", required: false, defaultValue: true },
          { name: "esiApplicable", label: "ESI Applicable", type: "boolean", required: false, defaultValue: false, helpText: "Applicable if monthly wages <= 21,000" },
          { name: "noticePeriod", label: "Notice Period (Days)", type: "number", required: true, placeholder: "60" },
          { name: "leavePolicy", label: "Annual Leave Entitlement (Days)", type: "number", required: true, placeholder: "24" },
          { name: "additionalBenefits", label: "Additional Benefits", type: "textarea", required: false, placeholder: "Health insurance, meal allowance, transport" },
        ],
      },
    ],
  },
  "consultant-agreement": {
    name: "Consultant/Freelancer Agreement",
    description: "Independent contractor agreement with tax compliance",
    category: "Employment & HR",
    lawReference: "Income Tax Act (194J), GST Act",
    estimatedTime: "10-15 min",
    steps: [
      {
        title: "Company Details",
        description: "Enter engaging company information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyAddress", label: "Registered Address", type: "textarea", required: true },
          { name: "companyPAN", label: "Company PAN", type: "pan", required: true },
          { name: "companyGSTIN", label: "GSTIN", type: "gstin", required: true },
          { name: "contactPerson", label: "Contact Person", type: "text", required: true },
          { name: "contactEmail", label: "Contact Email", type: "email", required: true },
        ],
      },
      {
        title: "Consultant Details",
        description: "Enter consultant/freelancer information",
        icon: User,
        fields: [
          { name: "consultantName", label: "Full Name / Business Name", type: "text", required: true },
          { name: "consultantType", label: "Consultant Type", type: "select", required: true, options: ["Individual", "Proprietorship", "Company", "LLP"] },
          { name: "consultantAddress", label: "Address", type: "textarea", required: true },
          { name: "consultantPAN", label: "PAN Number", type: "pan", required: true },
          { name: "consultantGSTIN", label: "GSTIN (if registered)", type: "gstin", required: false, helpText: "Required if turnover exceeds Rs. 20 lakhs" },
          { name: "consultantEmail", label: "Email Address", type: "email", required: true },
          { name: "consultantPhone", label: "Phone Number", type: "phone", required: true },
          { name: "bankAccount", label: "Bank Account Number", type: "text", required: false },
          { name: "ifscCode", label: "IFSC Code", type: "text", required: false },
        ],
      },
      {
        title: "Engagement Terms",
        description: "Define scope of work and timelines",
        icon: FileSignature,
        fields: [
          { name: "projectTitle", label: "Project/Engagement Title", type: "text", required: true },
          { name: "scopeOfWork", label: "Scope of Work", type: "textarea", required: true, placeholder: "Detailed description of services to be provided" },
          { name: "deliverables", label: "Key Deliverables", type: "textarea", required: true },
          { name: "startDate", label: "Start Date", type: "date", required: true },
          { name: "endDate", label: "End Date", type: "date", required: true },
          { name: "workingHours", label: "Expected Working Hours (per week)", type: "number", required: false },
          { name: "workLocation", label: "Work Location", type: "select", required: true, options: ["Remote", "On-site", "Hybrid"] },
        ],
      },
      {
        title: "Payment & Tax",
        description: "Define compensation and tax treatment",
        icon: CreditCard,
        fields: [
          { name: "feeStructure", label: "Fee Structure", type: "select", required: true, options: ["Fixed Fee", "Hourly Rate", "Milestone Based", "Retainer"] },
          { name: "totalFee", label: "Total Fee / Rate (INR)", type: "number", required: true },
          { name: "paymentTerms", label: "Payment Terms", type: "select", required: true, options: ["On Completion", "Monthly", "Bi-weekly", "Milestone Based", "50% Advance + 50% Completion"] },
          { name: "tdsRate", label: "TDS Rate (%)", type: "number", required: true, defaultValue: 10, helpText: "10% under Section 194J for professional fees" },
          { name: "gstApplicable", label: "GST Applicable", type: "boolean", required: false, defaultValue: true },
          { name: "gstRate", label: "GST Rate (%)", type: "number", required: false, defaultValue: 18 },
          { name: "invoiceFrequency", label: "Invoice Frequency", type: "select", required: true, options: ["Monthly", "On Milestone", "On Completion", "Bi-weekly"] },
          { name: "ipOwnership", label: "IP Ownership", type: "select", required: true, options: ["Company owns all IP", "Consultant retains IP, Company gets license", "Shared IP"] },
        ],
      },
    ],
  },
  "internship-agreement": {
    name: "Internship Agreement",
    description: "Agreement for paid/unpaid internships",
    category: "Employment & HR",
    lawReference: "Indian Contract Act, 1872",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Organization Details",
        description: "Enter organization information",
        icon: Building,
        fields: [
          { name: "orgName", label: "Organization Name", type: "text", required: true },
          { name: "orgAddress", label: "Address", type: "textarea", required: true },
          { name: "supervisorName", label: "Supervisor/Mentor Name", type: "text", required: true },
          { name: "supervisorEmail", label: "Supervisor Email", type: "email", required: true },
          { name: "department", label: "Department", type: "text", required: true },
        ],
      },
      {
        title: "Intern Details",
        description: "Enter intern information",
        icon: User,
        fields: [
          { name: "internName", label: "Full Name", type: "text", required: true },
          { name: "internAddress", label: "Address", type: "textarea", required: true },
          { name: "internEmail", label: "Email", type: "email", required: true },
          { name: "internPhone", label: "Phone", type: "phone", required: true },
          { name: "institution", label: "Educational Institution", type: "text", required: false },
          { name: "course", label: "Course/Degree", type: "text", required: false },
        ],
      },
      {
        title: "Internship Terms",
        description: "Define internship details",
        icon: Calendar,
        fields: [
          { name: "internshipType", label: "Internship Type", type: "select", required: true, options: ["Paid", "Unpaid", "Stipend Based"] },
          { name: "stipend", label: "Monthly Stipend (INR)", type: "number", required: false },
          { name: "startDate", label: "Start Date", type: "date", required: true },
          { name: "endDate", label: "End Date", type: "date", required: true },
          { name: "workingDays", label: "Working Days per Week", type: "number", required: true, placeholder: "5" },
          { name: "workingHours", label: "Working Hours per Day", type: "number", required: true, placeholder: "8" },
          { name: "responsibilities", label: "Key Responsibilities", type: "textarea", required: true },
          { name: "learningObjectives", label: "Learning Objectives", type: "textarea", required: true },
          { name: "conversionPossible", label: "Possible Conversion to Full-Time", type: "boolean", required: false, defaultValue: true },
        ],
      },
    ],
  },
  "offer-letter": {
    name: "Offer Letter",
    description: "Formal job offer with terms and conditions",
    category: "Employment & HR",
    lawReference: "Indian Contract Act, 1872",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Company Details",
        description: "Enter employer information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyAddress", label: "Company Address", type: "textarea", required: true },
          { name: "hrName", label: "HR Contact Name", type: "text", required: true },
          { name: "hrEmail", label: "HR Email", type: "email", required: true },
        ],
      },
      {
        title: "Candidate Details",
        description: "Enter candidate information",
        icon: User,
        fields: [
          { name: "candidateName", label: "Candidate Full Name", type: "text", required: true },
          { name: "candidateEmail", label: "Candidate Email", type: "email", required: true },
          { name: "candidateAddress", label: "Candidate Address", type: "textarea", required: true },
        ],
      },
      {
        title: "Offer Terms",
        description: "Define the job offer details",
        icon: FileSignature,
        fields: [
          { name: "designation", label: "Designation", type: "text", required: true },
          { name: "department", label: "Department", type: "text", required: true },
          { name: "joiningDate", label: "Proposed Joining Date", type: "date", required: true },
          { name: "workLocation", label: "Work Location", type: "text", required: true },
          { name: "ctc", label: "Annual CTC (INR)", type: "number", required: true },
          { name: "probationPeriod", label: "Probation Period (Months)", type: "number", required: true, placeholder: "6" },
          { name: "offerValidity", label: "Offer Valid Until", type: "date", required: true },
          { name: "bgvRequired", label: "Background Verification Required", type: "boolean", required: false, defaultValue: true },
          { name: "documentsRequired", label: "Documents Required", type: "textarea", required: false, placeholder: "ID proof, address proof, education certificates, experience letters" },
        ],
      },
    ],
  },
  "service-agreement": {
    name: "Service Agreement (MSA)",
    description: "Master Service Agreement for service providers",
    category: "Business Agreements",
    lawReference: "Indian Contract Act, 1872; GST Act",
    estimatedTime: "15-20 min",
    steps: [
      {
        title: "Service Provider Details",
        description: "Enter service provider information",
        icon: Building,
        fields: [
          { name: "providerName", label: "Company/Business Name", type: "text", required: true },
          { name: "providerType", label: "Entity Type", type: "select", required: true, options: ["Pvt Ltd", "LLP", "Partnership", "Proprietorship", "Public Ltd"] },
          { name: "providerAddress", label: "Registered Address", type: "textarea", required: true },
          { name: "providerPAN", label: "PAN", type: "pan", required: true },
          { name: "providerGSTIN", label: "GSTIN", type: "gstin", required: true },
          { name: "providerEmail", label: "Business Email", type: "email", required: true },
        ],
      },
      {
        title: "Client Details",
        description: "Enter client information",
        icon: User,
        fields: [
          { name: "clientName", label: "Client Name", type: "text", required: true },
          { name: "clientType", label: "Entity Type", type: "select", required: true, options: ["Pvt Ltd", "LLP", "Partnership", "Proprietorship", "Public Ltd", "Individual"] },
          { name: "clientAddress", label: "Address", type: "textarea", required: true },
          { name: "clientPAN", label: "PAN", type: "pan", required: true },
          { name: "clientGSTIN", label: "GSTIN", type: "gstin", required: false },
          { name: "clientEmail", label: "Email", type: "email", required: true },
        ],
      },
      {
        title: "Service Terms",
        description: "Define the services and scope",
        icon: FileSignature,
        fields: [
          { name: "serviceDescription", label: "Description of Services", type: "textarea", required: true },
          { name: "deliverables", label: "Key Deliverables", type: "textarea", required: true },
          { name: "slaTerms", label: "SLA Terms", type: "textarea", required: false, placeholder: "Response time, uptime guarantees, support hours" },
          { name: "agreementTerm", label: "Agreement Term (Months)", type: "number", required: true },
          { name: "autoRenewal", label: "Auto Renewal", type: "boolean", required: false, defaultValue: true },
          { name: "renewalNoticeDays", label: "Renewal Notice Period (Days)", type: "number", required: false, placeholder: "30" },
        ],
      },
      {
        title: "Payment & Legal",
        description: "Payment terms and legal clauses",
        icon: CreditCard,
        fields: [
          { name: "feeAmount", label: "Service Fee (INR)", type: "number", required: true },
          { name: "feeType", label: "Fee Type", type: "select", required: true, options: ["Monthly Retainer", "Per Project", "Hourly", "Annual Contract"] },
          { name: "paymentTerms", label: "Payment Terms (Days)", type: "number", required: true, placeholder: "30" },
          { name: "gstRate", label: "GST Rate (%)", type: "number", required: true, defaultValue: 18 },
          { name: "tdsApplicable", label: "TDS Applicable", type: "boolean", required: false, defaultValue: true },
          { name: "liabilityCap", label: "Liability Cap (INR)", type: "number", required: false, helpText: "Leave blank for unlimited" },
          { name: "terminationNoticeDays", label: "Termination Notice (Days)", type: "number", required: true, placeholder: "30" },
          { name: "governingLaw", label: "Governing Law", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana"] },
          { name: "disputeResolution", label: "Dispute Resolution", type: "select", required: true, options: ["Arbitration", "Mediation then Arbitration", "Court Jurisdiction"] },
        ],
      },
    ],
  },
  "vendor-agreement": {
    name: "Vendor Agreement",
    description: "Agreement for engaging vendors and suppliers",
    category: "Business Agreements",
    lawReference: "Indian Contract Act, 1872",
    estimatedTime: "10-15 min",
    steps: [
      {
        title: "Company Details",
        description: "Your company information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyAddress", label: "Address", type: "textarea", required: true },
          { name: "companyPAN", label: "PAN", type: "pan", required: true },
          { name: "companyGSTIN", label: "GSTIN", type: "gstin", required: true },
        ],
      },
      {
        title: "Vendor Details",
        description: "Vendor/Supplier information",
        icon: User,
        fields: [
          { name: "vendorName", label: "Vendor Name", type: "text", required: true },
          { name: "vendorType", label: "Vendor Type", type: "select", required: true, options: ["Manufacturer", "Distributor", "Service Provider", "Contractor", "Other"] },
          { name: "vendorAddress", label: "Address", type: "textarea", required: true },
          { name: "vendorPAN", label: "PAN", type: "pan", required: true },
          { name: "vendorGSTIN", label: "GSTIN", type: "gstin", required: true },
        ],
      },
      {
        title: "Agreement Terms",
        description: "Define vendor engagement terms",
        icon: FileSignature,
        fields: [
          { name: "productsServices", label: "Products/Services Supplied", type: "textarea", required: true },
          { name: "qualityStandards", label: "Quality Standards", type: "textarea", required: false },
          { name: "deliveryTerms", label: "Delivery Terms", type: "textarea", required: true },
          { name: "paymentTerms", label: "Payment Terms", type: "select", required: true, options: ["Advance", "COD", "Net 15", "Net 30", "Net 45", "Net 60"] },
          { name: "warrantyPeriod", label: "Warranty Period (Months)", type: "number", required: false },
          { name: "exclusivity", label: "Exclusive Arrangement", type: "boolean", required: false, defaultValue: false },
        ],
      },
    ],
  },
  "partnership-deed": {
    name: "Partnership Deed",
    description: "Agreement for partnership firm formation",
    category: "Business Agreements",
    lawReference: "Indian Partnership Act, 1932",
    estimatedTime: "20-30 min",
    steps: [
      {
        title: "Partnership Firm Details",
        description: "Enter firm information",
        icon: Building,
        fields: [
          { name: "firmName", label: "Partnership Firm Name", type: "text", required: true },
          { name: "firmAddress", label: "Principal Place of Business", type: "textarea", required: true },
          { name: "businessNature", label: "Nature of Business", type: "textarea", required: true },
          { name: "commencementDate", label: "Date of Commencement", type: "date", required: true },
          { name: "firmPAN", label: "Firm PAN (if allotted)", type: "pan", required: false },
        ],
      },
      {
        title: "Partner 1 Details",
        description: "First partner information",
        icon: User,
        fields: [
          { name: "partner1Name", label: "Full Name", type: "text", required: true },
          { name: "partner1Address", label: "Address", type: "textarea", required: true },
          { name: "partner1PAN", label: "PAN", type: "pan", required: true },
          { name: "partner1Capital", label: "Capital Contribution (INR)", type: "number", required: true },
          { name: "partner1ProfitShare", label: "Profit Sharing Ratio (%)", type: "number", required: true },
          { name: "partner1Salary", label: "Monthly Salary (INR)", type: "number", required: false },
        ],
      },
      {
        title: "Partner 2 Details",
        description: "Second partner information",
        icon: User,
        fields: [
          { name: "partner2Name", label: "Full Name", type: "text", required: true },
          { name: "partner2Address", label: "Address", type: "textarea", required: true },
          { name: "partner2PAN", label: "PAN", type: "pan", required: true },
          { name: "partner2Capital", label: "Capital Contribution (INR)", type: "number", required: true },
          { name: "partner2ProfitShare", label: "Profit Sharing Ratio (%)", type: "number", required: true },
          { name: "partner2Salary", label: "Monthly Salary (INR)", type: "number", required: false },
        ],
      },
      {
        title: "Partnership Terms",
        description: "Define partnership governance",
        icon: Scale,
        fields: [
          { name: "bankingArrangement", label: "Banking Arrangement", type: "select", required: true, options: ["Joint Operation", "Either Partner Can Operate", "Designated Partner Only"] },
          { name: "interestOnCapital", label: "Interest on Capital (%)", type: "number", required: false, placeholder: "12" },
          { name: "interestOnDrawings", label: "Interest on Drawings (%)", type: "number", required: false },
          { name: "decisionMaking", label: "Decision Making", type: "select", required: true, options: ["Unanimous", "Majority", "As per Capital Ratio"] },
          { name: "admissionOfPartner", label: "Admission of New Partner", type: "select", required: true, options: ["Unanimous Consent Required", "Majority Consent"] },
          { name: "retirementNotice", label: "Retirement Notice Period (Months)", type: "number", required: true, placeholder: "3" },
          { name: "dissolutionTerms", label: "Dissolution Terms", type: "textarea", required: true },
          { name: "arbitration", label: "Arbitration Clause", type: "boolean", required: false, defaultValue: true },
        ],
      },
    ],
  },
  "mou-loi": {
    name: "MOU / Letter of Intent",
    description: "Non-binding memorandum for preliminary discussions",
    category: "Business Agreements",
    lawReference: "Indian Contract Act, 1872",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Party 1 Details",
        description: "First party information",
        icon: Building,
        fields: [
          { name: "party1Name", label: "Name/Company Name", type: "text", required: true },
          { name: "party1Type", label: "Entity Type", type: "select", required: true, options: ["Company", "LLP", "Partnership", "Individual", "Other"] },
          { name: "party1Address", label: "Address", type: "textarea", required: true },
          { name: "party1Representative", label: "Authorized Representative", type: "text", required: true },
          { name: "party1Email", label: "Email", type: "email", required: true },
        ],
      },
      {
        title: "Party 2 Details",
        description: "Second party information",
        icon: User,
        fields: [
          { name: "party2Name", label: "Name/Company Name", type: "text", required: true },
          { name: "party2Type", label: "Entity Type", type: "select", required: true, options: ["Company", "LLP", "Partnership", "Individual", "Other"] },
          { name: "party2Address", label: "Address", type: "textarea", required: true },
          { name: "party2Representative", label: "Authorized Representative", type: "text", required: true },
          { name: "party2Email", label: "Email", type: "email", required: true },
        ],
      },
      {
        title: "MOU Terms",
        description: "Define the understanding",
        icon: FileSignature,
        fields: [
          { name: "documentType", label: "Document Type", type: "select", required: true, options: ["MOU (Memorandum of Understanding)", "LOI (Letter of Intent)", "Term Sheet"] },
          { name: "purpose", label: "Purpose of MOU/LOI", type: "textarea", required: true, placeholder: "Exploring potential business collaboration for..." },
          { name: "keyTerms", label: "Key Terms/Understanding", type: "textarea", required: true },
          { name: "exclusivity", label: "Exclusivity Period (Days)", type: "number", required: false, helpText: "Leave blank for non-exclusive" },
          { name: "validityPeriod", label: "Validity Period (Days)", type: "number", required: true, placeholder: "90" },
          { name: "confidentiality", label: "Confidentiality Clause", type: "boolean", required: false, defaultValue: true },
          { name: "bindingClauses", label: "Binding Clauses", type: "textarea", required: false, placeholder: "Confidentiality, exclusivity, costs (specify which clauses are binding)" },
          { name: "governingLaw", label: "Governing Law", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Gujarat"] },
        ],
      },
    ],
  },
  "privacy-policy": {
    name: "Privacy Policy",
    description: "DPDP Act 2023 compliant privacy policy",
    category: "Compliance Documents",
    lawReference: "Digital Personal Data Protection Act, 2023",
    estimatedTime: "10-15 min",
    steps: [
      {
        title: "Company Details",
        description: "Data fiduciary information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyWebsite", label: "Website URL", type: "text", required: true, placeholder: "https://www.example.com" },
          { name: "companyAddress", label: "Registered Address", type: "textarea", required: true },
          { name: "grievanceOfficer", label: "Grievance Officer Name", type: "text", required: true, helpText: "As required under DPDP Act" },
          { name: "grievanceEmail", label: "Grievance Officer Email", type: "email", required: true },
          { name: "dpoName", label: "Data Protection Officer (if applicable)", type: "text", required: false },
        ],
      },
      {
        title: "Data Collection",
        description: "Types of data collected",
        icon: FileSignature,
        fields: [
          { name: "personalDataTypes", label: "Types of Personal Data Collected", type: "textarea", required: true, placeholder: "Name, email, phone, address, payment information, etc." },
          { name: "sensitiveData", label: "Sensitive Personal Data Collected", type: "textarea", required: false, placeholder: "Financial data, health data, biometric data (if any)" },
          { name: "collectionMethods", label: "Collection Methods", type: "textarea", required: true, placeholder: "Website forms, mobile app, cookies, third-party integrations" },
          { name: "purposeOfCollection", label: "Purpose of Collection", type: "textarea", required: true, placeholder: "Service delivery, marketing, analytics, legal compliance" },
          { name: "cookiesUsed", label: "Cookies/Tracking Technologies", type: "boolean", required: false, defaultValue: true },
          { name: "thirdPartySharing", label: "Third Party Data Sharing", type: "boolean", required: false, defaultValue: true },
        ],
      },
      {
        title: "User Rights & Retention",
        description: "Data subject rights and retention policy",
        icon: Scale,
        fields: [
          { name: "retentionPeriod", label: "Data Retention Period", type: "text", required: true, placeholder: "As long as necessary for the purposes collected, or as required by law" },
          { name: "rightToAccess", label: "Right to Access", type: "boolean", required: false, defaultValue: true },
          { name: "rightToCorrection", label: "Right to Correction", type: "boolean", required: false, defaultValue: true },
          { name: "rightToErasure", label: "Right to Erasure", type: "boolean", required: false, defaultValue: true },
          { name: "rightToPortability", label: "Right to Data Portability", type: "boolean", required: false, defaultValue: true },
          { name: "consentWithdrawal", label: "Consent Withdrawal Process", type: "textarea", required: true, placeholder: "Users can withdraw consent by emailing privacy@company.com" },
          { name: "childrenData", label: "Children's Data Collection", type: "boolean", required: false, defaultValue: false, helpText: "Do you collect data from children under 18?" },
          { name: "crossBorderTransfer", label: "Cross-Border Data Transfer", type: "boolean", required: false, defaultValue: false },
        ],
      },
    ],
  },
  "terms-of-service": {
    name: "Terms of Service",
    description: "Website/app terms and conditions",
    category: "Compliance Documents",
    lawReference: "IT Act, 2000; Consumer Protection Act, 2019",
    estimatedTime: "10-15 min",
    steps: [
      {
        title: "Company Details",
        description: "Service provider information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyWebsite", label: "Website/App Name", type: "text", required: true },
          { name: "companyAddress", label: "Registered Address", type: "textarea", required: true },
          { name: "supportEmail", label: "Support Email", type: "email", required: true },
          { name: "serviceType", label: "Type of Service", type: "select", required: true, options: ["SaaS Platform", "E-commerce", "Marketplace", "Content Platform", "Mobile App", "Other"] },
        ],
      },
      {
        title: "Service Terms",
        description: "Define service usage terms",
        icon: FileSignature,
        fields: [
          { name: "serviceDescription", label: "Description of Services", type: "textarea", required: true },
          { name: "eligibility", label: "User Eligibility", type: "textarea", required: true, placeholder: "Users must be 18 years or older, valid Indian residents, etc." },
          { name: "accountTerms", label: "Account Creation Terms", type: "textarea", required: false },
          { name: "prohibitedActivities", label: "Prohibited Activities", type: "textarea", required: true, placeholder: "Illegal activities, harassment, spam, data scraping, etc." },
          { name: "subscriptionPlans", label: "Subscription/Pricing Plans", type: "boolean", required: false, defaultValue: false },
          { name: "refundPolicy", label: "Refund Policy", type: "textarea", required: false },
        ],
      },
      {
        title: "Legal Terms",
        description: "Liability and legal provisions",
        icon: Scale,
        fields: [
          { name: "ipOwnership", label: "Intellectual Property Ownership", type: "textarea", required: true, placeholder: "All content, trademarks, and IP belong to the company" },
          { name: "userContent", label: "User Generated Content Policy", type: "textarea", required: false },
          { name: "disclaimers", label: "Disclaimers", type: "textarea", required: true, placeholder: "Service provided as-is, no warranties, etc." },
          { name: "limitationOfLiability", label: "Limitation of Liability", type: "textarea", required: true },
          { name: "indemnification", label: "Indemnification Clause", type: "boolean", required: false, defaultValue: true },
          { name: "terminationRights", label: "Termination Rights", type: "textarea", required: true },
          { name: "governingLaw", label: "Governing Law", type: "select", required: true, options: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana"] },
          { name: "disputeResolution", label: "Dispute Resolution", type: "select", required: true, options: ["Arbitration", "Courts of Jurisdiction", "Online Dispute Resolution"] },
        ],
      },
    ],
  },
  "board-resolution": {
    name: "Board Resolution",
    description: "Format for board meeting resolutions",
    category: "Compliance Documents",
    lawReference: "Companies Act, 2013 (Section 179)",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Company Details",
        description: "Enter company information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "cin", label: "CIN", type: "text", required: true },
          { name: "companyAddress", label: "Registered Office", type: "textarea", required: true },
        ],
      },
      {
        title: "Meeting Details",
        description: "Board meeting information",
        icon: Calendar,
        fields: [
          { name: "meetingType", label: "Meeting Type", type: "select", required: true, options: ["Board Meeting", "Circular Resolution", "Committee Meeting"] },
          { name: "meetingDate", label: "Meeting Date", type: "date", required: true },
          { name: "meetingTime", label: "Meeting Time", type: "text", required: true, placeholder: "11:00 AM" },
          { name: "meetingVenue", label: "Venue/Mode", type: "text", required: true, placeholder: "Registered Office / Video Conference" },
          { name: "quorumPresent", label: "Quorum Present", type: "boolean", required: false, defaultValue: true },
          { name: "chairperson", label: "Chairperson", type: "text", required: true },
        ],
      },
      {
        title: "Resolution Details",
        description: "Define the resolution",
        icon: FileSignature,
        fields: [
          { name: "resolutionType", label: "Resolution Type", type: "select", required: true, options: ["Ordinary Resolution", "Special Resolution", "Board Resolution"] },
          { name: "resolutionSubject", label: "Subject of Resolution", type: "text", required: true, placeholder: "Approval of Annual Accounts" },
          { name: "resolutionText", label: "Resolution Text", type: "textarea", required: true, placeholder: "RESOLVED THAT..." },
          { name: "authorizedPerson", label: "Authorized Person (if any)", type: "text", required: false },
          { name: "attachments", label: "Attachments/Enclosures", type: "textarea", required: false },
          { name: "votingResult", label: "Voting Result", type: "select", required: true, options: ["Unanimously Approved", "Approved by Majority", "Approved with Dissent"] },
        ],
      },
    ],
  },
  "website-disclaimer": {
    name: "Website Disclaimer",
    description: "Legal disclaimers for your website",
    category: "Compliance Documents",
    lawReference: "IT Act, 2000; Indian Contract Act, 1872",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Website Details",
        description: "Enter website information",
        icon: Building,
        fields: [
          { name: "companyName", label: "Company/Owner Name", type: "text", required: true },
          { name: "websiteName", label: "Website Name", type: "text", required: true },
          { name: "websiteUrl", label: "Website URL", type: "text", required: true, placeholder: "https://www.example.com" },
          { name: "contactEmail", label: "Contact Email", type: "email", required: true },
        ],
      },
      {
        title: "Disclaimer Content",
        description: "Define disclaimer scope",
        icon: FileSignature,
        fields: [
          { name: "websiteType", label: "Website Type", type: "select", required: true, options: ["Informational", "E-commerce", "Blog", "Professional Services", "Financial Services", "Legal Services", "Healthcare", "Other"] },
          { name: "generalDisclaimer", label: "Include General Disclaimer", type: "boolean", required: false, defaultValue: true },
          { name: "professionalAdvice", label: "Professional Advice Disclaimer", type: "boolean", required: false, defaultValue: true, helpText: "Content is not professional advice" },
          { name: "accuracyDisclaimer", label: "Accuracy Disclaimer", type: "boolean", required: false, defaultValue: true },
          { name: "externalLinks", label: "External Links Disclaimer", type: "boolean", required: false, defaultValue: true },
          { name: "testimonials", label: "Testimonials Disclaimer", type: "boolean", required: false, defaultValue: false },
          { name: "affiliateDisclosure", label: "Affiliate Disclosure", type: "boolean", required: false, defaultValue: false },
          { name: "copyrightNotice", label: "Copyright Notice", type: "boolean", required: false, defaultValue: true },
          { name: "additionalDisclaimers", label: "Additional Disclaimers", type: "textarea", required: false, placeholder: "Any specific disclaimers for your industry" },
        ],
      },
    ],
  },
};

export default function ContractGeneratorPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const config = CONTRACT_CONFIGS[type];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [contractId, setContractId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Initialize form data with defaults
  useState(() => {
    if (config) {
      const defaults: Record<string, unknown> = {};
      config.steps.forEach((step) => {
        step.fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            defaults[field.name] = field.defaultValue;
          } else if (field.type === "boolean") {
            defaults[field.name] = false;
          } else {
            defaults[field.name] = "";
          }
        });
      });
      setFormData(defaults);
    }
  });

  const totalSteps = config?.steps.length || 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const currentStepConfig = config?.steps[currentStep];

  // Validate current step
  const isCurrentStepValid = useMemo(() => {
    if (!currentStepConfig) return false;
    return currentStepConfig.fields
      .filter((f) => f.required)
      .every((f) => {
        const value = formData[f.name];
        if (typeof value === "boolean") return true;
        if (typeof value === "number") return value !== undefined;
        return value && String(value).trim() !== "";
      });
  }, [currentStepConfig, formData]);

  function updateField(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      const response = await contractsApi.generateContract(type, formData);
      setGeneratedContent(response.contract.content);
      setContractId(response.contract.id);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate contract");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDownload(format: "pdf" | "docx") {
    if (!contractId) return;
    try {
      setDownloading(true);
      const blob = await contractsApi.downloadContract(contractId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config?.name?.replace(/\s+/g, "_") || "contract"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    if (!generatedContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Build via DOM APIs to avoid XSS — `generatedContent` is backend-supplied
    // and previously interpolated raw into a `document.write` template literal.
    const doc = printWindow.document;
    doc.open();
    doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
    doc.close();

    const titleEl = doc.createElement("title");
    titleEl.textContent = config?.name || "Contract";
    doc.head.appendChild(titleEl);

    const styleEl = doc.createElement("style");
    styleEl.textContent = `
      body { font-family: 'Georgia', serif; line-height: 1.8; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
      h1 { font-size: 24px; text-align: center; margin-bottom: 30px; }
      h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
      h3 { font-size: 15px; margin-top: 18px; }
      p { margin: 8px 0; text-align: justify; }
      ul, ol { margin: 8px 0 8px 20px; }
      li { margin: 4px 0; }
      strong { font-weight: 600; }
      hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    `;
    doc.head.appendChild(styleEl);

    generatedContent.split(/\n+/).forEach((line) => {
      const p = doc.createElement("p");
      p.textContent = line;
      doc.body.appendChild(p);
    });

    printWindow.print();
  }

  function renderField(field: (typeof currentStepConfig)["fields"][number]) {
    const value = formData[field.name];

    const commonProps = {
      id: field.name,
      required: field.required,
    };

    switch (field.type) {
      case "text":
      case "pan":
      case "gstin":
      case "email":
      case "phone":
        return (
          <Input
            {...commonProps}
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            rows={4}
          />
        );

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            placeholder={field.placeholder || ""}
            value={(value as string | number) ?? ""}
            onChange={(e) =>
              updateField(field.name, e.target.value === "" ? "" : Number(e.target.value))
            }
            step={field.step || 1}
          />
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => updateField(field.name, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <Switch
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => updateField(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm text-muted-foreground cursor-pointer">
              {value ? "Yes" : "No"}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
          />
        );
    }
  }

  // Contract not found
  if (!config) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/contracts">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-foreground">Contract Not Found</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Contract Type Not Found</h2>
              <p className="text-muted-foreground">
                The requested contract type &quot;{type}&quot; does not exist.
              </p>
              <Link href="/dashboard/contracts">
                <Button>Browse All Contracts</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generated contract view
  if (generated && generatedContent) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/contracts">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{config.name}</h1>
                  <p className="text-sm text-muted-foreground">Contract generated successfully</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <Edit3 className="h-4 w-4 mr-1" /> Raw
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("docx")}
                  disabled={downloading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  DOCX
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownload("pdf")}
                  disabled={downloading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Success Banner */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-400">
                        Contract Generated Successfully
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Your {config.name} has been generated using AI. Review the content before
                        downloading. Always have a qualified lawyer review important contracts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Law Reference */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {config.lawReference}
                </Badge>
                <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3" />
                  AI-Generated
                </Badge>
              </div>

              {/* Document Content */}
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Generated Contract
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {showPreview ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto">
                      {generatedContent}
                    </pre>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerated(false);
                    setGeneratedContent("");
                    setContractId(null);
                    setCurrentStep(0);
                  }}
                >
                  Generate Another
                </Button>
                <Link href="/dashboard/contracts">
                  <Button variant="ghost">Back to Contracts</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form wizard view
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0 lg:w-1/2 lg:flex-none">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/contracts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate leading-tight">{config.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{config.description}</p>
            </div>
            <DraftControls
              type={type}
              contractName={config.name}
              formData={formData}
              onLoad={(data) => setFormData(data)}
              onClear={() => {
                if (config) {
                  const defaults: Record<string, unknown> = {};
                  config.steps.forEach((step) => {
                    step.fields.forEach((field) => {
                      if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue;
                      else if (field.type === "boolean") defaults[field.name] = false;
                      else defaults[field.name] = "";
                    });
                  });
                  setFormData(defaults);
                }
                setCurrentStep(0);
              }}
              className="hidden md:flex shrink-0"
            />
            <div className="hidden 2xl:flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {config.estimatedTime}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {config.lawReference}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden gap-1.5"
              onClick={() => setShowPreview((v) => !v)}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Hide" : "Preview"}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-3">
                  {config.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-1.5 text-xs ${
                        index <= currentStep
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          index < currentStep
                            ? "bg-primary text-primary-foreground"
                            : index === currentStep
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="hidden sm:inline">{step.title.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Step Form */}
            {currentStepConfig && (
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <currentStepConfig.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{currentStepConfig.title}</CardTitle>
                      <CardDescription>{currentStepConfig.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {currentStepConfig.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm font-medium">
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-0.5">*</span>
                          )}
                        </Label>
                        {renderField(field)}
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button onClick={handleNext} disabled={!isCurrentStepValid}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!isCurrentStepValid || generating}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Contract
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Info Banner */}
            <Card className="shadow-sm border-border bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Legal Disclaimer</p>
                    <p>
                      This contract is generated using AI and Indian legal templates. While it
                      follows standard legal practices, it should be reviewed by a qualified
                      lawyer before execution. JurisGPT is not liable for any legal consequences
                      arising from the use of these documents.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── Right: Live preview pane ───────────────────────────── */}
      <aside
        className={cn(
          "lg:flex lg:w-1/2 lg:flex-none",
          showPreview ? "fixed inset-0 z-40 flex bg-background lg:static lg:z-auto" : "hidden lg:flex"
        )}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden absolute top-3 right-3 z-10"
          onClick={() => setShowPreview(false)}
        >
          Close
        </Button>
        <LiveContractPreview
          type={type}
          config={config}
          formData={formData}
          className="w-full"
        />
      </aside>
    </div>
  );
}
