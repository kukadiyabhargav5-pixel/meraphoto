'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Lock, Key, AlertCircle, Loader, ChevronLeft, ChevronRight, X, Camera, ScanFace, Download, UploadCloud, CheckCircle2, ImagePlus, Video } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { apiClient } from '../../../../lib/api';

export default function EventPhotosPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [fullMedia, setFullMedia] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Download State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadAuthStep, setDownloadAuthStep] = useState<'PASSWORD' | 'MOBILE' | 'OTP' | 'DOWNLOADING' | 'SUCCESS'>('PASSWORD');
  const [downloadMobile, setDownloadMobile] = useState('');
  const [downloadOtp, setDownloadOtp] = useState('');
  const [downloadPassword, setDownloadPassword] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // AI Face Search State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [aiTab, setAiTab] = useState<'upload' | 'camera'>('upload');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchEventData();
  }, [slug]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/event/code/${slug}`);
      setEvent(res.data.event);

      if (res.data.event.accessType === 'PASSWORD') {
        setIsLocked(true);
      } else {
        fetchPhotos(res.data.event._id);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Event gallery not found.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (eventId: string) => {
    try {
      const res = await apiClient.get(`/media/event/${eventId}?type=PHOTO`);
      const completed = res.data.media.filter((m: any) => m.processedStatus === 'COMPLETED');
      setMedia(completed);
      setFullMedia(completed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await apiClient.post(`/event/code/${slug}/verify-password`, { password });
      setIsLocked(false);
      fetchPhotos(event._id);
    } catch (err: any) {
      setAuthError('Incorrect gallery password.');
    }
  };

  // --- DOWNLOAD FLOW ---
  const handleDownloadClick = () => {
    if (!event) return;
    if (event.accessType === 'PUBLIC') {
      startBulkDownload();
    } else if (event.accessType === 'PASSWORD') {
      setDownloadAuthStep('PASSWORD');
      setDownloadModalOpen(true);
    } else if (event.accessType === 'OTP') {
      setDownloadAuthStep('MOBILE');
      setDownloadModalOpen(true);
    } else {
      startBulkDownload();
    }
  };

  const handleDownloadAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadError('');

    try {
      if (downloadAuthStep === 'PASSWORD') {
        await apiClient.post(`/event/code/${slug}/verify-password`, { password: downloadPassword });
        startBulkDownload();
      } else if (downloadAuthStep === 'MOBILE') {
        await apiClient.post(`/event/code/${slug}/request-otp`, { mobile: downloadMobile });
        setDownloadAuthStep('OTP');
      } else if (downloadAuthStep === 'OTP') {
        await apiClient.post(`/event/code/${slug}/verify-otp`, { mobile: downloadMobile, otp: downloadOtp });
        startBulkDownload();
      }
    } catch (err: any) {
      setDownloadError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const startBulkDownload = async () => {
    setDownloadAuthStep('DOWNLOADING');
    setDownloadModalOpen(true);
    setDownloadError('');
    setDownloadProgress(0);
    
    try {
      const targetMedia = isFiltered ? media : fullMedia;
      if (targetMedia.length === 0) throw new Error("No photos to download");

      const mediaIds = targetMedia.map(m => m._id);
      const res = await apiClient.post('/media/download-bulk', { mediaIds });
      const downloads = res.data.downloads;

      const zip = new JSZip();
      
      for (let i = 0; i < downloads.length; i++) {
        const item = downloads[i];
        const response = await fetch(item.url);
        const blob = await response.blob();
        zip.file(item.filename || `photo_${i+1}.jpg`, blob);
        setDownloadProgress(Math.round(((i + 1) / downloads.length) * 50));
      }

      setDownloadProgress(60);
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: "STORE", 
      }, (metadata) => {
        setDownloadProgress(60 + Math.round(metadata.percent * 0.4));
      });
      
      saveAs(content, `${event.name.replace(/\s+/g, '_')}_Photos.zip`);
      setDownloadAuthStep('SUCCESS');
      setTimeout(() => {
        setDownloadModalOpen(false);
        setDownloadAuthStep(event.accessType === 'OTP' ? 'MOBILE' : 'PASSWORD');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setDownloadError('Failed to download photos. Please try again.');
      setDownloadAuthStep(event.accessType === 'OTP' ? 'MOBILE' : 'PASSWORD'); 
    }
  };

  // --- AI SEARCH FLOW ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelfieFile(file);
    if (file) {
      setSelfiePreview(URL.createObjectURL(file));
    } else {
      setSelfiePreview(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraActive(true);
      
      // Foolproof fallback to ensure the stream attaches after render
      setTimeout(() => {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => setCameraReady(true)).catch(console.error);
        }
      }, 200);
      
    } catch (err) {
      setAiError('Could not access camera. Please allow camera permission or upload a photo instead.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'face_scan.jpg', { type: 'image/jpeg' });
        setSelfieFile(file);
        setSelfiePreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const performAiSearch = async (file: File) => {
    setAiLoading(true);
    setAiError('');

    try {
      const formData = new FormData();
      formData.append('selfie', file);

      const res = await apiClient.post(`/ai/search/${event._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const matches = res.data.matches || [];
      if (matches.length === 0) {
        setAiError('Your photos not found in this album. Try a different photo.');
        return;
      }

      setMedia(matches);
      setIsFiltered(true);
      closeAiModal();
    } catch (err: any) {
      setAiError(err.response?.data?.error || 'Failed to search. Please try a different photo.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelfieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) return;
    await performAiSearch(selfieFile);
  };

  const closeAiModal = () => {
    stopCamera();
    setAiModalOpen(false);
    setAiError('');
    setSelfieFile(null);
    setSelfiePreview(null);
    setAiTab('upload');
  };

  const clearSearch = () => {
    setMedia(fullMedia);
    setIsFiltered(false);
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  // --- LIGHTBOX FLOW ---
  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === media.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, media.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? media.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, media.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, goNext, goPrev, closeLightbox]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500 font-bold">Loading gallery...</span>
        </div>
      </div>
    );
  }

  if (authError && !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-bold">{authError}</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">{event?.name || 'Private Event'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
            This gallery is password protected.<br />Enter the password to view the photos.
          </p>

          {authError && (
            <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs flex items-center justify-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4 mt-6">
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white text-center tracking-wider"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
            >
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentLightboxMedia = lightboxIndex !== null ? media[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                  {event?.studioId?.name || 'Gallery'}
                </span>
              </div>
            )}
            <span className="h-4 w-px bg-slate-300" />
            <h1 className="text-sm font-bold text-slate-800">{event?.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-bold">
              {media.length} photos
            </span>
          </div>
        </div>
      </header>

      {/* Sticky Bottom Action Bar */}
      {fullMedia.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
            {isFiltered ? (
              <button
                onClick={clearSearch}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-900/20 rounded-2xl py-3.5 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <X className="h-5 w-5" />
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => setAiModalOpen(true)}
                className="flex-1 bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/20 rounded-2xl py-3.5 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ScanFace className="h-5 w-5 text-emerald-400" />
                Find My Photos
              </button>
            )}

            <button
              onClick={handleDownloadClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl py-3.5 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Download className="h-5 w-5" />
              Download All
            </button>
          </div>
        </div>
      )}

      {/* Masonry Photo Gallery */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {media.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
            {media.map((m, index) => {
              const imgSrc = `${m.compressedUrl || m.r2Url}?t=${new Date(m.updatedAt).getTime()}`;

              return (
                <div
                  key={m._id}
                  className="break-inside-avoid mb-6 overflow-hidden rounded-xl cursor-pointer group relative bg-white shadow-sm hover:shadow-md transition-all border border-slate-200"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={imgSrc}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-auto object-cover transition-all duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-4">
            {isFiltered ? (
              <>
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                  <ScanFace className="h-8 w-8 text-rose-400" />
                </div>
                <p className="text-base text-slate-700 font-bold">Your photos not found</p>
                <p className="text-sm text-slate-400">We couldn't find your face in this album. Try uploading a different selfie.</p>
                <button onClick={clearSearch} className="mt-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                  Show All Photos
                </button>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500 font-bold">No photos available yet.</p>
                <p className="text-xs text-slate-400">Photos will appear here once they are processed.</p>
              </>
            )}
          </div>
        )}
      </main>

      {/* ====== FULLSCREEN LIGHTBOX ====== */}
      {lightboxIndex !== null && currentLightboxMedia && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 z-20 pointer-events-none">
            <span className="text-xs sm:text-sm text-white/60 font-mono font-medium tracking-widest pointer-events-auto">
              {lightboxIndex + 1} / {media.length}
            </span>
            <button
              onClick={closeLightbox}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all pointer-events-auto"
              title="Close (Esc)"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="w-full h-full p-4 sm:p-16 flex items-center justify-center relative">
            <img
              src={`${currentLightboxMedia.compressedUrl || currentLightboxMedia.r2Url}?t=${new Date(currentLightboxMedia.updatedAt).getTime()}`}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
              draggable={false}
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all hover:scale-110 backdrop-blur-md z-20"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all hover:scale-110 backdrop-blur-md z-20"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        </div>
      )}

      {/* ====== AI FACE SEARCH MODAL ====== */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={closeAiModal} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10">
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div className="text-center mb-5 mt-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <ScanFace className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Find My Photos</h3>
              <p className="text-sm text-slate-500 mt-1">Upload a photo or scan your face to find all photos you are in.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAiTab('upload'); stopCamera(); setAiError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aiTab === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ImagePlus className="h-4 w-4" /> Upload Photo
              </button>
              <button
                type="button"
                onClick={() => { setAiTab('camera'); setSelfieFile(null); setSelfiePreview(null); setAiError(''); startCamera(); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aiTab === 'camera' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Video className="h-4 w-4" /> Face Scan
              </button>
            </div>

            {aiError && (
              <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold text-center border border-rose-100 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {aiError}
              </div>
            )}

            {/* Hidden canvas for camera capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Upload Tab */}
            {aiTab === 'upload' && (
              <form onSubmit={handleSelfieSubmit} className="flex flex-col gap-4">
                <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group overflow-hidden ${
                  selfiePreview ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200'
                }`}>
                  {selfiePreview ? (
                    <img src={selfiePreview} alt="Preview" className="w-32 h-32 rounded-xl object-cover shadow-md" />
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Tap to upload photo</span>
                      <span className="text-xs text-slate-400">Use a clear photo of your face</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {selfiePreview && (
                  <button type="button" onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="text-xs text-slate-500 hover:text-rose-500 font-bold transition-colors">
                    Remove & choose another
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!selfieFile || aiLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  {aiLoading ? 'Searching...' : 'Search Photos'}
                </button>
              </form>
            )}

            {/* Camera / Face Scan Tab */}
            {aiTab === 'camera' && (
              <div className="flex flex-col gap-4">
                {/* Camera View */}
                {cameraActive && !selfiePreview && (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                    <video
                      ref={(node) => {
                        videoRef.current = node;
                        if (node && streamRef.current && node.srcObject !== streamRef.current) {
                          node.srcObject = streamRef.current;
                          node.play().then(() => setCameraReady(true)).catch(console.error);
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-52 border-2 border-white/40 rounded-[50%]" />
                    </div>
                    {cameraReady && (
                      <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70 font-bold">Position your face in the oval</p>
                    )}
                  </div>
                )}

                {/* Captured preview */}
                {selfiePreview && !cameraActive && (
                  <div className="flex flex-col items-center gap-3">
                    <img src={selfiePreview} alt="Captured" className="w-40 h-40 rounded-xl object-cover shadow-md border-2 border-blue-200" />
                    <button type="button" onClick={() => { setSelfieFile(null); setSelfiePreview(null); startCamera(); }} className="text-xs text-slate-500 hover:text-rose-500 font-bold transition-colors">
                      Retake photo
                    </button>
                  </div>
                )}

                {/* No camera yet */}
                {!cameraActive && !selfiePreview && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
                    <Video className="h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-500 font-bold">Camera starting...</p>
                  </div>
                )}

                {/* Capture Button */}
                {cameraActive && cameraReady && !selfiePreview && (
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    Capture Photo
                  </button>
                )}

                {/* Search Button (after capture) */}
                {selfieFile && selfiePreview && !cameraActive && (
                  <button
                    type="button"
                    onClick={() => performAiSearch(selfieFile)}
                    disabled={aiLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {aiLoading ? <Loader className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                    {aiLoading ? 'Searching...' : 'Search Photos'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== DOWNLOAD AUTH/PROGRESS MODAL ====== */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            {downloadAuthStep !== 'DOWNLOADING' && downloadAuthStep !== 'SUCCESS' && (
              <button onClick={() => setDownloadModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            )}

            {downloadAuthStep === 'PASSWORD' && (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Password Required</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Please enter the event password to download photos.</p>
                {downloadError && <p className="text-xs text-rose-500 font-bold mb-4">{downloadError}</p>}
                <form onSubmit={handleDownloadAuthSubmit} className="flex flex-col gap-4">
                  <input
                    type="password"
                    required
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 text-center"
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Verify & Download
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'MOBILE' && (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
                  <Key className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Verify Mobile</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Enter your mobile number to receive an OTP for downloading.</p>
                {downloadError && <p className="text-xs text-rose-500 font-bold mb-4">{downloadError}</p>}
                <form onSubmit={handleDownloadAuthSubmit} className="flex flex-col gap-4">
                  <input
                    type="tel"
                    required
                    value={downloadMobile}
                    onChange={(e) => setDownloadMobile(e.target.value)}
                    placeholder="Mobile Number (e.g. 9876543210)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 text-center"
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Send OTP
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'OTP' && (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
                  <Key className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Enter OTP</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Enter the OTP sent to {downloadMobile}</p>
                {downloadError && <p className="text-xs text-rose-500 font-bold mb-4">{downloadError}</p>}
                <form onSubmit={handleDownloadAuthSubmit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={downloadOtp}
                    onChange={(e) => setDownloadOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold tracking-[0.5em] focus:border-blue-600 text-center"
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Verify OTP
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'DOWNLOADING' && (
              <div className="py-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <svg className="animate-spin w-full h-full text-blue-100" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75 text-blue-600" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                    {downloadProgress}%
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Preparing Download</h3>
                <p className="text-xs text-slate-500">Zipping {isFiltered ? media.length : fullMedia.length} high-resolution photos...</p>
                <p className="text-[10px] text-slate-400 mt-2">Please keep this page open until the download starts.</p>
              </div>
            )}

            {downloadAuthStep === 'SUCCESS' && (
              <div className="py-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Download Complete</h3>
                <p className="text-sm text-slate-500">Your photos have been saved as a ZIP file.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
