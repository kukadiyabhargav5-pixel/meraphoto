'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera, Sparkles, QrCode, Lock, Shield, TrendingUp,
  ChevronRight, Video, CheckCircle, HelpCircle, Menu, X
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-blue-600" />,
      title: "AI Face Recognition Search",
      desc: "Guests upload a single selfie and instantly find all photos they appear in, out of thousands of event uploads."
    },
    {
      icon: <Video className="h-6 w-6 text-cyan-600" />,
      title: "AI Video Face Matching",
      desc: "Process event videos, index faces, and allow clients to jump directly to the exact timestamps where they appear."
    },
    {
      icon: <QrCode className="h-6 w-6 text-blue-600" />,
      title: "Instant QR Code Delivery",
      desc: "Generate QR codes for tables or screens. Guests scan, snap a selfie, and get their memories in real-time."
    },
    {
      icon: <Shield className="h-6 w-6 text-cyan-600" />,
      title: "Custom Studio Watermarking",
      desc: "Protect your intellectual property. Automatically overlay custom text or image watermarks with precise opacity control."
    },
    {
      icon: <Lock className="h-6 w-6 text-blue-600" />,
      title: "Flexible Gallery Access",
      desc: "Configure access protocols: Public, Private password-protected, QR-locked, or OTP verification via Email/WhatsApp."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-cyan-600" />,
      title: "Full Studio Whitelabeling",
      desc: "Use your own logo, branding, custom dashboard subdomains (studio.maraphoto.com), and custom domain mappings."
    }
  ];

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for new creators getting started.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Up to 5 Active Events",
        "AI Search Enabled (Photos Only)",
        "Standard Storage (10 GB R2)",
        "Watermark Settings",
        "Dashboard Access",
        "Self-Serve QR Generation"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Professional",
      desc: "For active photographers building their brand.",
      price: { monthly: 29, yearly: 24 },
      features: [
        "Up to 20 Active Events",
        "AI Search (Photos + Video Timestamps)",
        "Enhanced Storage (100 GB R2)",
        "No Mara Photo Branding",
        "Team Members (Up to 3)",
        "Email Invite Templates"
      ],
      cta: "Go Pro",
      popular: true
    },
    {
      name: "Business",
      desc: "For busy studios managing bulk events.",
      price: { monthly: 79, yearly: 69 },
      features: [
        "Unlimited Active Events",
        "Ultra-Fast AI Face Indexing",
        "Bulk Video Processing (FFmpeg)",
        "Professional Storage (500 GB R2)",
        "Team Members (Up to 10)",
        "WhatsApp Invite Templates"
      ],
      cta: "Unlock Business",
      popular: false
    },
    {
      name: "Enterprise",
      desc: "Custom limits and dedicated support.",
      price: { monthly: 199, yearly: 179 },
      features: [
        "Custom Storage Capacity",
        "Dedicated Server Sidecar (InsightFace)",
        "Custom Domain Mapping",
        "Premium SLA Support Tickets",
        "Google & JWT Single Sign-On",
        "Custom API Integrations"
      ],
      cta: "Contact Enterprise",
      popular: false
    }
  ];

  const faqs = [
    {
      q: "How does the AI face matching search engine work?",
      a: "When a studio uploads photos or videos, our backend workers automatically run face detection (using the SCRFD model) and extract a 512-dimension embedding representing facial structures (via the ArcFace model). When a guest uploads a selfie, we extract their embedding and perform a high-speed cosine similarity comparison to retrieve all matching media in milliseconds."
    },
    {
      q: "Can the AI search for faces inside MP4 videos?",
      a: "Yes! For videos, we extract frames at regular intervals (e.g. 1 frame every 2 seconds) and build a timestamp face index. Guests can upload a selfie, view all matching videos, and click the timestamps to play the video directly from the moment they are on screen."
    },
    {
      q: "Is storage on Cloudflare R2 secure and reliable?",
      a: "Absolutely. Cloudflare R2 is an enterprise-grade, S3-compatible object storage system. It offers 99.999% reliability, does not charge egress bandwidth fees (allowing guests to download original files at ultra-fast speeds), and handles high parallel traffic effortlessly."
    },
    {
      q: "How is the billing managed? Can I cancel anytime?",
      a: "Billing is secured through Razorpay. You can subscribe to monthly or yearly cycles with auto-renewal. You can cancel or upgrade your subscription plan at any time directly from your dashboard."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-blue-100/50 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-900 to-slate-800 bg-clip-text text-transparent">
              Mara Photo
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-blue-600 transition-colors">FAQ</a>
            <Link href="/auth/login" className="hover:text-blue-600 transition-colors">Login</Link>
            <Link href="/auth/login?tab=register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-650/20">
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden glass-panel border-b border-blue-100 bg-white/95 absolute top-20 left-0 w-full p-6 flex flex-col gap-5 z-40">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-700 hover:text-blue-600 transition-colors">Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-700 hover:text-blue-600 transition-colors">Pricing</a>
          <a href="#faqs" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-700 hover:text-blue-600 transition-colors">FAQ</a>
          <hr className="border-slate-100" />
          <Link href="/auth/login" className="text-lg text-slate-700 hover:text-blue-600 transition-colors">Login</Link>
          <Link href="/auth/login?tab=register" onClick={() => setMobileMenuOpen(false)} className="bg-blue-600 text-white text-center py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Register Studio
          </Link>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-600 font-semibold mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Face Recognition Photo & Video Delivery</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-blue-950 via-slate-800 to-slate-900 bg-clip-text text-transparent max-w-4xl">
            Find Every Memory <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              With AI Face Match
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mb-12 leading-relaxed font-medium">
            The ultimate multi-tenant whitelabel gallery delivery system for photography studios. Guests upload a selfie to instantly download all their photos and video segments.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-md">
            <Link href="/auth/login?tab=register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-750 hover:from-blue-700 hover:to-blue-800 text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-blue-550/20 hover:shadow-blue-550/30 transform hover:-translate-y-0.5 transition-all duration-200">
              Create Studio Account
              <ChevronRight className="h-5 w-5" />
            </Link>
            <a href="#features" className="flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 text-base font-semibold px-8 py-4 rounded-2xl transition-all border border-slate-200 shadow-sm">
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Floating Mock UI Interface */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="w-full max-w-5xl mt-20 relative rounded-3xl overflow-hidden glass-panel border border-slate-200 p-2 shadow-xl">
          <div className="bg-white rounded-2xl overflow-hidden aspect-[16/9] border border-slate-100 relative p-6 flex flex-col justify-between">
            {/* Window controls */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-400" />
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 ml-4 font-mono">dashboard.dreamstudio.maraphoto.com</span>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 text-left">
              {/* Sidebar Mock */}
              <div className="col-span-3 border-r border-slate-100 pr-4 flex flex-col gap-4">
                <div className="h-10 bg-slate-50 border border-slate-100 rounded-lg w-full flex items-center px-3 gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">Dream Studio</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="h-8 bg-blue-50 border-l-2 border-blue-600 rounded-r-md w-full" />
                  <span className="h-8 bg-transparent hover:bg-slate-50 rounded-md w-[80%]" />
                  <span className="h-8 bg-transparent hover:bg-slate-50 rounded-md w-[90%]" />
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="col-span-9 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-800">Sharma Wedding Reception</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold">Active</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Photos Uploaded</span>
                      <span className="text-xl font-extrabold font-mono text-slate-800">1,824</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AI Face Matches</span>
                      <span className="text-xl font-extrabold font-mono text-blue-600">12,450</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Client Downloads</span>
                      <span className="text-xl font-extrabold font-mono text-slate-800">456</span>
                    </div>
                  </div>
                </div>

                {/* Simulated matches grid */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-slate-500">Selfie Search Results (Match threshold: 0.65)</span>
                  </div>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-1 right-1 text-[9px] px-1 bg-cyan-500 text-white font-bold rounded font-mono">92%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-slate-100 bg-[#0F172A] text-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed For Professional Studios</h2>
            <p className="text-slate-400 text-lg">
              Get the full suite of cloud hosting, advanced AI processing, Razorpay auto-billing, and whitelabel customization tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl flex flex-col gap-4 hover:border-blue-500/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Flexible Plans for Every Studio</h2>
          <p className="text-slate-600 text-lg mb-8">
            Select a plan that fits your event volumes. Save 20% by subscribing to a yearly billing cycle.
          </p>

          {/* Monthly/Yearly toggle */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              Monthly
            </button>
            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((p, i) => {
            const price = billingCycle === 'monthly' ? p.price.monthly : p.price.yearly;
            return (
              <div key={i} className={`glass-panel p-8 rounded-2xl flex flex-col justify-between relative transition-all duration-300 bg-white ${p.popular ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-lg' : 'border-slate-200'}`}>
                {p.popular && (
                  <span className="absolute top-0 right-1/2 translate-y-[-50%] translate-x-[50%] bg-blue-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md shadow-blue-500/20">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">{p.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 min-h-[32px]">{p.desc}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-slate-700">$</span>
                    <span className="text-5xl font-extrabold tracking-tight font-mono text-slate-800">{price}</span>
                    <span className="text-slate-500 text-sm">/mo</span>
                  </div>

                  <ul className="flex flex-col gap-4 border-t border-slate-100 pt-6 mb-8">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-3 text-sm text-slate-600">
                        <CheckCircle className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={`/auth/login?tab=register&plan=${p.name.toUpperCase()}`} className={`w-full py-3.5 rounded-xl font-semibold text-center text-sm transition-all duration-200 ${p.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'}`}>
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="py-24 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-800">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-lg">
              Have questions about our AI photo search, billing, or integrations? We've got you covered.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((f, i) => (
              <div key={i} className="glass-panel border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full px-8 py-6 flex items-center justify-between text-left font-bold text-base hover:bg-slate-50 transition-colors text-slate-700">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <span>{f.q}</span>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-8 pb-6 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-[#F8FAFC] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-sm tracking-wide text-slate-850">Mara Photo</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 Mara Photo. All rights reserved. "Find Every Memory With AI"
          </p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
