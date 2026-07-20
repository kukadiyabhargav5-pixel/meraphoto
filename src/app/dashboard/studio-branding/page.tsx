'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';


export default function StudioBrandingPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    customers, setCustomers,
    team, setTeam,
    bookings, setBookings,
    quotations, setQuotations,
    bills, setBills,
    studio, setStudio,
    sessionUser,
    tickets, setTickets,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg

    
  } = context;

  const handleAssetUpload = (e: any, setter: any, type: string) => { 
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(type); 
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
      }
      setUploadingAsset('');
    };
    reader.readAsDataURL(file);
  };
  const [uploadingAsset, setUploadingAsset] = useState('');
  
  // Use studio from context if available, otherwise fallback
  const [studioName, setStudioName] = useState(studio?.name || '');
  const [studioLogo, setStudioLogo] = useState(studio?.logoUrl || '');
  const [studioSubdomain, setStudioSubdomain] = useState(studio?.subdomain || '');
  const [studioCustomDomain, setStudioCustomDomain] = useState(studio?.customDomain || '');
  const [wmType, setWmType] = useState(studio?.watermark?.type || 'NONE');
  const [wmText, setWmText] = useState(studio?.watermark?.text || 'Mara Photo');
  const [wmLogo, setWmLogo] = useState(studio?.watermark?.logoUrl || '');
  const [wmPos, setWmPos] = useState(studio?.watermark?.position || 'BOTTOM_RIGHT');
  const [wmOpacity, setWmOpacity] = useState(studio?.watermark?.opacity ?? 0.5);
  const [wmSize, setWmSize] = useState(studio?.watermark?.size ?? 50);
  
  // Update state if studio object changes after initial load
  useEffect(() => {
    if (studio) {
      setStudioName(studio.name || '');
      setStudioLogo(studio.logoUrl || '');
      setStudioSubdomain(studio.subdomain || '');
      setStudioCustomDomain(studio.customDomain || '');
      if (studio.watermark) {
        setWmType(studio.watermark.type || 'NONE');
        setWmText(studio.watermark.text || 'Mara Photo');
        setWmLogo(studio.watermark.logoUrl || '');
        setWmPos(studio.watermark.position || 'BOTTOM_RIGHT');
        setWmOpacity(studio.watermark.opacity ?? 0.5);
        setWmSize(studio.watermark.size ?? 50);
      }
    }
  }, [studio]);

  const [isSaving, setIsSaving] = useState(false);
  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: studioName,
        logoUrl: studioLogo,
        subdomain: studioSubdomain,
        customDomain: studioCustomDomain,
        watermark: {
          type: wmType,
          text: wmText,
          logoUrl: wmLogo,
          position: wmPos,
          opacity: wmOpacity,
          size: wmSize
        }
      };
      
      const res = await apiClient.put('/studio/me', payload);
      setStudio(res.data.studio); // Update context
      setSuccessMsg('Studio settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.response?.data?.error || 'Failed to update studio branding');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 flex items-center justify-center">
      <div className="flex flex-col gap-8 w-full max-w-xl">
            <h1 className="text-2xl font-extrabold text-slate-900 text-center">Studio Branding</h1>
            
            <form onSubmit={handleUpdateBranding} className="bg-[#f8f7f4] text-slate-900 border border-slate-200 p-8 rounded-3xl flex flex-col gap-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-600 font-bold uppercase tracking-wider">Studio Name</label>
                <input type="text" required value={studioName} onChange={(e) => setStudioName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-600 font-bold uppercase tracking-wider">Studio Logo</label>
                <div className="flex items-center gap-3">
                  {studioLogo ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-[#f8f7f4] text-slate-900 shrink-0">
                      <img src={studioLogo} alt="Studio Logo Preview" className="w-full h-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => setStudioLogo('')}
                        className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-slate-900 text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border border-dashed border-slate-200 flex items-center justify-center bg-[#f8f7f4] text-slate-900 text-slate-400 shrink-0">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="inline-flex items-center justify-center px-4 py-3 bg-white border border-[#c5a880]/30 hover:bg-[#c5a880]/10 text-[#b59a72] rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-sm w-full text-center">
                      {uploadingAsset === 'studioLogo' ? (
                        <span className="flex items-center gap-1.5 justify-center">
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        'Choose File'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAssetUpload(e, setStudioLogo, 'studioLogo')}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Max 2MB. Square ratio recommended.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-600 font-bold uppercase tracking-wider">Subdomain (slug.maraphoto.com)</label>
                <input type="text" required value={studioSubdomain} onChange={(e) => setStudioSubdomain(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-600 font-bold uppercase tracking-wider">Custom Domain (requires Enterprise Plan)</label>
                <input type="text" disabled={studio.subscriptionPlan !== 'ENTERPRISE'} value={studioCustomDomain} onChange={(e) => setStudioCustomDomain(e.target.value)}  className="w-full bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white/[0.04] disabled:opacity-50" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full mt-4 bg-[#c5a880] hover:bg-[#b59a72] text-slate-900 font-bold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Studio Changes'}
              </button>
            </form>
          </div>
    </div>
  );
}
