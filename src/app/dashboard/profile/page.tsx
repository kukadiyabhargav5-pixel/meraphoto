'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Upload, Trash2, Globe,
  ShieldCheck, Mail, Phone, Building,
  Edit3, Save, Loader2
} from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

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

export default function UnifiedProfilePage() {
  const context = useDashboard();
  const { user: authUser, studio: authStudio } = useAuth();

  const {
    studio, setStudio,
    sessionUser, setSessionUser,
  } = context || {};

  // Active section tab: only Profile and Branding
  const [activeTab, setActiveTab] = useState<'profile' | 'branding'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // User Profile States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Studio Identity States
  const [studioName, setStudioName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  // Studio Logo State
  const [logoUrl, setLogoUrl] = useState('');

  // Sync state from context and auth
  useEffect(() => {
    const currentUser = sessionUser || authUser;
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || currentUser.mobile || '');
    }

    const currentStudio = studio || authStudio;
    if (currentStudio) {
      setStudioName(currentStudio.name || '');
      setCustomDomain(currentStudio.customDomain || currentStudio.websiteLink || '');
      setInstagramUrl(currentStudio.instagramUrl || '');
      setFacebookUrl(currentStudio.facebookUrl || '');
      setLogoUrl(resolveMediaUrl(currentStudio.logoUrl || ''));
    }
  }, [sessionUser, authUser, studio, authStudio]);

  // Handle direct Studio Logo upload to Cloudflare R2
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validMimes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WEBP, or SVG image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo file size must be under 10MB.');
      return;
    }

    setUploadingLogo(true);
    const toastId = toast.loading('Uploading studio logo...');

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('image', file);

      const res = await apiClient.post('/studio/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.logoUrl) {
        const newUrl = resolveMediaUrl(res.data.logoUrl);
        setLogoUrl(newUrl);

        if (res.data?.studio) {
          setStudio(res.data.studio);
          try {
            localStorage.setItem('studio', JSON.stringify(res.data.studio));
          } catch {}
          window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
          window.dispatchEvent(new CustomEvent('studio_updated', { detail: res.data.studio }));
        }

        toast.success('Studio logo updated successfully!', { id: toastId });
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err?.response?.data?.error || 'Failed to upload logo to storage.', { id: toastId });
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle removing Studio Logo
  const handleRemoveLogo = async () => {
    if (!logoUrl) return;
    const confirmRemove = window.confirm('Are you sure you want to remove your studio logo?');
    if (!confirmRemove) return;

    const toastId = toast.loading('Removing studio logo...');
    try {
      const res = await apiClient.delete('/studio/logo');
      setLogoUrl('');

      if (res.data?.studio) {
        setStudio(res.data.studio);
        try {
          localStorage.setItem('studio', JSON.stringify(res.data.studio));
        } catch {}
        window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
      }
      toast.success('Studio logo removed successfully', { id: toastId });
    } catch (err: any) {
      console.error('Delete logo error:', err);
      toast.error(err?.response?.data?.error || 'Failed to remove logo.', { id: toastId });
    }
  };

  // Save profile and studio configurations
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Saving profile & studio settings...');

    try {
      const payload: any = {
        name: studioName,
        userName: name,
        userPhone: phone,
        logoUrl: logoUrl || undefined,
        customDomain: customDomain ? customDomain.trim().toLowerCase() : undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
      };

      const res = await apiClient.put('/studio/me', payload);

      if (res.data?.studio) {
        setStudio(res.data.studio);
        try {
          localStorage.setItem('studio', JSON.stringify(res.data.studio));
        } catch {}
        window.dispatchEvent(new CustomEvent('studio_updated', { detail: res.data.studio }));
        window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
      }

      if (sessionUser && setSessionUser) {
        setSessionUser((prev: any) => ({
          ...prev,
          name,
          phone,
        }));
      }

      toast.success('All settings saved successfully!', { id: toastId });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save settings error:', err);
      toast.error(err?.response?.data?.error || 'Failed to save configuration.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const planKey = (studio?.subscriptionPlan || authStudio?.subscriptionPlan || 'BASIC').toUpperCase();

  return (
    <div className="w-full min-h-full bg-[#f8f7f4] text-slate-900 p-3 xs:p-4 sm:p-6 lg:p-8 pb-32 font-poppins">

      {/* ═══ Top Header & Action Bar ═══ */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#c5a880] bg-[#fbf9f6] flex items-center justify-center shrink-0 shadow-sm">
            {logoUrl ? (
              <img src={resolveMediaUrl(logoUrl)} alt="Studio Logo" className="w-full h-full object-contain p-1" onError={() => setLogoUrl('')} />
            ) : (
              <Building className="w-8 h-8 text-[#c5a880]/70" />
            )}
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-bold">Change</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {studioName || name || 'My Studio Profile'}
              </h1>
              <span className="bg-[#c5a880]/15 text-[#8f7048] border border-[#c5a880]/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                {planKey} PLAN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Owner: <span className="font-bold text-slate-800">{name || 'Admin'}</span> • {email}
            </p>
          </div>
        </div>

        {/* Edit / Save Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#c5a880] via-[#d4bc97] to-[#b59a72] hover:brightness-105 active:scale-95 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer min-h-[42px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-[#c5a880] hover:bg-[#b59870] active:scale-95 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-[0_4px_14px_rgba(197,168,128,0.25)] flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto min-h-[42px]"
            >
              <Edit3 className="w-4 h-4 text-slate-950" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Section Navigation Tabs ═══ */}
      <div className="w-full flex items-center gap-2 border-b border-slate-200/90 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#c5a880] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Studio Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-[#c5a880] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Logo & Branding</span>
        </button>
      </div>

      {/* ═══ TAB 1: Profile & Studio Details ═══ */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* User Account Card */}
          <div className="w-full bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-[#c5a880]" />
              <h2 className="text-base font-extrabold text-slate-900">Owner Account Information</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Full Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Login Email (Protected)</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Mobile Number</label>
              <input
                type="tel"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Studio Business Card */}
          <div className="w-full bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-[#c5a880]" />
              <h2 className="text-base font-extrabold text-slate-900">Studio & Brand Information</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Studio Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. Royal Wedding Studio"
                className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Custom Domain / Website Link
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="gallery.royalweddings.com"
                  className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Instagram Handle</label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="@royalweddings"
                    className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Facebook URL</label>
                <div className="relative">
                  <FacebookIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="facebook.com/royalweddings"
                    className="w-full bg-slate-50 disabled:bg-[#faf9f6] text-slate-900 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ TAB 2: Logo & Branding ═══ */}
      {activeTab === 'branding' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">Official Studio Logo</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved securely in high-speed cloud storage. Displays on albums, customer invoices, and guest portals.
              </p>
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Logo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Live Logo Preview Container */}
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-[#fbf9f6] min-h-[220px]">
              {logoUrl ? (
                <div className="relative group max-w-[260px] max-h-[160px] p-4 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                  <img src={resolveMediaUrl(logoUrl)} alt="Studio Logo" className="max-h-28 max-w-full object-contain" onError={() => setLogoUrl('')} />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-400">
                    <Camera className="w-8 h-8 text-[#c5a880]" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">No logo currently uploaded</span>
                  <span className="text-[11px] text-slate-400">Upload your branding image to enhance your galleries</span>
                </div>
              )}
            </div>

            {/* Upload Action Box */}
            <div className="flex flex-col gap-3">
              <label className="border-2 border-dashed border-[#c5a880]/50 hover:border-[#c5a880] bg-[#c5a880]/5 hover:bg-[#c5a880]/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group text-center">
                {uploadingLogo ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 className="w-7 h-7 text-[#c5a880] animate-spin" />
                    <span className="text-xs font-bold text-[#c5a880]">Uploading logo...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#c5a880] group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block">
                        {logoUrl ? 'Upload & Replace Logo' : 'Choose Studio Logo File'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                        PNG (recommended with transparent background), JPG, WEBP, or SVG
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#b59a72] bg-white px-3 py-1 rounded-full border border-[#c5a880]/30 shadow-xs">
                      Max 10 MB • High Resolution
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={uploadingLogo}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating Save Bar when in Edit Mode */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-4"
          >
            <span className="text-xs font-bold text-slate-300">Unsaved profile edits</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="bg-[#c5a880] hover:bg-[#b59870] text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save All</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
