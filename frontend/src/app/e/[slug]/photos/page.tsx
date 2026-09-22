'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Key, AlertCircle, Loader, ChevronLeft, ChevronRight, X, Camera, ScanFace, Download, UploadCloud, CheckCircle2, ImagePlus, Video, Sparkles, CheckCircle, RefreshCw, Check, ShieldCheck, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { apiClient } from '../../../../lib/api';

const dbName = 'MeraPhotoDB';
const storeName = 'media_files';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('Server side');
    const request = window.indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getLocalFile = async (id: string): Promise<File | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ? request.result.file : null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('getLocalFile error', e);
    return null;
  }
};

export default function EventPhotosPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [fullMedia, setFullMedia] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [otpVals, setOtpVals] = useState(['', '', '', '']);
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<any>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState('');
  const [isMatchedSuccess, setIsMatchedSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  const resolveMediaUrl = (m: any) => {
    if (!m) return '';
    const url = m.compressedUrl || m.thumbnailUrl || m.url || m.r2Url || '';
    if (url.startsWith('localdb://')) {
      const id = url.replace('localdb://', '');
      if (localUrls[id]) return localUrls[id];
      
      getLocalFile(id).then((file) => {
        if (file) {
          const blobUrl = URL.createObjectURL(file);
          setLocalUrls(prev => ({ ...prev, [id]: blobUrl }));
        }
      });
      return '';
    }
    return url;
  };

  const fetchPhotos = async (eventId: string) => {
    try {
      const res = await apiClient.get(`/media/event/${eventId}`);
      const completed = res.data.media.filter((m: any) => m.processedStatus === 'COMPLETED');
      setMedia(completed);
      setFullMedia(completed);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/event/code/${slug}`);
      setEvent(res.data.event);

      if (res.data.event.accessType === 'PASSWORD' || res.data.event.accessType === 'OTP') {
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

  useEffect(() => {
    fetchEventData();
  }, [slug]);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otpVals];
    newOtp[index] = val;
    setOtpVals(newOtp);
    setPassword(newOtp.join(''));
    if (val && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpVals[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
      setAuthError('Incorrect access code.');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    setIsCapturing(true);
    setAiError('');
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 350);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    const frames: File[] = [];
    
    // Capture 3 frames over 900ms
    for (let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (blob) {
        frames.push(new File([blob], `frame_${i}.jpg`, { type: 'image/jpeg' }));
      }
      if (i < 2) await new Promise(r => setTimeout(r, 300));
    }

    if (frames.length > 0) {
      setSelfiePreview(URL.createObjectURL(frames[0]));
      stopCamera();
      await performAiSearch(frames);
    }
    setIsCapturing(false);
  };

  const performAiSearch = async (files: File[]) => {
    if (!event || files.length === 0) return;
    setAiLoading(true);
    setIsMatchedSuccess(false);
    setAiError('');
    setAiMessage('');
    setSearchProgress(10);
    setSearchStage('Scanning facial geometry & landmark coordinates...');

    const progressTimer = setInterval(() => {
      setSearchProgress(prev => {
        if (prev < 32) {
          setSearchStage('Analyzing 68 facial landmark coordinates...');
          return prev + 4;
        } else if (prev < 68) {
          setSearchStage('Generating 512-D neural facial vector embedding...');
          return prev + 3;
        } else if (prev < 90) {
          setSearchStage('Matching biometric embedding against album photos...');
          return prev + 2;
        }
        return prev;
      });
    }, 180);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });

      const res = await apiClient.post(`/event/${event._id}/face-search`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressTimer);
      setSearchProgress(100);

      const matches = res.data.matches || [];
      const status = res.data.indexingStatus;
      
      setIndexingStatus(status);
      setAiMessage(res.data.message || '');

      if (matches.length === 0) {
        setAiLoading(false);
        setIsMatchedSuccess(false);
        if (status && status.pending > 0) {
           setAiError(`No photos found yet, but ${status.pending} photos are still being indexed.`);
        } else {
           setAiError('Your photos not found in this album. Try a different photo.');
        }
        return;
      }

      setIsMatchedSuccess(true);
      setSearchStage(`Face matched! Found ${matches.length} photo${matches.length > 1 ? 's' : ''}`);

      setTimeout(() => {
        setMedia(matches);
        setIsFiltered(true);
        closeAiModal();
      }, 1200);

      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#c5a880', '#FF6B00', '#10B981', '#3B82F6', '#EC4899'],
        });
      }, 300);
    } catch (err: any) {
      clearInterval(progressTimer);
      setSearchProgress(0);
      setSearchStage('');
      setAiLoading(false);
      setIsMatchedSuccess(false);
      setAiError(err.response?.data?.error || 'Failed to search. Please try a different photo.');
    }
  };

  const handleSelfieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) return;
    await performAiSearch([selfieFile]);
  };

  const closeAiModal = () => {
    stopCamera();
    setAiModalOpen(false);
    setAiError('');
    setSelfieFile(null);
    setSelfiePreview(null);
    setAiTab('upload');
    setSearchProgress(0);
    setSearchStage('');
    setIsMatchedSuccess(false);
    setAiLoading(false);
  };

  // Close search modal on Escape key
  useEffect(() => {
    if (!aiModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAiModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [aiModalOpen]);

  const clearSearch = () => {
    setMedia(fullMedia);
    setIsFiltered(false);
    setSelfieFile(null);
    setSelfiePreview(null);
    setIndexingStatus(null);
    setAiMessage('');
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
          <Loader className="h-8 w-8 animate-spin text-[#FF6B00]" />
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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">{event?.name || 'Private Event'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
            This gallery is {event?.accessType === 'OTP' ? 'OTP' : 'password'} protected.<br />Enter the {event?.accessType === 'OTP' ? 'code' : 'password'} to view the photos.
          </p>

          {authError && (
            <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs flex items-center justify-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {event?.accessType === 'OTP' ? (
            <form onSubmit={handleUnlock} className="flex flex-col gap-6 mt-6">
              <div className="flex justify-center gap-3">
                {otpVals.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 h-16 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                    required
                  />
                ))}
              </div>
              <button type="submit" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 uppercase tracking-widest">
                Verify PIN
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="flex flex-col gap-4 mt-6">
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:bg-white text-center tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20"
              >
                Unlock Gallery
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const currentLightboxMedia = lightboxIndex !== null ? media[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="h-8 max-w-[130px] flex items-center justify-start shrink-0 overflow-hidden">
              <img 
                src={event?.studioId?.logoUrl || '/studio-gold-icon.png'} 
                alt="Logo" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/studio-gold-icon.png';
                }}
                style={{
                  maxHeight: '32px',
                  maxWidth: '130px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
                className="max-h-8 w-auto max-w-[130px] object-contain rounded drop-shadow-sm" 
              />
            </div>
            <span className="text-xs font-extrabold text-[#c5a880] uppercase tracking-wider truncate max-w-[130px]">
              {event?.studioId?.name || 'Gallery'}
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-300" />
            <h1 className="text-sm font-bold text-slate-800 truncate max-w-[120px] sm:max-w-none">{event?.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={mediaTypeFilter}
              onChange={(e) => {
                const type = e.target.value as 'ALL' | 'PHOTO' | 'VIDEO';
                setMediaTypeFilter(type);
                if (type === 'ALL') {
                  setMedia(fullMedia);
                } else {
                  setMedia(fullMedia.filter(m => m.type === type));
                }
              }}
              className="text-xs bg-slate-100 border-none rounded-lg px-2 py-1.5 outline-none cursor-pointer text-slate-700 font-bold hover:bg-slate-200 transition-colors"
            >
              <option value="ALL">All Media</option>
              <option value="PHOTO">Photos</option>
              <option value="VIDEO">Videos</option>
            </select>
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              {media.length} items
            </span>
          </div>
        </div>
      </header>

      {/* Sticky Bottom Action Bar */}
      {fullMedia.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {isFiltered ? (
              <button
                onClick={clearSearch}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-900/20 rounded-2xl py-3.5 px-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Clear Search</span>
              </button>
            ) : (
              <>
                <Link
                  href={`/e/${slug}/scan`}
                  className="flex-1 bg-gradient-to-r from-[#c5a880] to-[#b09672] text-slate-950 shadow-xl shadow-[#c5a880]/20 rounded-2xl py-3.5 px-3 sm:px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <ScanFace className="h-4 w-4 text-slate-950 stroke-[2.5]" />
                  <span>Face Scan</span>
                </Link>

                <button
                  onClick={() => setAiModalOpen(true)}
                  className="bg-slate-900 hover:bg-black text-white shadow-xl rounded-2xl py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  title="Quick Modal Search"
                >
                  <Sparkles className="h-4 w-4 text-[#c5a880]" />
                  <span className="hidden xs:inline">Popup</span>
                </button>
              </>
            )}

            <button
              onClick={handleDownloadClick}
              className="flex-1 bg-[#FF6B00] hover:bg-[#E05E00] text-white shadow-xl shadow-orange-500/20 rounded-2xl py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Masonry Photo Gallery */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {media.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-6">
            {media.map((m, index) => {
              const imgSrc = resolveMediaUrl(m);

              return (
                <div
                  key={m._id}
                  className="smooth-photo-zoom-card break-inside-avoid mb-3 sm:mb-6 shadow-sm hover:shadow-xl border border-slate-200"
                  onClick={() => setLightboxIndex(index)}
                >
                  {m.type === 'VIDEO' ? (
                    <video
                      src={imgSrc}
                      className="w-full h-auto object-cover smooth-zoom-img"
                      controls
                    />
                  ) : (
                    <img
                      src={imgSrc}
                      alt={`Media ${index + 1}`}
                      className="w-full h-auto object-cover smooth-zoom-img"
                      loading="lazy"
                    />
                  )}
                  <div className="photo-card-overlay absolute inset-0 bg-black/10 pointer-events-none" />
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
                <p className="text-sm text-slate-400">We couldn&apos;t find your face in this album. Try uploading a different selfie.</p>
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
            {currentLightboxMedia.type === 'VIDEO' ? (
              <video
                src={resolveMediaUrl(currentLightboxMedia)}
                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={resolveMediaUrl(currentLightboxMedia)}
                alt={`Media ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                draggable={false}
              />
            )}
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
        <div 
          onClick={closeAiModal}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-500 animate-modal-fade-in cursor-pointer safe-bottom"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white p-0 rounded-2xl sm:rounded-[2rem] relative shadow-[0_25px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-y-auto max-h-[90vh] sm:max-h-[92vh] border border-slate-200 transform transition-all animate-modal-slide-up text-slate-800 cursor-default"
          >
            {/* Subtle accent glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-24 bg-gradient-to-b from-[#c5a880]/10 to-transparent blur-3xl rounded-full pointer-events-none" />

            {/* Modal Header */}
            <div className="relative bg-gradient-to-b from-[#faf9f6] to-white border-b border-slate-200 p-4 sm:p-7 pb-4 sm:pb-6 rounded-t-2xl sm:rounded-t-[2rem]">
              <button 
                type="button"
                onClick={closeAiModal} 
                aria-label="Close dialog"
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer z-50 group min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
              </button>
              
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 pr-8 sm:pr-0">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#c5a880]/20 via-[#c5a880]/10 to-[#faf9f6] border border-[#c5a880]/30 shadow-sm flex items-center justify-center shrink-0">
                  <ScanFace className="h-6 w-6 sm:h-7 sm:w-7 text-[#c5a880] animate-gentle-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Find My Photos</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span>Scan face or upload a selfie</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30">AI 512-D</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-7 bg-white rounded-b-2xl sm:rounded-b-[2rem] relative z-10">
              {/* Error message */}
              {aiError && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-start justify-between gap-3 font-semibold shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 animate-pulse text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{aiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiError('')}
                    className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Hidden canvas for camera capture */}
              <canvas ref={canvasRef} className="hidden" />

              {aiLoading || isMatchedSuccess ? (
                /* ── FULL BIOMETRIC AI FACE SCANNING VIEW ── */
                <div className="flex flex-col items-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-500">
                  {/* Biometric Viewport */}
                  <div className={`relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-700 shadow-xl flex items-center justify-center ${
                    isMatchedSuccess 
                      ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)]' 
                      : 'border-[#c5a880] shadow-[0_0_30px_rgba(197,168,128,0.2)]'
                  }`}>
                    {/* Captured / Uploaded Face Image */}
                    {selfiePreview ? (
                      <img 
                        src={selfiePreview} 
                        alt="Face Scan Target" 
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          isMatchedSuccess ? 'brightness-105 contrast-105' : 'brightness-90 contrast-110'
                        }`} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <ScanFace className="w-20 h-20 text-[#c5a880]/40 animate-pulse" />
                      </div>
                    )}

                    {/* Cyber Grid Texture & Scanline Overlay */}
                    <div className="absolute inset-0 biometric-grid-overlay pointer-events-none opacity-60" />
                    <div className="absolute inset-0 biometric-scanline pointer-events-none opacity-40" />

                    {/* Radial Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 pointer-events-none" />

                    {/* ── High-Tech Biometric HUD Overlay ── */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      
                      {/* Outer Rotating Segmented Ring */}
                      <div className={`absolute w-56 h-56 rounded-full border-2 border-dashed transition-all duration-700 ${
                        isMatchedSuccess 
                          ? 'border-emerald-400 scale-105 opacity-100 shadow-[0_0_20px_rgba(52,211,153,0.8)]' 
                          : 'border-[#c5a880]/70 animate-spin-slow opacity-90 shadow-[0_0_15px_rgba(197,168,128,0.4)]'
                      }`} />

                      {/* Inner Rotating Segmented Ring */}
                      <div className={`absolute w-44 h-44 rounded-full border border-dotted transition-all duration-700 ${
                        isMatchedSuccess 
                          ? 'border-emerald-300 scale-100 opacity-95' 
                          : 'border-amber-300/80 animate-spin-reverse-slow opacity-85'
                      }`} />

                      {/* Center Target Crosshairs */}
                      <div className="absolute w-14 h-14 flex items-center justify-center pointer-events-none">
                        <div className={`w-full h-[1.5px] ${isMatchedSuccess ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#c5a880] shadow-[0_0_8px_rgba(197,168,128,0.8)]'}`} />
                        <div className={`h-full w-[1.5px] absolute ${isMatchedSuccess ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#c5a880] shadow-[0_0_8px_rgba(197,168,128,0.8)]'}`} />
                      </div>

                      {/* Concentric Radar Pulse Waves */}
                      {!isMatchedSuccess && (
                        <div className="absolute w-44 h-44 rounded-full border border-[#c5a880]/60 animate-radar-pulse" />
                      )}

                      {/* ── 4 HUD Corner Target Brackets ── */}
                      <div className="absolute inset-3 pointer-events-none">
                        <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -top-3.5 left-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">SCAN_SYS</span>
                        </div>
                        <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -top-3.5 right-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">LIVE●</span>
                        </div>
                        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -bottom-3.5 left-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">512-D</span>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -bottom-3.5 right-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">BIO_LOCK</span>
                        </div>
                      </div>

                      {/* ── Sweeping Holographic Laser Scanner ── */}
                      {!isMatchedSuccess && (
                        <div className="absolute inset-x-0 animate-laser-sweep pointer-events-none z-20">
                          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#e3d8c8] to-transparent shadow-[0_0_16px_rgba(227,216,200,1),0_0_30px_rgba(197,168,128,0.8)]" />
                          <div className="h-14 w-full bg-gradient-to-b from-[#c5a880]/25 to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* ── Facial Landmark Feature Points ── */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-56 h-64 overflow-visible" viewBox="0 0 200 240">
                          <circle cx="68" cy="88" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="132" cy="88" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="58" cy="74" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="78" cy="72" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="122" cy="72" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="142" cy="74" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="100" cy="100" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="120" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="88" cy="122" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="112" cy="122" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="78" cy="148" r="3" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="122" cy="148" r="3" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="144" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="154" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="188" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="65" cy="168" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="135" cy="168" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <path 
                            d="M 68 88 L 100 100 L 132 88 M 100 100 L 100 120 M 88 122 L 100 120 L 112 122 M 78 148 L 100 144 L 122 148 M 78 148 L 100 154 L 122 148 M 100 154 L 100 188 M 65 168 L 100 188 L 135 168" 
                            className={`transition-colors duration-500 fill-none stroke-[1.5] ${
                              isMatchedSuccess ? 'stroke-emerald-400/90' : 'stroke-[#c5a880]/60'
                            }`}
                          />
                        </svg>
                      </div>

                      {/* Top Floating HUD Badges */}
                      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md border border-[#c5a880]/40 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                          <span className={`w-2 h-2 rounded-full ${isMatchedSuccess ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse'}`} />
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-200">
                            {isMatchedSuccess ? 'TARGET LOCKED' : 'AI NEURAL SCAN 512-D'}
                          </span>
                        </div>

                        <div className="bg-black/80 backdrop-blur-md border border-[#c5a880]/40 rounded-full px-3 py-1 text-[10px] font-mono font-black tracking-wider text-[#c5a880] shadow-lg">
                          {isMatchedSuccess ? 'MATCHED' : `${searchProgress}%`}
                        </div>
                      </div>

                      {/* Match Confirmed Overlay */}
                      {isMatchedSuccess && (
                        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.9)] mb-3 animate-bounce">
                            <Check className="w-9 h-9 stroke-[3]" />
                          </div>
                          <h4 className="text-xl font-black text-white tracking-wider drop-shadow-md">FACE IDENTIFIED!</h4>
                          <p className="text-xs text-emerald-300 font-extrabold mt-1">Personal gallery ready</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic High-Tech Progress & Stage Status Card */}
                  <div className="w-full bg-[#faf9f6] border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#c5a880]/8 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c5a880] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#c5a880] animate-pulse" />
                        {isMatchedSuccess ? 'Biometric Match Complete' : 'AI Facial Processing'}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {searchProgress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-300 ease-out rounded-full relative ${
                          isMatchedSuccess 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880]'
                        }`}
                        style={{ width: `${searchProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress-shine" />
                      </div>
                    </div>

                    {/* Stage Description */}
                    <div className="mt-4 flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-sm relative z-10">
                      <div className="w-6 h-6 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 flex items-center justify-center shrink-0">
                        {isMatchedSuccess ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                        ) : (
                          <Loader className="w-3.5 h-3.5 text-[#c5a880] animate-spin" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700 tracking-wide select-none">
                        {searchStage || 'Processing face detection...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab Switcher */}
                  <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-7 border border-slate-200">
                    <button 
                      type="button"
                      onClick={() => { setAiTab('upload'); stopCamera(); setAiError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                        aiTab === 'upload' 
                          ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-white shadow-[0_4px_15px_rgba(197,168,128,0.3)] transform scale-[1.02]' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setAiTab('camera'); setSelfieFile(null); setSelfiePreview(null); setAiError(''); startCamera(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                        aiTab === 'camera' 
                          ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-white shadow-[0_4px_15px_rgba(197,168,128,0.3)] transform scale-[1.02]' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                      }`}
                    >
                      <Camera className="h-4 w-4" />
                      Face Scan
                    </button>
                  </div>

                  {/* Camera View */}
                  {aiTab === 'camera' && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {cameraActive && (
                        <div className="w-full rounded-3xl border-2 border-[#c5a880]/50 overflow-hidden bg-slate-950 relative shadow-[0_0_30px_rgba(197,168,128,0.25)] group">
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
                            className="w-full h-auto max-h-[50vh] object-contain scale-x-[-1] opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
                          />
                          
                          {/* Shutter flash effect */}
                          {shutterFlash && (
                            <div className="absolute inset-0 bg-white z-50 animate-shutter-flash pointer-events-none" />
                          )}

                          {/* Face guide overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-40 sm:w-56 h-40 sm:h-56 border-2 border-[#c5a880] rounded-full border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-500 group-hover:scale-105" />
                            {/* Scanning laser */}
                            <div className="absolute w-40 sm:w-56 h-0.5 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent animate-scan-laser shadow-[0_0_12px_rgba(197,168,128,0.9)]" />
                          </div>
                          <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 text-center animate-pulse">
                            <span className="text-[9px] sm:text-[10px] tracking-widest text-white font-mono font-bold bg-black/80 backdrop-blur-md px-3 sm:px-6 py-1 sm:py-2 rounded-full border border-white/20 shadow-lg">
                              ALIGN FACE IN CIRCLE
                            </span>
                          </div>
                        </div>
                      )}

                      {!cameraActive && (
                        <div className="rounded-3xl bg-[#faf9f6] border border-slate-200 p-10 flex flex-col items-center justify-center gap-4 text-center w-full">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center animate-pulse border border-slate-200">
                            <Video className="h-8 w-8 text-[#c5a880]" />
                          </div>
                          <p className="text-sm text-slate-600 font-bold">Initializing Camera...</p>
                        </div>
                      )}

                      {cameraActive && (
                        <button 
                          type="button"
                          onClick={captureFromCamera} 
                          disabled={isCapturing}
                          className="w-full bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-110 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all duration-300 shadow-[0_8px_30px_rgba(197,168,128,0.4)] hover:shadow-[0_8px_40px_rgba(197,168,128,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {isCapturing ? (
                            <>
                              <Loader className="h-5 w-5 animate-spin text-slate-950" />
                              <span>Scanning & Analyzing Face...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-5 w-5 text-slate-950" />
                              <span>Capture Photo & Scan Face</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Upload View */}
                  {aiTab === 'upload' && (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {selfieFile && selfiePreview ? (
                        <div className="flex flex-col items-center gap-6">
                          {/* Preview */}
                          <div className="relative w-full group">
                            <div className="w-full rounded-3xl border-2 border-[#c5a880]/50 overflow-hidden bg-black/40 flex items-center justify-center shadow-xl relative">
                              <img src={selfiePreview} alt="Selfie Preview" className="w-full h-auto max-h-[300px] object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} 
                              className="absolute top-4 right-4 bg-black/75 backdrop-blur-md hover:bg-black text-white p-2.5 rounded-xl transition-all duration-300 shadow-xl border border-white/20 hover:scale-110 hover:text-rose-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="w-full space-y-4">
                            <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()} 
                              className="w-full text-xs text-[#c5a880] hover:text-white font-bold py-2 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Remove & choose another photo
                            </button>

                            {/* Search button */}
                            <button 
                              type="button"
                              onClick={() => performAiSearch([selfieFile])} 
                              className="relative w-full bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-110 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all duration-300 shadow-[0_8px_30px_rgba(197,168,128,0.4)] hover:shadow-[0_8px_40px_rgba(197,168,128,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden group"
                            >
                              <span className="relative flex items-center gap-2.5 z-10 tracking-wide">
                                <Sparkles className="h-5 w-5 text-slate-950 group-hover:animate-pulse" />
                                <span>Search Matches with AI</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (                          <div className={`w-full min-h-[260px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-4 p-8 relative overflow-hidden group ${
                            isDragOver 
                              ? 'border-[#c5a880] bg-[#c5a880]/10 scale-[1.01]' 
                              : 'border-slate-300 bg-[#faf9f6] hover:border-[#c5a880] hover:bg-[#c5a880]/5'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-[#c5a880]/8 to-transparent opacity-0 transition-opacity duration-500 ${isDragOver ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                          
                          <div className={`w-16 h-16 rounded-2xl bg-white border shadow-sm flex items-center justify-center relative z-10 transition-all duration-500 ${isDragOver ? 'border-[#c5a880] shadow-md scale-110' : 'border-slate-200 group-hover:scale-110 group-hover:border-[#c5a880]/50 group-hover:shadow-md'}`}>
                            <Upload className="h-7 w-7 text-[#c5a880]" />
                          </div>
                          
                          <div className="text-center relative z-10">
                            <p className="text-sm font-black text-slate-700 transition-colors group-hover:text-slate-900">
                              {isDragOver ? 'Drop your photo here!' : 'Drag & drop your photo here'}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1.5 tracking-wide">
                              or click to browse • JPG, PNG, WebP supportedclick to browse • JPG, PNG, WebP supported
                            </p>
                          </div>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                  )}
                </>
              )}

              {/* Privacy note */}
              <div className="mt-7 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Your photo is encrypted and never stored permanently</span>
              </div>

              {/* Indexing Status Banner */}
              {indexingStatus && indexingStatus.pending > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-amber-200">
                    <Loader className="w-5 h-5 text-[#c5a880] animate-spin" />
                  </div>
                  <div className="mt-0.5">
                    <h4 className="text-sm font-bold text-amber-800">Photo indexing in progress</h4>
                    <p className="text-xs font-medium text-amber-600 mt-1 leading-relaxed">
                      {indexingStatus.pending} photos are still being processed. Check back soon to find more matches!
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Cancel / Close button */}
              <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={closeAiModal}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <X className="h-4 w-4 text-slate-400" />
                  <span>Cancel / Close</span>
                </button>
              </div>
            </div>
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
                <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] text-center"
                  />
                  <button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Verify & Download
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'MOBILE' && (
              <>
                <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] text-center"
                  />
                  <button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Send OTP
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'OTP' && (
              <>
                <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-3 mt-2">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold tracking-[0.5em] focus:border-[#FF6B00] text-center"
                  />
                  <button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                    Verify OTP
                  </button>
                </form>
              </>
            )}

            {downloadAuthStep === 'DOWNLOADING' && (
              <div className="py-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <svg className="animate-spin w-full h-full text-orange-100" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75 text-[#FF6B00]" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#FF6B00]">
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
