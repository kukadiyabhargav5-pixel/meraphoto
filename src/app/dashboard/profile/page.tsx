'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { Camera, Upload, CheckCircle, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api';

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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

      // Try calling studio API
      const res = await apiClient.put('/studio/me', {
        name: studioName,
        logoUrl: logoUrl,
        customDomain: websiteLink
      });
      if (res.data && res.data.studio) {
        setStudio(res.data.studio);
      } else {
        setStudio((prev: any) => ({
          ...prev,
          name: studioName,
          logoUrl: logoUrl,
          customDomain: websiteLink
        }));
      }

      setSuccessMsg('Profile and Studio settings saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex-grow bg-white text-black p-4 md:p-8 flex flex-col min-h-[85vh] font-poppins relative">
      {!isEditing && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-[#c5a880] hover:bg-[#b0936b] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-4 h-4" /> Edit Details
          </button>
        </div>
      )}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-xl bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col items-center gap-6 relative">
        
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
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
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
              
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
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
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
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
              
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
            />
          </div>

          {/* Studio Logo File Upload (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1">
              Studio Logo <span className="text-[9px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className={`relative border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${!isEditing ? 'bg-slate-50 opacity-80 cursor-default' : 'bg-white cursor-pointer hover:border-[#c5a880]'}`}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Preview" className="max-h-16 object-contain mb-3" />
              ) : (
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
              )}
              {isEditing && (
                <>
                  <input 
                    type="file" 
                    accept="image/*"
                    disabled={!isEditing}
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <span className="text-xs font-bold text-slate-600 mt-1">
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">PNG, JPG, SVG up to 2MB</span>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#c5a880] hover:bg-[#b0936b] text-white font-bold py-3.5 rounded-lg text-xs transition-colors shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
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
