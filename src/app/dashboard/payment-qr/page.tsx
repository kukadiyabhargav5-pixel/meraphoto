'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../DashboardContext';
import { Download, Share2, Edit2, Upload, Camera, CheckCircle, Image as ImageIcon, QrCode } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function PaymentQRPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    studio, setStudio,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg
  } = context;

  const [mode, setMode] = useState<'VIEW' | 'EDIT'>('EDIT');
  const [loading, setLoading] = useState(false);
  
  const [formUpiId, setFormUpiId] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [uploadedQrUrl, setUploadedQrUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (studio?.paymentDetails) {
      setFormUpiId(studio.paymentDetails.upiId || '');
      setFormBusinessName(studio.paymentDetails.merchantName || '');
      setUploadedQrUrl(studio.paymentDetails.uploadedQrUrl || '');
      
      if (studio.paymentDetails.upiId || studio.paymentDetails.uploadedQrUrl) {
        setMode('VIEW');
      }
    } else {
       setMode('EDIT');
    }
  }, [studio]);

  // Auto-hide success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, setSuccessMsg]);

  // Determine which QR to show
  const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${formUpiId}&pn=${encodeURIComponent(formBusinessName)}&cu=INR`)}`;
  const displayQr = uploadedQrUrl || (formUpiId ? generatedQr : '');

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedQrUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setUploadedQrUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await apiClient.put('/studio/me', {
        paymentDetails: {
          upiId: formUpiId,
          merchantName: formBusinessName,
          uploadedQrUrl: uploadedQrUrl
        }
      });
      if (res.data && res.data.studio) {
        setStudio(res.data.studio);
      }
      setSuccessMsg('Payment details saved successfully!');
      setMode('VIEW');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!displayQr) return;
    try {
      const response = await fetch(displayQr);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payment_QR_${formBusinessName.replace(/\s+/g, '_') || 'Studio'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR', error);
      alert('Could not download QR code. Try again.');
    }
  };

  const handleShare = async () => {
    if (!displayQr) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Studio Payment QR',
          text: `Scan to pay ${formBusinessName || 'our studio'}`,
          url: displayQr
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-black p-4 md:p-8 flex items-center justify-center min-h-full font-poppins">
      
      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 text-emerald-700 text-sm font-bold px-6 py-4 rounded-xl flex items-center gap-3 border border-emerald-200 shadow-2xl animate-fade-in transition-all">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="w-full max-w-xl bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl relative animate-fade-in">
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Payment QR</h1>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Allow clients to pay directly to your account.</p>
          </div>
          {mode === 'VIEW' && (
            <button 
              onClick={() => setMode('EDIT')} 
              className="flex items-center gap-2 bg-[#c5a880]/10 hover:bg-[#c5a880]/20 text-[#b59a72] px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-[#c5a880]/20"
            >
              <Edit2 className="w-3.5 h-3.5" /> Change Details
            </button>
          )}
        </div>

        {/* QR Preview Section */}
        <div className="flex flex-col items-center bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner w-full md:w-3/4 mx-auto mb-8 relative">
          <span className="text-[10px] text-[#09090b] font-black uppercase tracking-widest mb-4">Scan & Pay</span>
          
          <div className="p-3 border-2 border-dashed border-[#c5a880]/30 rounded-2xl bg-white shadow-sm flex items-center justify-center w-48 h-48 relative overflow-hidden group">
            {displayQr ? (
              <img 
                src={displayQr}
                alt="UPI QR Code" 
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <QrCode className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No QR</span>
              </div>
            )}
            
            {mode === 'EDIT' && uploadedQrUrl && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={handleRemoveQr} className="bg-white/20 hover:bg-white text-white hover:text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold backdrop-blur-sm transition-colors">
                  Remove Custom QR
                </button>
              </div>
            )}
          </div>

          <div className="text-center mt-5">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">{formBusinessName || 'Your Business'}</h3>
            {formUpiId && !uploadedQrUrl && (
              <p className="text-[11px] text-slate-500 font-bold mt-1 font-mono tracking-wide">{formUpiId}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 w-full">
            <button type="button" disabled={!displayQr} onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 py-3 rounded-xl border border-slate-200 text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="w-4 h-4" /> Download
            </button>
            <button type="button" disabled={!displayQr} onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 bg-[#c5a880] hover:bg-[#b0936b] text-white py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {mode === 'EDIT' && (
          <form onSubmit={handleSave} className="flex flex-col gap-5 text-left border-t border-slate-100 pt-6">
            
            {/* Custom QR Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                Upload Custom QR <span className="text-[9px] text-[#c5a880] font-bold bg-[#c5a880]/10 px-2 py-0.5 rounded">(Optional)</span>
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 hover:border-[#c5a880] rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors bg-slate-50 hover:bg-white group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-[#c5a880]/20 flex items-center justify-center transition-colors">
                  <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-[#c5a880]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">{uploadedQrUrl ? 'Change Custom QR Image' : 'Click to browse QR Image'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">If uploaded, this will override the UPI ID generator.</span>
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleQrUpload} className="hidden" />
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR GENERATE VIA UPI</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Merchant UPI ID</label>
              <input type="text" value={formUpiId} onChange={e => setFormUpiId(e.target.value)} placeholder="e.g. maraphoto@paytm" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-4 focus:ring-[#c5a880]/10 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Business Display Name</label>
              <input type="text" required value={formBusinessName} onChange={e => setFormBusinessName(e.target.value)} placeholder="e.g. Mara Photo Studio" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-4 focus:ring-[#c5a880]/10 transition-all" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
