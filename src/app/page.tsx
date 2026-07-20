'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PublicWrapper from '../components/PublicWrapper';
import {
  Camera, QrCode, ScanFace, Download, Star, Check,
  ChevronDown, ArrowRight, Zap, Shield, Users,
  Upload, Smile, ImageDown, Trophy, Clock, Globe,
  Mail, Phone, MapPin, Send, Eye, Settings, CreditCard,
  Calendar, LayoutDashboard, ChevronRight
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
  { icon: ScanFace, title: 'Instant Face Recognition',  desc: 'Eliminate the friction of manual photo browsing. Our proprietary AI engine analyzes and matches faces in under 2 seconds, delivering a highly personalized and seamless memory retrieval experience for every guest.' },
  { icon: QrCode,   title: 'Elegant QR Branding',       desc: 'Enhance your studio\'s prestige with beautifully designed, custom-branded QR codes. Display them on elegant table tents or digital screens to provide guests with frictionless, instant access to the event gallery.' },
  { icon: Zap,      title: 'Real-time Live Delivery',    desc: 'Revolutionize client satisfaction by streaming high-resolution photos instantly as the event unfolds. Drive unprecedented organic social media engagement and immediate word-of-mouth marketing for your studio.' },
  { icon: Globe,    title: 'Fully White-Labeled',        desc: 'Maintain absolute brand authority with fully customized subdomains, tailored color palettes, and integrated studio logos. Deliver a truly luxurious, uninterrupted brand experience to your most premium clientele.' },
  { icon: Shield,   title: 'End-to-End Privacy',         desc: 'Guarantee peace of mind with enterprise-grade encryption and stringent access controls. Rest assured that private event memories remain strictly confidential, accessible only to authorized guests via secure QR authentication.' },
  { icon: Users,    title: 'Unlimited Guest Delivery',   desc: 'Scale effortlessly to accommodate events of any magnitude. Our robust cloud infrastructure delivers thousands of high-resolution images to an unlimited number of concurrent guests with zero latency or performance degradation.' },
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
  const [simState, setSimState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [sliderVal, setSliderVal] = useState<number>(50);
  const [heroTab, setHeroTab] = useState<'scanner' | 'enhancer'>('scanner');

  // Autoplay loop simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const runLoop = () => {
      if (simState === 'idle') {
        timer = setTimeout(() => setSimState('scanning'), 3000);
      } else if (simState === 'scanning') {
        timer = setTimeout(() => setSimState('success'), 2500);
      } else if (simState === 'success') {
        timer = setTimeout(() => setSimState('idle'), 4000);
      }
    };
    runLoop();
    return () => clearTimeout(timer);
  }, [simState]);

  const handleHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you for contacting Mara Photo! Our team will get back to you within 24 hours.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <PublicWrapper>
      {/* ═══════════ INTERNAL CSS ═══════════ */}
      <style dangerouslySetInnerHTML={{__html: `
        /* ── HERO ── */
        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 16px 0 80px;
          background: linear-gradient(180deg, #faf9f6 0%, #f5f2eb 100%);
        }
        .hero-glow-1 {
          position: absolute;
          top: -100px;
          right: -200px;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-glow-2 {
          position: absolute;
          bottom: -200px;
          left: -100px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-grid {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
          position: relative;
          z-index: 10;
        }
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 7fr 5fr;
            gap: 80px;
          }
          .hero-section {
            padding: 32px 0 96px;
          }
        }
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 300;
          line-height: 1.12;
          color: #09090b;
          margin-bottom: 28px;
        }
        .hero-headline em {
          font-style: italic;
          color: #c5a880;
        }
        .hero-sub {
          font-size: 16px;
          line-height: 1.7;
          color: #6b7280;
          max-width: 560px;
          margin-bottom: 36px;
          font-weight: 500;
        }
        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: #09090b;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          border: none;
          cursor: pointer;
        }
        .hero-btn-primary:hover {
          background: #c5a880;
          color: #09090b;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(197,168,128,0.3);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          font-size: 14px;
          font-weight: 700;
          color: #09090b;
          background: #fff;
          border: 1.5px solid #e3d8c8;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s ease;
          cursor: pointer;
        }
        .hero-btn-secondary:hover {
          background: #f5f2eb;
          border-color: #c5a880;
          transform: translateY(-1px);
        }
        .hero-trust {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid rgba(227,216,200,0.3);
        }
        .hero-avatars {
          display: flex;
        }
        .hero-avatars div {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f0e8;
          border: 2px solid #faf9f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          margin-left: -8px;
        }
        .hero-avatars div:first-child {
          margin-left: 0;
        }

        /* ── PHONE MOCKUP ── */
        .phone-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .phone-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.2) 0%, transparent 70%);
          animation: pulseGlow 3s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
        .phone-frame {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 300px;
          background: #09090b;
          border-radius: 48px;
          padding: 12px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.15), 0 0 0 4px rgba(227,216,200,0.3);
        }
        .phone-notch {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 20px;
          background: #09090b;
          border-radius: 9999px;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .phone-notch-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .phone-screen {
          width: 100%;
          height: 540px;
          background: #faf9f6;
          border-radius: 36px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 40px 16px 16px;
        }
        .phone-tabs {
          display: flex;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(227,216,200,0.4);
          border-radius: 9999px;
          padding: 2px;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        .phone-tab {
          flex: 1;
          padding: 6px;
          border-radius: 9999px;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: transparent;
          color: #94a3b8;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }
        .phone-tab-active {
          background: #c5a880;
          color: #09090b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .phone-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 0;
        }
        .phone-title-block {
          text-align: center;
        }
        .phone-title-block img {
          height: 24px;
          width: auto;
          margin: 0 auto 12px;
          display: block;
        }
        .phone-title-block h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #09090b;
          margin-bottom: 4px;
        }
        .phone-title-block p {
          font-size: 9px;
          font-weight: 700;
          color: #c5a880;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .phone-viewfinder {
          position: relative;
          aspect-ratio: 1;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          border: 2px dashed rgba(197,168,128,0.4);
          background: #f3f0e8;
          margin: 8px 0;
        }
        .phone-viewfinder img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }
        .phone-scan-btn {
          width: 100%;
          padding: 14px;
          background: #09090b;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s;
        }
        .phone-scan-btn:hover {
          background: #c5a880;
          color: #09090b;
        }
        .scan-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #c5a880;
          box-shadow: 0 0 15px #c5a880;
          animation: scanLaser 2s ease-in-out infinite;
          z-index: 20;
        }
        @keyframes scanLaser {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .scan-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(9,9,11,0.15);
          backdrop-filter: blur(1px);
        }
        .scan-spinner {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px dashed #c5a880;
          animation: spinScan 2s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes spinScan {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .match-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 8px 0;
        }
        .match-grid-item {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(227,216,200,0.25);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .match-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }
        .match-grid-item:hover img {
          transform: scale(1.1);
        }
        .match-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #c5a880;
          color: #fff;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .match-info-bar {
          background: #f5f2eb;
          border: 1px solid rgba(227,216,200,0.4);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .match-info-bar-label {
          font-size: 8px;
          font-weight: 800;
          color: #09090b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .match-info-bar-count {
          font-size: 10px;
          color: #6b7280;
          font-weight: 700;
        }
        .match-info-bar-badge {
          font-size: 8px;
          font-weight: 800;
          background: rgba(22,163,74,0.1);
          color: #16a34a;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── AI ENHANCER ── */
        .enhancer-wrap {
          position: relative;
          aspect-ratio: 1;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: #f3f0e8;
          border: 1px solid rgba(227,216,200,0.4);
          margin: 8px 0;
          user-select: none;
        }
        .enhancer-wrap img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .enhancer-before {
          filter: brightness(0.75) contrast(0.8) saturate(0.5);
        }
        .enhancer-after-clip {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .enhancer-after-inner {
          position: absolute;
          inset: 0;
        }
        .enhancer-after-inner img {
          filter: brightness(1.08) contrast(1.05) saturate(1.12);
        }
        .enhancer-watermark {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.45);
          padding: 4px 8px;
          border-radius: 4px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 7px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transform: scale(0.85);
          transform-origin: bottom right;
        }
        .enhancer-line {
          position: absolute;
          inset: 0;
          width: 2px;
          background: #c5a880;
          box-shadow: 0 0 10px #c5a880;
          pointer-events: none;
        }
        .enhancer-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #09090b;
          border: 1.5px solid #c5a880;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          font-size: 9px;
          color: #c5a880;
          font-weight: 900;
        }
        .enhancer-drag {
          position: absolute;
          inset: 0;
          cursor: ew-resize;
        }

        /* ── STATS ── */
        .stats-section {
          background: #09090b;
          border-top: 1px solid rgba(227,216,200,0.15);
          padding: 72px 0;
          position: relative;
          overflow: hidden;
        }
        .stats-grid {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 48px; }
        }
        .stat-item {
          text-align: center;
          border-right: 1px solid rgba(227,216,200,0.1);
        }
        .stat-item:last-child { border-right: none; }
        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #c5a880;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        /* ── WORKFLOW ── */
        .workflow-section {
          padding: 96px 0;
          background: #fff;
          position: relative;
        }
        .section-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
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
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #09090b;
          margin-bottom: 16px;
        }
        .section-desc {
          color: #6b7280;
          max-width: 540px;
          margin: 0 auto;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }
        .workflow-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-top: 60px;
        }
        @media (min-width: 768px) {
          .workflow-grid { grid-template-columns: repeat(3, 1fr); gap: 32px; }
        }
        .workflow-card {
          background: #09090b;
          border-radius: 24px;
          padding: 32px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
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
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }
        .workflow-card p {
          font-size: 13px;
          color: #9ca3af;
          line-height: 1.7;
          font-weight: 500;
        }

        /* ── FEATURES ── */
        .features-section {
          padding: 96px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.25);
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 60px;
        }
        @media (min-width: 768px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .feature-card {
          background: #fff;
          border: 1px solid rgba(227,216,200,0.25);
          border-radius: 20px;
          padding: 28px;
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
          font-size: 16px;
          font-weight: 800;
          color: #09090b;
          margin-bottom: 10px;
        }
        .feature-card p {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.7;
          font-weight: 500;
        }

        /* ── TESTIMONIALS ── */
        .testimonials-section {
          padding: 96px 0;
          background: #09090b;
          border-top: 1px solid rgba(227,216,200,0.15);
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-top: 60px;
        }
        @media (min-width: 768px) {
          .testimonials-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .testimonial-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 32px;
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
          margin-bottom: 20px;
        }
        .testimonial-text {
          font-size: 14px;
          color: #d1d5db;
          line-height: 1.7;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 20px;
        }
        .testimonial-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(197,168,128,0.2), rgba(197,168,128,0.05));
          border: 1px solid rgba(197,168,128,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c5a880;
          font-size: 13px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .testimonial-name {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .testimonial-role {
          font-size: 10px;
          color: #6b7280;
          font-weight: 700;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── PRICING ── */
        .pricing-section {
          padding: 96px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.3);
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          margin-top: 60px;
        }
        @media (min-width: 640px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .pricing-card {
          background: #fff;
          border: 1px solid rgba(227,216,200,0.25);
          border-radius: 24px;
          padding: 28px;
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
          padding: 96px 0;
          background: #faf9f6;
          border-top: 1px solid rgba(227,216,200,0.3);
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
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
          border-radius: 24px;
          padding: 36px;
          border: 1px solid rgba(227,216,200,0.3);
          box-shadow: 0 12px 40px rgba(0,0,0,0.04);
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
          padding: 96px 0;
          background: #fff;
          border-top: 1px solid rgba(227,216,200,0.25);
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
          padding: 20px 24px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 15px;
          font-weight: 700;
          color: #09090b;
          transition: background 0.2s;
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
          padding: 0 24px 20px;
          border-top: 1px solid rgba(227,216,200,0.25);
        }
        .faq-answer p {
          padding-top: 16px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.7;
          font-weight: 500;
        }

        /* ── CTA BANNER ── */
        .cta-banner {
          background: #09090b;
          padding: 96px 0;
          border-top: 1px solid rgba(227,216,200,0.15);
          position: relative;
          overflow: hidden;
          text-align: center;
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
          font-size: 16px;
          max-width: 520px;
          margin: 0 auto 32px;
          font-weight: 500;
          position: relative;
          z-index: 10;
        }
        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          position: relative;
          z-index: 10;
        }
        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #09090b;
          background: #c5a880;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s;
          border: none;
        }
        .cta-btn-primary:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(197,168,128,0.3);
        }
        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.35s;
          background: transparent;
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

      {/* ── HERO SECTION ── */}
      <section className="hero-section">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="hero-grid">
          <div className="animate-in" style={{ textAlign: 'left' }}>
            <h1 className="hero-headline">
              Transform Event Photos & <em>Deliver with AI</em> in Seconds.
            </h1>
            <p className="hero-sub">
              The ultimate AI platform for event photographers. Guests scan a custom QR code, upload a selfie, and instantly receive their matched photos. Save hours of sorting and deliver a luxury client experience.
            </p>
            <div className="hero-cta-row">
              <Link href="/signup" className="hero-btn-primary">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => { const s = document.getElementById('how-it-works'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }}
                className="hero-btn-secondary"
              >
                Try AI Simulator
              </button>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                {[1,2,3,4].map(i => (
                  <div key={i}>{String.fromCharCode(64 + i)}</div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4" style={{ fill: '#c5a880', color: '#c5a880' }} />)}
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Loved by 600+ premium photography studios
                </p>
              </div>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="phone-wrap">
            <div className="phone-glow" />
            <div className="phone-frame">
              <div className="phone-notch">
                <div className="phone-notch-dot" />
              </div>
              <div className="phone-screen">
                <div className="phone-tabs">
                  <button className={`phone-tab ${heroTab === 'scanner' ? 'phone-tab-active' : ''}`} onClick={() => setHeroTab('scanner')}>Face Match</button>
                  <button className={`phone-tab ${heroTab === 'enhancer' ? 'phone-tab-active' : ''}`} onClick={() => setHeroTab('enhancer')}>AI Enhancer</button>
                </div>

                {heroTab === 'scanner' ? (
                  <div className="phone-content">
                    {simState === 'idle' && (
                      <>
                        <div className="phone-title-block">
                          <img src="/logo.png" alt="Mara Photo" />
                          <h3>Guest Photo Search</h3>
                          <p style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}>Autoplay Simulation Running</p>
                        </div>
                        <div className="phone-viewfinder">
                          <img src="/portrait.jpg" alt="Guest Selfie" />
                          <div style={{ position: 'absolute', top: '8px', left: '8px', color: '#c5a880', opacity: 0.6 }}><Camera className="w-4 h-4" /></div>
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '8px', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '9999px', backdropFilter: 'blur(4px)' }}>Viewfinder</div>
                        </div>
                        <button className="phone-scan-btn" onClick={() => setSimState('scanning')}>
                          <Zap className="w-3 h-3" style={{ color: '#c5a880' }} /> Try AI Face Scanner
                        </button>
                      </>
                    )}

                    {simState === 'scanning' && (
                      <>
                        <div className="phone-title-block">
                          <img src="/logo.png" alt="Mara Photo" />
                          <h3>Scanning Face...</h3>
                          <p style={{ animation: 'pulseGlow 1.5s ease-in-out infinite' }}>Analyzing structures</p>
                        </div>
                        <div className="phone-viewfinder" style={{ border: '2px solid #c5a880' }}>
                          <img src="/portrait.jpg" alt="Guest Selfie" style={{ filter: 'brightness(0.9)' }} />
                          <div className="scan-laser" />
                          <div className="scan-overlay">
                            <div className="scan-spinner">
                              <ScanFace className="w-5 h-5" style={{ color: '#fff' }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c5a880', animation: 'pulseGlow 1s ease-in-out infinite' }} />
                            Matching 1,247 photos...
                          </div>
                        </div>
                      </>
                    )}

                    {simState === 'success' && (
                      <>
                        <div className="phone-title-block">
                          <img src="/logo.png" alt="Mara Photo" />
                          <h3>Matches Found!</h3>
                          <p style={{ color: '#16a34a' }}>Analysis complete</p>
                        </div>
                        <div className="match-grid">
                          {["/wedding.jpg","/gala.jpg","/party.jpg","/rings.jpg"].map((url, i) => (
                            <div key={i} className="match-grid-item">
                              <img src={url} alt="Matched" />
                              <div className="match-badge"><Check className="w-2 h-2" /></div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="match-info-bar">
                            <div>
                              <p className="match-info-bar-label">Matched Gallery</p>
                              <p className="match-info-bar-count">23 high-res images</p>
                            </div>
                            <span className="match-info-bar-badge">100% Match</span>
                          </div>
                          <button className="phone-scan-btn" onClick={() => setSimState('idle')}>
                            <Download className="w-3 h-3" /> Download All (ZIP)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="phone-content" style={{ textAlign: 'center' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 300, color: '#09090b', marginBottom: '4px' }}>AI Enhancer</h3>
                      <p style={{ fontSize: '8px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Slide to color correct & watermark</p>
                    </div>
                    <div className="enhancer-wrap">
                      <img src="/wedding.jpg" alt="Original" className="enhancer-before" />
                      <div className="enhancer-after-clip" style={{ width: `${sliderVal}%` }}>
                        <div className="enhancer-after-inner" style={{ width: '270px', height: '270px' }}>
                          <img src="/wedding.jpg" alt="Enhanced" />
                          <div className="enhancer-watermark">MARA PHOTO</div>
                        </div>
                      </div>
                      <div className="enhancer-line" style={{ left: `${sliderVal}%` }} />
                      <div className="enhancer-handle" style={{ left: `${sliderVal}%` }}>↔</div>
                      <div
                        className="enhancer-drag"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setSliderVal(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
                        }}
                        onTouchMove={(e) => {
                          if (e.touches[0]) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSliderVal(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                          }
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <Link href="/signup" className="phone-scan-btn" style={{ textDecoration: 'none' }}>
                        Start Editing Free
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>



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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <button type="submit" className="contact-submit">
                  Send Message <Send className="w-3.5 h-3.5" />
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
