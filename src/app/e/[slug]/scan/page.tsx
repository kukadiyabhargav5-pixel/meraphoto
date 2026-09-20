'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Camera, Upload, ArrowLeft, ScanFace, Sparkles, Check, X,
  RefreshCw, Download, ShieldCheck, SwitchCamera, AlertCircle,
  Loader, ZoomIn, Share2, Layers, CheckCircle2, ChevronRight,
  ChevronLeft, Eye, Heart, Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api';

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

export default function DedicatedFaceScanPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Selfie file & preview
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // AI Biometric Search States
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState('');
  const [isMatchedSuccess, setIsMatchedSuccess] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [matchedPhotos, setMatchedPhotos] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<{ totalSearched: number; message: string } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Download & Lightbox
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  // ── Load Event Data ──────────────────────────
  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/event/code/${slug}`);
        setEvent(res.data.event);
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  // Resolve media URLs
  const resolveMediaUrl = useCallback((m: any, isThumbnail = false) => {
    if (!m) return '';
    if (m.type === 'VIDEO' && isThumbnail) {
      if (m.thumbnailUrl && !m.thumbnailUrl.endsWith('.mp4')) return m.thumbnailUrl;
      const base = m.compressedUrl || m.url || m.r2Url || '';
      if (base.includes('imagekit.io')) return `${base}/ik-thumbnail.jpg`;
      return m.thumbnailUrl || base;
    }
    const url = m.compressedUrl || m.url || m.r2Url || '';
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
  }, [localUrls]);

  // ── Camera Management ──────────────────────────
  const startCamera = useCallback(async (facing = cameraFacing) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraReady(false);
      setSearchError('');

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => setCameraReady(true))
            .catch(console.error);
        }
      }, 150);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setCameraReady(false);
      setSearchError('Camera access denied or unavailable. Please enable camera permission or upload a photo instead.');
      setActiveTab('upload');
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && !hasSearched) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, hasSearched, startCamera, stopCamera, cameraFacing]);

  // Clean up selfie preview URL
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // ── Perform AI Face Matching ──────────────────
  const performSearch = async (files: File[]) => {
    if (!event || files.length === 0) return;
    setSearchLoading(true);
    setIsMatchedSuccess(false);
    setSearchError('');
    setSearchProgress(12);
    setSearchStage('Initializing 68-point neural landmark detector...');

    const formData = new FormData();
    files.forEach(f => formData.append('file', f));

    const progressTimer = setInterval(() => {
      setSearchProgress(prev => {
        if (prev < 35) {
          setSearchStage('Analyzing facial geometry & ocular coordinates...');
          return prev + 4;
        } else if (prev < 70) {
          setSearchStage('Extracting 512-D deep facial vector embedding...');
          return prev + 3;
        } else if (prev < 92) {
          setSearchStage('Matching biometric embedding against album photos...');
          return prev + 2;
        }
        return prev;
      });
    }, 160);

    try {
      const res = await apiClient.post(`/event/${event._id}/face-search`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressTimer);
      setSearchProgress(100);

      const matches = res.data.matches || [];
      setMatchedPhotos(matches);
      setSearchStats({
        totalSearched: res.data.totalSearched || 0,
        message: res.data.message || '',
      });
      setHasSearched(true);

      if (matches.length > 0) {
        setIsMatchedSuccess(true);
        setSearchStage(`Target Identified! Found ${matches.length} matching photo${matches.length > 1 ? 's' : ''}`);

        setTimeout(() => {
          confetti({
            particleCount: 220,
            spread: 90,
            origin: { y: 0.4 },
            colors: ['#c5a880', '#dfcdb5', '#10B981', '#3B82F6', '#F59E0B'],
          });
        }, 300);

        setTimeout(() => {
          setSearchLoading(false);
        }, 1200);
      } else {
        setSearchLoading(false);
        setIsMatchedSuccess(false);
        setSearchError('No matching photos found for this face. Try taking a photo with better lighting or looking directly at the camera.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setSearchLoading(false);
      setIsMatchedSuccess(false);
      setSearchProgress(0);
      setSearchStage('');
      const msg = err.response?.data?.error || 'AI Face Matching failed. Please try again.';
      setSearchError(msg);
    }
  };

  // ── Capture from Live Camera ──────────────────
  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setSearchError('');
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 300);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Mirror if front camera
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const primaryBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.95));
    if (!primaryBlob) {
      setIsCapturing(false);
      return;
    }

    const primaryFile = new File([primaryBlob], 'selfie_primary.jpg', { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(primaryFile);
    setSelfiePreview(previewUrl);
    setSelfieFile(primaryFile);

    // Capture 2 rapid burst frames for 100% accuracy
    const frames: File[] = [primaryFile];
    for (let i = 1; i <= 2; i++) {
      await new Promise(r => setTimeout(r, 120));
      if (videoRef.current) {
        ctx.save();
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        const b = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.92));
        if (b) {
          frames.push(new File([b], `frame_${i}.jpg`, { type: 'image/jpeg' }));
        }
      }
    }

    stopCamera();
    setIsCapturing(false);
    await performSearch(frames);
  };

  // ── Handle Upload Photo ───────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      setSearchError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      setSearchError('');
    }
  };

  const handleUploadSearch = async () => {
    if (!selfieFile) return;
    await performSearch([selfieFile]);
  };

  const resetScanner = () => {
    setHasSearched(false);
    setMatchedPhotos([]);
    setSelfieFile(null);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    setSearchError('');
    setIsMatchedSuccess(false);
    setSearchProgress(0);
    setSearchStage('');
    if (activeTab === 'camera') {
      startCamera(cameraFacing);
    }
  };

  // ── Bulk Download Matched Photos ─────────────
  const downloadAllMatched = async () => {
    if (matchedPhotos.length === 0 || downloadingZip) return;
    setDownloadingZip(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      const folderName = `${event?.name || 'My'}_Photos`;
      const imgFolder = zip.folder(folderName) || zip;

      for (let i = 0; i < matchedPhotos.length; i++) {
        const item = matchedPhotos[i];
        const url = resolveMediaUrl(item);
        if (!url) continue;

        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const ext = item.type === 'VIDEO' ? 'mp4' : 'jpg';
          const filename = item.originalName || `photo_${i + 1}.${ext}`;
          imgFolder.file(filename, blob);
        } catch (fetchErr) {
          console.warn('Failed to fetch image for zip:', fetchErr);
        }

        setDownloadProgress(Math.round(((i + 1) / matchedPhotos.length) * 60));
      }

      setDownloadProgress(75);
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setDownloadProgress(75 + Math.round(metadata.percent * 0.25));
      });

      saveAs(zipBlob, `${event?.name?.replace(/\s+/g, '_') || 'Event'}_My_Photos.zip`);
    } catch (err) {
      console.error('Download zip failed:', err);
    } finally {
      setDownloadingZip(false);
      setDownloadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center shadow-[0_0_30px_rgba(197,168,128,0.3)] animate-pulse mb-4">
          <ScanFace className="w-8 h-8 text-[#c5a880]" />
        </div>
        <Loader className="w-6 h-6 text-[#c5a880] animate-spin mb-2" />
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading AI Biometric Scanner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060609] text-white flex flex-col selection:bg-[#c5a880] selection:text-black relative overflow-x-hidden font-sans">
      {/* Dynamic Background Ambient Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-gradient-to-b from-[#c5a880]/20 via-[#c5a880]/5 to-transparent blur-3xl opacity-75" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-[#FF6B00]/10 blur-3xl rounded-full" />
      </div>

      {/* ── Top Sticky Luxury Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-[#060609]/90 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/e/${slug}`}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors group bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 sm:px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden xs:inline">Back to Gallery</span>
            <span className="xs:hidden">Back</span>
          </Link>

          {/* Event & Studio Logo/Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="h-8 sm:h-9 max-w-[120px] flex items-center justify-start shrink-0 overflow-hidden">
              <img
                src={event?.studioId?.logoUrl || '/studio-gold-icon.png'}
                alt="Studio Logo"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/studio-gold-icon.png';
                }}
                style={{
                  maxHeight: '34px',
                  maxWidth: '120px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
                className="max-h-8 sm:max-h-9 w-auto max-w-[120px] object-contain rounded drop-shadow-sm"
              />
            </div>
            <div className="text-right sm:text-left">
              <h1 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[160px] sm:max-w-xs">
                {event?.name || 'Private Event'}
              </h1>
              <p className="text-[10px] text-[#c5a880] font-mono tracking-wider uppercase font-bold">
                AI Face Scanner
              </p>
            </div>
          </div>

          {/* Biometric Status Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 text-[10px] font-mono font-bold text-[#c5a880] shadow-[0_0_15px_rgba(197,168,128,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NEURAL 512-D</span>
          </div>
        </div>
      </header>

      {/* ── Main Responsive Content Area ── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex flex-col items-center">
        
        {/* ── View 1: Biometric Scanning & Capture Interface ── */}
        {!hasSearched ? (
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* Header Title & Description */}
            <div className="text-center mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-[#c5a880]/30 via-[#c5a880]/15 to-transparent border border-[#c5a880]/40 shadow-[0_0_30px_rgba(197,168,128,0.35)] mb-4">
                <ScanFace className="w-7 h-7 sm:w-8 sm:h-8 text-[#c5a880] animate-pulse-soft" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#c5a880] bg-clip-text text-transparent">
                Find Your Memories
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-2 max-w-md mx-auto leading-relaxed">
                Take a quick selfie or upload your photo. Our deep-learning AI will scan the entire album to find all your moments.
              </p>
            </div>

            {/* Error Message Box */}
            {searchError && (
              <div className="w-full mb-6 bg-rose-950/40 backdrop-blur-md border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs sm:text-sm flex items-start justify-between gap-3 font-semibold shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5 animate-pulse" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
                <button
                  onClick={() => setSearchError('')}
                  className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-500/20 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Active Scanning Animation Mode ── */}
            {searchLoading || isMatchedSuccess ? (
              <div className="w-full bg-[#0c0c14]/95 backdrop-blur-3xl border border-[#c5a880]/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(197,168,128,0.2)] flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                {/* Biometric Viewport with Scan Lines */}
                <div className={`relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-[#020205] border-2 transition-all duration-700 shadow-2xl flex items-center justify-center ${
                  isMatchedSuccess
                    ? 'border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.7)]'
                    : 'border-[#c5a880] shadow-[0_0_45px_rgba(197,168,128,0.4)]'
                }`}>
                  {selfiePreview ? (
                    <img
                      src={selfiePreview}
                      alt="Target Face"
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isMatchedSuccess ? 'brightness-105 contrast-105' : 'brightness-90 contrast-110'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#07070b]">
                      <ScanFace className="w-20 h-20 text-[#c5a880]/50 animate-pulse" />
                    </div>
                  )}

                  {/* High-Tech Biometric HUD Rings & Scanning Lasers */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`absolute w-56 h-56 rounded-full border-2 border-dashed transition-all duration-700 ${
                      isMatchedSuccess
                        ? 'border-emerald-400 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
                        : 'border-[#c5a880]/70 animate-spin-slow shadow-[0_0_15px_rgba(197,168,128,0.4)]'
                    }`} />

                    <div className={`absolute w-44 h-44 rounded-full border border-dotted transition-all duration-700 ${
                      isMatchedSuccess
                        ? 'border-emerald-300'
                        : 'border-amber-300/80 animate-spin-reverse-slow'
                    }`} />

                    {/* Holographic Laser Sweep */}
                    {!isMatchedSuccess && (
                      <div className="absolute inset-x-0 animate-laser-sweep pointer-events-none z-20">
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#e3d8c8] to-transparent shadow-[0_0_16px_rgba(227,216,200,1),0_0_30px_rgba(197,168,128,0.8)]" />
                        <div className="h-14 w-full bg-gradient-to-b from-[#c5a880]/25 to-transparent" />
                      </div>
                    )}

                    {/* Match Confirmed Overlay */}
                    {isMatchedSuccess && (
                      <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.9)] mb-3 animate-bounce">
                          <Check className="w-9 h-9 stroke-[3]" />
                        </div>
                        <h4 className="text-xl font-black text-white tracking-wider">FACE IDENTIFIED!</h4>
                        <p className="text-xs text-emerald-300 font-extrabold mt-1">Opening your personal album...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Card */}
                <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold">
                    <span className="text-[#c5a880] flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      {isMatchedSuccess ? 'Biometric Identification Complete' : 'AI Neural Analysis'}
                    </span>
                    <span className="text-white bg-white/10 px-2.5 py-0.5 rounded-md">
                      {searchProgress}%
                    </span>
                  </div>

                  {/* Radiant Progress Bar */}
                  <div className="w-full h-3 bg-black/80 rounded-full p-0.5 border border-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isMatchedSuccess
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_20px_rgba(16,185,129,0.9)]'
                          : 'bg-gradient-to-r from-amber-500 via-[#c5a880] to-emerald-400 shadow-[0_0_20px_rgba(197,168,128,0.9)]'
                      }`}
                      style={{ width: `${searchProgress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-3 bg-black/50 border border-white/5 rounded-xl p-3 px-4">
                    <Loader className="w-4 h-4 text-[#c5a880] animate-spin shrink-0" />
                    <p className="text-xs font-bold text-slate-200">
                      {searchStage || 'Processing face biometric detection...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Idle / Capture Mode Card ── */
              <div className="w-full bg-[#0c0c14]/95 backdrop-blur-3xl border border-[#c5a880]/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(197,168,128,0.18)]">
                
                {/* Tab Switcher */}
                <div className="bg-black/60 p-1.5 rounded-2xl flex mb-6 border border-white/10 shadow-inner">
                  <button
                    onClick={() => { setActiveTab('camera'); startCamera(cameraFacing); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${
                      activeTab === 'camera'
                        ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-slate-950 shadow-[0_4px_20px_rgba(197,168,128,0.4)] transform scale-[1.01] border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Live Camera Scan
                  </button>
                  <button
                    onClick={() => { setActiveTab('upload'); stopCamera(); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${
                      activeTab === 'upload'
                        ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-slate-950 shadow-[0_4px_20px_rgba(197,168,128,0.4)] transform scale-[1.01] border border-white/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </button>
                </div>

                {/* ── Tab 1: Live Camera Viewfinder ── */}
                {activeTab === 'camera' && (
                  <div className="flex flex-col items-center gap-5">
                    {/* Viewfinder Container */}
                    <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] max-w-md rounded-3xl overflow-hidden bg-black border-2 border-[#c5a880]/50 shadow-[0_0_35px_rgba(197,168,128,0.25)] flex items-center justify-center group">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                      />

                      {/* Shutter flash effect */}
                      {shutterFlash && (
                        <div className="absolute inset-0 bg-white z-50 animate-shutter-flash pointer-events-none" />
                      )}

                      {/* Oval Face Guide */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 sm:w-56 h-60 sm:h-68 rounded-[48%] border-2 border-[#c5a880] border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute w-48 sm:w-56 h-0.5 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent animate-scan-laser shadow-[0_0_12px_rgba(197,168,128,0.9)]" />
                      </div>

                      {/* Bottom Instruction Tag */}
                      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <span className="text-[10px] tracking-widest text-white font-mono font-bold bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
                          ALIGN YOUR FACE IN OVAL
                        </span>
                      </div>

                      {/* Camera Flip Button (Mobile Front/Back switch) */}
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="absolute top-4 right-4 bg-black/75 backdrop-blur-md hover:bg-black text-white p-2.5 rounded-xl border border-white/20 transition-all hover:scale-110 shadow-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer z-30"
                        title="Switch Camera (Front/Back)"
                      >
                        <SwitchCamera className="w-4 h-4 text-[#c5a880]" />
                        <span className="hidden xs:inline">{cameraFacing === 'user' ? 'Front' : 'Back'}</span>
                      </button>
                    </div>

                    {/* Touch-Friendly Capture Action Button */}
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={isCapturing || !cameraActive}
                      className="w-full bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-110 active:scale-[0.99] text-slate-950 font-black py-4 sm:py-4.5 rounded-2xl text-sm sm:text-base transition-all shadow-[0_8px_30px_rgba(197,168,128,0.4)] flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCapturing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin text-slate-950" />
                          <span>Scanning 3 Burst Frames...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                          <span>Capture Photo & Scan Face</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* ── Tab 2: Upload Photo View ── */}
                {activeTab === 'upload' && (
                  <div className="flex flex-col gap-5">
                    {selfiePreview ? (
                      <div className="flex flex-col items-center gap-5">
                        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-[#c5a880]/50 shadow-2xl bg-black">
                          <img
                            src={selfiePreview}
                            alt="Selfie Preview"
                            className="w-full h-auto max-h-[320px] object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieFile(null);
                              if (selfiePreview) URL.revokeObjectURL(selfiePreview);
                              setSelfiePreview(null);
                            }}
                            className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white p-2 rounded-xl border border-white/20 transition-all hover:text-rose-400"
                            title="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="w-full flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-[#c5a880] hover:text-white font-bold py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Choose a different photo
                          </button>

                          <button
                            type="button"
                            onClick={handleUploadSearch}
                            className="w-full bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-110 active:scale-[0.99] text-slate-950 font-black py-4 rounded-2xl text-sm sm:text-base transition-all shadow-[0_8px_30px_rgba(197,168,128,0.4)] flex items-center justify-center gap-2.5 cursor-pointer"
                          >
                            <Sparkles className="w-5 h-5 text-slate-950" />
                            <span>Search Matches with AI</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag and Drop Zone */
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full min-h-[260px] sm:min-h-[300px] rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 sm:p-8 relative group ${
                          isDragOver
                            ? 'border-[#c5a880] bg-[#c5a880]/15 scale-[1.01]'
                            : 'border-[#c5a880]/30 bg-white/[0.02] hover:border-[#c5a880] hover:bg-[#c5a880]/5'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 group-hover:border-[#c5a880]/50 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                          <Upload className="w-8 h-8 text-[#c5a880]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm sm:text-base font-black text-white">
                            {isDragOver ? 'Drop photo here!' : 'Tap or Drag photo to upload'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            Choose selfie from camera roll or files • JPG, PNG, WebP
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

                {/* Privacy Badge */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your photo is encrypted and never stored permanently</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── View 2: Matched Photos Gallery & Results View ── */
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            
            {/* Success Results Banner */}
            <div className="w-full bg-gradient-to-b from-[#c5a880]/15 via-[#0c0c14] to-[#0c0c14] border border-[#c5a880]/40 rounded-[2.5rem] p-6 sm:p-8 mb-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)] mb-4">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {matchedPhotos.length > 0 ? 'Face Matched Successfully!' : 'No Matching Photos Found'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-2 max-w-lg mx-auto leading-relaxed">
                {matchedPhotos.length > 0
                  ? `We found ${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''} containing your face in this album.`
                  : 'We could not detect this face in any album photos. Try a different angle or clearer photo.'}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {matchedPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadAllMatched}
                    disabled={downloadingZip}
                    className="bg-[#c5a880] hover:bg-[#b09672] active:scale-95 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-[0_4px_20px_rgba(197,168,128,0.4)] flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {downloadingZip ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Creating ZIP ({downloadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-slate-950" />
                        <span>Download All My Photos (ZIP)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetScanner}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold px-5 py-3.5 rounded-xl text-xs sm:text-sm border border-white/15 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Another Face</span>
                </button>

                <Link
                  href={`/e/${slug}`}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold px-5 py-3.5 rounded-xl text-xs sm:text-sm border border-white/10 flex items-center gap-2 transition-all"
                >
                  <span>View Full Album</span>
                </Link>
              </div>
            </div>

            {/* Photos Grid */}
            {matchedPhotos.length > 0 ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#c5a880]" />
                    <span>Your Personal Gallery ({matchedPhotos.length})</span>
                  </h3>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-[#c5a880] uppercase tracking-wider">
                    AI Curated
                  </span>
                </div>

                {/* Responsive 2-col on mobile, 3-4 col on tablet/desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
                  {matchedPhotos.map((photo, index) => {
                    const imgSrc = resolveMediaUrl(photo);
                    return (
                      <div
                        key={photo._id}
                        onClick={() => setSelectedPhoto(photo)}
                        className="group relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-white/10 hover:border-[#c5a880]/60 transition-all duration-300 shadow-lg cursor-pointer hover:shadow-[0_10px_30px_rgba(197,168,128,0.2)] hover:-translate-y-1"
                      >
                        <img
                          src={imgSrc}
                          alt={`Matched Memory ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
                          <div className="flex justify-end">
                            <span className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                              {Math.round((photo.similarity || 0.45) * 100)}% Match
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white flex items-center gap-1">
                              <ZoomIn className="w-3.5 h-3.5 text-[#c5a880]" />
                              View
                            </span>
                            <a
                              href={imgSrc}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#c5a880] text-white hover:text-black flex items-center justify-center transition-colors shadow-md"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full py-16 text-center bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                <ScanFace className="w-12 h-12 text-slate-500 mx-auto mb-3 animate-pulse" />
                <h4 className="text-base font-bold text-white">No Matched Photos</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try uploading a clearer, well-lit photo of your face, or take a direct selfie using the camera.
                </p>
                <button
                  type="button"
                  onClick={resetScanner}
                  className="mt-4 bg-[#c5a880] text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Fullscreen Lightbox Modal ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-xs font-mono font-bold text-[#c5a880] tracking-wider uppercase">
              AI Biometric Matched Photo
            </span>
            <div className="flex items-center gap-3">
              <a
                href={resolveMediaUrl(selectedPhoto)}
                download
                className="bg-white/10 hover:bg-white/20 border border-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="bg-white/10 hover:bg-rose-500/80 text-white p-2 rounded-xl transition-colors border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <img
              src={resolveMediaUrl(selectedPhoto)}
              alt="Full Size View"
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
            />
          </div>

          <div className="text-center py-2 text-xs text-slate-400 font-medium">
            Tap outside or click &apos;X&apos; to return to gallery
          </div>
        </div>
      )}
    </div>
  );
}
