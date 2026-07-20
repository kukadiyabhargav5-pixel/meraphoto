'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../DashboardContext';
import { Download, Share2, Upload, CheckCircle, QrCode, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PaymentQRPage() {
  const context = useDashboard();
  if (!context) return null;
  const { studio, setStudio, successMsg, setSuccessMsg, errorMsg, setErrorMsg } = context;

  // VIEW = show only QR | UPLOAD = show upload form
  const [mode, setMode] = useState<'VIEW' | 'UPLOAD'>('UPLOAD');
  const [loading, setLoading] = useState(false);
  const [uploadedQrUrl, setUploadedQrUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(''); // local preview before save
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved QR from studio
  useEffect(() => {
    if (studio?.paymentDetails?.uploadedQrUrl) {
      setUploadedQrUrl(studio.paymentDetails.uploadedQrUrl);
      setMode('VIEW');
    } else {
      setMode('UPLOAD');
    }
  }, [studio]);

  // Auto-hide success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, setSuccessMsg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.put('/studio/me', {
        paymentDetails: {
          uploadedQrUrl: previewUrl,
          upiId: studio?.paymentDetails?.upiId || '',
          merchantName: studio?.paymentDetails?.merchantName || '',
        }
      });
      if (res.data?.studio) setStudio(res.data.studio);
      setUploadedQrUrl(previewUrl);
      setPreviewUrl('');
      setSuccessMsg('QR Code saved successfully!');
      setMode('VIEW');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!uploadedQrUrl) return;
    try {
      const a = document.createElement('a');
      a.href = uploadedQrUrl;
      a.download = 'Payment_QR.png';
      a.click();
    } catch {
      toast.error('Could not download QR code.');
    }
  };

  const handleShare = async () => {
    if (!uploadedQrUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Payment QR Code', url: uploadedQrUrl });
      } catch {}
    } else {
      toast.error('Sharing not supported on this browser.');
    }
  };

  const handleChangeQR = () => {
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMode('UPLOAD');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-10 flex items-start md:items-center justify-center min-h-full font-poppins">

      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 text-emerald-700 text-sm font-bold px-6 py-4 rounded-xl flex items-center gap-3 border border-emerald-200 shadow-2xl animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-50 text-red-700 text-sm font-bold px-6 py-4 rounded-xl flex items-center gap-3 border border-red-200 shadow-2xl animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="w-full max-w-sm">

        {/* ===================== VIEW MODE ===================== */}
        {mode === 'VIEW' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
            {/* Top bar with Change QR button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#c5a880]/10 rounded-lg">
                  <QrCode className="w-4 h-4 text-[#c5a880]" />
                </div>
                <span className="text-sm font-bold text-slate-700">Payment QR</span>
              </div>
              <button
                onClick={handleChangeQR}
                className="flex items-center gap-1.5 text-xs font-bold text-[#9c7c56] bg-[#c5a880]/10 hover:bg-[#c5a880]/20 px-3 py-1.5 rounded-lg transition-all border border-[#c5a880]/20 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Change QR
              </button>
            </div>

            {/* QR Code — only this, nothing else */}
            <div className="flex flex-col items-center px-8 py-10 gap-6">
              <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#c5a880]/30 shadow-inner">
                <img
                  src={uploadedQrUrl}
                  alt="Payment QR Code"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                />
              </div>

              {/* Download + Share */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#c5a880] hover:bg-[#b0936b] text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== UPLOAD MODE ===================== */}
        {mode === 'UPLOAD' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#c5a880]/10 rounded-lg">
                  <QrCode className="w-4 h-4 text-[#c5a880]" />
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">Upload Payment QR</h1>
              </div>
              <p className="text-xs text-slate-400 font-medium ml-8">Upload your bank / UPI QR code image</p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 hover:border-[#c5a880] rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all bg-slate-50 hover:bg-[#c5a880]/[0.02] group"
              >
                {previewUrl ? (
                  // Show preview of selected file
                  <>
                    <img
                      src={previewUrl}
                      alt="QR Preview"
                      className="w-40 h-40 object-contain rounded-xl border border-slate-200"
                    />
                    <span className="text-xs font-bold text-[#c5a880] uppercase tracking-wider">Click to change</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-[#c5a880]/10 flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#c5a880] transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">Click to upload QR image</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — Max 10MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Save button — only active if file selected */}
              <button
                onClick={handleSave}
                disabled={!previewUrl || loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  'Save QR Code'
                )}
              </button>

              {/* Cancel (only if QR already saved before) */}
              {uploadedQrUrl && (
                <button
                  onClick={() => { setPreviewUrl(''); setMode('VIEW'); }}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
