'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, Upload, Shield, Loader, Edit, ExternalLink,
  Check, Globe, Store, User as UserIcon, Mail, Phone, Crown,
  Sparkles, X
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function StudioSettingsPage() {
  const context = useDashboard();
  if (!context) return null;
  const {
    studio, setStudio,
    sessionUser, setSessionUser,
  } = context;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Studio fields
  const [studioName, setStudioName] = useState('');
  const [studioLogo, setStudioLogo] = useState('');
  const [studioSubdomain, setStudioSubdomain] = useState('');
  const [studioWebsite, setStudioWebsite] = useState('');
  const [studioInstagram, setStudioInstagram] = useState('');
  const [studioFacebook, setStudioFacebook] = useState('');

  // Owner fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Sync from context
  useEffect(() => {
    if (studio) {
      setStudioName(studio.name || '');
      setStudioLogo(studio.logoUrl || '');
      setStudioSubdomain(studio.subdomain || '');
      setStudioWebsite(studio.customDomain || '');
      setStudioInstagram(studio.instagramUrl || '');
      setStudioFacebook(studio.facebookUrl || '');
    }
    if (sessionUser) {
      setOwnerName(sessionUser.name || '');
      setOwnerEmail(sessionUser.email || '');
      setOwnerPhone(sessionUser.phone || sessionUser.mobile || '');
    }
  }, [studio, sessionUser]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setStudioLogo(event.target.result as string);
      }
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setStudioLogo('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim()) {
      toast.error('Studio name is required');
      return;
    }
    if (!studioSubdomain.trim()) {
      toast.error('Subdomain is required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiClient.put('/studio/me', {
        name: studioName,
        logoUrl: studioLogo,
        subdomain: studioSubdomain,
        customDomain: studioWebsite || undefined,
        instagramUrl: studioInstagram || undefined,
        facebookUrl: studioFacebook || undefined,
        userName: ownerName,
        userPhone: ownerPhone,
      });
      if (res.data?.studio) {
        setStudio(res.data.studio);
      }
      setSessionUser((prev: any) => ({
        ...prev,
        name: ownerName,
        phone: ownerPhone,
      }));
      toast.success('Studio settings saved successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save studio settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (studio) {
      setStudioName(studio.name || '');
      setStudioLogo(studio.logoUrl || '');
      setStudioSubdomain(studio.subdomain || '');
      setStudioWebsite(studio.customDomain || '');
      setStudioInstagram(studio.instagramUrl || '');
      setStudioFacebook(studio.facebookUrl || '');
    }
    if (sessionUser) {
      setOwnerName(sessionUser.name || '');
      setOwnerPhone(sessionUser.phone || sessionUser.mobile || '');
    }
  };

  const planConfig: Record<string, { gradient: string; text: string; icon: string }> = {
    BASIC: { gradient: 'from-slate-500 to-slate-600', text: 'Basic', icon: '🌱' },
    STANDARD: { gradient: 'from-blue-500 to-blue-600', text: 'Standard', icon: '⭐' },
    ESSENTIAL: { gradient: 'from-indigo-500 to-indigo-600', text: 'Essential', icon: '💎' },
    PREMIUM: { gradient: 'from-amber-500 to-orange-500', text: 'Premium', icon: '👑' },
    STARTER: { gradient: 'from-emerald-500 to-green-600', text: 'Starter', icon: '🚀' },
    PROFESSIONAL: { gradient: 'from-violet-500 to-purple-600', text: 'Professional', icon: '🏆' },
    BUSINESS: { gradient: 'from-rose-500 to-pink-600', text: 'Business', icon: '💼' },
    ENTERPRISE: { gradient: 'from-yellow-500 to-amber-600', text: 'Enterprise', icon: '🏢' },
  };
  const plan = studio?.subscriptionPlan || 'BASIC';
  const pc = planConfig[plan] || planConfig.BASIC;
  const subdomainLink = studioSubdomain ? `${studioSubdomain}.maraphoto.com` : '';

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes settingsFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerGlow {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .settings-page-animate {
          animation: settingsFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ---- Card Base ---- */
        .ss-card {
          background: #ffffff;
          border: 1px solid #e8e4dd;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.03);
          transition: box-shadow 0.35s ease, transform 0.35s ease;
        }
        .ss-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.05);
        }
        @media (max-width: 640px) {
          .ss-card { padding: 20px; border-radius: 20px; }
        }

        /* ---- Section Header ---- */
        .ss-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1ede7;
        }

        /* ---- Form Fields ---- */
        .ss-field { margin-bottom: 20px; }
        .ss-field:last-child { margin-bottom: 0; }
        .ss-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .ss-label-hint {
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          text-transform: none;
          letter-spacing: 0;
        }
        .ss-input {
          width: 100%;
          background: #faf9f6;
          border: 1.5px solid #e8e4dd;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          transition: all 0.3s ease;
        }
        .ss-input:focus {
          border-color: #c5a880;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(197,168,128,0.1);
        }
        .ss-input:disabled {
          background: #f5f3ef;
          color: #94a3b8;
          border-color: #f0ece6;
          cursor: not-allowed;
        }
        .ss-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }

        /* ---- Logo Area ---- */
        .ss-logo-container {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 22px;
          overflow: hidden;
          border: 2.5px solid #e8e4dd;
          background: #faf9f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.35s ease;
        }
        .ss-logo-container.has-logo { border-color: #c5a880; }
        .ss-logo-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
        }
        .ss-logo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(2px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }
        .ss-logo-container:hover .ss-logo-overlay { opacity: 1; }

        /* ---- View-mode Info Rows ---- */
        .ss-info-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid #f5f3ef;
        }
        .ss-info-item:last-child { border-bottom: none; }
        .ss-info-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ss-info-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .ss-info-value {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
          word-break: break-word;
        }

        /* ---- Link Style ---- */
        .ss-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #c5a880;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ss-link:hover { color: #9c7c56; }

        /* ---- Buttons ---- */
        .ss-btn-primary {
          width: 100%;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #0f172a;
          background: linear-gradient(135deg, #c5a880 0%, #d4bc9a 100%);
          border: none;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(197,168,128,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .ss-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(197,168,128,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .ss-btn-primary:active { transform: translateY(0); }
        .ss-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .ss-btn-edit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 22px;
          font-size: 11px;
          font-weight: 800;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #0f172a;
          background: linear-gradient(135deg, #c5a880 0%, #d4bc9a 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 12px rgba(197,168,128,0.25);
        }
        .ss-btn-edit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(197,168,128,0.35);
        }
        .ss-btn-cancel {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 22px;
          font-size: 11px;
          font-weight: 800;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          background: #ffffff;
          border: 1.5px solid #e8e4dd;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .ss-btn-cancel:hover {
          border-color: #cbd5e1;
          color: #0f172a;
          background: #faf9f6;
        }

        /* ---- Quick Link Cards ---- */
        .ss-quick-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 16px;
          background: #faf9f6;
          border: 1px solid #f0ece6;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .ss-quick-link:hover {
          border-color: #c5a880;
          background: #fff;
          box-shadow: 0 4px 16px rgba(197,168,128,0.1);
          transform: translateY(-1px);
        }

        /* ---- Plan Badge ---- */
        .ss-plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: white;
        }

        /* ---- Subdomain Input Group ---- */
        .ss-subdomain-group {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .ss-subdomain-group .ss-input {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-right: none;
        }
        .ss-subdomain-suffix {
          padding: 14px 16px;
          background: #f0ece6;
          border: 1.5px solid #e8e4dd;
          border-left: none;
          border-radius: 0 14px 14px 0;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          white-space: nowrap;
        }
      `}} />

      <div className="max-w-2xl mx-auto settings-page-animate">

        {/* ===== Page Header ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c5a880] to-[#d4bc9a] flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Studio Settings</h1>
            </div>
            <p className="text-xs text-slate-400 font-semibold ml-[42px]">Manage your studio identity, branding & owner details</p>
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="ss-btn-edit">
                <Edit className="h-3.5 w-3.5" /> Edit Details
              </button>
            ) : (
              <button onClick={handleCancel} className="ss-btn-cancel">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* ===== CARD 1: Studio Identity ===== */}
          <div className="ss-card mb-5">
            <div className="ss-section-label">
              <Store className="h-4 w-4 text-[#c5a880]" />
              Studio Identity
            </div>

            {/* Logo + Studio Name / Plan Row */}
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              {/* Logo */}
              <div>
                <div className={`ss-logo-container ${studioLogo ? 'has-logo' : ''}`}>
                  {studioLogo ? (
                    <img src={studioLogo} alt="Studio Logo" />
                  ) : (
                    <Camera className="h-8 w-8 text-slate-300" />
                  )}
                  {isEditing && (
                    <label className="ss-logo-overlay">
                      <Upload className="h-5 w-5 text-white" />
                      <span className="text-[10px] text-white font-bold">
                        {uploadingLogo ? 'Loading...' : 'Change'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isEditing && studioLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="mt-2 text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors w-full text-center"
                  >
                    Remove Logo
                  </button>
                )}
                {!isEditing && (
                  <p className="text-[10px] font-bold text-center mt-2" style={{ color: studioLogo ? '#22c55e' : '#94a3b8' }}>
                    {studioLogo ? '✓ Active' : 'No Logo'}
                  </p>
                )}
              </div>

              {/* Name + Plan */}
              <div className="flex-1 min-w-0 w-full">
                {isEditing ? (
                  <div className="ss-field">
                    <label className="ss-label">Studio Name <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      className="ss-input"
                      placeholder="Enter your studio name"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 truncate mb-3">{studioName || 'Unnamed Studio'}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`ss-plan-badge bg-gradient-to-r ${pc.gradient}`}>
                        <span>{pc.icon}</span> {pc.text} Plan
                      </span>
                      {studio?.subscriptionStatus && (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                          studio.subscriptionStatus === 'ACTIVE' || studio.subscriptionStatus === 'FREE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {studio.subscriptionStatus === 'FREE' ? 'Free Tier' : studio.subscriptionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subdomain */}
            <div className="ss-field">
              <label className="ss-label">
                Subdomain <span className="text-rose-400">*</span>
              </label>
              {isEditing ? (
                <div className="ss-subdomain-group">
                  <input
                    type="text"
                    required
                    value={studioSubdomain}
                    onChange={(e) => setStudioSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="ss-input"
                    placeholder="your-studio"
                  />
                  <span className="ss-subdomain-suffix">.maraphoto.com</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Globe className="h-4 w-4 text-[#c5a880] flex-shrink-0" />
                  {subdomainLink ? (
                    <a href={`https://${subdomainLink}`} target="_blank" rel="noopener noreferrer" className="ss-link">
                      {subdomainLink} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 font-semibold italic">Not configured</span>
                  )}
                </div>
              )}
            </div>

            {/* Website Link */}
            <div className="ss-field">
              <label className="ss-label">
                Website Link <span className="ss-label-hint">(optional)</span>
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={studioWebsite}
                  onChange={(e) => setStudioWebsite(e.target.value)}
                  className="ss-input"
                  placeholder="https://yourstudio.com"
                />
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <ExternalLink className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  {studioWebsite ? (
                    <a
                      href={studioWebsite.startsWith('http') ? studioWebsite : `https://${studioWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-link"
                    >
                      {studioWebsite} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 font-semibold italic">Not set</span>
                  )}
                </div>
              )}
            </div>

            {/* Instagram Link */}
            <div className="ss-field">
              <label className="ss-label">
                Instagram Link <span className="ss-label-hint">(optional)</span>
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={studioInstagram}
                  onChange={(e) => setStudioInstagram(e.target.value)}
                  className="ss-input"
                  placeholder="https://instagram.com/yourstudio"
                />
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Globe className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  {studioInstagram ? (
                    <a
                      href={studioInstagram.startsWith('http') ? studioInstagram : `https://${studioInstagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-link"
                    >
                      {studioInstagram} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 font-semibold italic">Not set</span>
                  )}
                </div>
              )}
            </div>

            {/* Facebook Link */}
            <div className="ss-field">
              <label className="ss-label">
                Facebook Link <span className="ss-label-hint">(optional)</span>
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={studioFacebook}
                  onChange={(e) => setStudioFacebook(e.target.value)}
                  className="ss-input"
                  placeholder="https://facebook.com/yourstudio"
                />
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Globe className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  {studioFacebook ? (
                    <a
                      href={studioFacebook.startsWith('http') ? studioFacebook : `https://${studioFacebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-link"
                    >
                      {studioFacebook} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 font-semibold italic">Not set</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===== CARD 2: Owner Details ===== */}
          <div className="ss-card mb-5">
            <div className="ss-section-label">
              <UserIcon className="h-4 w-4 text-[#c5a880]" />
              Owner Details
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div className="ss-field">
                  <label className="ss-label">Full Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="ss-input"
                    placeholder="Your full name"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Email <span className="ss-label-hint">(cannot be changed)</span></label>
                  <input
                    type="email"
                    value={ownerEmail}
                    disabled
                    className="ss-input"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Phone Number</label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="ss-input"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            ) : (
              <div>
                {/* Name */}
                <div className="ss-info-item">
                  <div className="ss-info-icon" style={{ background: '#eff6ff' }}>
                    <UserIcon className="h-4.5 w-4.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ss-info-label">Name</p>
                    <p className="ss-info-value">{ownerName || '—'}</p>
                  </div>
                </div>
                {/* Email */}
                <div className="ss-info-item">
                  <div className="ss-info-icon" style={{ background: '#ecfdf5' }}>
                    <Mail className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ss-info-label">Email</p>
                    <p className="ss-info-value">{ownerEmail || '—'}</p>
                  </div>
                </div>
                {/* Phone */}
                <div className="ss-info-item">
                  <div className="ss-info-icon" style={{ background: '#f5f3ff' }}>
                    <Phone className="h-4.5 w-4.5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ss-info-label">Phone</p>
                    <p className="ss-info-value">{ownerPhone || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== CARD 3: Quick Links (view mode only) ===== */}
          {!isEditing && (
            <div className="ss-card mb-5">
              <div className="ss-section-label">
                <Sparkles className="h-4 w-4 text-[#c5a880]" />
                Quick Links
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/dashboard/studio-branding" className="ss-quick-link">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                    <Shield className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Studio Branding</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Configure photo watermarks</p>
                  </div>
                </Link>
                <Link href="/dashboard/plans-billing" className="ss-quick-link">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 border border-violet-100">
                    <Crown className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Plans & Billing</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage your subscription</p>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* ===== Save Button ===== */}
          {isEditing && (
            <div className="mt-6">
              <button type="submit" disabled={isSaving} className="ss-btn-primary">
                {isSaving ? (
                  <><Loader className="h-4 w-4 animate-spin" /> Saving Changes...</>
                ) : (
                  <><Shield className="h-4 w-4" /> Save Studio Settings</>
                )}
              </button>
              <p className="text-[10px] text-slate-400 font-semibold text-center mt-3">
                All changes will be reflected across your entire dashboard
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
