'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  ExternalLink,
  Sparkles,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Globe,
  Award,
  ArrowRight,
  Heart,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { resolveMediaUrl } from '@/lib/api';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

interface StudioData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  bio?: string;
  aboutUs?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  customEventsCount?: string;
  customCustomersCount?: string;
}

interface PortfolioEvent {
  id: string;
  name: string;
  code: string;
  type: string;
  date: string;
  location: string;
  clientName?: string;
  coverImageUrl?: string;
  photosCount: number;
}

export default function PublicStudioPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [loading, setLoading] = useState(true);
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [stats, setStats] = useState<{ eventsCount: string | number; customersCount: string | number }>({
    eventsCount: '',
    customersCount: '',
  });
  const [portfolioEvents, setPortfolioEvents] = useState<PortfolioEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    const fetchStudioProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/studio/public/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error('Studio profile not found');
        }
        const data = await res.json();
        if (isMounted && data.success) {
          setStudio(data.studio);
          setStats(data.stats || { eventsCount: 0, customersCount: 0 });
          setPortfolioEvents(data.portfolioEvents || []);
        }
      } catch (err: any) {
        console.error('Failed to load studio:', err);
        if (isMounted) {
          toast.error('Unable to load studio profile. Please verify the URL.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudioProfile();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: studio?.name || 'Studio Portfolio',
          text: `Check out ${studio?.name || 'our'} photography portfolio!`,
          url,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        toast.success('Studio link copied to clipboard!');
      }
    }
  };

  const getCleanPhone = (num?: string) => {
    if (!num) return '';
    return num.replace(/[^0-9]/g, '');
  };

  const getWhatsAppLink = () => {
    const rawNumber = studio?.whatsappNumber || studio?.whatsappUrl || studio?.mobile || studio?.phone || '';
    const cleanNumber = getCleanPhone(rawNumber);
    if (!cleanNumber) return '#';
    const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const msg = encodeURIComponent(`Hello ${studio?.name || 'Studio'}, I would like to inquire about your photography services.`);
    return `https://wa.me/${finalNumber}?text=${msg}`;
  };

  const categories = ['ALL', ...Array.from(new Set(portfolioEvents.map((e) => (e.type || 'GENERAL').toUpperCase())))];

  const filteredEvents = filterType === 'ALL'
    ? portfolioEvents
    : portfolioEvents.filter((e) => (e.type || 'GENERAL').toUpperCase() === filterType);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#e8dfd3] border-t-[#c5a880] animate-spin" />
          <Camera className="w-8 h-8 text-[#99732e] absolute animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-wider text-slate-900">Loading Studio Showcase...</h2>
        <p className="text-slate-500 text-sm mt-1">Preparing luxury portfolio & galleries</p>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-slate-800 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-[#e8dfd3] shadow-xl flex items-center justify-center mb-6 text-[#99732e]">
          <Camera className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Studio Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8 text-sm">
          The requested studio domain or profile <span className="text-[#99732e] font-mono font-semibold">"{slug}"</span> could not be found.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#c5a880] via-[#d4be99] to-[#b89665] text-white font-bold text-sm shadow-lg shadow-[#c5a880]/30 hover:opacity-90 transition-opacity"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const cleanPhone = studio.mobile || studio.phone || '';
  const resolvedLogo = resolveMediaUrl(studio.logoUrl, '/logo.png');
  const resolvedBanner = resolveMediaUrl(studio.bannerUrl, '');

  // Guaranteed Studio Cover Banner Image (strictly prioritize uploaded banner, never portfolio photos):
  const bannerImageSrc =
    resolvedBanner && resolvedBanner.trim().length > 0
      ? resolvedBanner
      : '/wedding.jpg';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 font-sans selection:bg-[#c5a880] selection:text-white">
      <Toaster position="top-right" />

      {/* ── STICKY LUXURY TOP BAR (WHITE & GOLD) ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-[#e8dfd3] shadow-[0_4px_30px_-5px_rgba(197,168,128,0.2)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href={`/s/${studio.slug || slug}`} className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white border-2 border-[#c5a880] p-1 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(197,168,128,0.5)] transition-all duration-300">
              {resolvedLogo && resolvedLogo !== '/logo.png' ? (
                <img
                  src={resolvedLogo}
                  alt={studio.name}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Camera className="w-6 h-6 text-[#99732e]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-[#99732e] transition-colors line-clamp-1">
                {studio.name}
              </span>
              <span className="text-[10px] font-extrabold text-[#99732e] tracking-widest uppercase flex items-center gap-1.5">
                <span>Official Studio</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                <span>Verified</span>
              </span>
            </div>
          </Link>

          {/* Social Links & Direct Contacts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Phone Calling Link */}
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#faf7f2] border-2 border-[#e8dfd3] text-xs font-bold text-slate-800 transition-all hover:border-[#c5a880] hover:text-[#99732e] shadow-sm hover:shadow-md"
                title={`Call ${studio.name}`}
              >
                <Phone className="w-3.5 h-3.5 text-[#99732e]" />
                <span>{cleanPhone}</span>
              </a>
            )}

            {/* Direct WhatsApp Chat Link */}
            {(studio.whatsappNumber || studio.whatsappUrl || cleanPhone) && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white transition-all hover:scale-105 shadow-md shadow-emerald-600/30"
                title="Chat with Studio on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span className="hidden md:inline">WhatsApp</span>
              </a>
            )}

            {/* Instagram Profile */}
            {studio.instagramUrl && (
              <a
                href={studio.instagramUrl.startsWith('http') ? studio.instagramUrl : `https://instagram.com/${studio.instagramUrl.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white border border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-all shadow-sm hover:scale-105"
                title="Follow on Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}

            {/* Facebook Profile */}
            {studio.facebookUrl && (
              <a
                href={studio.facebookUrl.startsWith('http') ? studio.facebookUrl : `https://facebook.com/${studio.facebookUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white border border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm hover:scale-105"
                title="View on Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            )}

            {/* Share Profile Button */}
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-white border border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-slate-700 hover:text-[#99732e] transition-colors shadow-sm"
              title="Share Studio Page"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── CINEMATIC HERO COVER BANNER (16:9 WIDESCREEN RATIO) ── */}
      <section className="relative overflow-hidden w-full aspect-[16/9] min-h-[460px] md:min-h-[560px] max-h-[700px] flex items-center justify-center text-center">
        {/* Full-bleed High-Resolution 16:9 Cover Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImageSrc}
            alt={`${studio.name} Cover Banner`}
            className="w-full h-full object-cover object-center scale-105 filter brightness-90 contrast-105"
          />

          {/* Luxury Double Vignette & Contrast Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

          {/* Radiant Golden Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#c5a880]/35 to-amber-200/25 blur-[140px] rounded-full pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center">
          {/* Prominent Gold Circular Logo Medallion */}
          <div className="relative mb-6 group cursor-pointer">
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-tr from-[#d4af37] via-[#f7e6c4] to-[#aa771c] shadow-[0_20px_60px_rgba(212,175,55,0.55)] flex items-center justify-center transition-transform duration-500 group-hover:scale-108 group-hover:shadow-[0_25px_70px_rgba(212,175,55,0.7)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-2.5 shadow-inner flex items-center justify-center">
                {resolvedLogo && resolvedLogo !== '/logo.png' ? (
                  <img
                    src={resolvedLogo}
                    alt={studio.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Camera className="w-20 h-20 text-[#99732e]" />
                )}
              </div>
            </div>

            {/* Sparkle Floating Medallion */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-white p-3 rounded-full shadow-xl border-2 border-white group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
          </div>

          {/* Studio Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
            {studio.name}
          </h1>

          {/* Royal Gold Divider */}
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-[#d4af37]" />
            <div className="w-3 h-3 rotate-45 bg-[#d4af37] shadow-lg shadow-[#d4af37]/50" />
            <div className="h-[2px] w-24 bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>

          {/* Tagline */}
          <p className="text-lg sm:text-2xl font-serif italic text-amber-200 font-semibold max-w-2xl tracking-wide drop-shadow-lg">
            "{studio.tagline || 'Capturing Timeless Moments & Cherished Stories'}"
          </p>

          {/* Bio / About */}
          <p className="mt-4 text-slate-200 max-w-2xl text-sm sm:text-base leading-relaxed font-normal drop-shadow-md">
            {studio.bio ||
              'We are a premier photography & visual production studio dedicated to preserving your most precious wedding, celebration, and life memories with artistic excellence.'}
          </p>

          {/* Studio Office Location Badge */}
          {(studio.city || studio.address) && (
            <div className="mt-5 inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-xs sm:text-sm text-white font-medium shadow-2xl">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{[studio.address, studio.city].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Hero Action CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#portfolio"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f7e6c4] to-[#aa771c] text-slate-950 font-black text-sm shadow-[0_10px_35px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.6)] hover:scale-105 transition-all flex items-center gap-2.5"
            >
              <Camera className="w-4 h-4" />
              <span>Explore Portfolio Events</span>
            </a>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border-2 border-white/40 text-white font-extrabold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Book Studio Inquiries</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FLOATING STATS RIBBON (WHITE & GOLD - NO RATINGS) ── */}
      <div className="-mt-14 sm:-mt-16 z-20 relative max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {/* Events Completed */}
          <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#e8dfd3] p-6 sm:p-8 shadow-[0_15px_40px_-5px_rgba(197,168,128,0.3)] hover:border-[#c5a880] hover:shadow-[0_25px_55px_-5px_rgba(197,168,128,0.45)] hover:-translate-y-2 transition-all duration-300 text-center group">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#c5a880] via-[#f7e6c4] to-[#aa771c]" />

            <div className="w-14 h-14 rounded-2xl bg-[#faf4ea] text-[#99732e] mx-auto mb-3 flex items-center justify-center border border-[#c5a880]/40 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
              <Calendar className="w-7 h-7" />
            </div>

            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight group-hover:text-[#99732e] transition-colors">
              {stats.eventsCount || studio.customEventsCount || '100+'}
            </div>

            <div className="text-xs sm:text-sm uppercase tracking-widest text-[#99732e] font-black mt-1.5">
              Events Captured
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Weddings & Celebrations</div>
          </div>

          {/* Happy Customers */}
          <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#e8dfd3] p-6 sm:p-8 shadow-[0_15px_40px_-5px_rgba(197,168,128,0.3)] hover:border-[#c5a880] hover:shadow-[0_25px_55px_-5px_rgba(197,168,128,0.45)] hover:-translate-y-2 transition-all duration-300 text-center group">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#aa771c] via-[#f7e6c4] to-[#c5a880]" />

            <div className="w-14 h-14 rounded-2xl bg-[#faf4ea] text-[#99732e] mx-auto mb-3 flex items-center justify-center border border-[#c5a880]/40 group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-sm">
              <Users className="w-7 h-7" />
            </div>

            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight group-hover:text-[#99732e] transition-colors">
              {stats.customersCount || studio.customCustomersCount || '250+'}
            </div>

            <div className="text-xs sm:text-sm uppercase tracking-widest text-[#99732e] font-black mt-1.5">
              Happy Customers
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Families & Satisfied Clients</div>
          </div>
        </div>
      </div>

      {/* ── PORTFOLIO & EVENTS SHOWCASE ── */}
      <section id="portfolio" className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f8f1e5] border border-[#c5a880]/40 text-xs font-black text-[#99732e] uppercase tracking-wider mb-3 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#99732e]" />
              <span>Curated Masterpieces</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Featured Events & Portfolio
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Browse our captured events with high-resolution galleries, guest albums, and cinematography.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-sm ${
                    filterType === cat
                      ? 'bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white shadow-md shadow-[#c5a880]/30 scale-105'
                      : 'bg-white text-slate-700 hover:bg-[#faf7f2] border border-[#e8dfd3] hover:border-[#c5a880]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-[#e8dfd3] bg-white p-14 text-center max-w-2xl mx-auto shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-[#faf4ea] border border-[#c5a880]/30 mx-auto flex items-center justify-center text-[#99732e] mb-5 shadow-sm">
              <ImageIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Portfolio Galleries In Preparation</h3>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              The studio is currently curating their featured event albums. Contact {studio.name} directly to request private previews and package quotations.
            </p>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white font-extrabold text-xs hover:opacity-95 shadow-lg shadow-[#c5a880]/30 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Inquire via WhatsApp</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const cover = resolveMediaUrl(event.coverImageUrl, '');
              const eventDate = event.date
                ? new Date(event.date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <div
                  key={event.id}
                  className="group relative rounded-3xl overflow-hidden bg-white border-2 border-[#e8dfd3] hover:border-[#c5a880] transition-all duration-500 flex flex-col shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_-5px_rgba(197,168,128,0.35)] hover:-translate-y-2.5"
                >
                  {/* Event Cover Photo Container - 16:9 Widescreen Ratio */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={event.name}
                        className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <Camera className="w-12 h-12 mb-2 text-[#c5a880]/60" />
                        <span className="text-xs font-bold text-slate-500">Event Gallery</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-85 group-hover:opacity-65 transition-opacity" />

                    {/* Category Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#99732e] border border-[#c5a880]/40 shadow-lg">
                        {event.type || 'Event'}
                      </span>
                    </div>

                    {/* Photo Count Badge */}
                    {event.photosCount > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold bg-slate-900/85 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
                          <ImageIcon className="w-3.5 h-3.5 text-[#c5a880]" />
                          <span>{event.photosCount} Photos</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-7 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#99732e] font-extrabold mb-2">
                        <Calendar className="w-4 h-4 text-[#99732e]" />
                        <span>{eventDate || 'Special Event'}</span>
                        {event.location && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-slate-500 flex items-center gap-1 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{event.location}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#99732e] transition-colors line-clamp-1">
                        {event.name}
                      </h3>

                      {event.clientName && (
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          Client: <span className="text-slate-800 font-bold">{event.clientName}</span>
                        </p>
                      )}
                    </div>

                    {/* View Gallery Link */}
                    <div className="mt-7 pt-5 border-t border-[#f2ede4] flex items-center justify-between">
                      <Link
                        href={`/e/${event.code}`}
                        className="inline-flex items-center gap-2 text-xs font-black text-[#99732e] group-hover:text-slate-950 transition-colors"
                      >
                        <span>View Full Event Gallery</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform text-[#c5a880]" />
                      </Link>

                      <Link
                        href={`/e/${event.code}`}
                        className="w-10 h-10 rounded-2xl bg-[#faf4ea] group-hover:bg-[#c5a880] text-[#99732e] group-hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:shadow-md"
                        title="Open Event Gallery"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── STUDIO OFFICE & CONTACT SECTION (LUXURY WHITE & GOLD) ── */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#e8dfd3]">
        <div className="rounded-3xl bg-gradient-to-br from-white via-[#fdfcf9] to-[#fbf7f0] border-2 border-[#e8dfd3] p-8 sm:p-14 relative overflow-hidden shadow-[0_20px_50px_-10px_rgba(197,168,128,0.3)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Office Details */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f8f1e5] text-[#99732e] border border-[#c5a880]/30 text-xs font-black mb-3 shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>Visit Our Studio Office</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Let's Create Lifelong Memories Together
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed max-w-xl">
                Whether planning a wedding, pre-wedding destination shoot, or anniversary celebration, our team is ready to capture your story with elegance.
              </p>

              <div className="mt-8 space-y-4">
                {/* Physical Address */}
                {(studio.address || studio.city) && (
                  <div className="flex items-start gap-3.5 text-sm">
                    <div className="w-11 h-11 rounded-2xl bg-[#faf4ea] border border-[#c5a880]/30 flex items-center justify-center text-[#99732e] shrink-0 shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-slate-900">Studio Address</div>
                      <div className="text-slate-600 text-xs mt-0.5 font-medium">
                        {[studio.address, studio.city].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Call */}
                {cleanPhone && (
                  <div className="flex items-start gap-3.5 text-sm">
                    <div className="w-11 h-11 rounded-2xl bg-[#faf4ea] border border-[#c5a880]/30 flex items-center justify-center text-[#99732e] shrink-0 shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-slate-900">Direct Phone Contact</div>
                      <a href={`tel:${cleanPhone}`} className="text-[#99732e] text-xs mt-0.5 hover:underline block font-bold">
                        {cleanPhone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {studio.email && (
                  <div className="flex items-start gap-3.5 text-sm">
                    <div className="w-11 h-11 rounded-2xl bg-[#faf4ea] border border-[#c5a880]/30 flex items-center justify-center text-[#99732e] shrink-0 shadow-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-slate-900">Email Inquiries</div>
                      <a href={`mailto:${studio.email}`} className="text-slate-600 text-xs mt-0.5 hover:underline block font-medium">
                        {studio.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Direct Instant Actions */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 group hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                <span>Chat on WhatsApp Instantly</span>
              </a>

              {cleanPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-[#faf7f2] border-2 border-[#c5a880] text-slate-900 font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  <Phone className="w-4 h-4 text-[#99732e]" />
                  <span>Call Studio ({cleanPhone})</span>
                </a>
              )}

              {studio.instagramUrl && (
                <a
                  href={studio.instagramUrl.startsWith('http') ? studio.instagramUrl : `https://instagram.com/${studio.instagramUrl.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 hover:scale-[1.02]"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-600" />
                  <span>View Latest Reels & Photos on Instagram</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (WHITE & GOLD - LARGE & PROMINENT TEXT) ── */}
      <footer className="border-t-2 border-[#e8dfd3] bg-[#fbf9f5] text-slate-700 pt-16 pb-14 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b-2 border-[#e8dfd3]/80">
            {/* Col 1: Studio Details */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-[#c5a880] p-1.5 flex items-center justify-center shadow-lg">
                  {resolvedLogo && resolvedLogo !== '/logo.png' ? (
                    <img src={resolvedLogo} alt={studio.name} className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Camera className="w-8 h-8 text-[#99732e]" />
                  )}
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight leading-tight">
                    {studio.name}
                  </span>
                  <span className="text-xs font-black text-[#99732e] uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                    <span>Official Studio</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                    <span>Verified Brand</span>
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium max-w-md">
                "{studio.tagline || 'Specializing in cinematic wedding photography, candid films, and artistic visual documentation.'}"
              </p>

              {studio.address && (
                <p className="text-sm sm:text-base text-slate-800 font-semibold flex items-start gap-2 pt-1">
                  <MapPin className="w-5 h-5 text-[#99732e] shrink-0 mt-0.5" />
                  <span>{[studio.address, studio.city].filter(Boolean).join(', ')}</span>
                </p>
              )}
            </div>

            {/* Col 2: Contact Numbers */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest border-b border-[#c5a880]/30 pb-2 inline-block">
                Direct Contact
              </h4>
              <ul className="space-y-3.5 text-sm sm:text-base">
                {cleanPhone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#99732e] shrink-0" />
                    <span className="text-slate-500 font-semibold">Mobile:</span>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-slate-900 hover:text-[#99732e] font-extrabold transition-colors text-base"
                    >
                      {cleanPhone}
                    </a>
                  </li>
                )}
                {studio.phone && studio.phone !== studio.mobile && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#99732e] shrink-0" />
                    <span className="text-slate-500 font-semibold">Office:</span>
                    <a
                      href={`tel:${studio.phone}`}
                      className="text-slate-900 hover:text-[#99732e] font-extrabold transition-colors text-base"
                    >
                      {studio.phone}
                    </a>
                  </li>
                )}
                {studio.email && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#99732e] shrink-0" />
                    <span className="text-slate-500 font-semibold">Email:</span>
                    <a
                      href={`mailto:${studio.email}`}
                      className="text-slate-900 hover:text-[#99732e] font-bold transition-colors break-all"
                    >
                      {studio.email}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#99732e] shrink-0" />
                  <span className="text-slate-500 font-semibold">Live Website:</span>
                  <span className="text-[#99732e] font-mono font-extrabold text-base">
                    {typeof window !== 'undefined' ? window.location.host : `${studio.slug}.maraphoto.com`}
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 3: Social & Powered Badge */}
            <div className="md:col-span-3 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest border-b border-[#c5a880]/30 pb-2 inline-block mb-4">
                  Connect With Us
                </h4>
                <div className="flex items-center gap-3">
                  {studio.instagramUrl && (
                    <a
                      href={studio.instagramUrl.startsWith('http') ? studio.instagramUrl : `https://instagram.com/${studio.instagramUrl.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-pink-600 hover:bg-pink-50 transition-all shadow-md hover:scale-110"
                      title="Follow on Instagram"
                    >
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}

                  {studio.facebookUrl && (
                    <a
                      href={studio.facebookUrl.startsWith('http') ? studio.facebookUrl : `https://facebook.com/${studio.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all shadow-md hover:scale-110"
                      title="Follow on Facebook"
                    >
                      <FacebookIcon className="w-5 h-5" />
                    </a>
                  )}

                  {(studio.whatsappNumber || studio.whatsappUrl || cleanPhone) && (
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e8dfd3] hover:border-emerald-500 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all shadow-md hover:scale-110"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5 fill-emerald-100" />
                    </a>
                  )}

                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e8dfd3] hover:border-[#c5a880] flex items-center justify-center text-[#99732e] hover:bg-[#faf4ea] transition-all shadow-md hover:scale-110"
                      title="Call Now"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Mara Photo Platform Branding */}
              <div className="pt-4 border-t border-[#e8dfd3]">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2.5 text-sm sm:text-base text-slate-700 hover:text-[#99732e] transition-colors font-bold"
                >
                  <Globe className="w-5 h-5 text-[#99732e]" />
                  <span>Powered by <strong className="text-slate-900 underline decoration-[#c5a880] underline-offset-4">Mara Photo Platform</strong></span>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-sm sm:text-base text-slate-600 gap-4 font-semibold">
            <div>
              &copy; {new Date().getFullYear()} <strong className="text-slate-900">{studio.name}</strong>. All Rights Reserved.
            </div>
            <div className="flex items-center gap-6 text-sm sm:text-base font-bold">
              <Link href="/privacy" className="hover:text-[#99732e] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[#99732e] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action for Mobile */}
      <aside aria-label="Quick WhatsApp contact" className="fixed bottom-6 right-6 z-40 sm:hidden">
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-white/20" />
        </a>
      </aside>
    </div>
  );
}
