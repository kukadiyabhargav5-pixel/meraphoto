'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { Camera, Upload, CheckCircle, Edit, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    studio, setStudio,
    sessionUser, setSessionUser,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg
  } = context;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [studioName, setStudioName] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with context
  useEffect(() => {
    if (sessionUser) {
      setName(sessionUser.name || '');
      setEmail(sessionUser.email || 'admin@maraphoto.com');
      setMobile(sessionUser.phone || sessionUser.mobile || '');
    }
    if (studio) {
      setStudioName(studio.name || '');
      setWebsiteLink(studio.customDomain || studio.websiteLink || '');
      setLogoUrl(studio.logoUrl || '');
    }
  }, [sessionUser, studio]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, setSuccessMsg]);

  // Direct file upload to cloud for logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo file size must be under 10MB');
      return;
    }

    try {
      setUploadingLogo(true);
      // Instant temporary preview
      const localPreview = URL.createObjectURL(file);
      setLogoUrl(localPreview);

      // Upload directly to server & cloud storage
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('image', file);

      const res = await apiClient.post('/studio/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.logoUrl) {
        const cloudLogoUrl = res.data.logoUrl;
        setLogoUrl(cloudLogoUrl);
        if (res.data?.studio) {
          setStudio(res.data.studio);
          try {
            localStorage.setItem('studio', JSON.stringify(res.data.studio));
          } catch {}
          window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
        }
        toast.success('Studio logo uploaded and updated everywhere! 🎉');
      }
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      toast.error(err.response?.data?.error || 'Failed to upload studio logo');
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Update User details in context
      setSessionUser((prev: any) => ({
        ...prev,
        name,
        phone: mobile,
        mobile
      }));

      // Update studio API
      const res = await apiClient.put('/studio/me', {
        name: studioName,
        logoUrl: logoUrl,
        customDomain: websiteLink || undefined,
        userName: name,
        userPhone: mobile
      });

      if (res.data && res.data.studio) {
        setStudio(res.data.studio);
        try {
          localStorage.setItem('studio', JSON.stringify(res.data.studio));
        } catch {}
        window.dispatchEvent(new CustomEvent('studio_logo_updated', { detail: res.data.studio }));
      } else {
        setStudio((prev: any) => ({
          ...prev,
          name: studioName,
          logoUrl: logoUrl,
          customDomain: websiteLink
        }));
      }

      toast.success('Profile and Studio configuration saved successfully!');
      setSuccessMsg('Profile and Studio settings saved successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save profile error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save configuration';
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-[#f8f7f4] text-slate-900 p-4 md:p-8 flex flex-col min-h-[85vh] font-poppins relative">
      {!isEditing && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-[#c5a880] hover:bg-[#b0936b] text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-4 h-4" /> Edit Details
          </button>
        </div>
      )}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-xl bg-[#f8f7f4] text-slate-900 p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col items-center gap-6 relative">
        
        {/* Profile Logo Preview at Top */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-[#c5a880] bg-white flex items-center justify-center shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt="Studio Logo" className="w-full h-full object-contain" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <span className="text-xs font-bold text-[#c5a880] uppercase tracking-wide">
            {logoUrl ? 'Studio Brand Active' : 'No Logo Uploaded'}
          </span>
        </div>

        <div className="w-full text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Studio Register & Profile</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Manage your studio brand details, credentials, and verification.</p>
        </div>

        {successMsg && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 text-emerald-700 text-sm font-bold px-6 py-4 rounded-xl flex items-center gap-3 border border-emerald-200 shadow-2xl animate-fade-in transition-all">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="w-full flex flex-col gap-4 text-left">
          
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              required 
              disabled={!isEditing}
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white disabled:bg-[#f8f7f4] text-slate-900 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
            />
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">Mobile Number</label>
            <input 
              type="tel" 
              required 
              disabled={!isEditing}
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)}
              
              className="w-full bg-white disabled:bg-[#f8f7f4] text-slate-900 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
            />
          </div>

          {/* Email ID (Disabled) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-455 font-bold uppercase tracking-wider">Login Email ID</label>
            <input 
              type="email" 
              disabled 
              value={email} 
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" 
            />
          </div>

          {/* Studio Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">Studio Name</label>
            <input 
              type="text" 
              required 
              disabled={!isEditing}
              value={studioName} 
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full bg-white disabled:bg-[#f8f7f4] text-slate-900 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
            />
          </div>

          {/* Studio Website Link (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1">
              Studio Website Link <span className="text-[9px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input 
              type="url" 
              disabled={!isEditing}
              value={websiteLink} 
              onChange={(e) => setWebsiteLink(e.target.value)}
              
              className="w-full bg-white disabled:bg-[#f8f7f4] text-slate-900 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
            />
          </div>

          {/* Studio Logo File Upload (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1">
              Studio Logo <span className="text-[9px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-[#c5a880] rounded-2xl p-5 flex flex-col items-center justify-center transition-all bg-white cursor-pointer group shadow-sm">
              {uploadingLogo ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 className="w-7 h-7 text-[#c5a880] animate-spin" />
                  <span className="text-xs font-bold text-[#c5a880]">Uploading logo to cloud...</span>
                </div>
              ) : (
                <>
                  {logoUrl ? (
                    <div className="relative mb-2">
                      <img src={logoUrl} alt="Logo Preview" className="max-h-20 object-contain rounded-lg p-1 bg-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-[#c5a880]/10 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#c5a880] transition-colors" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#8a6e42] transition-colors mt-1">
                    {logoUrl ? 'Change Logo' : 'Upload Studio Logo'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">PNG, JPG, SVG up to 10MB</span>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#c5a880] hover:bg-[#b0936b] text-slate-900 font-bold py-3.5 rounded-lg text-xs transition-colors shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Saving Configuration...' : 'Save Profile Configuration'}
            </button>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
