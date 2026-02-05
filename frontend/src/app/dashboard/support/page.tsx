"use client";

import { useState } from "react";
import { HelpCircle, MessageSquare, Book, Mail, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "1",
    question: "How do I create a new Founder Agreement?",
    answer: "Navigate to Legal Forms and click on 'Founder Agreement'. Fill in the required company and founder details, then submit for AI generation and lawyer review.",
  },
  {
    id: "2",
    question: "How long does document review take?",
    answer: "Standard document reviews are completed within 24 hours. Complex documents may take up to 48 hours.",
  },
  {
    id: "3",
    question: "Can I edit documents after they're generated?",
    answer: "Yes, you can request changes through the review process. Our lawyers will review and incorporate your requested modifications.",
  },
  {
    id: "4",
    question: "What file formats are supported?",
    answer: "We support PDF, DOCX, and DOC formats for document uploads. Generated documents are provided in PDF format.",
  },
];

const supportCategories = [
  {
    id: "1",
    title: "Getting Started",
    icon: Book,
    description: "Learn the basics of using JurisGPT",
    articles: 12,
  },
  {
    id: "2",
    title: "Document Management",
    icon: MessageSquare,
    description: "Managing and reviewing documents",
    articles: 8,
  },
  {
    id: "3",
    title: "Account & Billing",
    icon: HelpCircle,
    description: "Account settings and payment",
    articles: 5,
  },
];

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    email: "",
  });

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Support Center</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Help Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.id} className="shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{category.title}</h3>
                          <p className="text-xs text-muted-foreground">{category.articles} articles</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* FAQs */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
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
                <CardDescription>Send us a message and we'll get back to you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    placeholder="What can we help you with?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-message">Message</Label>
                  <Textarea
                    id="support-message"
                    placeholder="Describe your issue or question..."
                    rows={6}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
