'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Users, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSubmitted(false);
      alert('Message sent successfully! Our team will contact you shortly.');
    }, 1000);
  };

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] py-12 md:py-16 font-sans">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          
          {/* ── TOP HERO BANNER: Dark Expert Support Card ── */}
          <div className="w-full bg-[#09090b] text-white rounded-3xl p-8 md:p-14 relative overflow-hidden border border-[#e3d8c8]/20 shadow-2xl flex flex-col items-center text-center">
            {/* Subtle background glow */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl space-y-6">
              <h1 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tight">
                Get Instant Help <span className="italic text-[#c5a880]">From Our Experts</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-poppins font-medium">
                Our support team is ready to assist you with any issue. Fast responses, expert guidance, and reliable solutions.
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs md:text-sm font-bold uppercase tracking-wider text-gray-300 font-poppins">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-[#c5a880]" />
                  <span>Live Chat</span>
                </div>
                <div className="hidden sm:block text-[#e3d8c8]/30">•</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-[#c5a880]" />
                  <span>9 AM - 6 PM IST</span>
                </div>
                <div className="hidden sm:block text-[#e3d8c8]/30">•</div>
                <div className="flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-[#c5a880]" />
                  <span>Team Collaboration</span>
                </div>
              </div>

              {/* CTA button */}
              <div className="pt-4">
                <a 
                  href="#contact-form"
                  className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* ── SPLIT SECTION: Contact Info & Message Form ── */}
          <div id="contact-form" className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start pt-4">
            
            {/* Left Column: Branded Contact Details */}
            <div className="lg:col-span-5 space-y-8 lg:pr-6">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full font-poppins">
                  Get In Touch
                </span>
                <h2 className="font-serif-luxury text-4xl sm:text-5xl font-light text-[#09090b] leading-tight">
                  Let&apos;s Make <span className="italic text-[#c5a880]">Event Sharing</span> Effortless
                </h2>
              </div>

              {/* Pills info list */}
              <div className="space-y-4 font-poppins">
                {/* Email Pill */}
                <div className="bg-white border border-[#e3d8c8]/25 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-[#c5a880]/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center shrink-0 border border-[#e3d8c8]/10">
                    <Mail className="w-5.5 h-5.5 text-[#c5a880]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#09090b]">maraphoto303@gmail.com</p>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">We&apos;ll reply within 24 hours</p>
                  </div>
                </div>

                 {/* Phone Pill */}
                <div className="bg-white border border-[#e3d8c8]/25 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-[#c5a880]/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center shrink-0 border border-[#e3d8c8]/10">
                    <Phone className="w-5.5 h-5.5 text-[#c5a880]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#09090b]">+91 87994 95028</p>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Available 9 AM - 6 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Send Message Form Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 border border-[#e3d8c8]/30 shadow-xl font-poppins relative">
              <div className="mb-8 border-b border-[#e3d8c8]/20 pb-5">
                <h3 className="text-2xl font-bold text-[#09090b] tracking-wide">Send a Message</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">We usually respond in less than 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative shrink-0">
                      <select 
                        className="bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-3 py-3.5 text-sm text-[#09090b] focus:outline-none font-bold appearance-none pr-7"
                        defaultValue="+91"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        ▼
                      </div>
                    </div>
                    {/* Number input */}
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more about your needs..."
                    className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitted}
                    className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-poppins"
                  >
                    {submitted ? 'Sending...' : (
                      <>
                        Send Message
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </main>
    </PublicWrapper>
  );
}
