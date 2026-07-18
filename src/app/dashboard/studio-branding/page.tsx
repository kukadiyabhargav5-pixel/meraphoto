'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
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
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-900">Studio Branding & Watermark</h1>
            
            <form onSubmit={handleUpdateBranding} className="grid grid-cols-12 gap-8">
              <div className="col-span-6  bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-650 mb-2">Whitelabel Customizations</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Studio Name</label>
                  <input type="text" required value={studioName} onChange={(e) => setStudioName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Studio Logo</label>
                  <div className="flex items-center gap-3">
                    {studioLogo ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
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
                      <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50 text-slate-600 shrink-0">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-[#c5a880]/30 hover:bg-[#c5a880]/10 text-[#b59a72] rounded-lg text-xs font-extrabold cursor-pointer transition-all shadow-sm w-full text-center">
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
                      <p className="text-[10px] text-slate-600 mt-1 font-semibold">Max 2MB. Square ratio recommended.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Subdomain (slug.maraphoto.com)</label>
                  <input type="text" required value={studioSubdomain} onChange={(e) => setStudioSubdomain(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Custom Domain (requires Enterprise Plan)</label>
                  <input type="text" disabled={studio.subscriptionPlan !== 'ENTERPRISE'} value={studioCustomDomain} onChange={(e) => setStudioCustomDomain(e.target.value)} placeholder="gallery.yourdomain.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white/[0.04] disabled:opacity-50" />
                </div>
              </div>

              <div className="col-span-6  bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-650 mb-2">Automated Photo Watermark</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Watermark Type</label>
                  <select value={wmType} onChange={(e) => setWmType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]">
                    <option className="bg-white text-slate-900" value="NONE">NONE</option>
                    <option className="bg-white text-slate-900" value="TEXT">TEXT WATERMARK</option>
                    <option className="bg-white text-slate-900" value="LOGO">LOGO WATERMARK</option>
                  </select>
                </div>

                {wmType === 'TEXT' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Watermark Text</label>
                    <input type="text" required value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="© Dream Studio" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                )}

                {wmType === 'LOGO' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Watermark Logo Image</label>
                    <div className="flex items-center gap-3">
                      {wmLogo ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img src={wmLogo} alt="Watermark Logo Preview" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => setWmLogo('')}
                            className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-slate-900 text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50 text-slate-600 shrink-0">
                          <Camera className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-[#c5a880]/30 hover:bg-[#c5a880]/10 text-[#b59a72] rounded-lg text-xs font-extrabold cursor-pointer transition-all shadow-sm w-full text-center">
                          {uploadingAsset === 'wmLogo' ? (
                            <span className="flex items-center gap-1.5 justify-center">
                              <Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...
                            </span>
                          ) : (
                            'Choose File'
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAssetUpload(e, setWmLogo, 'wmLogo')}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-600 mt-1 font-semibold">PNG with transparent background recommended.</p>
                      </div>
                    </div>
                  </div>
                )}

                {wmType !== 'NONE' && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Watermark Position</label>
                        <select value={wmPos} onChange={(e) => setWmPos(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]">
                          <option className="bg-white text-slate-900" value="TOP_LEFT">TOP LEFT</option>
                          <option className="bg-white text-slate-900" value="TOP_RIGHT">TOP RIGHT</option>
                          <option className="bg-white text-slate-900" value="BOTTOM_LEFT">BOTTOM LEFT</option>
                          <option className="bg-white text-slate-900" value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                          <option className="bg-white text-slate-900" value="CENTER">CENTER OVERLAY</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Size ({wmSize}%)</label>
                        <input type="range" min="1" max="100" step="1" value={wmSize} onChange={(e) => setWmSize(parseInt(e.target.value))} className="w-full h-8 cursor-pointer accent-[#c5a880]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Opacity ({Math.round(wmOpacity * 100)}%)</label>
                        <input type="range" min="0.1" max="1.0" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(parseFloat(e.target.value))} className="w-full h-8 cursor-pointer accent-[#c5a880]" />
                      </div>
                    </div>

                    {/* Watermark Live Preview */}
                    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex flex-col">
                      <div className="bg-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        Live Preview
                      </div>
                      <div className="relative w-full aspect-video bg-white">
                        <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80" alt="Preview Background" className="w-full h-full object-cover" />
                        
                        {/* Overlay Watermark container based on position */}
                        <div className={`absolute inset-0 p-4 pointer-events-none flex 
                          ${wmPos === 'TOP_LEFT' ? 'items-start justify-start' : ''}
                          ${wmPos === 'TOP_RIGHT' ? 'items-start justify-end' : ''}
                          ${wmPos === 'BOTTOM_LEFT' ? 'items-end justify-start' : ''}
                          ${wmPos === 'BOTTOM_RIGHT' ? 'items-end justify-end' : ''}
                          ${wmPos === 'CENTER' ? 'items-center justify-center' : ''}
                        `}>
                          <div style={{ opacity: wmOpacity }} className="transition-opacity duration-200 pointer-events-auto">
                            {wmType === 'TEXT' ? (
                              <span style={{ fontSize: `${wmSize * 0.03}rem` }} className="text-white font-bold drop-shadow-md select-none whitespace-nowrap">{wmText}</span>
                            ) : wmType === 'LOGO' && wmLogo ? (
                              <img src={wmLogo} alt="Logo Watermark" style={{ width: `${wmSize * 3}px` }} className="object-contain drop-shadow-md select-none" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" disabled={isSaving} className="w-full mt-4 bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 font-bold py-3.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save Studio Changes'}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}
