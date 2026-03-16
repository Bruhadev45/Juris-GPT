"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Book,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Tag,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supportApi } from "@/lib/api";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  message: string;
}

const faqs = [
  {
    id: "1",
    question: "How do I create a new Founder Agreement?",
    answer:
      "Navigate to Legal Forms and click on 'Founder Agreement'. Fill in the required company and founder details, then submit for AI generation and lawyer review.",
  },
  {
    id: "2",
    question: "How long does document review take?",
    answer:
      "AI-powered document reviews are completed within minutes. Complex documents that require human review may take up to 24-48 hours.",
  },
  {
    id: "3",
    question: "Can I edit documents after they are generated?",
    answer:
      "Yes, you can request changes through the review process. Our AI and lawyers will review and incorporate your requested modifications.",
  },
  {
    id: "4",
    question: "What file formats are supported for document upload?",
    answer:
      "We support PDF, DOCX, and DOC formats for document uploads. Generated documents are provided in PDF format.",
  },
  {
    id: "5",
    question: "How does the AI analysis work?",
    answer:
      "Our AI analyzes your documents for risk factors, missing clauses, compliance issues, and provides actionable suggestions. It uses advanced language models trained on Indian legal data.",
  },
  {
    id: "6",
    question: "Is my data secure?",
    answer:
      "Yes. All documents are encrypted at rest and in transit. We follow industry-standard security practices and comply with data protection regulations.",
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });

  const fetchTickets = useCallback(async () => {
    try {
      const result = await supportApi.listTickets();
      setTickets(result.data || result.tickets || []);
    } catch {
      // Tickets may not exist yet, that is fine
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await supportApi.createTicket(form);
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "", category: "general" });
      // Refresh tickets list
      fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const ticketStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "resolved":
      case "closed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      case "in_progress":
      case "in progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                Support
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Create and track support tickets — get help with platform or legal workflow issues</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Help Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Book,
                  title: "Getting Started",
                  desc: "Learn the basics of using JurisGPT",
                  articles: 12,
                },
                {
                  icon: MessageSquare,
                  title: "Document Management",
                  desc: "Managing and reviewing documents",
                  articles: 8,
                },
                {
                  icon: HelpCircle,
                  title: "Account & Billing",
                  desc: "Account settings and payment",
                  articles: 5,
                },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card
                    key={cat.title}
                    className="shadow-sm border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {cat.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {cat.articles} articles
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* FAQs */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Ticket Submitted
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We have received your support request and will respond
                      shortly.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      Submit Another Ticket
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="support-name"
                          className="text-sm font-medium text-foreground"
                        >
                          Name *
                        </label>
                        <Input
                          id="support-name"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="support-email"
                          className="text-sm font-medium text-foreground"
                        >
                          Email *
                        </label>
                        <Input
                          id="support-email"
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="support-subject"
                          className="text-sm font-medium text-foreground"
                        >
                          Subject *
                        </label>
                        <Input
                          id="support-subject"
                          value={form.subject}
                          onChange={(e) =>
                            setForm({ ...form, subject: e.target.value })
                          }
                          placeholder="Brief description of your issue"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="support-category"
                          className="text-sm font-medium text-foreground"
                        >
                          Category
                        </label>
                        <select
                          id="support-category"
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="technical">Technical Issue</option>
                          <option value="billing">Billing</option>
                          <option value="feature">Feature Request</option>
                          <option value="bug">Bug Report</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="support-message"
                        className="text-sm font-medium text-foreground"
                      >
                        Message *
                      </label>
                      <textarea
                        id="support-message"
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        placeholder="Describe your issue or question in detail..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  My Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No support tickets yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {ticket.subject}
                            </h4>
                            {ticketStatusBadge(ticket.status)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {ticket.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
