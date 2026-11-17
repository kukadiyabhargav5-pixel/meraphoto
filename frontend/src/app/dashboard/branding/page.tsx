'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Users,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';

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

/**
 * Pure client-side canvas image compression.
 * Scales huge camera photos down to web-friendly dimensions in milliseconds,
 * preventing Next.js 10MB body size exceeded errors and connection drops.
 */
async function compressImageFile(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<File> {
  if (file.type === 'image/svg+xml' || file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const ext = outputType === 'image/jpeg' ? '.jpg' : '.png';
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ext), {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

interface EventItem {
  id: string;
  name: string;
  code: string;
  type: string;
  date: string;
  location: string;
  coverImageUrl?: string;
  addToPortfolio: boolean;
  photosCount: number;
}

export default function StudioBrandingPage() {
  const { studio, setStudio } = useDashboard();
  const { studio: authStudio } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [customEventsCount, setCustomEventsCount] = useState('');
  const [customCustomersCount, setCustomCustomersCount] = useState('');

  // Events for Portfolio selection
  const [events, setEvents] = useState<EventItem[]>([]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch Studio Branding Data
  const fetchBrandingData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/studio/branding');
      if (res.data?.success && res.data?.studio) {
        const s = res.data.studio;
        setName(s.name || '');
        setSlug(s.slug || s.customDomain || '');
        setLogoUrl(s.logoUrl || '');
        setBannerUrl(s.bannerUrl || '');
        setTagline(s.tagline || '');
        setBio(s.bio || '');
        setPhone(s.phone || '');
        setMobile(s.mobile || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setCity(s.city || '');
        setCustomEventsCount(s.customEventsCount || (s.branding && s.branding.customEventsCount) || '');
        setCustomCustomersCount(s.customCustomersCount || (s.branding && s.branding.customCustomersCount) || '');
        setInstagramUrl(s.instagramUrl || '');
        setFacebookUrl(s.facebookUrl || '');
        setWhatsappNumber(s.whatsappNumber || s.whatsappUrl || '');
        setWebsiteUrl(s.websiteUrl || '');

        setEvents(res.data.events || []);
      }
    } catch (err: any) {
      console.error('Error fetching branding data:', err);
      toast.error('Failed to load studio branding settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandingData();
  }, []);

  // Save Branding Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error('Studio Name is required');
      return;
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    try {
      setSaving(true);
      const portfolioEventIds = events.filter((ev) => ev.addToPortfolio).map((ev) => ev.id);

      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        customDomain: cleanSlug,
        tagline: tagline.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        customEventsCount: customEventsCount.trim(),
        customCustomersCount: customCustomersCount.trim(),
        instagramUrl: instagramUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        whatsappNumber: whatsappNumber.trim(),
        websiteUrl: websiteUrl.trim(),
        portfolioEventIds,
      };

      const res = await apiClient.put('/studio/branding', payload);

      if (res.data?.success) {
        toast.success('Studio branding & portfolio updated successfully!');
        if (res.data?.studio) {
          if (setStudio) {
            setStudio((prev: any) => ({ ...prev, ...res.data.studio }));
          }
          try {
            localStorage.setItem('studio', JSON.stringify(res.data.studio));
          } catch {}
          window.dispatchEvent(new CustomEvent('studio_updated', { detail: res.data.studio }));
        }
      }
    } catch (err: any) {
      console.error('Error saving branding:', err);
      toast.error(err?.response?.data?.error || 'Failed to save branding settings.');
    } finally {
      setSaving(false);
    }
  };

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validMimes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WEBP, or SVG image.');
      return;
    }

    // Instant local preview for immediate responsive feedback
    const localLogoPreview = URL.createObjectURL(file);
    setLogoUrl(localLogoPreview);

    const toastId = toast.loading('Optimizing & uploading studio logo...');
    setUploadingLogo(true);
    try {
      // Client-side compression to max 800x800
      const optimizedFile = await compressImageFile(file, 800, 800, 0.9);

      const formData = new FormData();
      formData.append('logo', optimizedFile);
      formData.append('image', optimizedFile);

      const res = await apiClient.post('/studio/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (res.data?.logoUrl) {
        const newUrl = resolveMediaUrl(res.data.logoUrl);
        setLogoUrl(newUrl);
        if (setStudio && res.data?.studio) {
          setStudio((prev: any) => ({ ...prev, ...res.data.studio }));
        }
        window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
        toast.success('Logo updated successfully!', { id: toastId });
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to upload logo.', { id: toastId });
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Delete Logo
  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to remove the studio logo?')) return;
    try {
      const res = await apiClient.delete('/studio/logo');
      if (res.data?.success) {
        setLogoUrl('');
        if (setStudio && res.data?.studio) {
          setStudio((prev: any) => ({ ...prev, logoUrl: '' }));
        }
        window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: { logoUrl: '' } }));
        toast.success('Studio logo removed.');
      }
    } catch (err: any) {
      toast.error('Failed to delete studio logo.');
    }
  };

  // Upload Banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // Instant local preview for immediate responsive feedback
    const localBannerPreview = URL.createObjectURL(file);
    setBannerUrl(localBannerPreview);

    const toastId = toast.loading('Optimizing & uploading 16:9 banner...');
    setUploadingBanner(true);
    try {
      // Client-side compression to 1920x1080 (16:9) to prevent >10MB proxy issues
      const optimizedFile = await compressImageFile(file, 1920, 1080, 0.85);

      const formData = new FormData();
      formData.append('banner', optimizedFile);
      formData.append('image', optimizedFile);

      const res = await apiClient.post('/studio/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (res.data?.bannerUrl) {
        setBannerUrl(resolveMediaUrl(res.data.bannerUrl));
        toast.success('Studio cover banner uploaded successfully!', { id: toastId });
      }
    } catch (err: any) {
      console.error('Banner upload error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to upload banner.', { id: toastId });
    } finally {
      setUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Delete Banner
  const handleDeleteBanner = async () => {
    if (!confirm('Are you sure you want to remove the cover banner?')) return;
    try {
      const res = await apiClient.delete('/studio/banner');
      if (res.data?.success) {
        setBannerUrl('');
        toast.success('Studio cover banner removed.');
      }
    } catch (err: any) {
      toast.error('Failed to remove banner.');
    }
  };

  // Toggle event in portfolio
  const togglePortfolioEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, addToPortfolio: !ev.addToPortfolio } : ev))
    );
  };

  // Public studio URL
  const publicStudioPath = `/s/${slug || studio?.customDomain || studio?._id || ''}`;
  const publicFullUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}${publicStudioPath}`
      : `http://localhost:3000${publicStudioPath}`;

  const copyPublicLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(publicFullUrl);
      setCopied(true);
      toast.success('Studio public link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const openPublicPage = () => {
    if (typeof window !== 'undefined') {
      window.open(publicStudioPath, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-10 h-10 text-[#c5a880] animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Studio Branding Settings...</p>
      </div>
    );
  }

  const resolvedLogoUrl = resolveMediaUrl(logoUrl, '/logo.png');
  const resolvedBannerUrl = resolveMediaUrl(bannerUrl, '');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 font-sans pb-32 text-slate-900">
      <Toaster position="top-right" />

      {/* ── HEADER HERO BANNER ── */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a880]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a880]/20 text-[#e4c9a3] text-xs font-bold uppercase tracking-wider border border-[#c5a880]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Studio Branding & Subdomain</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Studio Office Branding & Public Page
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Build your customized public studio portfolio website. Configure your custom subdomain, hero banner, direct WhatsApp chat, contact channels, and showcase portfolio events.
            </p>
          </div>

          {/* Quick Live Preview Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={openPublicPage}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-slate-950 font-black text-xs transition-all shadow-lg shadow-[#c5a880]/25 cursor-pointer hover:scale-105"
            >
              <Eye className="w-4 h-4 text-slate-950" />
              <span>View Public Studio Page</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={copyPublicLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Live Subdomain Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 flex-wrap">
            <Globe className="w-4 h-4 text-[#c5a880]" />
            <span className="font-semibold">Public URL:</span>
            <span className="font-mono text-white bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700/80 select-all font-semibold shadow-inner">
              {publicFullUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#e4c9a3] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#c5a880]" />
            <span>Subdomain routing enabled for local & production</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ── SECTION 1: STUDIO IDENTITY & SUBDOMAIN ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                  <Globe className="w-5 h-5" />
                </div>
                <span>Studio Identity & Custom Subdomain</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Your studio brand name and personalized subdomain slug.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Studio Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Studio Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Parmar's Gallery"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm transition-all font-medium"
              />
            </div>

            {/* Subdomain Slug */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Subdomain Slug (Unique URL)
              </label>
              <div className="flex items-center">
                <span className="px-3.5 py-3 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs text-slate-600 font-bold font-mono">
                  /s/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="parmarayush"
                  className="w-full px-4 py-3 rounded-r-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-mono font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Will be accessible at <strong className="text-slate-800">/s/{slug || 'your-slug'}</strong> and <strong className="text-slate-800">{slug || 'your-slug'}.maraphoto.com</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: VISUAL ASSETS (LOGO & COVER BANNER) ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                <Camera className="w-5 h-5" />
              </div>
              <span>Studio Brand Assets (Logo & Cover Banner)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Upload your official studio logo and cinematic hero cover photo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Studio Logo */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">
                Studio Logo
              </span>

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
              />

              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full border-2 border-dashed border-[#c5a880] hover:border-[#99732e] bg-white p-2 flex items-center justify-center cursor-pointer group shadow-sm transition-all"
                title="Click to upload logo"
              >
                {resolvedLogoUrl && resolvedLogoUrl !== '/logo.png' ? (
                  <img
                    src={resolvedLogoUrl}
                    alt="Studio Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-[#99732e] transition-colors">
                    <Upload className="w-6 h-6 mb-1 text-[#99732e]" />
                    <span className="text-[10px] font-bold text-slate-700">Upload Logo</span>
                  </div>
                )}

                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/90 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#99732e] animate-spin" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#99732e] text-xs font-bold transition-colors cursor-pointer"
                >
                  Change Logo
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">PNG, JPG, WEBP, or SVG under 10MB</p>
            </div>

            {/* Studio Cover Banner (16:9 Aspect Ratio) */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Hero Cover Banner
                </span>
                <span className="text-[10px] font-black text-[#99732e] bg-[#c5a880]/20 px-2.5 py-0.5 rounded-full border border-[#c5a880]/30">
                  16:9 Aspect Ratio
                </span>
              </div>

              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <div
                onClick={() => bannerInputRef.current?.click()}
                className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-[#c5a880] hover:border-[#99732e] bg-white overflow-hidden flex items-center justify-center cursor-pointer group shadow-sm transition-all"
                title="Click to upload 16:9 cover banner"
              >
                {resolvedBannerUrl ? (
                  <img
                    src={resolvedBannerUrl}
                    alt="Cover Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-[#99732e] transition-colors p-4">
                    <ImageIcon className="w-8 h-8 mb-2 text-[#99732e]" />
                    <span className="text-xs font-bold text-slate-800">Upload 16:9 Cover Banner</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Recommended: 1920x1080 (16:9)</span>
                  </div>
                )}

                {uploadingBanner && (
                  <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#99732e] animate-spin" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#99732e] text-xs font-bold transition-colors cursor-pointer"
                >
                  Change Banner (16:9)
                </button>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteBanner}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Remove Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                16:9 Widescreen Ratio Recommended (e.g. 1920x1080) JPG or WEBP
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: HERO STORY, TAGLINE & BIO ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span>Hero Story & Presentation</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tagline, bio, and studio story shown prominently in your hero block.
            </p>
          </div>

          <div className="space-y-4">
            {/* Tagline */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Studio Tagline / Slogan
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Capturing Timeless Moments & Cherished Stories"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm transition-all font-medium"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Studio Bio & About Description
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="We specialize in cinematic wedding, pre-wedding, and lifestyle photography crafted with passion..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm resize-none font-medium"
              />
            </div>

            {/* Office Address & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Office / Studio Physical Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 302, Royal Complex, Ring Road"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  City / State
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Surat, Gujarat"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: SHOWCASE COUNTER STATS (CUSTOM EDITABLE COUNTERS) ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                <Calendar className="w-5 h-5" />
              </div>
              <span>Showcase Counter Stats (Editable Counters)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Customize the numbers shown in the golden stats ribbon on your public studio website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Events Completed Count */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Events Captured Count (e.g. 150+ or 500)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#99732e] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={customEventsCount}
                  onChange={(e) => setCustomEventsCount(e.target.value)}
                  placeholder="e.g. 150+ or 500+"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Displayed under &quot;Events Captured&quot; on your public studio page ribbon.
              </p>
            </div>

            {/* Happy Customers Count */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Happy Customers Count (e.g. 250+ or 1000)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#99732e] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={customCustomersCount}
                  onChange={(e) => setCustomCustomersCount(e.target.value)}
                  placeholder="e.g. 250+ or 1000+"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Displayed under &quot;Happy Customers&quot; on your public studio page ribbon.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: DIRECT CONTACT & SOCIAL CHANNELS ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                <Phone className="w-5 h-5" />
              </div>
              <span>Contact Channels & Social Media</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Top bar links, direct calling links, and WhatsApp instant chat numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Mobile Number (For Calling & Footer)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-medium"
                />
              </div>
            </div>

            {/* Calling Phone Number */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Studio Phone Number (Direct Calling Button)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Studio Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="studio@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-sm font-medium"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                WhatsApp Direct Chat Number
              </label>
              <div className="relative">
                <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="919876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">Visitors can click directly to chat with you on WhatsApp</p>
            </div>

            {/* Instagram Profile */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Instagram Profile Link or Handle
              </label>
              <div className="relative">
                <InstagramIcon className="w-4 h-4 text-pink-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourstudio"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white text-sm font-medium"
                />
              </div>
            </div>

            {/* Facebook Profile */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Facebook Page / Profile Link
              </label>
              <div className="relative">
                <FacebookIcon className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourstudio"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: FEATURED PORTFOLIO SELECTION ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#c5a880]/15 text-[#99732e]">
                  <Layers className="w-5 h-5" />
                </div>
                <span>Select Events for Public Portfolio Showcase</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Toggle the switch on any event to feature it in your public studio portfolio.
              </p>
            </div>

            <div className="text-xs font-black text-[#99732e] bg-[#c5a880]/15 px-3 py-1.5 rounded-xl border border-[#c5a880]/30 shrink-0">
              {events.filter((e) => e.addToPortfolio).length} Events Featured
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No events found. Once you create events, you can toggle them here to feature in your portfolio!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
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
                    onClick={() => togglePortfolioEvent(event.id)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                      event.addToPortfolio
                        ? 'bg-[#fdfaf5] border-[#c5a880] shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                        {cover ? (
                          <img src={cover} alt={event.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#99732e] block truncate">
                          {event.type || 'Event'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{event.name}</h4>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{eventDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-xs font-medium">
                        {event.photosCount} Photos
                      </span>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${event.addToPortfolio ? 'text-[#99732e]' : 'text-slate-400'}`}>
                          {event.addToPortfolio ? 'In Portfolio' : 'Hidden'}
                        </span>
                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            event.addToPortfolio ? 'bg-[#c5a880]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              event.addToPortfolio ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STICKY SAVE BAR ── */}
        <div className="sticky bottom-6 z-30 flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready to publish changes to your live studio website</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={openPublicPage}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-slate-950 font-black text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Branding Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
