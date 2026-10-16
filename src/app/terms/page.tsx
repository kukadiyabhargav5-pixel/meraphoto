'use client';

import React from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowRight, HelpCircle, CheckCircle, Scale, RefreshCw, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'October 16, 2026';

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] min-h-screen font-poppins relative pb-24">
        {/* Background ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
        </div>

        {/* Hero Header */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-12 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 shadow-sm">
            <Scale className="w-3.5 h-3.5" />
            Legal Documentation
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-xs sm:text-sm font-medium">
            Please read these terms carefully before accessing or using Mara Photo platform, studio dashboard, and guest galleries.
          </p>
          <p className="text-[11px] text-gray-400 mt-3 font-semibold uppercase tracking-wider">
            Last Updated: {lastUpdated}
          </p>
        </section>

        {/* Main Content Card */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-white rounded-3xl border border-[#e3d8c8]/40 shadow-sm p-6 sm:p-12 space-y-10 text-left">
            
            {/* Overview */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">01.</span>
                Platform Agreement & Overview
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Welcome to <strong>Mara Photo</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Mara Photo provides an intelligent event photo management, AI-assisted face recognition indexing, quotation and invoice generation, and guest delivery platform for professional photographers, studios, and event clients (&quot;Services&quot;).
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                By creating an account, subscribing to a plan, uploading media, or accessing guest photo galleries, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, do not use the Services.
              </p>
            </div>

            {/* Account Responsibilities */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">02.</span>
                User Accounts & Responsibilities
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>Studio Owners:</strong> You must provide accurate, current, and complete registration information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>Team Access:</strong> Studio owners may grant team members access subject to their subscription plan tier limits. Owners remain liable for team member actions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>Event Guests:</strong> Guests scanning QR codes or uploading selfies agree to use the service only for identifying and viewing photos containing their likeness or photos permitted by the event host.</span>
                </li>
              </ul>
            </div>

            {/* Intellectual Property & Content Rights */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">03.</span>
                Content Ownership & Intellectual Property
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                <strong>You retain 100% intellectual property ownership</strong> of all photographs, videos, watermarks, studio branding, and client deliverables uploaded to Mara Photo. We claim zero ownership over your creative work.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                By uploading media, you grant Mara Photo a limited, worldwide, non-exclusive license solely for the technical execution of the Services—specifically for hosting, generating web-optimized thumbnails, executing facial recognition embedding vectors, and delivering files to authorized event guests.
              </p>
              <div className="bg-[#f5f2eb] rounded-2xl p-4 mt-3 border border-[#e3d8c8]/50 text-xs text-gray-700">
                <strong>Prohibited Content:</strong> You may not upload content that infringes upon copyright, contains illegal material, hate speech, or defamatory depictions. Accounts violating this policy are subject to immediate termination without refund.
              </div>
            </div>

            {/* AI Face Recognition Limitations */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">04.</span>
                AI Face Recognition & Matching Accuracy
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Mara Photo utilizes advanced deep-learning neural network models (InsightFace) to extract 512-dimensional facial feature vectors for matching event photos with guest selfies.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                <strong>Disclaimer of 100% Guarantee:</strong> While our AI recognition engine achieves industry-leading high accuracy under standard photographic conditions, facial recognition is an algorithmic matching estimation. Matching accuracy can be influenced by severe lighting variations, heavy occlusions (sunglasses, masks, turbans), motion blur, extreme facial angles, or low-resolution guest selfies. We do not warrant 100.0% infallible match retrieval for every single photo.
              </p>
            </div>

            {/* Pricing, Billing & Taxes */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">05.</span>
                Pricing, Billing & Razorpay Payments
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Paid studio subscriptions are billed annually in Indian Rupees (INR). Current active plans include <strong>Startup (₹3,999/yr)</strong>, <strong>Standard (₹7,999/yr)</strong>, <strong>Essential (₹12,999/yr)</strong>, and <strong>Premium (₹19,999/yr)</strong>, alongside our limited Free Basic tier.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600 mt-3">
                <li className="flex items-start gap-2">
                  <span className="text-[#c5a880] font-bold">•</span>
                  <span><strong>Taxes:</strong> Subscriptions are subject to statutory Goods and Services Tax (GST at 18%) in India where applicable. Valid GSTIN can be registered on your invoice at checkout.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c5a880] font-bold">•</span>
                  <span><strong>Payment Processing:</strong> Online transactions are handled through Razorpay Software Private Limited. We do not store full credit card numbers or UPI MPINs on our servers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c5a880] font-bold">•</span>
                  <span><strong>Plan Validity:</strong> Annual plans are active for 365 calendar days from the date of payment confirmation.</span>
                </li>
              </ul>
            </div>

            {/* Cancellation & Refund Policy */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">06.</span>
                Cancellation & Refund Policy
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                <p>
                  <strong>7-Day Money-Back Policy:</strong> If you are dissatisfied with a newly purchased annual subscription, you may request a cancellation and full refund within seven (7) calendar days of initial purchase by contacting our support desk at <a href="mailto:support@maraphoto.com" className="text-[#c5a880] font-semibold underline">support@maraphoto.com</a>.
                </p>
                <p>
                  <strong>Usage Thresholds:</strong> Refunds are eligible provided you have not exceeded 10% of the plan's photo upload allocation during the 7-day evaluation window. Gateway processing fees (up to 2%) charged by Razorpay may be non-refundable where permitted by law.
                </p>
                <p>
                  <strong>In-App Cancellation:</strong> You may cancel your subscription at any time via Dashboard &gt; Plans & Billing using secure email OTP confirmation. Upon cancellation, your account transitions to the Free Basic tier at the end of the billing cycle.
                </p>
              </div>
            </div>

            {/* Service Availability & Storage Limits */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">07.</span>
                Service Availability & Storage Fair Use
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                We make commercially reasonable efforts to maintain 99.9% uptime. Scheduled maintenance will be notified in advance. Each plan includes generous storage quotas for photos and videos. Once an account exceeds its quota, further uploads are temporarily paused until you upgrade or archive older events.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">08.</span>
                Governing Law & Dispute Resolution
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts located in Surat, Gujarat, India.
              </p>
            </div>

            {/* Contact Information */}
            <div className="border-t border-[#e3d8c8]/40 pt-8">
              <h2 className="text-lg font-serif-luxury font-light text-[#09090b] mb-2">
                Questions or Concerns?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                If you have any questions regarding these Terms &amp; Conditions, please reach out:
              </p>
              <div className="bg-[#f5f2eb] rounded-2xl p-5 border border-[#c5a880]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-[#09090b]">Mara Photo Support &amp; Legal Desk</p>
                  <p className="text-gray-500 mt-0.5">Email: <a href="mailto:support@maraphoto.com" className="text-[#c5a880] font-semibold">support@maraphoto.com</a></p>
                  <p className="text-gray-500">Location: Surat, Gujarat, India</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-5 py-2.5 rounded-full transition-all duration-300 self-start sm:self-auto"
                >
                  Contact Us
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>
    </PublicWrapper>
  );
}
