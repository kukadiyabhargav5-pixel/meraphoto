'use client';

import React from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import Link from 'next/link';
import { Shield, Lock, Eye, Trash2, Database, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            Data Protection &amp; Biometrics
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-xs sm:text-sm font-medium">
            Learn how Mara Photo collects, processes, and protects your personal information and facial recognition data.
          </p>
          <p className="text-[11px] text-gray-400 mt-3 font-semibold uppercase tracking-wider">
            Last Updated: {lastUpdated}
          </p>
        </section>

        {/* Main Content Card */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-white rounded-3xl border border-[#e3d8c8]/40 shadow-sm p-6 sm:p-12 space-y-10 text-left">
            
            {/* 1. Introduction */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">01.</span>
                Introduction &amp; Scope
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                At <strong>Mara Photo</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), your privacy and data security are our highest priorities. This Privacy Policy details the types of personal data we collect, why we collect it, how facial recognition biometrics are handled, and the choices available to studio owners, team members, and event attendees.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                By accessing Mara Photo, creating an account, or uploading photos or a selfie for facial recognition lookup, you acknowledge the terms of this Privacy Policy.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">02.</span>
                Information We Collect
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#e3d8c8]/30">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#09090b] mb-2 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#c5a880]" />
                    Studio Owners &amp; Photographers
                  </h3>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li>• Name, email address, phone number</li>
                    <li>• Studio name, branding logo, and portfolio links</li>
                    <li>• Billing address, GSTIN (for tax invoicing)</li>
                    <li>• Uploaded event photos and event videos</li>
                  </ul>
                </div>
                <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#e3d8c8]/30">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#09090b] mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#c5a880]" />
                    Event Guests &amp; Attendees
                  </h3>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li>• Temporary selfie photo submitted for matching</li>
                    <li>• Event access PIN or scanned QR code identifier</li>
                    <li>• Optional WhatsApp number (if guest requests direct delivery)</li>
                    <li>• Device info (browser type, OS for UI responsiveness)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. AI Facial Biometrics & Processing */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">03.</span>
                AI Facial Recognition &amp; Biometric Data Safety
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Mara Photo offers optional AI-powered face recognition to help event guests quickly locate photos of themselves from among thousands of event images.
              </p>
              
              <div className="space-y-3 mt-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-start gap-3 bg-[#f5f2eb]/60 p-3.5 rounded-xl border border-[#c5a880]/20">
                  <KeyRound className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#09090b]">Mathematical Embeddings (Not Reconstructible Images):</strong>
                    <p className="mt-1">
                      Our face recognition pipeline converts detected faces into anonymous 512-dimensional numerical vectors (embeddings) using the InsightFace neural architecture. These vectors represent mathematical points in space and <em>cannot</em> be reverse-engineered into a human face photograph.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#f5f2eb]/60 p-3.5 rounded-xl border border-[#c5a880]/20">
                  <Lock className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#09090b]">No Third-Party AI Training or Sale:</strong>
                    <p className="mt-1">
                      We <strong>never sell</strong> facial recognition data, selfies, or event photos to third-party data brokers, advertisers, or AI training platforms. Guest facial embeddings are strictly isolated to the specific event being searched.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#f5f2eb]/60 p-3.5 rounded-xl border border-[#c5a880]/20">
                  <Trash2 className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#09090b]">Transient Guest Selfies:</strong>
                    <p className="mt-1">
                      Selfies taken or uploaded by guests on our web app are used solely to generate the comparison vector for the active session. Guests can delete their photo match results at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Cloud Infrastructure & Storage */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">04.</span>
                Storage &amp; Security Infrastructure
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                All media files and database records are hosted on industry-certified cloud infrastructure:
              </p>
              <ul className="space-y-2 mt-3 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>Cloudflare R2 Object Storage:</strong> High-durability, S3-compatible cloud storage with enterprise encryption at rest (AES-256) and TLS 1.3 in transit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>MongoDB Atlas:</strong> Managed database infrastructure with network isolation, IP whitelisting, and automated encrypted backups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span><strong>Access Controls:</strong> Event galleries can be protected with custom passwords, QR-restricted views, or watermarked previews configured directly by the photographer.</span>
                </li>
              </ul>
            </div>

            {/* 5. Payments & Third-Party Processors */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">05.</span>
                Payment Processing (Razorpay)
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                When you purchase or upgrade a studio plan, your payment is processed by <strong>Razorpay Software Private Limited</strong>, a PCI-DSS Level 1 compliant payment processor.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                Mara Photo never receives or stores your full credit card number, debit card CVV, or net banking / UPI passwords. Razorpay processes and stores such payment information in accordance with RBI regulations and their own privacy policy.
              </p>
            </div>

            {/* 6. Your Rights */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-light text-[#09090b] mb-3 flex items-center gap-2">
                <span className="text-[#c5a880] font-sans font-bold text-base">06.</span>
                Your Privacy Rights &amp; Choices
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">
                Subject to applicable data protection laws (including the Digital Personal Data Protection Act of India), you have the right to:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
                <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-150">
                  <strong>Right of Access &amp; Portability:</strong> View and export your uploaded photos and customer quotations.
                </div>
                <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-150">
                  <strong>Right to Deletion:</strong> Request immediate removal of specific event galleries, guest photos, or your entire account.
                </div>
                <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-150">
                  <strong>Right to Correction:</strong> Update your studio profile, tax information, or contact credentials.
                </div>
                <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-150">
                  <strong>Opt-Out of Communications:</strong> Unsubscribe from marketing emails with a single click.
                </div>
              </div>
            </div>

            {/* 7. Contact Officer */}
            <div className="border-t border-[#e3d8c8]/40 pt-8">
              <h2 className="text-lg font-serif-luxury font-light text-[#09090b] mb-2">
                Privacy Officer &amp; Grievances
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                To request data deletion, ask questions about our biometric policy, or report a grievance:
              </p>
              <div className="bg-[#f5f2eb] rounded-2xl p-5 border border-[#c5a880]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-[#09090b]">Mara Photo Privacy Officer</p>
                  <p className="text-gray-500 mt-0.5">Email: <a href="mailto:privacy@maraphoto.com" className="text-[#c5a880] font-semibold">privacy@maraphoto.com</a> / <a href="mailto:support@maraphoto.com" className="text-[#c5a880] font-semibold">support@maraphoto.com</a></p>
                  <p className="text-gray-500">Location: Surat, Gujarat, India</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-5 py-2.5 rounded-full transition-all duration-300 self-start sm:self-auto"
                >
                  Contact Desk
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
