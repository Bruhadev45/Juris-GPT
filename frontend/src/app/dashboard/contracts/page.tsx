"use client";

import { useState, useMemo } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Search,
  Briefcase,
  Users,
  Building2,
  Shield,
  Scale,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpen,
  Clock,
  Star,
} from "lucide-react";

// Contract categories with Indian law templates
const CONTRACT_CATEGORIES = [
  {
    id: "startup-essentials",
    name: "Startup Essentials",
    description: "Essential legal documents for founding and scaling your startup",
    icon: Briefcase,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    iconColor: "text-violet-600",
    contracts: [
      {
        id: "nda",
        name: "Non-Disclosure Agreement (NDA)",
        description:
          "Protect confidential information shared between parties. Essential for investor meetings, partnerships, and hiring.",
        lawReference: "Indian Contract Act, 1872",
        popular: true,
        estimatedTime: "5-10 min",
      },
      {
        id: "founders-agreement",
        name: "Founder's Agreement",
        description:
          "Define roles, equity split, vesting, IP assignment, and exit clauses among co-founders.",
        lawReference: "Companies Act, 2013",
        popular: true,
        estimatedTime: "15-20 min",
      },
      {
        id: "shareholder-agreement",
        name: "Shareholder Agreement (SHA)",
        description:
          "Comprehensive agreement covering voting rights, drag-along, tag-along, anti-dilution, and board composition.",
        lawReference: "Companies Act, 2013",
        popular: false,
        estimatedTime: "20-30 min",
      },
      {
        id: "esop-scheme",
        name: "ESOP Scheme Document",
        description:
          "Employee Stock Option Plan with vesting schedules, exercise price, and SEBI compliance for listed companies.",
        lawReference: "Companies Act, 2013 (Section 62)",
        popular: false,
        estimatedTime: "15-20 min",
      },
    ],
  },
  {
    id: "employment-hr",
    name: "Employment & HR",
    description: "Compliant employment contracts adhering to Indian labour laws",
    icon: Users,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    iconColor: "text-blue-600",
    contracts: [
      {
        id: "employment-contract",
        name: "Employment Contract",
        description:
          "Full-time employment agreement with CTC, PF/ESI deductions, leave policy, and termination clauses.",
        lawReference: "Indian Labour Laws, PF Act, ESI Act",
        popular: true,
        estimatedTime: "10-15 min",
      },
      {
        id: "consultant-agreement",
        name: "Consultant/Freelancer Agreement",
        description:
          "Independent contractor agreement with TDS 194J compliance, GST invoicing, and deliverables.",
        lawReference: "Income Tax Act (194J), GST Act",
        popular: true,
        estimatedTime: "10-15 min",
      },
      {
        id: "internship-agreement",
        name: "Internship Agreement",
        description:
          "Paid/unpaid internship with learning objectives, stipend, and conversion to full-time clauses.",
        lawReference: "Indian Contract Act, 1872",
        popular: false,
        estimatedTime: "5-10 min",
      },
      {
        id: "offer-letter",
        name: "Offer Letter",
        description:
          "Formal job offer with compensation, joining date, background verification, and conditions precedent.",
        lawReference: "Indian Contract Act, 1872",
        popular: true,
        estimatedTime: "5-10 min",
      },
    ],
  },
  {
    id: "business-agreements",
    name: "Business Agreements",
    description: "Commercial contracts for partnerships, vendors, and service providers",
    icon: Building2,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    iconColor: "text-emerald-600",
    contracts: [
      {
        id: "service-agreement",
        name: "Service Agreement (MSA)",
        description:
          "Master Service Agreement with scope, SLAs, payment terms, GST compliance, and liability caps.",
        lawReference: "Indian Contract Act, 1872; GST Act",
        popular: true,
        estimatedTime: "15-20 min",
      },
      {
        id: "vendor-agreement",
        name: "Vendor Agreement",
        description:
          "Vendor onboarding contract with quality standards, delivery timelines, and payment terms.",
        lawReference: "Indian Contract Act, 1872",
        popular: false,
        estimatedTime: "10-15 min",
      },
      {
        id: "partnership-deed",
        name: "Partnership Deed",
        description:
          "Define profit sharing, capital contribution, management duties, and dissolution terms for partnership firms.",
        lawReference: "Indian Partnership Act, 1932",
        popular: false,
        estimatedTime: "20-30 min",
      },
      {
        id: "mou-loi",
        name: "MOU / Letter of Intent",
        description:
          "Non-binding memorandum of understanding for preliminary discussions, term sheets, and deal structuring.",
        lawReference: "Indian Contract Act, 1872",
        popular: true,
        estimatedTime: "5-10 min",
      },
    ],
  },
  {
    id: "compliance-documents",
    name: "Compliance Documents",
    description: "Statutory compliance documents for digital businesses",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    iconColor: "text-amber-600",
    contracts: [
      {
        id: "privacy-policy",
        name: "Privacy Policy",
        description:
          "DPDP Act 2023 compliant privacy policy with data collection, processing, storage, and user rights.",
        lawReference: "Digital Personal Data Protection Act, 2023",
        popular: true,
        estimatedTime: "10-15 min",
      },
      {
        id: "terms-of-service",
        name: "Terms of Service",
        description:
          "Website/app terms covering user conduct, intellectual property, disclaimers, and dispute resolution.",
        lawReference: "IT Act, 2000; Consumer Protection Act, 2019",
        popular: true,
        estimatedTime: "10-15 min",
      },
      {
        id: "board-resolution",
        name: "Board Resolution",
        description:
          "Format for board meetings, circular resolutions, and statutory filings under Companies Act.",
        lawReference: "Companies Act, 2013 (Section 179)",
        popular: false,
        estimatedTime: "5-10 min",
      },
      {
        id: "website-disclaimer",
        name: "Website Disclaimer",
        description:
          "Liability limitations, warranty disclaimers, and legal notices for your website or application.",
        lawReference: "IT Act, 2000; Indian Contract Act, 1872",
        popular: false,
        estimatedTime: "5-10 min",
      },
    ],
  },
];

function categoryBadgeColor(categoryId: string) {
  const colors: Record<string, string> = {
    "startup-essentials": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "employment-hr": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "business-agreements": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "compliance-documents": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  return colors[categoryId] || "bg-gray-100 text-gray-700";
}

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter contracts based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim() && !selectedCategory) {
      return CONTRACT_CATEGORIES;
    }

    const query = searchQuery.toLowerCase().trim();

    return CONTRACT_CATEGORIES.map((category) => {
      // Filter by category if selected
      if (selectedCategory && category.id !== selectedCategory) {
        return { ...category, contracts: [] };
      }

      // Filter contracts by search query
      const filteredContracts = category.contracts.filter((contract) => {
        if (!query) return true;
        return (
          contract.name.toLowerCase().includes(query) ||
          contract.description.toLowerCase().includes(query) ||
          contract.lawReference.toLowerCase().includes(query)
        );
      });

      return { ...category, contracts: filteredContracts };
    }).filter((category) => category.contracts.length > 0);
  }, [searchQuery, selectedCategory]);

  // Get total contracts count
  const totalContracts = CONTRACT_CATEGORIES.reduce(
    (acc, cat) => acc + cat.contracts.length,
    0
  );

  // Get popular contracts
  const popularContracts = CONTRACT_CATEGORIES.flatMap((cat) =>
    cat.contracts
      .filter((c) => c.popular)
      .map((c) => ({ ...c, categoryId: cat.id, categoryName: cat.name }))
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Contract Generator
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Generate legally compliant contracts tailored for Indian startups and MSMEs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {totalContracts} Templates
              </Badge>
              <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts by name, description, or law reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {CONTRACT_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                    className="gap-1"
                  >
                    <category.icon className="h-3.5 w-3.5" />
                    {category.name.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Popular Contracts */}
            {!searchQuery && !selectedCategory && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-foreground">Popular Templates</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularContracts.slice(0, 6).map((contract) => (
                    <Link
                      key={contract.id}
                      href={`/dashboard/contracts/${contract.id}`}
                    >
                      <Card className="h-full shadow-sm border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${categoryBadgeColor(contract.categoryId)}`}
                            >
                              {contract.categoryName.split(" ")[0]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                            >
                              <Star className="h-3 w-3 mr-0.5 fill-current" />
                              Popular
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {contract.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {contract.description}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {contract.estimatedTime}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Categories */}
            <Accordion
              type="multiple"
              defaultValue={CONTRACT_CATEGORIES.map((c) => c.id)}
              className="space-y-4"
            >
              {filteredCategories.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border rounded-lg bg-card shadow-sm"
                >
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}
                      >
                        <category.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {category.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {category.contracts.length} templates
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {category.contracts.map((contract) => (
                        <Card
                          key={contract.id}
                          className="shadow-sm border-border hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${category.color}`}
                                >
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <CardTitle className="text-base leading-tight">
                                    {contract.name}
                                  </CardTitle>
                                  <CardDescription className="mt-1 line-clamp-2">
                                    {contract.description}
                                  </CardDescription>
                                </div>
                              </div>
                              {contract.popular && (
                                <Badge
                                  variant="outline"
                                  className="flex-shrink-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                                >
                                  <Star className="h-3 w-3 mr-0.5 fill-current" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                              >
                                <BookOpen className="h-3 w-3" />
                                {contract.lawReference}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{contract.estimatedTime}</span>
                              </div>
                              <Link href={`/dashboard/contracts/${contract.id}`}>
                                <Button
                                  size="sm"
                                  className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  Generate
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* No Results */}
            {filteredCategories.length === 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-8 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    No contracts found
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Try adjusting your search query or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Banner */}
            <Card className="shadow-sm border-border bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      AI-Powered Contract Generation
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our contracts are generated using advanced AI trained on Indian legal frameworks.
                      Each template is reviewed by legal experts and customized based on your specific requirements.
                      Always have a qualified lawyer review important contracts before signing.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        Indian Contract Act, 1872
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Companies Act, 2013
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        DPDP Act, 2023
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        GST Compliant
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
