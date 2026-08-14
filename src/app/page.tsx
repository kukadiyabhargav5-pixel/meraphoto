'use client';

import Link from 'next/link';
import { useState } from 'react';
import PublicWrapper from '../components/PublicWrapper';
import CinematicHero from '../components/CinematicHero';
import './cinematic-hero.css';
import {
  Star, Check,
  ChevronDown, ArrowRight, Shield, Users,
  Globe, QrCode, ScanFace, Zap, Upload,
  Mail, Phone, Send
} from 'lucide-react';

/* ─────────────── DATA ─────────────── */

const stats = [
  { value: '600+', label: 'Elite Photo Studios' },
  { value: '8K+',  label: 'Luxury Events' },
  { value: '7M+',  label: 'Moments Delivered' },
  { value: '4.9★', label: 'Average Studio Rating' },
];

const howItWorks = [
  {
    step: '01',
    icon: Upload,
    title: 'Create Gallery & Upload',
    desc: 'Create a private, high-speed event gallery directly from your mobile or laptop. Upload raw or high-res edits seamlessly during the event.',
  },
  {
    step: '02',
    icon: QrCode,
    title: 'Display Branded QR Code',
    desc: 'Present a beautifully designed table tent or backdrop banner with your unique event QR code. Guests simply scan to begin.',
  },
  {
    step: '03',
    icon: ScanFace,
    title: 'AI Matches Moments Instantly',
    desc: 'Guests snap a quick selfie. The AI instantly scans thousands of event photos, matching and serving their personal memories in seconds.',
  },
];

const features = [
  { icon: ScanFace, title: 'Instant Face Recognition',  desc: 'Eliminate manual photo searching. Guests upload a selfie and view their personalized, matched photos in under 2 seconds.' },
  { icon: QrCode,   title: 'Elegant QR Branding',       desc: 'Generate custom branded QR codes showing your studio logo. Print or display them at event tables and entries.' },
  { icon: Zap,      title: 'Real-time Live Delivery',    desc: 'Photos stream live to guests as you shoot and upload. Drive organic social shares while the event is still happening.' },
  { icon: Globe,    title: 'Fully White-Labeled',        desc: 'Use your own custom subdomain, branding colors, and logo. Deliver a luxury, high-end gallery experience to premium clients.' },
  { icon: Shield,   title: 'End-to-End Privacy',         desc: 'Encrypt and protect your client\'s personal photos. Only authorized guests with the unique event QR code can view.' },
  { icon: Users,    title: 'Unlimited Guest Delivery',   desc: 'Deliver photos to thousands of guests simultaneously with zero lag, zero performance drops, and zero limits.' },
];

const plans = [
  {
    name: 'Basic',
    price: '₹3,500',
    period: '/year',
    desc: 'Store 50,000 photos & store 10 videos',
    highlight: false,
    features: ['Store 50,000 photos', 'Store 10 videos', 'Business Branding', 'Bulk Download', 'Web Mode'],
    cta: 'Choose Basic',
    href: '/signup',
  },
  {
    name: 'Standard',
    price: '₹7,900',
    period: '/year',
    desc: 'Store 1,50,000 photos & store 100 videos',
    highlight: true,
    features: ['Store 1,50,000 photos', 'Store 100 videos', 'Watermarks', 'Includes all Basic features'],
    cta: 'Choose Standard',
    href: '/signup',
  },
  {
    name: 'Essential',
    price: '₹15,900',
    period: '/year',
    desc: 'Store 3,00,000 photos & store 200 videos',
    highlight: false,
    features: ['Store 3,00,000 photos', 'Store 200 videos', 'View Client Favourites', 'Switch on/off Downloads', 'Portfolio Website', 'Includes all Standard features'],
    cta: 'Choose Essential',
    href: '/signup',
  },
  {
    name: 'Premium',
    price: '₹31,900',
    period: '/year',
    desc: 'Store 7,50,000 photos & store 500 videos',
    highlight: false,
    features: ['Store 7,50,000 photos', 'Store 500 videos', 'Digital Album', 'Includes all Essential features'],
    cta: 'Choose Premium',
    href: '/signup',
  },
];

const faqs = [
  {
    q: 'How accurate is the AI face recognition system?',
    a: 'Our deep-learning facial analysis engine is incredibly accurate and fast. It matches a guest\'s selfie against thousands of high-resolution event photos in under 2 seconds, even recognizing faces under different lighting conditions and angles.',
  },
  {
    q: 'Do event guests need to download an application?',
    a: 'Absolutely not. Mara Photo operates entirely in the mobile web browser. Guests simply scan the QR code, take a selfie on our webpage, and instantly view their matched photos.',
  },
  {
    q: 'Can I upload raw images directly?',
    a: 'Yes, you can upload raw or highly compressed high-resolution images. Our backend automatically optimizes them for web delivery while maintaining spectacular color accuracy and details.',
  },
  {
    q: 'How do the white-label galleries work?',
    a: 'On our Professional and Enterprise plans, the entire guest interface is customized. Your client sees only your domain (e.g., gallery.yourstudio.com), your logo, and your business details, ensuring a premium experience.',
  },
  {
    q: 'Are the event galleries secure?',
    a: 'Yes. We enforce enterprise-grade security. All uploaded photos are encrypted, and access controls ensure that guests can only view their own photos unless you choose to make the public gallery accessible.',
  },
  {
    q: 'Can I use this for multi-day weddings?',
    a: 'Definitely. You can manage multiple sub-folders or event days inside a single gallery, making it effortless for guests to retrieve their photos from different ceremonies.',
  },
];

const testimonials = [
  {
    name: 'Rohan Malhotra',
    role: 'Luxury Wedding Photographer, Mumbai',
    rating: 5,
    text: 'Mara Photo transformed our client delivery. At a recent 600-guest heritage wedding, guests retrieved their personalized photos instantly. It completely saved us from endless WhatsApp and email follow-ups.',
  },
  {
    name: 'Sneha Rao',
    role: 'Editorial Portrait Photographer, Bangalore',
    rating: 5,
    text: 'I save hours of manual sorting on every shoot. Delivering high-resolution portraits live as the event happens wows the hosts and generates instant social media word-of-mouth for my studio.',
  },
  {
    name: 'Hardik Patel',
    role: 'Creative Director, Ahmedabad',
    rating: 5,
    text: 'For a massive three-day Gujarati wedding, we uploaded over 12,000 photos. The AI face recognition worked flawlessly. Guests were thrilled, and we looked incredibly professional and modern.',
  },
];

/* ─────────────── COMPONENTS ─────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        <ChevronDown className={`faq-chevron ${open ? 'faq-chevron-open' : ''}`} />
      </button>
      {open && (
        <div className="faq-answer">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────── PAGE ─────────────── */

export default function HomePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert('Thank you for contacting Mara Photo! Our team will get back to you within 24 hours.');
        form.reset();
      } else {
        alert(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicWrapper>
      {/* ═══════════ INTERNAL CSS ═══════════ */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hero styles are in cinematic-hero.css */

        /* ── STATS ── */
        .stats-section {
          background: #09090b;
          border-top: 1px solid rgba(227,216,200,0.15);
          padding: 40px 0;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .stats-section { padding: 72px 0; }
        }
        .stats-grid {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 48px; }
        }
        .stat-item {
          text-align: center;
          border-right: none;
        }
        @media (min-width: 1024px) {
          .stat-item { border-right: 1px solid rgba(227,216,200,0.1); }
          .stat-item:last-child { border-right: none; }
        }
        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.75rem, 4vw, 3rem);
          font-weight: 300;
          color: #c5a880;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        /* ── WORKFLOW ── */
        .workflow-section {
          padding: 48px 0;
          background: #fff;
          position: relative;
        }
        @media (min-width: 1024px) {
          .workflow-section { padding: 96px 0; }
        }
        .section-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }
        @media (min-width: 640px) {
          .section-container { padding: 0 24px; }
        }
        .section-badge {
          display: inline-block;
          padding: 6px 16px;
          background: #f5f2eb;
          color: #c5a880;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border-radius: 9999px;
          margin-bottom: 16px;
        }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.75rem, 4vw, 3rem);
          font-weight: 300;
          color: #09090b;
          margin-bottom: 16px;
        }
        .section-desc {
          color: #6b7280;
          max-width: 540px;
          margin: 0 auto;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 500;
          padding: 0 8px;
        }
        @media (min-width: 640px) {
          .section-desc { font-size: 14px; padding: 0; }
        }
        .workflow-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-top: 40px;
        }
        @media (min-width: 768px) {
          .workflow-grid { grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 60px; }
        }
        .workflow-card {
          background: #09090b;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .workflow-card { padding: 32px; }
        }
        .workflow-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          border-color: rgba(197,168,128,0.3);
        }
        .workflow-step {
          display: inline-block;
          background: #c5a880;
          color: #09090b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 20px;
        }
        .workflow-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(197,168,128,0.1);
          border: 1px solid rgba(197,168,128,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #c5a880;
        }
        .workflow-card h3 {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }
        .workflow-card p {
          font-size: 13px;
          color: #9ca3af;
          line-height: 1.6;
          font-weight: 500;
        }

        /* ── FEATURES ── */
        .features-section {
          padding: 48px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.25);
        }
        @media (min-width: 1024px) {
          .features-section { padding: 96px 0; }
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 40px;
        }
        @media (min-width: 768px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; }
        }
        @media (min-width: 1024px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .feature-card {
          background: #fff;
          border: 1px solid rgba(227,216,200,0.25);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.4s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
          border-color: rgba(197,168,128,0.5);
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(197,168,128,0.1);
          border: 1px solid rgba(197,168,128,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #c5a880;
          transition: all 0.3s;
        }
        .feature-card:hover .feature-icon {
          background: #c5a880;
          color: #09090b;
        }
        .feature-card h3 {
          font-size: 15px;
          font-weight: 800;
          color: #09090b;
          margin-bottom: 8px;
        }
        .feature-card p {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          font-weight: 500;
        }

        /* ── TESTIMONIALS ── */
        .testimonials-section {
          padding: 48px 0;
          background: #09090b;
          border-top: 1px solid rgba(227,216,200,0.15);
        }
        @media (min-width: 1024px) {
          .testimonials-section { padding: 96px 0; }
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 40px;
        }
        @media (min-width: 768px) {
          .testimonials-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 60px; }
        }
        .testimonial-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.4s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .testimonial-card:hover {
          border-color: rgba(197,168,128,0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .testimonial-stars {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
        }
        .testimonial-text {
          font-size: 13px;
          color: #d1d5db;
          line-height: 1.6;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 16px;
        }
        .testimonial-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(197,168,128,0.2), rgba(197,168,128,0.05));
          border: 1px solid rgba(197,168,128,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c5a880;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .testimonial-name {
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .testimonial-role {
          font-size: 9px;
          color: #6b7280;
          font-weight: 700;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── PRICING ── */
        .pricing-section {
          padding: 48px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.3);
        }
        @media (min-width: 1024px) {
          .pricing-section { padding: 96px 0; }
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
          margin-top: 40px;
        }
        @media (min-width: 640px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 60px; }
        }
        @media (min-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .pricing-card {
          background: #fff;
          border: 1px solid rgba(227,216,200,0.25);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          transition: all 0.4s ease;
          position: relative;
        }
        .pricing-card:hover {
          transform: translateY(-6px);
        }
        .pricing-card-highlight {
          background: #09090b;
          border-color: #09090b;
          color: #fff;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }
        .pricing-popular {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: #c5a880;
          color: #09090b;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border-radius: 9999px;
        }
        .pricing-name {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .pricing-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 3vw, 2.2rem);
          font-weight: 300;
        }
        .pricing-period {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-left: 4px;
        }
        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 24px 0;
          flex: 1;
        }
        .pricing-features li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .pricing-cta {
          display: block;
          width: 100%;
          text-align: center;
          padding: 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .pricing-cta-default {
          border: 1px solid rgba(9,9,11,0.2);
          color: #09090b;
        }
        .pricing-cta-default:hover {
          background: #09090b;
          color: #fff;
          border-color: #09090b;
        }
        .pricing-cta-highlight {
          background: #c5a880;
          color: #09090b;
          border: none;
        }
        .pricing-cta-highlight:hover {
          background: #fff;
        }

        /* ── CONTACT ── */
        .contact-section {
          padding: 48px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.3);
        }
        @media (min-width: 1024px) {
          .contact-section { padding: 96px 0; }
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .contact-grid { grid-template-columns: 5fr 7fr; gap: 64px; }
        }
        .contact-info-card {
          background: #fff;
          border: 1px solid rgba(227,216,200,0.25);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .contact-info-card:hover {
          border-color: rgba(197,168,128,0.5);
        }
        .contact-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(197,168,128,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c5a880;
          flex-shrink: 0;
        }
        .contact-form-card {
          background: #fff;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(227,216,200,0.3);
          box-shadow: 0 12px 40px rgba(0,0,0,0.04);
        }
        @media (min-width: 640px) {
          .contact-form-card { padding: 24px; border-radius: 24px; }
        }
        @media (min-width: 1024px) {
          .contact-form-card { padding: 36px; }
        }
        .contact-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .contact-form-grid { grid-template-columns: 1fr 1fr; }
        }
        .contact-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
          background: #faf9f6;
          border: 1px solid rgba(227,216,200,0.3);
          border-radius: 12px;
          outline: none;
          transition: all 0.3s;
        }
        .contact-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.1);
        }
        .contact-label {
          font-size: 10px;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
        }
        .contact-submit {
          width: 100%;
          padding: 16px;
          background: #09090b;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .contact-submit:hover {
          background: #c5a880;
          color: #09090b;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(197,168,128,0.3);
        }

        /* ── FAQ ── */
        .faq-section {
          padding: 48px 0;
          background: #fff;
          border-top: 1px solid rgba(227,216,200,0.25);
        }
        @media (min-width: 1024px) {
          .faq-section { padding: 96px 0; }
        }
        .faq-item {
          border: 1px solid rgba(227,216,200,0.4);
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(4px);
          transition: all 0.3s;
          margin-bottom: 12px;
        }
        .faq-item:hover {
          border-color: rgba(197,168,128,0.5);
        }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          font-weight: 700;
          color: #09090b;
          transition: background 0.2s;
        }
        @media (min-width: 1024px) {
          .faq-question { padding: 20px 24px; font-size: 15px; }
        }
        .faq-question:hover {
          background: rgba(250,249,246,0.9);
        }
        .faq-chevron {
          width: 18px;
          height: 18px;
          color: #c5a880;
          flex-shrink: 0;
          transition: transform 0.3s;
        }
        .faq-chevron-open {
          transform: rotate(180deg);
        }
        .faq-answer {
          padding: 0 20px 16px;
          border-top: 1px solid rgba(227,216,200,0.25);
        }
        @media (min-width: 1024px) {
          .faq-answer { padding: 0 24px 20px; }
        }
        .faq-answer p {
          padding-top: 16px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          font-weight: 500;
        }

        /* ── CTA BANNER ── */
        .cta-banner {
          background: #09090b;
          padding: 64px 0;
          border-top: 1px solid rgba(227,216,200,0.15);
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        @media (min-width: 1024px) {
          .cta-banner { padding: 96px 0; }
        }
        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.1) 0%, transparent 70%);
          opacity: 0.4;
          pointer-events: none;
        }
        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 300;
          color: #fff;
          margin-bottom: 20px;
          position: relative;
          z-index: 10;
        }
        .cta-title em {
          font-style: italic;
          color: #c5a880;
        }
        .cta-desc {
          color: #9ca3af;
          font-size: 14px;
          max-width: 520px;
          margin: 0 auto 32px;
          font-weight: 500;
          position: relative;
          z-index: 10;
        }
        @media (min-width: 768px) {
          .cta-desc { font-size: 16px; }
        }
        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          position: relative;
          z-index: 10;
          padding: 0 16px;
        }
        @media (min-width: 480px) {
          .cta-buttons {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
            padding: 0;
          }
        }
        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #09090b;
          background: #c5a880;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s;
          border: none;
          width: 100%;
        }
        @media (min-width: 480px) {
          .cta-btn-primary { width: auto; padding: 16px 36px; font-size: 12px; }
        }
        .cta-btn-primary:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(197,168,128,0.3);
        }
        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s;
          background: transparent;
          width: 100%;
        }
        @media (min-width: 480px) {
          .cta-btn-secondary { width: auto; padding: 16px 36px; font-size: 12px; }
        }
        .cta-btn-secondary:hover {
          background: rgba(255,255,255,0.1);
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeInUp 0.6s ease-out;
        }
      `}} />

      <main className="font-poppins">

      {/* ── CINEMATIC HERO SECTION ── */}
      <CinematicHero />



      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="section-container" style={{ textAlign: 'center' }}>
          <span className="section-badge">Platform Capabilities</span>
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-desc">A complete suite of tools for the modern event photographer.</p>
          <div className="features-grid">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-card" style={{ textAlign: 'left' }}>
                  <div className="feature-icon"><Icon className="w-5 h-5" /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="section-container" style={{ textAlign: 'center' }}>
          <span className="section-badge">Wall of Love</span>
          <h2 className="section-title" style={{ color: '#fff' }}>What Photographers Say</h2>
          <p className="section-desc" style={{ color: '#9ca3af' }}>Real results from real studios across India.</p>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card">
                <div>
                  <div className="testimonial-stars">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3" style={{ fill: '#c5a880', color: '#c5a880' }} />
                    ))}
                  </div>
                  <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <div style={{ textAlign: 'left' }}>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="pricing-section">
        <div className="section-container" style={{ textAlign: 'center' }}>
          <span className="section-badge">Membership</span>
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-desc">Start delivering free. Upgrade as your studio grows.</p>
          <div className="pricing-grid">
            {plans.map(plan => (
              <div key={plan.name} className={`pricing-card ${plan.highlight ? 'pricing-card-highlight' : ''}`}>
                {plan.highlight && <div className="pricing-popular">Most Popular</div>}
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="pricing-name" style={{ color: plan.highlight ? '#c5a880' : '#09090b' }}>{plan.name}</h3>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: plan.highlight ? '#9ca3af' : '#6b7280', marginBottom: '16px' }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '1px solid rgba(227,216,200,0.15)', paddingBottom: '16px' }}>
                    <span className="pricing-price" style={{ color: plan.highlight ? '#fff' : '#09090b' }}>{plan.price}</span>
                    <span className="pricing-period" style={{ color: plan.highlight ? '#c5a880' : '#6b7280', marginBottom: '4px' }}>{plan.period}</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <Check className="w-3.5 h-3.5" style={{ color: '#c5a880', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: plan.highlight ? '#d1d5db' : '#6b7280' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`pricing-cta ${plan.highlight ? 'pricing-cta-highlight' : 'pricing-cta-default'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="contact-grid">
            <div style={{ textAlign: 'left' }}>
              <span className="section-badge">Get In Touch</span>
              <h2 className="section-title" style={{ marginBottom: '32px' }}>
                Let&apos;s Make <em style={{ fontStyle: 'italic', color: '#c5a880' }}>Event Sharing</em> Effortless
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="contact-info-card">
                  <div className="contact-icon-wrap"><Mail className="w-5 h-5" /></div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#09090b' }}>maraphoto303@gmail.com</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>We&apos;ll reply within 24 hours</p>
                  </div>
                </div>
                <div className="contact-info-card">
                  <div className="contact-icon-wrap"><Phone className="w-5 h-5" /></div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#09090b' }}>+91 87994 95028</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>Available 9 AM – 6 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <div style={{ marginBottom: '28px', borderBottom: '1px solid rgba(227,216,200,0.2)', paddingBottom: '16px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#09090b' }}>Send a Message</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}>We usually respond in less than 24 hours.</p>
              </div>
              <form onSubmit={handleHomeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="contact-form-grid">
                  <div style={{ textAlign: 'left' }}>
                    <label className="contact-label">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" required name="name" className="contact-input" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <label className="contact-label">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="email" required name="email" className="contact-input" />
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label className="contact-label">Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="tel" required name="phone" className="contact-input" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label className="contact-label">Message <span style={{ color: '#dc2626' }}>*</span></label>
                  <textarea required rows={4} name="message" className="contact-input" style={{ resize: 'none' }} />
                </div>
                <button type="submit" className="contact-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : (
                    <>Send Message <Send className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-glow" />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
          <h2 className="cta-title">Ready to deliver photos <em>flawlessly?</em></h2>
          <p className="cta-desc">Join premium studios delivering experiences, not links. Start free today, no credit card required.</p>
          <div className="cta-buttons">
            <Link href="/signup" className="cta-btn-primary">
              Start Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/#contact" className="cta-btn-secondary">
              Consult Sales
            </Link>
          </div>
        </div>
      </section>

      </main>
    </PublicWrapper>
  );
}
