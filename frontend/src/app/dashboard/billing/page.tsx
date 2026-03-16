"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Crown,
  IndianRupee,
  Download,
  ArrowRight,
  Calendar,
  FileText,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Naagrik",
    price: 0,
    period: "Free forever",
    description: "For individuals exploring legal basics",
    icon: Zap,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    features: [
      "5 AI consultations/month",
      "Basic legal search",
      "1 document generation",
      "Community support",
    ],
    current: true,
  },
  {
    name: "Udyami",
    price: 999,
    period: "/month",
    description: "For startups and small businesses",
    icon: Building2,
    color: "bg-primary/10 text-primary",
    popular: true,
    features: [
      "Unlimited AI consultations",
      "Advanced legal research",
      "10 documents/month",
      "Contract analyzer",
      "Compliance tracker",
      "Email support",
    ],
  },
  {
    name: "Vyapar",
    price: 4999,
    period: "/month",
    description: "For growing businesses",
    icon: Crown,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    features: [
      "Everything in Udyami",
      "Unlimited documents",
      "Lawyer review workflow",
      "5 lawyer review credits/month",
      "Team collaboration (5 members)",
      "Document vault (10 GB)",
      "Priority support",
      "API access",
    ],
  },
  {
    name: "Nigam",
    price: null,
    period: "Custom",
    description: "For enterprises and law firms",
    icon: Building2,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    features: [
      "Everything in Vyapar",
      "Unlimited team members",
      "Unlimited lawyer review credits",
      "Unlimited storage",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise deployment",
    ],
  },
];

const invoices = [
  { id: "INV-001", date: "Feb 1, 2026", amount: 0, status: "Paid", plan: "Naagrik" },
  { id: "INV-002", date: "Jan 1, 2026", amount: 0, status: "Paid", plan: "Naagrik" },
];

export default function BillingPage() {
  const [currentPlan] = useState("Naagrik");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View subscription plan and usage, manage payments, upgrade plans or add lawyer review credits
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Current Plan */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Current Plan
          </h2>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{currentPlan}</h3>
                  <p className="text-sm text-muted-foreground">Free plan - No billing required</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Active
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Plans */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Available Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.current;
              return (
                <Card
                  key={plan.name}
                  className={`relative h-full transition-all ${
                    plan.popular
                      ? "border-primary shadow-md"
                      : isCurrent
                      ? "border-primary/30"
                      : "border-border hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-5">
                    <div className={`rounded-lg p-2 w-fit ${plan.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg mt-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-2">
                      {plan.price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <IndianRupee className="h-4 w-4 text-foreground" />
                          <span className="text-3xl font-bold text-foreground">
                            {plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">{plan.period}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-foreground">{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2.5 mb-5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Plan" : plan.price === null ? "Contact Sales" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Payment Method
          </h2>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2.5">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No payment method added</p>
                  <p className="text-xs text-muted-foreground">
                    Add a payment method to upgrade your plan
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                Add Method
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Invoice History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Invoice History
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-4">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{invoice.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.date} - {invoice.plan} plan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-foreground">
                        {invoice.amount === 0 ? "Free" : `₹${invoice.amount}`}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300"
                      >
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
