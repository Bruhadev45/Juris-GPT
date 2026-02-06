"use client";

import Link from "next/link";
import { Scale, FileCheck, Clock, Gavel, Shield, Zap, ArrowRight, Sparkles, CheckCircle, Users, TrendingUp, Award, BookOpen, FileText, Lock, Globe, Star, ChevronRight, X, Check, BarChart3, Target, Building2, Mail, Phone, MessageSquare, HelpCircle, AlertCircle, Eye, Key, Database, Server, Code, Rocket, Timer, DollarSign, Briefcase, Handshake, FileSearch, PenTool, Layers, Network, BarChart, ArrowUp, Send } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";

export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowBackToTop(latest > 400);
    setShowStickyCTA(latest > 600);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

    useEffect(() => {
      // Set smooth scrolling via data attribute (Next.js compatible)
      document.documentElement.setAttribute("data-scroll-behavior", "smooth");
    }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 relative">
      {/* Law-themed Background Images */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Hero Background - Scales of Justice */}
        <div 
          className="absolute top-0 left-0 w-full h-[100vh] opacity-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        ></div>
        
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        
        {/* Additional law-themed decorative elements */}
        <div className="absolute top-20 right-10 w-96 h-96 opacity-5">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80')",
            }}
          ></div>
        </div>
        
        <div className="absolute bottom-20 left-10 w-80 h-80 opacity-5">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80')",
            }}
          ></div>
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-sm relative"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 cursor-pointer" aria-label="NyayaSetu Home">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
              </motion.div>
                <span className="text-xl font-bold text-foreground">NyayaSetu</span>
            </motion.div>
          </Link>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-foreground/70 hover:text-foreground transition-all hover:scale-105"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/agreements/new"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                aria-label="Get Started - Create Founder Agreement"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Sticky CTA Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: showStickyCTA ? 0 : 100,
          opacity: showStickyCTA ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg"
        style={{ display: showStickyCTA ? "block" : "none" }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-base font-semibold text-foreground">Ready to get started?</p>
            <p className="text-sm text-muted-foreground">Create your Founder Agreement in minutes</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/agreements/new"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              aria-label="Create Founder Agreement"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-card border-2 border-primary text-primary rounded-md font-semibold hover:bg-secondary transition-all"
              aria-label="View Dashboard"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Back to Top Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: showBackToTop ? 1 : 0,
          opacity: showBackToTop ? 1 : 0,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </motion.button>

      {/* Live Chat Widget */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
        aria-label="Open live chat"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Law-themed background image overlay */}
          <div 
            className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full mb-6 hover:bg-accent/20 transition-all cursor-pointer group"
            >
              <Sparkles className="h-4 w-4 text-accent group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-medium text-accent">Legal Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl md:text-7xl font-bold mb-6 text-foreground leading-tight"
            >
              Professional Legal
              <br />
              <motion.span
                className="text-primary inline-block"
                animate={{
                  backgroundPosition: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{
                  backgroundImage: "linear-gradient(90deg, #1F2937, #374151, #1F2937)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Documents
              </motion.span>{" "}
              for Startups
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto"
            >
              AI-Powered Founder Agreements with Expert Lawyer Review
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-xl mx-auto"
            >
              Generate legally compliant Founder Agreements in minutes. Reviewed by experienced lawyers. Delivered within 24 hours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <Link
                  href="/agreements/new"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold shadow-lg hover:shadow-xl transition-all transform flex items-center gap-2 inline-block"
                >
                  Create Founder Agreement
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-card border-2 border-primary text-primary rounded-md font-semibold hover:bg-secondary transition-all transform hover:shadow-lg inline-block"
                >
                  View Dashboard
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-base text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure & Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>Lawyer Reviewed</span>
              </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>DPDPA Compliant</span>
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Agreements Generated", icon: FileCheck, color: "text-primary" },
              { value: "98%", label: "Client Satisfaction", icon: Star, color: "text-yellow-500" },
              { value: "18hrs", label: "Average Turnaround", icon: Timer, color: "text-accent" },
              { value: "₹1.2M+", label: "Legal Costs Saved", icon: DollarSign, color: "text-green-600" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-xl transition-all duration-300 text-center group"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: index * 0.3 }}
                    className={`w-12 h-12 ${stat.color} mx-auto mb-4`}
                  >
                    <Icon className="h-full w-full" />
                  </motion.div>
                  <motion.p
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", delay: index * 0.1 }}
                    className="text-3xl md:text-4xl font-bold text-primary mb-2"
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-base text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Features with 3D Cards */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
                Why Choose NyayaSetu?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Everything you need to create legally sound founder agreements
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{
                y: -10,
                rotateY: 5,
                rotateX: 5,
                scale: 1.02,
              }}
              className="group perspective-1000"
            >
              <div className="p-8 bg-card rounded-lg shadow-lg border-l-4 border-primary hover:shadow-2xl transition-all duration-300 transform-gpu h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 relative z-10"
                >
                  <FileCheck className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">AI-Powered Generation</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  GPT-4 generates your Founder Agreement based on your company details and legal preferences. Professional quality, every time.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{
                y: -10,
                rotateY: -5,
                rotateX: 5,
                scale: 1.02,
              }}
              className="group perspective-1000"
            >
              <div className="p-8 bg-card rounded-lg shadow-lg border-l-4 border-accent hover:shadow-2xl transition-all duration-300 transform-gpu h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all"></div>
                <motion.div
                  whileHover={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 relative z-10"
                >
                  <Scale className="h-6 w-6 text-accent" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-accent transition-colors">Lawyer Reviewed</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Every document is reviewed by experienced Indian corporate lawyers to ensure legal compliance and accuracy.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{
                y: -10,
                rotateY: 5,
                rotateX: -5,
                scale: 1.02,
              }}
              className="group perspective-1000"
            >
              <div className="p-8 bg-card rounded-lg shadow-lg border-l-4 border-primary hover:shadow-2xl transition-all duration-300 transform-gpu h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                  className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 relative z-10"
                >
                  <Clock className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">24-Hour Delivery</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Get your finalized Founder Agreement within 24 hours of submission. Fast, reliable, and professional.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-card/70 backdrop-blur-sm rounded-3xl my-20 relative z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Simple, fast, and reliable process
            </motion.p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Fill Details", desc: "Enter company and founder information", icon: FileText },
              { step: "02", title: "AI Generation", desc: "Our AI creates your agreement", icon: Zap },
              { step: "03", title: "Lawyer Review", desc: "Expert lawyers review and approve", icon: Scale },
              { step: "04", title: "Get Document", desc: "Receive your finalized agreement", icon: CheckCircle },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="text-center group"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-all">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-base text-muted-foreground">{item.desc}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary/20 transform translate-x-4"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-card/70 to-background/90 backdrop-blur-sm relative z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Why Startups Love Us
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Save time, money, and legal headaches
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "90% Cost Savings", desc: "Compared to traditional law firms", icon: DollarSign },
              { title: "10x Faster", desc: "Get documents in hours, not weeks", icon: Zap },
              { title: "Always Updated", desc: "Compliant with latest Indian laws", icon: Shield },
              { title: "Expert Review", desc: "Every document reviewed by lawyers", icon: Award },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: index % 2 === 0 ? -5 : 5, scale: 1.02 }}
                  className="p-6 bg-card rounded-lg shadow-md border-l-4 border-primary hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg md:text-xl mb-1 group-hover:text-primary transition-colors">{benefit.title}</h3>
                      <p className="text-base text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Perfect For
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Trusted by startups across India
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Tech Startups", desc: "SaaS, FinTech, EdTech companies", icon: Zap },
              { title: "E-commerce", desc: "Online marketplaces and retail", icon: Globe },
              { title: "Healthcare", desc: "HealthTech and medical startups", icon: Shield },
            ].map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors">{useCase.title}</h3>
                  <p className="text-base text-muted-foreground">{useCase.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-20 bg-card/60 backdrop-blur-sm rounded-3xl my-20 relative z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
                NyayaSetu vs Traditional Law Firms
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              See why startups choose us
            </motion.p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold text-primary">NyayaSetu</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Traditional Firms</th>
                </tr>
              </thead>
              <tbody>
                {[
                    { feature: "Price", jurisgpt: "₹999", traditional: "₹15,000 - ₹50,000" },
                  { feature: "Turnaround Time", jurisgpt: "24 hours", traditional: "2-4 weeks" },
                  { feature: "AI-Powered", jurisgpt: "✓", traditional: "✗" },
                  { feature: "Lawyer Review", jurisgpt: "✓ Included", traditional: "✓ Included" },
                  { feature: "Revisions", jurisgpt: "Unlimited", traditional: "Limited" },
                  { feature: "Online Platform", jurisgpt: "✓", traditional: "✗" },
                ].map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ backgroundColor: "rgba(124, 58, 237, 0.05)" }}
                    className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.jurisgpt === "✓" ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : row.jurisgpt === "✗" ? (
                        <X className="h-5 w-5 text-red-600 mx-auto" />
                      ) : (
                        <span className="text-primary font-semibold">{row.jurisgpt}</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">{row.traditional}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Pricing with 3D Effect */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block px-6 py-3 bg-accent/10 border border-accent/20 rounded-full mb-6"
          >
            <span className="text-base font-medium text-accent">Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6"
          >
            Simple, Fixed Pricing
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{
              rotateY: 5,
              rotateX: -5,
              scale: 1.05,
            }}
            className="inline-block p-8 bg-card rounded-lg shadow-xl border-2 border-primary/20 hover:shadow-2xl transition-all duration-300 transform-gpu perspective-1000"
          >
            <motion.p
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="text-5xl font-bold text-primary mb-2"
              >
                ₹999
              </motion.p>
              <p className="text-lg text-muted-foreground">Per Founder Agreement</p>
              <p className="text-base text-muted-foreground/70 mt-2">No hidden fees. First consultation free.</p>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {["AI-Powered Generation", "Lawyer Review", "24-Hour Delivery", "Unlimited Revisions", "Legal Compliance", "Email Support"].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Trusted by Founders
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              See what our clients say
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Rajesh Kumar",
                role: "Co-founder, TechStart",
                content: "Got our founder agreement in 18 hours. The quality was excellent and lawyer review caught important clauses we missed.",
                rating: 5,
              },
              {
                name: "Priya Sharma",
                role: "Founder, HealthTech India",
                content: "The AI-generated document was comprehensive. Our lawyer only needed minor tweaks. Highly recommended!",
                rating: 5,
              },
              {
                name: "Amit Patel",
                role: "CEO, FinTech Solutions",
                content: "Saved us weeks of legal work. Professional, fast, and affordable. Exactly what startups need.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-base text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-lg text-foreground">{testimonial.name}</p>
                  <p className="text-base text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Security & Privacy Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Security & Privacy First
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Your data is protected with enterprise-grade security
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "End-to-End Encryption", desc: "All documents encrypted in transit and at rest", icon: Lock },
                { title: "DPDPA Compliant", desc: "Full compliance with India's Digital Personal Data Protection Act, 2023", icon: Shield },
              { title: "Secure Storage", desc: "Documents stored in secure cloud infrastructure", icon: Database },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-base text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20 bg-card/70 backdrop-blur-sm rounded-3xl my-20 relative z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Everything you need to know
            </motion.p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: "How long does it take to get my Founder Agreement?",
                answer: "Typically within 24 hours. After you submit your details, our AI generates the document within minutes. Then our expert lawyers review it and send you the finalized version within 24 hours.",
              },
              {
                question: "Is the document legally valid in India?",
                answer: "Yes! All documents are reviewed by experienced Indian corporate lawyers and comply with the Companies Act, 2013 and other relevant Indian laws. They are legally binding and enforceable.",
              },
              {
                question: "What if I need revisions?",
                answer: "We offer unlimited revisions until you're satisfied. Our team works with you to ensure the agreement meets all your requirements.",
              },
              {
                question: "How secure is my company information?",
                  answer: "We use end-to-end encryption and follow DPDPA (Digital Personal Data Protection Act, 2023) compliance standards. Your data is stored securely in India and never shared with third parties. All documents are confidential.",
              },
              {
                question: "Can I use this for multiple founders?",
                answer: "Absolutely! Our Founder Agreement template supports multiple founders. Simply add all founder details during the form submission process.",
              },
              {
                question: "What happens after I receive the document?",
                answer: "You'll receive a finalized Word document (.docx) that you can review, sign, and use. Our lawyers are available for any questions or clarifications you might have.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem value={`item-${index}`} className="border-b border-border/50">
                  <AccordionTrigger className="text-left hover:text-primary transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 pt-16 border-t border-border relative z-10"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            {[
              { value: "100%", label: "Lawyer Reviewed", icon: Shield },
              { value: "24hrs", label: "Average Delivery", icon: Zap },
              { value: "India", label: "Companies Act Compliant", icon: Gavel },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="group"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: index * 0.5,
                    }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all"
                  >
                    <Icon className="h-8 w-8 text-primary" />
                  </motion.div>
                  <motion.p
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: index * 0.3,
                    }}
                    className="text-3xl md:text-4xl font-bold text-primary mb-2"
                  >
                    {item.value}
                  </motion.p>
                  <p className="text-base text-muted-foreground">{item.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Additional Features Grid */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div 
          className="absolute inset-0 opacity-5 rounded-3xl"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Powerful Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Everything you need in one platform
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Smart Templates", desc: "Pre-built templates for common scenarios", icon: FileText },
              { title: "Version Control", desc: "Track changes and revisions easily", icon: Layers },
              { title: "Export Options", desc: "Download in Word, PDF formats", icon: FileCheck },
              { title: "Legal Compliance", desc: "Always up-to-date with Indian laws", icon: Shield },
              { title: "Expert Support", desc: "Get help from our legal team", icon: MessageSquare },
              { title: "Dashboard Access", desc: "Manage all your documents in one place", icon: BarChart },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-base text-muted-foreground">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Newsletter Signup */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-lg border border-border"
        >
          <div className="text-center mb-6">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-2"
            >
              Stay Updated
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base text-muted-foreground"
            >
              Get legal tips, updates, and exclusive offers delivered to your inbox
            </motion.p>
          </div>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              // Handle newsletter signup
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Email address"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              Subscribe
              <Send className="h-4 w-4" />
            </motion.button>
          </motion.form>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 backdrop-blur-md rounded-3xl border border-primary/30 relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-20 rounded-3xl"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 animate-gradient"></div>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          ></motion.div>
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground mb-8"
            >
              Create your Founder Agreement in minutes. No credit card required.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/agreements/new"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold shadow-lg hover:shadow-xl transition-all transform flex items-center gap-2 inline-block"
                  aria-label="Create Founder Agreement Now"
                >
                  Create Agreement Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-card border-2 border-primary text-primary rounded-md font-semibold hover:bg-secondary transition-all transform hover:shadow-lg inline-block"
                  aria-label="View Examples"
                >
                  View Examples
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-border bg-card/80 backdrop-blur-md mt-32 relative z-10"
      >
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 cursor-pointer mb-4"
              >
                <Scale className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">NyayaSetu</span>
              </motion.div>
              <p className="text-base text-muted-foreground">
                AI-powered legal document generation for Indian startups.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li><Link href="/agreements/new" className="hover:text-primary transition-colors">Founder Agreements</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/forms" className="hover:text-primary transition-colors">Legal Forms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li><Link href="/dashboard/support" className="hover:text-primary transition-colors">Support</Link></li>
                <li><Link href="/dashboard/team" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-primary transition-colors">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex justify-between items-center">
            <p className="text-base text-muted-foreground">
              &copy; 2025 NyayaSetu. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}
