'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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

const featureTabs = [
  {
    tabLabel: 'Manage Event',
    icon: Settings,
    title: 'Instant Client Gallery Setup & Event Management Software',
    desc: 'Easily set up your event photo gallery on Mara Photo in seconds. Streamline your event photography workflow with our rapid creation tools. Try Mara Photo free!',
    bullets: [
      'Create your event in seconds',
      'Organize event categories & sub events',
      'Invite other Co hosts as admin collaborators'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[230px] select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black text-[#09090b]">mara photo</span>
          <span className="text-[8px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">• 4 active</span>
        </div>
        <div className="flex gap-3 flex-1 mt-2.5">
          {/* Sidebar */}
          <div className="w-[65px] border-r border-slate-50 pr-1 space-y-1 shrink-0 text-[7px] text-slate-400 font-bold">
            <div className="bg-[#09090b] text-white rounded p-1 flex items-center gap-1"><LayoutDashboard className="w-2 h-2" /> Dashboard</div>
            <div className="p-1 flex items-center gap-1"><Camera className="w-2 h-2" /> Events</div>
            <div className="p-1 flex items-center gap-1"><Settings className="w-2 h-2" /> Settings</div>
          </div>
          {/* Content */}
          <div className="flex-1 space-y-2">
            <p className="text-[9px] font-black text-[#c5a880]">Your Events, Organized ✨</p>
            <div className="border border-slate-100 rounded-lg p-1.5 space-y-1 bg-slate-50 relative">
              <div className="h-12 rounded overflow-hidden">
                <img src="/party.jpg" alt="party" className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <p className="text-[8px] font-black text-slate-800">Birthday Party</p>
                  <p className="text-[6px] text-gray-400 font-semibold">26 May, 2026</p>
                </div>
                <span className="text-[5.5px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">Public</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Invoice Generator',
    icon: CreditCard,
    title: 'Professional Invoicing & Payment Automation',
    desc: 'Create and send branded invoices to clients in one click. Receive payments directly to your bank account with automatic status tracking on Mara Photo.',
    bullets: [
      'Generate GST-compliant invoices instantly',
      'Automated client payment reminders',
      'Secure digital payments & UPI integration'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[230px] select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Studio Invoice</span>
          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Paid</span>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <div className="flex justify-between text-[8px] text-slate-400 font-semibold">
            <span>Bill To: Mehta Family</span>
            <span>Date: 24 May 2026</span>
          </div>
          <div className="border border-slate-100 rounded-lg p-2 bg-slate-50 space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-700">
              <span>Wedding Photography Cover</span>
              <span>₹85,000</span>
            </div>
            <div className="flex justify-between text-[7px] text-slate-400 font-medium">
              <span>Pre-Wedding + 2 Day Event Shoot</span>
              <span>Qty: 1</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
            <span className="text-[8px] text-slate-400 font-bold">Total Received</span>
            <span className="text-xs font-black text-slate-800">₹85,000</span>
          </div>
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Photographer Portfolio Website',
    icon: Globe,
    title: 'Stunning White-Label Portfolios',
    desc: 'Showcase your high-resolution event galleries on a custom domain under your own branding, giving clients an elite, premium experience.',
    bullets: [
      'Add custom domains (e.g., yourstudio.com)',
      'High-resolution, ultra-fast image load speed',
      'Integrated contact & client booking forms'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[230px] select-none">
        <div className="h-16 w-full overflow-hidden relative rounded-lg shrink-0">
          <img src="/portrait.jpg" alt="Portfolio Preview" className="w-full h-full object-cover brightness-95" />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            <span className="text-[8px] bg-slate-900/90 text-[#c5a880] font-black px-2.5 py-0.5 rounded-full shadow-md">yourstudio.com</span>
          </div>
        </div>
        <div className="p-1 flex flex-col justify-between flex-1 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-black text-slate-700 uppercase tracking-wider">Featured Work</span>
            <span className="text-[6px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">View All</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1.5">
            <div className="h-[48px] rounded-lg overflow-hidden border border-slate-100"><img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" /></div>
            <div className="h-[48px] rounded-lg overflow-hidden border border-slate-100"><img src="/party.jpg" alt="Party" className="w-full h-full object-cover" /></div>
            <div className="h-[48px] rounded-lg overflow-hidden border border-slate-100"><img src="/gala.jpg" alt="Gala" className="w-full h-full object-cover" /></div>
          </div>
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Event QR Code Gallery',
    icon: QrCode,
    title: 'Instant Guest Access via QR Codes',
    desc: 'Generate branded, high-res QR code designs for print on table cards or display on venue backdrops. Guests scan to immediately view their photos.',
    bullets: [
      'Generate print-ready QR card templates',
      'Customize with your studio name and branding',
      'Guests scan to instantly start facial search'
    ],
    mockup: (
      <div className="w-full bg-[#09090b] text-white rounded-xl shadow-lg border border-white/10 p-4 text-center font-poppins relative flex flex-col justify-between h-[230px] overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a880]/10 rounded-full blur-xl" />
        <div className="space-y-0.5 z-10">
          <p className="text-[9px] font-black tracking-widest text-[#c5a880] uppercase">Scan to Find Your Photos</p>
          <p className="text-[6.5px] text-gray-400">Powered by Mara Photo AI</p>
        </div>
        <div className="bg-white p-2 rounded-xl inline-block mx-auto z-10 shadow-lg my-1">
          <QrCode className="w-14 h-14 text-[#09090b]" />
        </div>
        <div className="bg-[#c5a880] text-[#09090b] font-black text-[7.5px] rounded-lg py-1.5 uppercase tracking-widest z-10 max-w-[140px] mx-auto w-full">
          Scan QR Code
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Event Booking',
    icon: Calendar,
    title: 'Simplified Booking & Client Management',
    desc: 'Allow prospective clients to book dates directly on your studio calendar, sign digital contracts, and deposit token booking advances.',
    bullets: [
      'Real-time automated calendar availability',
      'Secure deposit collection during booking',
      'Smart contract templates & digital signatures'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[230px] select-none">
        <div className="border-b border-slate-100 pb-2">
          <p className="text-[9.5px] font-black text-slate-800">Select Date & Time</p>
          <p className="text-[6.5px] text-gray-400 font-semibold mt-0.5">Choose your event date below</p>
        </div>
        <div className="grid grid-cols-7 gap-1.5 my-2.5 text-center text-[7px] font-bold">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-slate-400">{d}</div>)}
          {Array.from({ length: 28 }).map((_, i) => (
            <div 
              key={i} 
              className={`p-1 rounded cursor-pointer ${
                i === 17 
                  ? 'bg-[#c5a880] text-[#09090b] font-black shadow-sm' 
                  : i === 12 || i === 19 
                    ? 'bg-slate-100 text-slate-300 pointer-events-none line-through' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="bg-[#faf9f6] border border-[#e3d8c8]/25 rounded-lg p-2 text-center text-[7.5px] font-bold text-[#c5a880] uppercase tracking-wider">
          May 18, 2026 • 09:00 AM Requested
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Event Face Recognition',
    icon: ScanFace,
    title: 'Ultra-Fast AI Face Matching',
    desc: 'Guests take a quick selfie, and Mara Photo AI instantly scans thousands of event photos, serving personal results in milliseconds.',
    bullets: [
      'Lightning-fast face index match in 0.5s',
      'Ultra high-precision recognition accuracy',
      'Strict guest privacy & security encryption'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[230px] overflow-hidden select-none">
        <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 border-b border-slate-100 pb-1.5">
          <span>AI Scanning System</span>
          <span className="text-emerald-500 font-bold">• Active</span>
        </div>
        <div className="relative h-[110px] w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-0.5 mt-1">
          <img src="/guest_selfie.jpg" alt="Guest Selfie" className="w-full h-full object-cover rounded-xl" />
          <div className="absolute inset-1.5 border-2 border-emerald-400 border-dashed rounded-full animate-pulse" />
          <div className="absolute bottom-1.5 bg-[#09090b]/80 text-white text-[6px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Match Found (99.8%)
          </div>
        </div>
        <div className="text-[7.5px] text-slate-500 font-bold text-center mt-1">
          Serving 14 matched photos instantly
        </div>
      </div>
    )
  },
  {
    tabLabel: 'Wedding Website Template',
    icon: Smile,
    title: 'Elegant Wedding Event Subpages',
    desc: 'Create custom mini-sites for couples featuring their story, event location maps, countdown timers, and interactive RSVP guest registries.',
    bullets: [
      'Gorgeous pre-designed wedding layouts',
      'Interactive RSVP and event schedule registry',
      'Integrated live photo wall for wedding guests'
    ],
    mockup: (
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 text-center font-poppins relative flex flex-col justify-between h-[230px] overflow-hidden select-none">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wedding Celebration</p>
          <p className="text-[13px] font-serif-luxury font-light text-[#09090b]">Raj & Priya</p>
        </div>
        <div className="h-20 rounded-lg overflow-hidden my-2 border border-slate-100">
          <img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover brightness-95" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-slate-700 text-center font-bold text-[7.5px]">
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">12</p><p className="text-[5.5px] text-slate-400">Days</p></div>
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">08</p><p className="text-[5.5px] text-slate-400">Hours</p></div>
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">45</p><p className="text-[5.5px] text-slate-400">Mins</p></div>
        </div>
      </div>
    )
  }
];

/* ─────────────── COMPONENTS ─────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#e3d8c8]/40 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm transition-all duration-300">
      <button
        className="w-full flex items-center justify-between px-6 py-6 text-left hover:bg-[#faf9f6]/90 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-bold text-[#09090b] text-base md:text-lg tracking-wide font-poppins pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#c5a880] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 text-[#1c1c1f] leading-relaxed text-sm md:text-base border-t border-[#e3d8c8]/25">
          <p className="pt-4 font-medium text-gray-600">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────── PAGE ─────────────── */

export default function HomePage() {
  const [simState, setSimState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [sliderVal, setSliderVal] = useState<number>(50);
  const [heroTab, setHeroTab] = useState<'scanner' | 'enhancer'>('scanner');

  // Autoplay loop simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runLoop = () => {
      if (simState === 'idle') {
        // Wait 3 seconds, then start scanning automatically
        timer = setTimeout(() => {
          setSimState('scanning');
        }, 3000);
      } else if (simState === 'scanning') {
        // Scan for 2.5 seconds, then succeed
        timer = setTimeout(() => {
          setSimState('success');
        }, 2500);
      } else if (simState === 'success') {
        // Wait 4 seconds on success screen, then loop back to idle
        timer = setTimeout(() => {
          setSimState('idle');
        }, 4000);
      }
    };

    runLoop();
    return () => clearTimeout(timer);
  }, [simState]);

  const startSimulation = () => {
    setSimState('scanning');
  };

  const resetSimulation = () => {
    setSimState('idle');
  };

  const handleHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for contacting Mara Photo! Our team will get back to you within 24 hours.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b]">

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-2 pb-12 lg:pt-4 lg:pb-16">
        {/* Editorial Background Art */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[900px] h-[900px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-14 lg:gap-20 items-center">
            
            {/* Left Column: Premium Headline & CTA */}
            <div className="lg:col-span-7 text-center lg:text-left animate-fade-in-up">

              {/* Luxury Editorial Headline */}
              <h1 className="font-serif-luxury text-5xl sm:text-6xl lg:text-7xl font-light text-[#09090b] leading-[1.12] mb-8">
                Transform Event Photos & <span className="italic text-[#c5a880]">Deliver with AI</span> in Seconds.
              </h1>

              <p className="font-poppins text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                The ultimate AI platform for event photographers. Guests scan a custom QR code, upload a selfie, and instantly receive their matched photos. Save hours of sorting and deliver a luxury client experience.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="font-poppins inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-[#09090b] hover:bg-[#c5a880] px-9 py-4.5 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  Start Editing Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => {
                    const section = document.getElementById('how-it-works');
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-poppins inline-flex items-center justify-center gap-2 text-base font-bold text-[#09090b] bg-white border border-[#e3d8c8]/60 px-9 py-4.5 rounded-full hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                >
                  Try AI Simulator
                </button>
              </div>

              {/* Social trust badge */}
              <div className="mt-14 flex items-center gap-5 justify-center lg:justify-start border-t border-[#e3d8c8]/30 pt-10">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-[#f3f0e8] border-2 border-[#faf9f6] flex items-center justify-center text-slate-800 text-sm font-bold font-poppins">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-[#c5a880] text-[#c5a880]" />)}
                  </div>
                  <p className="text-xs text-gray-500 font-bold mt-1 font-poppins uppercase tracking-widest">Loved by 600+ premium photography studios</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Smartphone AI Scanner Simulator */}
            <div className="lg:col-span-5 relative flex items-center justify-center mt-8 lg:mt-0">
              {/* Decorative background glow */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#c5a880]/15 blur-3xl opacity-40 animate-pulse-soft" />
              </div>

              {/* Smartphone Frame Wrapper */}
              <div className="relative w-full max-w-[320px] h-[610px] bg-[#09090b] rounded-[52px] p-3 shadow-2xl border-4 border-[#e3d8c8]/30 relative z-10">
                {/* Speaker grill & camera (Dynamic Island) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-[#09090b] rounded-full border border-white/5 z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/10" />
                  <div className="w-11 h-0.5 bg-slate-950 rounded-full ml-3" />
                </div>

                {/* Inner screen content */}
                <div className="w-full h-full bg-[#faf9f6] rounded-[40px] overflow-hidden relative flex flex-col pt-10 px-4 pb-4">
                  
                  {/* Tab controls */}
                  <div className="flex bg-white/60 backdrop-blur-sm border border-[#e3d8c8]/40 rounded-full p-0.5 mb-3 shrink-0 z-20">
                    <button 
                      onClick={() => setHeroTab('scanner')}
                      className={`flex-1 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${heroTab === 'scanner' ? 'bg-[#c5a880] text-[#09090b] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Face Match
                    </button>
                    <button 
                      onClick={() => setHeroTab('enhancer')}
                      className={`flex-1 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${heroTab === 'enhancer' ? 'bg-[#c5a880] text-[#09090b] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      AI Enhancer
                    </button>
                  </div>

                  {heroTab === 'scanner' ? (
                    <>
                      {simState === 'idle' && (
                        <div className="flex-1 flex flex-col justify-between py-4 animate-fade-in">
                          <div className="text-center">
                            <img src="/logo.png" alt="Mara Photo Logo" className="h-7 w-auto mx-auto object-contain mb-4" />
                            <h3 className="font-serif-luxury text-xl font-light text-[#09090b] mb-1">Guest Photo Search</h3>
                            <p className="text-[10px] text-[#c5a880] font-bold uppercase tracking-wider font-poppins animate-pulse">Autoplay Simulation Running</p>
                          </div>

                          {/* Viewfinder frame */}
                          <div className="relative aspect-square w-full rounded-2xl border-2 border-dashed border-[#c5a880]/40 overflow-hidden bg-[#f3f0e8] flex items-center justify-center p-1">
                            <img src="/portrait.jpg" alt="Guest Selfie" className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 border-2 border-white/40 rounded-xl pointer-events-none" />
                            
                            <div className="absolute top-2 left-2 text-[#c5a880]"><Camera className="w-4 h-4 opacity-60" /></div>
                            <div className="absolute bottom-2 right-2 text-[9px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">Viewfinder</div>
                          </div>

                          <button
                            onClick={startSimulation}
                            className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] font-bold text-xs uppercase tracking-wider py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-poppins"
                          >
                            <Zap className="w-4 h-4 text-[#c5a880] animate-pulse" />
                            Try AI Face Scanner (Autoplay)
                          </button>
                        </div>
                      )}

                      {simState === 'scanning' && (
                        <div className="flex-1 flex flex-col justify-between py-4">
                          <div className="text-center">
                            <img src="/logo.png" alt="Mara Photo Logo" className="h-7 w-auto mx-auto object-contain mb-4" />
                            <h3 className="font-serif-luxury text-xl font-light text-[#09090b] mb-1">Scanning Face...</h3>
                            <p className="text-[10px] text-[#c5a880] font-bold uppercase tracking-wider animate-pulse">Analyzing structures</p>
                          </div>

                          {/* Frame view with scanning laser line */}
                          <div className="relative aspect-square w-full rounded-2xl border-2 border-[#c5a880] overflow-hidden bg-[#f3f0e8] p-1">
                            <img src="/portrait.jpg" alt="Guest Selfie" className="w-full h-full object-cover rounded-xl brightness-90" />
                            
                            {/* Scanning Laser Line */}
                            <div className="absolute left-0 right-0 h-1 bg-[#c5a880] shadow-[0_0_15px_#c5a880] animate-scan-laser z-20" />
                            
                            {/* Analyzing overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]/15 backdrop-blur-[1px]">
                              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#c5a880] animate-spin flex items-center justify-center">
                                <ScanFace className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="text-center px-2 py-4">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 font-poppins uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-ping" />
                              Matching 1,247 photos...
                            </div>
                          </div>
                        </div>
                      )}

                      {simState === 'success' && (
                        <div className="flex-1 flex flex-col justify-between py-4 animate-fade-in">
                          <div className="text-center">
                            <img src="/logo.png" alt="Mara Photo Logo" className="h-7 w-auto mx-auto object-contain mb-4" />
                            <h3 className="font-serif-luxury text-xl font-light text-[#09090b] mb-1">Matches Found!</h3>
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Analysis complete</p>
                          </div>

                          {/* Matched grid */}
                          <div className="grid grid-cols-2 gap-2 my-2">
                            {[
                              "/wedding.jpg",
                              "/gala.jpg",
                              "/party.jpg",
                              "/rings.jpg"
                            ].map((url, i) => (
                              <div key={i} className="aspect-square rounded-xl bg-[#faf9f6] relative overflow-hidden group shadow-sm border border-[#e3d8c8]/25">
                                <img
                                  src={url}
                                  alt="Matched Photo"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-1.5 right-1.5 bg-[#c5a880] text-white p-1 rounded-full shadow-sm">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="space-y-2">
                            <div className="bg-[#f5f2eb] border border-[#e3d8c8]/40 rounded-xl px-3 py-2 flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-bold text-[#09090b] uppercase tracking-wider">Matched Gallery</p>
                                <p className="text-xs text-gray-500 font-bold">23 high-res images</p>
                              </div>
                              <span className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider">100% Match</span>
                            </div>
                            <button
                              onClick={resetSimulation}
                              className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-poppins"
                            >
                              <Download className="w-4 h-4" />
                              Download All (ZIP)
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between py-2 animate-fade-in text-center">
                      <div>
                        <h3 className="font-serif-luxury text-lg font-light text-[#09090b] mb-1">AI Enhancer</h3>
                        <p className="text-[9px] text-gray-405 font-bold uppercase tracking-wider font-poppins mb-3">Slide to color correct & watermark</p>
                      </div>

                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#f3f0e8] select-none group border border-[#e3d8c8]/40 shadow-inner">
                        {/* Before */}
                        <img src="/wedding.jpg" alt="Original Photo" className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-[0.8] saturate-[0.5]" />
                        
                        {/* After */}
                        <div 
                          className="absolute inset-y-0 left-0 overflow-hidden"
                          style={{ width: `${sliderVal}%` }}
                        >
                          <div className="absolute inset-0 w-[270px] h-[270px]">
                            <img src="/wedding.jpg" alt="AI Color Corrected" className="w-full h-full object-cover filter brightness-[1.08] contrast-[1.05] saturate-[1.12]" />
                            {/* Dynamic Watermark overlay */}
                            <div className="absolute bottom-2.5 right-2.5 bg-black/45 px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 border border-white/10 scale-75 origin-bottom-right shadow-sm">
                              <span className="text-[7.5px] font-bold text-white tracking-widest uppercase font-poppins">MARA PHOTO</span>
                            </div>
                          </div>
                        </div>

                        {/* Slider line */}
                        <div 
                          className="absolute inset-y-0 w-0.5 bg-[#c5a880] shadow-[0_0_10px_#c5a880] pointer-events-none"
                          style={{ left: `${sliderVal}%` }}
                        />
                        
                        {/* Handle thumb */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#09090b] border border-[#c5a880] shadow-md flex items-center justify-center pointer-events-none"
                          style={{ left: `${sliderVal}%` }}
                        >
                          <span className="text-[9px] text-[#c5a880] font-black">↔</span>
                        </div>

                        {/* Drag mouse interaction overlay */}
                        <div 
                          className="absolute inset-0 cursor-ew-resize"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setSliderVal(pct);
                          }}
                          onTouchMove={(e) => {
                            if (e.touches && e.touches[0]) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.touches[0].clientX - rect.left;
                              const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
                              setSliderVal(pct);
                            }
                          }}
                        />
                      </div>

                      <div className="mt-4">
                        <Link
                          href="/signup"
                          className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-poppins"
                        >
                          Start Editing Free
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="bg-[#09090b] border-t border-[#e3d8c8]/20 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center group border-r border-[#e3d8c8]/10 last:border-0">
                <p className="font-serif-luxury text-4xl lg:text-5xl font-light text-[#c5a880] mb-2">{s.value}</p>
                <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest font-poppins">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW SECTION ── */}
      <section id="how-it-works" className="py-28 lg:py-36 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] text-[11px] font-bold uppercase tracking-widest rounded-full mb-4 font-poppins">
              Sleek Workflow
            </span>
            <h2 className="font-serif-luxury text-4xl lg:text-5xl font-light text-[#09090b] mb-4">
              How Mara Photo Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed font-medium">
              Three simple steps to deliver a premium, fully automated photo retrieval experience to guests.
            </p>
          </div>

          {/* Cohesive, luxury symmetrical 3-column workflow layout matching user screenshot exactly */}
          <div className="grid lg:grid-cols-3 gap-8 items-stretch relative">
            
            {/* Column 01: STEP 01 & STEP 02 */}
            <div className="flex flex-col gap-8">
              <div className="bg-[#09090b] text-white border border-white/10 rounded-3xl p-6 shadow-lg transition-all duration-300 group flex flex-col justify-between h-[295px] relative">
                <div>
                  <div className="absolute -top-3.5 left-6 bg-[#c5a880] text-[#09090b] text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm z-20 font-poppins">
                    Step 01
                  </div>
                  
                  {/* Visual mockup block - White panel stretches close to border showing 3 events */}
                  <div className="w-full h-36 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 overflow-hidden relative flex items-center justify-center p-1.5">
                    <div className="w-[96%] h-[94%] bg-white rounded-xl shadow-lg border border-slate-100 p-2.5 text-slate-800 text-left font-poppins flex flex-col justify-between transition-transform duration-500 group-hover:scale-[1.02]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[9px] font-black text-slate-800 tracking-wider">Events</span>
                        <span className="text-[7px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">• 4 active</span>
                      </div>
                      <p className="text-[8px] font-black text-[#c5a880] mb-0.5">Your Events, Beautifully Organized ✨</p>
                      
                      {/* Grid with 3 events side-by-side */}
                      <div className="grid grid-cols-3 gap-2 flex-1 items-stretch mt-0.5">
                        <div className="border border-slate-100 rounded p-1 space-y-0.5 bg-slate-50 flex flex-col justify-between">
                          <div className="h-9 rounded overflow-hidden">
                            <img src="/party.jpg" alt="party" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[6.5px] font-black text-slate-800 truncate">Birthday Party</p>
                            <p className="text-[4.5px] text-gray-400 font-semibold">26 May, 2026</p>
                          </div>
                        </div>
                        <div className="border border-slate-100 rounded p-1 space-y-0.5 bg-slate-50 flex flex-col justify-between">
                          <div className="h-9 rounded overflow-hidden">
                            <img src="/wedding.jpg" alt="wedding" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[6.5px] font-black text-slate-800 truncate">Engagement</p>
                            <p className="text-[4.5px] text-gray-400 font-semibold">26 May, 2026</p>
                          </div>
                        </div>
                        <div className="border border-slate-100 rounded p-1 space-y-0.5 bg-slate-50 flex flex-col justify-between">
                          <div className="h-9 rounded overflow-hidden">
                            <img src="/gala.jpg" alt="gala" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[6.5px] font-black text-slate-800 truncate">Pre-Wedding</p>
                            <p className="text-[4.5px] text-gray-400 font-semibold">26 May, 2026</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-poppins font-bold text-xl text-white mb-1.5 tracking-wide">Create Events</h3>
                  <p className="text-gray-455 text-sm leading-relaxed font-medium">
                    Create the event gallery before you even reach the venue. Upload photos on the go as you shoot.
                  </p>
                </div>
              </div>

              {/* STEP 02: Generate QR Codes */}
              <div className="bg-[#09090b] text-white border border-white/10 rounded-3xl p-6 shadow-lg transition-all duration-300 group flex flex-col justify-between h-[295px] relative">
                <div>
                  <div className="absolute -top-3.5 left-6 bg-[#c5a880] text-[#09090b] text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm z-20 font-poppins">
                    Step 02
                  </div>
                  
                  {/* Visual mockup block matching screenshot 3 - White panel stretches close to border */}
                  <div className="w-full h-36 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 overflow-hidden relative flex items-center justify-center p-1.5">
                    <div className="w-[96%] h-[94%] bg-white rounded-xl shadow-lg border border-slate-100 p-2.5 text-slate-800 text-left font-poppins relative flex flex-col justify-between transition-transform duration-500 group-hover:scale-[1.02]">
                      <div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                          <span className="text-[9px] font-bold text-slate-800">Birthday Party</span>
                          <span className="text-[7.5px] text-[#c5a880] font-bold">Access Permissions</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[6.5px] font-bold text-slate-400 uppercase">Email Address</span>
                          <div className="w-full h-5 bg-slate-50 border border-slate-100 rounded px-1.5 flex items-center text-[7px] text-gray-550">collaborator@example.com</div>
                        </div>
                      </div>
                      
                      {/* Floating QR Card */}
                      <div className="absolute bottom-2.5 right-2.5 w-[75px] bg-[#09090b] text-white rounded p-1.5 shadow-xl border border-white/10 space-y-1 text-center">
                        <div className="bg-white p-0.5 rounded inline-block">
                          <QrCode className="w-7 h-7 text-[#09090b]" />
                        </div>
                        <div className="bg-[#c5a880] text-[#09090b] font-bold text-[5.5px] rounded py-0.5 uppercase tracking-wide">Download QR</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-poppins font-bold text-xl text-white mb-1.5 tracking-wide">Generate QR Codes</h3>
                  <p className="text-gray-455 text-sm leading-relaxed font-medium">
                    Generate a custom QR code with your logo inside it. Print on table cards or the venue backdrop and guests can scan directly.
                  </p>
                </div>
              </div>

            </div>

            {/* Column 02 & Column 03 Container: ALL-IN-ONE (top) + STEP 03 & PORTFOLIO (bottom) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* ALL-IN-ONE WORKFLOW Card (full-width across columns 2 & 3) - Dark themed */}
              <div className="bg-[#09090b] text-white rounded-3xl p-7 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-16 shadow-xl h-[240px]">
                {/* Subtle glow */}
                <div className="absolute inset-0 pointer-events-none select-none">
                  <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#c5a880]/10 blur-3xl" />
                </div>

                <div className="space-y-3.5 max-w-[420px] relative z-10 text-left">
                  <span className="inline-block px-3.5 py-1.5 bg-white/5 border border-white/10 text-[#c5a880] text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-full font-poppins">
                    All-in-one Workflow
                  </span>
                  <h3 className="font-serif-luxury text-2xl sm:text-[28px] font-normal tracking-wide text-white leading-tight">
                    Everything You Need, <span className="italic text-[#c5a880]">In One Single Place</span>
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-[15px] font-medium leading-relaxed font-poppins">
                    Bookings, invoices, client messages, photo galleries - all of it sits in one photographer dashboard. No switching between apps.
                  </p>
                </div>

                {/* Photographer Dashboard Widget - High-Contrast White Theme (Bolder fonts & original spacing) */}
                <div className="relative z-10 shrink-0 select-none">
                  <div className="w-[210px] bg-[#faf9f6] border border-slate-150 rounded-2xl shadow-xl p-3.5 font-poppins space-y-3.5 text-slate-800 text-left transition-transform duration-500 hover:scale-[1.02]">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#c5a880]">Studio Analytics</span>
                      <span className="text-[8px] sm:text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </span>
                    </div>
                    
                    {/* Compact stats grid */}
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="bg-white border border-slate-100 rounded-lg p-1.5">
                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Bookings</p>
                        <p className="text-xs sm:text-[13px] font-black text-slate-800 mt-0.5">14 Active</p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg p-1.5">
                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Invoices</p>
                        <p className="text-xs sm:text-[13px] font-black text-[#c5a880] mt-0.5">9 Paid</p>
                      </div>
                    </div>

                    {/* Active task details */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[8px] sm:text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Next Event</span>
                        <span className="text-[#c5a880] font-black uppercase tracking-wider">Scheduled</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-xl p-2 space-y-1">
                        <p className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-tight">Mehta & Shah Wedding</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold truncate">The Oberoi Palace, Udaipur</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-grid containing STEP 03 and PORTFOLIO sitting side-by-side */}
              <div className="grid sm:grid-cols-2 gap-8 items-stretch">
                
                {/* STEP 03: Scan & Find Photos - COHESIVE DARK BACKGROUND */}
                <div className="bg-[#09090b] text-white border border-white/10 rounded-3xl p-6 shadow-lg transition-all duration-300 group flex flex-col justify-between relative h-[350px]">
                  {/* Step Badge overlapping top border */}
                  <div className="absolute -top-3.5 left-6 bg-[#c5a880] text-[#09090b] text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm z-20 font-poppins">
                    Step 03
                  </div>

                  <div className="space-y-2 text-left mb-2">
                    <h3 className="font-poppins font-bold text-xl text-white tracking-wide">Scan & Find Photos</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                      Guest scans the QR code, takes a selfie from their phone, and finds all their photos from the event immediately.
                    </p>
                  </div>
                  
                  {/* Smartphone mockup - responsive wide in width but even shorter in height to fit cleanly */}
                  <div className="w-full flex justify-center mt-auto pt-2 pb-6 relative select-none">
                    <div className="w-[220px] sm:w-[330px] h-[155px] sm:h-[180px] bg-[#1c1c1f] rounded-3xl shadow-2xl p-2 sm:p-2.5 border-2 border-white/10 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative flex flex-col justify-between p-1.5 sm:p-2 text-center font-poppins text-slate-800 shadow-inner">
                        {/* Close Button X */}
                        <div className="absolute top-1.5 right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-100 flex items-center justify-center text-[6px] sm:text-[7.5px] text-slate-500 font-bold cursor-pointer">
                          ✕
                        </div>

                        {/* Header Section */}
                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-[9px] sm:text-[11px] font-black text-slate-800 tracking-tight leading-none">Live Verification</p>
                          <p className="text-[6px] sm:text-[7.5px] text-slate-400 font-semibold leading-none mt-0.5">Step 1 of 3 — Slowly blink once</p>
                        </div>

                        {/* Steps Indicator Pills */}
                        <div className="flex justify-center items-center gap-1 my-0.5 sm:my-0.5">
                          <div className="w-5 sm:w-6 h-[2.5px] sm:h-[3px] bg-[#6366f1] rounded-full" />
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Viewfinder Section - Shorter height to fit device bounds, changed to guest_selfie.jpg */}
                        <div className="relative h-[68px] sm:h-[80px] w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-0.5 mb-1 border border-slate-100 shrink-0">
                          <img src="/guest_selfie.jpg" alt="Guest Selfie" className="w-full h-full object-cover rounded-xl" />
                          
                          {/* Oval Face Guide Overlay */}
                          <div className="absolute inset-x-5 sm:inset-x-8 inset-y-1 border border-white/70 rounded-[45%] pointer-events-none" />
                          
                          {/* Floating Capsule Badge at bottom of viewfinder */}
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#09090b]/80 border border-white/10 text-white rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-md shrink-0">
                            <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                            <span className="text-[5px] sm:text-[6px] font-bold tracking-wide">Blink your eyes</span>
                          </div>
                        </div>

                        {/* Bottom Lavender Status Bar */}
                        <div className="w-full bg-[#f0f2fe] border border-[#e0e7ff] rounded-lg p-1.5 sm:p-2 flex items-center gap-2 text-left shrink-0">
                          {/* Spinner Icon */}
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-[7.5px] sm:text-[8.5px] font-black text-[#4f46e5] leading-tight">Blink your eyes to verify</p>
                            <p className="text-[5px] sm:text-[6px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">STEP 1 OF 3 — SLOWLY BLINK ONCE</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WHITE-LABEL PORTFOLIO - Dark themed */}
                <div className="bg-[#09090b] text-white border border-white/10 rounded-3xl p-6 shadow-lg transition-all duration-300 group flex flex-col justify-between relative h-[350px]">
                  {/* Tag Badge overlapping top-left border with gold background */}
                  <div className="absolute -top-3.5 left-6 bg-[#c5a880] text-[#09090b] text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm z-20 font-poppins">
                    Portfolio
                  </div>

                  <div className="space-y-2 text-left mb-2">
                    <h3 className="font-poppins font-bold text-xl text-white tracking-wide">White-Label Portfolios</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                      Portfolio website with your name and branding. Custom domain works on it. Clients get a professional first impression before the event itself.
                    </p>
                  </div>
                  
                  {/* Laptop mockup - responsive wide in width and floated up (extra wide for desktop) */}
                  <div className="w-full flex justify-center mt-auto pt-2 pb-6 relative select-none">
                    <div className="w-[265px] sm:w-[335px] h-[170px] sm:h-[185px] bg-[#1c1c1f] rounded-3xl shadow-2xl p-2 border-2 border-white/10 relative overflow-hidden text-left transition-transform duration-500 group-hover:scale-[1.02]">
                      <div className="w-full h-full bg-[#faf9f6] rounded-2xl overflow-hidden relative flex flex-col justify-between">
                        <div className="h-14 sm:h-16 w-full overflow-hidden relative shrink-0">
                          <img src="/portrait.jpg" alt="Portfolio Preview" className="w-full h-full object-cover brightness-90 scale-105" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="text-[8px] bg-[#09090b]/80 text-[#c5a880] font-black px-2.5 py-0.5 rounded-full shadow-sm font-poppins">yourstudio.com</span>
                          </div>
                        </div>
                        {/* Dynamic photography gallery showing actual works with curved corners */}
                        <div className="p-2 flex flex-col justify-between flex-1 text-slate-800 font-poppins text-left">
                          <div className="flex items-center justify-between pb-0.5">
                            <span className="text-[6px] sm:text-[7px] font-black text-slate-700 tracking-wider uppercase">Featured Work</span>
                            <span className="text-[4.5px] sm:text-[5px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">View All</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <div className="h-[38px] sm:h-[48px] rounded-lg overflow-hidden border border-slate-100">
                              <img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" />
                            </div>
                            <div className="h-[38px] sm:h-[48px] rounded-lg overflow-hidden border border-slate-100">
                              <img src="/party.jpg" alt="Party" className="w-full h-full object-cover" />
                            </div>
                            <div className="h-[38px] sm:h-[48px] rounded-lg overflow-hidden border border-slate-100">
                              <img src="/gala.jpg" alt="Gala" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          <div className="w-full flex justify-center text-center mt-16 relative z-30">
            <Link href="/signup" className="font-poppins inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-[#09090b] hover:bg-[#c5a880] px-9 py-4 rounded-full transition-all duration-300 shadow-md">
              Start Delivering Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── INTERACTIVE FEATURES TABBED SECTION ── */}
      <section className="bg-[#faf9f6] border-y border-[#e3d8c8]/30 py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 font-poppins shadow-sm">
              Full Feature Set
            </span>
            <h2 className="font-serif-luxury text-4xl lg:text-5xl font-light text-[#09090b] mb-4">
              Built for <span className="text-[#c5a880] font-normal">Modern Event Photography</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base font-medium">
              Explore the powerful feature suite designed to automate client delivery, simplify payments, and grow your brand.
            </p>
          </div>

          {/* Symmetrical Layout - Sidebar tabs on left, content panel on right */}
          <div className="grid lg:grid-cols-12 gap-8 items-stretch font-poppins">
            
            {/* Left sidebar tab selector */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible flex-row lg:flex-col pb-4 lg:pb-0 scrollbar-none">
              {featureTabs.map((tab, idx) => {
                const TabIcon = tab.icon;
                const isActive = activeFeatureTab === idx;
                return (
                  <button
                    key={tab.tabLabel}
                    onClick={() => setActiveFeatureTab(idx)}
                    className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer shrink-0 min-w-[200px] lg:min-w-0 ${
                      isActive 
                        ? 'bg-[#09090b] border-[#09090b] text-white shadow-md' 
                        : 'bg-white border-[#e3d8c8]/25 text-slate-600 hover:border-[#c5a880] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${isActive ? 'bg-[#c5a880]/15 border-[#c5a880]/20 text-[#c5a880]' : 'bg-[#faf9f6] border-[#e3d8c8]/10 text-[#c5a880]'}`}>
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold tracking-wide">{tab.tabLabel}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-[#c5a880] translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right content display panel */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#e3d8c8]/25 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#09090b] leading-snug tracking-tight mb-8 text-left">
                  {featureTabs[activeFeatureTab].title}
                </h3>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Mockup wrapper */}
                  <div className="w-full max-w-[320px] bg-[#faf9f6] border border-slate-100 rounded-2xl p-2.5 mx-auto relative flex items-center justify-center shrink-0 min-h-[250px]">
                    {featureTabs[activeFeatureTab].mockup}
                  </div>

                  {/* Bullet points with gold themed lightning bolt */}
                  <ul className="space-y-4 text-left">
                    {featureTabs[activeFeatureTab].bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3">
                        <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          ⚡
                        </div>
                        <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom description and call to action buttons */}
              <div className="mt-10 pt-6 border-t border-slate-100 text-left space-y-5">
                <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                  {featureTabs[activeFeatureTab].desc}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/signup"
                    className="font-poppins inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-6 py-3.5 rounded-xl transition-all duration-300 shadow-sm"
                  >
                    Try for free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="font-poppins inline-flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-[#c5a880] hover:text-slate-700 px-4 py-3.5 transition-colors"
                  >
                    Learn More
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center text-center mt-16 relative z-30">
            <Link href="/pricing" className="font-poppins inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-[#09090b] hover:bg-[#c5a880] px-9 py-4 rounded-full transition-all duration-300 shadow-md">
              Try Premium Features
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="bg-[#09090b] text-white py-20 lg:py-24 border-t border-white/10 relative overflow-hidden">
        {/* Subtle glowing gradients */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/5 blur-3xl opacity-60" />
          <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/5 blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/20 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 font-poppins">
              Endorsements
            </span>
            <h2 className="font-serif-luxury text-4xl lg:text-5xl font-light text-white mb-4">
              Loved by <span className="italic text-[#c5a880]">premium studios</span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => {
              const shootTags = [
                "Heritage Wedding • 600 Guests",
                "Live Portrait Shoot • Editorial",
                "3-Day Garba Wedding • 12,000+ Photos"
              ];
              return (
                <div 
                  key={t.name} 
                  className="relative bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col justify-between hover:border-[#c5a880]/60 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-2xl hover:shadow-[#c5a880]/5 hover:-translate-y-1.5 group overflow-hidden"
                >
                  {/* Giant quotation mark in background */}
                  <div className="absolute -right-3 -top-6 text-[120px] font-serif font-black text-white/[0.02] group-hover:text-[#c5a880]/5 select-none pointer-events-none transition-colors duration-500">
                    “
                  </div>

                  <div>
                    {/* Top tag & Star Rating */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[9px] bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/20 px-3 py-1 rounded-full font-poppins font-black uppercase tracking-wider">
                        {shootTags[idx]}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#c5a880] text-[#c5a880]" />
                        ))}
                      </div>
                    </div>

                    {/* Testimonial Quote */}
                    <p className="font-poppins font-semibold text-[15px] sm:text-base text-gray-300 leading-relaxed mb-8 tracking-wide text-left relative z-10">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>

                  {/* Profile details */}
                  <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-4 relative z-10">
                    {/* Custom Initials Avatar Badge */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c5a880]/20 to-[#c5a880]/5 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] text-sm font-black font-poppins shrink-0 group-hover:border-[#c5a880] transition-colors duration-500 shadow-md">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-left font-poppins">
                      <p className="font-bold text-xs sm:text-sm text-white group-hover:text-[#c5a880] transition-colors duration-300 uppercase tracking-wider">{t.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5 uppercase">{t.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className="bg-[#faf9f6] border-t border-[#e3d8c8]/30 py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] text-[11px] font-bold uppercase tracking-widest rounded-full mb-4 font-poppins">
              Membership
            </span>
            <h2 className="font-serif-luxury text-4xl lg:text-5xl font-light text-[#09090b] mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm md:text-base font-medium">
              Start delivering free. Upgrade as your studio demands grows.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-6.5 flex flex-col border transition-all duration-300 hover:-translate-y-1.5 ${
                  plan.highlight
                    ? 'bg-[#09090b] border-[#09090b] text-white shadow-xl shadow-slate-900/10'
                    : 'bg-white border-[#e3d8c8]/25 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1.5 bg-[#c5a880] text-[#09090b] text-[9px] font-black uppercase tracking-widest font-poppins rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className={`font-poppins font-bold text-sm md:text-base tracking-wider uppercase mb-1 ${plan.highlight ? 'text-[#c5a880]' : 'text-[#09090b]'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs md:text-sm font-medium mb-5 ${plan.highlight ? 'text-gray-400' : 'text-gray-405'}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1 border-b border-[#e3d8c8]/15 pb-5">
                    <span className={`font-serif-luxury text-3xl md:text-4xl ${plan.highlight ? 'text-white' : 'text-[#09090b]'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${plan.highlight ? 'text-[#c5a880]' : 'text-gray-400'}`}>{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs md:text-sm font-semibold">
                      <Check className="w-3.5 h-3.5 shrink-0 text-[#c5a880] mt-0.5" />
                      <span className={plan.highlight ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full text-center py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider font-poppins transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-[#c5a880] text-[#09090b] hover:bg-white shadow-sm'
                      : 'border border-[#09090b]/20 text-[#09090b] hover:bg-[#09090b] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section id="contact" className="bg-[#faf9f6] border-t border-[#e3d8c8]/30 py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Contact details */}
            <div className="lg:col-span-5 space-y-8 lg:pr-6 text-left font-poppins">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full">
                  Get In Touch
                </span>
                <h2 className="font-serif-luxury text-4xl sm:text-5xl font-light text-[#09090b] leading-tight">
                  Let&apos;s Make <span className="italic text-[#c5a880]">Event Sharing</span> Effortless
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="bg-white border border-[#e3d8c8]/25 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-[#c5a880]/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center shrink-0 border border-[#e3d8c8]/10">
                    <Mail className="w-5.5 h-5.5 text-[#c5a880]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#09090b]">maraphoto303@gmail.com</p>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">We&apos;ll reply within 24 hours</p>
                  </div>
                </div>

                {/* Phone */}
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

            {/* Right Column: Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 border border-[#e3d8c8]/30 shadow-xl font-poppins relative">
              <div className="mb-8 border-b border-[#e3d8c8]/20 pb-5 text-left">
                <h3 className="text-2xl font-bold text-[#09090b] tracking-wide">Send a Message</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">We usually respond in less than 24 hours.</p>
              </div>
              <form onSubmit={handleHomeSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wider flex items-center gap-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="name"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wider flex items-center gap-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider flex items-center gap-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
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
                    <input
                      type="tel"
                      required
                      name="phone"
                      className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wider flex items-center gap-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    name="message"
                    className="w-full bg-[#faf9f6] border border-[#e3d8c8]/30 rounded-xl px-4 py-3.5 text-sm text-[#09090b] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] font-semibold resize-none"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-poppins"
                  >
                    Send Message
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="bg-white py-28 lg:py-36 border-t border-[#e3d8c8]/25">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] text-[11px] font-bold uppercase tracking-widest rounded-full mb-4 font-poppins">
              Information
            </span>
            <h2 className="font-serif-luxury text-4xl lg:text-5xl font-light text-[#09090b] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>

          <div className="w-full flex justify-center text-center mt-12">
            <Link href="/signup" className="font-poppins inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-[#09090b] hover:bg-[#c5a880] px-9 py-4 rounded-full transition-all duration-300 shadow-md">
              Start Delivering Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── LUXURY CALL TO ACTION BANNER ── */}
      <section className="bg-[#09090b] py-28 border-t border-[#e3d8c8]/20 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[300px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6">
            Ready to deliver photos <span className="italic text-[#c5a880]">flawlessly?</span>
          </h2>
          <p className="text-gray-400 font-poppins text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
            Join premium studios delivering experiences, not links. Start free today, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-9 py-4.5 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5 animate-pulse-soft"
            >
              Start Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white border border-white/20 px-9 py-4.5 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Consult Sales
            </Link>
          </div>
        </div>
      </section>
      
      </main>
    </PublicWrapper>
  );
}
