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
  ChevronLeft, Eye, Heart, Image as ImageIcon, Video
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
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const eventRef = useRef<any>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

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
  const [photoSize, setPhotoSize] = useState<'big' | 'huge'>('big');

  // ── Load Event Data ──────────────────────────
  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/event/code/${slug}`);
        setEvent(res.data.event);
        eventRef.current = res.data.event;
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
  const attachStreamToVideo = useCallback((v: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!v) return;
    if (!stream) {
      v.srcObject = null;
      return;
    }
    if (v.srcObject !== stream) {
      v.srcObject = stream;
    }
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', 'true');
    v.setAttribute('webkit-playsinline', 'true');
    v.setAttribute('muted', 'true');

    const p = v.play();
    if (p !== undefined) {
      p.then(() => {
        if (v.videoWidth > 0) {
          setCameraReady(true);
        }
      }).catch(err => {
        console.warn('Play prevented by policy, tap to play:', err);
      });
    }
  }, []);

  const openNativeCamera = useCallback(() => {
    if (nativeCameraInputRef.current) {
      nativeCameraInputRef.current.value = '';
      nativeCameraInputRef.current.click();
    }
  }, []);

  const handleNativeCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSelfiePreview(previewUrl);
      setSelfieFile(file);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraReady(false);
      // Use eventRef.current to avoid stale closure
      const currentEvent = eventRef.current;
      if (currentEvent) {
        performSearchWithEvent([file], currentEvent);
      }
    }
  }, []);

  const startCamera = useCallback(async (forcedFacing?: 'user' | 'environment') => {
    setIsStartingCamera(true);
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        setCameraActive(false);
        setCameraReady(false);
        setSearchError('Live camera requires HTTPS or secure context. Tap "Take Selfie with Phone Camera" below to take your selfie.');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraReady(false);
      setSearchError('');

      const targetFacing = forcedFacing || cameraFacing;

      let stream: MediaStream | null = null;

      // Prioritize front selfie camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e1) {
        console.warn('Constrained getUserMedia failed, trying basic facingMode:', e1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: false,
          });
        } catch (e2) {
          console.warn('FacingMode failed, trying generic video:', e2);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setCameraReady(false);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setSearchError(
        isDenied
          ? 'Camera permission denied. Tap "Take Selfie with Phone Camera" below to snap your selfie directly.'
          : 'Could not connect to live camera. Tap "Take Selfie with Phone Camera" below.'
      );
    } finally {
      setIsStartingCamera(false);
    }
  }, [cameraFacing, attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  const toggleCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (activeTab === 'camera' && !hasSearched) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, hasSearched]);

  // Clean up selfie preview URL
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // ── Perform AI Face Matching ──────────────────
  // Internal search function that accepts event directly to avoid stale closures
  const performSearchWithEvent = async (files: File[], eventData: any) => {
    if (!eventData || files.length === 0) return;
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
      const res = await apiClient.post(`/event/${eventData._id}/face-search`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
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
      const status = err.response?.status;
      let msg = err.response?.data?.error || 'AI Face Matching failed. Please try again.';
      if (status === 503) {
        msg = 'AI Face Recognition service is warming up. Please wait 10 seconds and try again.';
      } else if (!err.response && err.message?.includes('Network Error')) {
        msg = 'Network error: Could not reach the server. Please check your internet connection.';
      }
      setSearchError(msg);
    }
  };

  // Wrapper that uses current event state
  const performSearch = async (files: File[]) => {
    const currentEvent = event || eventRef.current;
    await performSearchWithEvent(files, currentEvent);
  };

  // ── Capture from Live Camera ──────────────────
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || isCapturing) return;

    // Check if video actually has frames ready
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      setSearchError('Camera feed is still initializing. Please wait a moment for the preview to appear.');
      return;
    }

    setIsCapturing(true);
    setSearchError('');
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 300);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Mirror if front camera with proper save/restore
    ctx.save();
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Verify the frame is not completely dark/black (e.g. privacy shutter closed or IR camera selected)
    try {
      const sampleData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let brightnessSum = 0;
      const step = Math.max(1, Math.floor(sampleData.data.length / (4 * 400))); // sample ~400 pixels
      let samples = 0;
      for (let i = 0; i < sampleData.data.length; i += step * 4) {
        brightnessSum += (sampleData.data[i] + sampleData.data[i + 1] + sampleData.data[i + 2]) / 3;
        samples++;
      }
      const avgBrightness = samples > 0 ? brightnessSum / samples : 0;
      if (avgBrightness < 3) {
        setIsCapturing(false);
        setSearchError('The camera preview is pitch black. Please open your webcam privacy shutter, check lighting, or click "Switch Camera".');
        return;
      }
    } catch (e) {
      console.warn('Brightness check skipped:', e);
    }

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
      <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-[#c5a880]/10 border border-[#c5a880]/25 flex items-center justify-center shadow-sm animate-gentle-pulse mb-4">
          <ScanFace className="w-8 h-8 text-[#c5a880]" />
        </div>
        <Loader className="w-6 h-6 text-[#c5a880] animate-spin mb-2" />
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading AI Biometric Scanner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white text-slate-800 flex flex-col selection:bg-[#c5a880] selection:text-white relative overflow-x-hidden font-sans pb-10 safe-bottom">
      {/* Subtle Background Accent */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[350px] bg-gradient-to-b from-[#c5a880]/8 via-[#c5a880]/3 to-transparent blur-3xl opacity-75" />
      </div>

      {/* ── Top Sticky Luxury Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 transition-all">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href={`/e/${slug}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 transition-all bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 sm:px-4 py-2 rounded-xl shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to Gallery</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Event & Studio Logo/Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end sm:justify-start">
            <div className="h-7 sm:h-9 max-w-[80px] sm:max-w-[120px] flex items-center justify-start shrink-0 overflow-hidden">
              <img
                src={event?.studioId?.logoUrl || '/studio-gold-icon.png'}
                alt="Studio Logo"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/studio-gold-icon.png';
                }}
                style={{
                  maxHeight: '32px',
                  maxWidth: '120px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
                className="max-h-7 sm:max-h-9 w-auto max-w-[80px] sm:max-w-[120px] object-contain rounded"
              />
            </div>
            <div className="text-right sm:text-left min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs leading-tight">
                {event?.name || 'Private Event'}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#c5a880] font-mono tracking-wider uppercase font-bold">
                AI Face Scanner
              </p>
            </div>
          </div>

          {/* Biometric Status Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 text-[10px] font-mono font-bold text-[#c5a880] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>NEURAL 512-D</span>
          </div>
        </div>
      </header>

      {/* ── Main Responsive Content Area ── */}
      <main className={`flex-1 w-full mx-auto py-5 sm:py-8 relative z-10 flex flex-col items-center transition-all duration-500 ${
        hasSearched 
          ? 'w-full max-w-full px-3 sm:px-6 md:px-10 lg:px-14 xl:px-16' 
          : 'max-w-xl px-4 sm:px-6'
      }`}>
        
        {/* ── View 1: Biometric Scanning & Capture Interface ── */}
        {!hasSearched ? (
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* Header Title & Description */}
            <div className="text-center mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-3 duration-500 w-full px-2">
              <div className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[#c5a880]/10 border border-[#c5a880]/25 shadow-sm mb-2.5 sm:mb-3">
                <ScanFace className="w-6 h-6 sm:w-7 sm:h-7 text-[#c5a880] animate-gentle-pulse" />
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                Find Your Memories
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 sm:mt-1.5 max-w-sm sm:max-w-md mx-auto leading-relaxed">
                Take a quick selfie or upload a photo to instantly find all your photos in this event album.
              </p>
            </div>

            {/* Error Message Box */}
            {searchError && (
              <div className="w-full mb-4 sm:mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-start justify-between gap-2.5 font-semibold shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
                <button
                  onClick={() => setSearchError('')}
                  className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Active Scanning Animation Mode ── */}
            {searchLoading || isMatchedSuccess ? (
              <div className="w-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col items-center gap-4 sm:gap-6 animate-in zoom-in-95 duration-500">
                {/* Biometric Viewport with Scan Lines */}
                <div className={`relative w-full max-w-[260px] sm:max-w-xs aspect-square sm:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 transition-all duration-700 shadow-xl flex items-center justify-center ${
                  isMatchedSuccess
                    ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                    : 'border-[#c5a880] shadow-[0_0_30px_rgba(197,168,128,0.25)]'
                }`}>
                  {selfiePreview ? (
                    <img
                      src={selfiePreview}
                      alt="Target Face"
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isMatchedSuccess ? 'brightness-105 contrast-105' : 'brightness-95 contrast-105'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <ScanFace className="w-14 h-14 sm:w-16 sm:h-16 text-[#c5a880]/50 animate-pulse" />
                    </div>
                  )}

                  {/* HUD Rings & Scanning Lasers */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border-2 border-dashed transition-all duration-700 ${
                      isMatchedSuccess
                        ? 'border-emerald-400 scale-105'
                        : 'border-[#c5a880]/60 animate-spin-slow'
                    }`} />

                    <div className={`absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-dotted transition-all duration-700 ${
                      isMatchedSuccess
                        ? 'border-emerald-300'
                        : 'border-[#c5a880]/40 animate-spin-reverse-slow'
                    }`} />

                    {/* Laser Sweep */}
                    {!isMatchedSuccess && (
                      <div className="absolute inset-x-0 animate-laser-sweep pointer-events-none z-20">
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c5a880] to-transparent shadow-[0_0_12px_rgba(197,168,128,0.7)]" />
                        <div className="h-8 sm:h-12 w-full bg-gradient-to-b from-[#c5a880]/20 to-transparent" />
                      </div>
                    )}

                    {/* Match Confirmed Overlay */}
                    {isMatchedSuccess && (
                      <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[3px] flex flex-col items-center justify-center p-3 sm:p-5 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-2 animate-bounce">
                          <Check className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white tracking-wider">FACE IDENTIFIED!</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-300 font-extrabold mt-1">Opening your personal album...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Card */}
                <div className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-2.5 text-xs font-mono font-bold">
                    <span className="text-[#c5a880] flex items-center gap-1.5 uppercase tracking-wider text-[10px] sm:text-xs truncate">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      {isMatchedSuccess ? 'Match Complete' : 'AI Neural Analysis'}
                    </span>
                    <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold shrink-0">
                      {searchProgress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 sm:h-3 bg-slate-200 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 rounded-full relative ${
                        isMatchedSuccess
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880]'
                      }`}
                      style={{ width: `${searchProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress-shine" />
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3.5 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3">
                    <Loader className="w-3.5 h-3.5 text-[#c5a880] animate-spin shrink-0" />
                    <p className="text-[11px] sm:text-xs font-bold text-slate-600 leading-snug break-words">
                      {searchStage || 'Processing face biometric detection...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Idle / Capture Mode Card ── */
              <div className="w-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                
                {/* Tab Switcher */}
                <div className="bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex mb-4 sm:mb-6 border border-slate-200 gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('camera'); startCamera(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all duration-300 min-h-[42px] cursor-pointer ${
                      activeTab === 'camera'
                        ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-white shadow-[0_4px_15px_rgba(197,168,128,0.3)]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                    }`}
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Live Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('upload'); stopCamera(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all duration-300 min-h-[42px] cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-gradient-to-r from-[#c5a880] to-[#b09672] text-white shadow-[0_4px_15px_rgba(197,168,128,0.3)]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                    }`}
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {/* ── Tab 1: Live Camera Viewfinder ── */}
                {activeTab === 'camera' && (
                  <div className="flex flex-col items-center gap-4 sm:gap-5">
                    {/* Viewfinder Container */}
                    <div 
                      onClick={() => {
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().then(() => setCameraReady(true)).catch(() => {});
                        }
                      }}
                      className="relative w-full aspect-[4/5] sm:aspect-[4/3] max-h-[52vh] sm:max-h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-[#c5a880]/40 shadow-xl flex items-center justify-center group"
                    >
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && streamRef.current && el.srcObject !== streamRef.current) {
                            attachStreamToVideo(el, streamRef.current);
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          v.play().catch(() => {});
                          if (v.videoWidth > 0) setCameraReady(true);
                        }}
                        onCanPlay={(e) => {
                          const v = e.currentTarget;
                          v.play().catch(() => {});
                          if (v.videoWidth > 0) setCameraReady(true);
                        }}
                        onPlaying={(e) => {
                          const v = e.currentTarget;
                          if (v.videoWidth > 0) setCameraReady(true);
                        }}
                        className={`absolute inset-0 w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                      />

                      {/* Viewfinder States: Selfie Preview vs Starting vs Inactive */}
                      {selfiePreview && !cameraActive ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black overflow-hidden">
                          <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                        </div>
                      ) : !cameraActive ? (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10 p-6 text-center">
                          {isStartingCamera ? (
                            <>
                              <div className="w-12 h-12 rounded-full bg-[#c5a880]/20 border border-[#c5a880]/40 flex items-center justify-center animate-spin">
                                <Loader className="w-6 h-6 text-[#c5a880]" />
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">CONNECTING SELFIE CAMERA...</span>
                              <span className="text-[11px] text-slate-400">Please allow camera permissions if prompted</span>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center mb-1 shadow-md">
                                <Camera className="w-7 h-7 text-[#c5a880]" />
                              </div>
                              <span className="text-xs font-bold text-slate-200">Live Camera Inactive</span>
                              <button
                                type="button"
                                onClick={() => startCamera()}
                                className="bg-gradient-to-r from-[#c5a880] to-[#b09672] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md hover:brightness-105 active:scale-95 transition-all mt-1"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Start Live Camera</span>
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}

                      {/* Shutter flash effect */}
                      {shutterFlash && (
                        <div className="absolute inset-0 bg-white z-50 animate-shutter-flash pointer-events-none" />
                      )}

                      {/* Biometric HUD Corner Brackets */}
                      <div className="absolute top-3 left-3 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-l-2 border-[#c5a880] rounded-tl pointer-events-none z-10 opacity-80" />
                      <div className="absolute top-3 right-28 sm:right-32 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-r-2 border-[#c5a880] rounded-tr pointer-events-none z-10 opacity-80" />
                      <div className="absolute bottom-3 left-3 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-l-2 border-[#c5a880] rounded-bl pointer-events-none z-10 opacity-80" />
                      <div className="absolute bottom-3 right-3 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-r-2 border-[#c5a880] rounded-br pointer-events-none z-10 opacity-80" />

                      {/* Oval Face Guide with Animated Laser */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-36 sm:w-52 h-48 sm:h-64 rounded-[48%] border-2 border-[#c5a880] border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute w-36 sm:w-52 h-0.5 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent animate-scan-laser shadow-[0_0_12px_rgba(197,168,128,0.7)]" />
                      </div>

                      {/* Bottom Instruction Tag */}
                      <div className="absolute bottom-2.5 sm:bottom-3.5 left-0 right-0 text-center pointer-events-none z-20">
                        <span className="text-[9px] sm:text-[10px] tracking-widest text-white font-mono font-bold bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg">
                          ALIGN FACE IN OVAL
                        </span>
                      </div>

                      {/* Camera Switch / Flip Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCamera();
                        }}
                        className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer z-30 min-h-[38px]"
                        title="Switch Camera (Front / Back)"
                      >
                        <SwitchCamera className="w-4 h-4 text-[#c5a880]" />
                        <span>{cameraFacing === 'user' ? 'Front (Selfie)' : 'Back Camera'}</span>
                      </button>
                    </div>

                    {/* Touch-Friendly Capture Action Buttons */}
                    <div className="w-full flex flex-col gap-2.5">
                      {cameraActive ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex gap-2 w-full">
                            <button
                              type="button"
                              onClick={handleCapture}
                              disabled={isCapturing}
                              className="flex-1 bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-105 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all shadow-[0_4px_18px_rgba(197,168,128,0.35)] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer min-h-[48px]"
                            >
                              {isCapturing ? (
                                <>
                                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                  <span>Scanning Face & Matching...</span>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
                                  <span>Capture Selfie & Scan Face</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={openNativeCamera}
                              title="Open phone camera app"
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer min-h-[48px]"
                            >
                              <Camera className="w-5 h-5 text-slate-700" />
                            </button>
                          </div>
                          {/* Dedicated 1-tap mobile phone camera button */}
                          <button
                            type="button"
                            onClick={openNativeCamera}
                            className="sm:hidden w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                          >
                            <Camera className="w-4 h-4 text-[#c5a880]" />
                            <span>Or Open Phone Camera Directly</span>
                          </button>
                        </div>
                      ) : selfiePreview ? (
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                          <button
                            type="button"
                            onClick={() => selfieFile && performSearch([selfieFile])}
                            disabled={searchLoading}
                            className="flex-1 bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-105 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all shadow-[0_4px_18px_rgba(197,168,128,0.35)] flex items-center justify-center gap-2 cursor-pointer min-h-[48px] disabled:opacity-60"
                          >
                            {searchLoading ? (
                              <>
                                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                <span>Scanning Face & Matching...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
                                <span>Scan This Selfie with AI</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieFile(null);
                              setSelfiePreview(null);
                              startCamera();
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                          >
                            <RefreshCw className="w-4 h-4 text-[#c5a880]" />
                            <span>Retake Photo</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                          <button
                            type="button"
                            onClick={openNativeCamera}
                            className="flex-1 bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-105 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all shadow-[0_4px_18px_rgba(197,168,128,0.35)] flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                          >
                            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
                            <span>Take Selfie with Phone Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                          >
                            <RefreshCw className="w-4 h-4 text-[#c5a880]" />
                            <span>Retry Live Webcam</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Tab 2: Upload Photo View ── */}
                {activeTab === 'upload' && (
                  <div className="flex flex-col gap-4">
                    {selfiePreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-sm rounded-xl sm:rounded-2xl overflow-hidden border border-[#c5a880]/30 shadow-md bg-slate-50">
                          <img
                            src={selfiePreview}
                            alt="Selfie Preview"
                            className="w-full h-auto max-h-[260px] sm:max-h-[320px] object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieFile(null);
                              if (selfiePreview) URL.revokeObjectURL(selfiePreview);
                              setSelfiePreview(null);
                            }}
                            className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-600 p-2 rounded-xl border border-slate-200 transition-all hover:text-rose-500 shadow-md min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="w-full flex flex-col gap-2.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-[#c5a880] hover:text-slate-900 font-bold py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Choose a different photo
                          </button>

                          <button
                            type="button"
                            onClick={handleUploadSearch}
                            className="w-full bg-gradient-to-r from-[#c5a880] via-[#dfcdb5] to-[#c5a880] hover:brightness-105 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all shadow-[0_4px_18px_rgba(197,168,128,0.35)] flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                          >
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                            <span>Search Matches with AI</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag and Drop / Mobile Tap Zone */
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full min-h-[190px] sm:min-h-[250px] rounded-xl sm:rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 p-4 sm:p-6 relative group ${
                          isDragOver
                            ? 'border-[#c5a880] bg-[#c5a880]/10 scale-[1.01]'
                            : 'border-slate-300 bg-[#faf9f6] hover:border-[#c5a880] hover:bg-[#c5a880]/5'
                        }`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border border-slate-200 group-hover:border-[#c5a880]/50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                          <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-[#c5a880]" />
                        </div>
                        <div className="text-center px-2">
                          <p className="text-xs sm:text-sm font-black text-slate-800">
                            {isDragOver ? 'Drop photo here!' : 'Tap to Take Selfie or Select Photo'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">
                            JPG, PNG, WebP • Tap camera roll or files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy Badge */}
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-200 flex items-center justify-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center px-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Your photo is encrypted and never stored permanently</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── View 2: Matched Photos Gallery & Results View ── */
          <div className="w-full max-w-full mx-auto flex flex-col items-center animate-in fade-in duration-500">
            
            {/* Success Results Banner - Expansive Full Width Luxury Card */}
            <div className="w-full max-w-4xl lg:max-w-5xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white shadow-md mb-3 sm:mb-4">
                <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {matchedPhotos.length > 0 ? 'Face Matched Successfully!' : 'No Matching Photos Found'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 sm:mt-2 max-w-md mx-auto leading-relaxed px-1">
                {matchedPhotos.length > 0
                  ? `We found ${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''} containing your face in this album.`
                  : 'We could not detect this face in any album photos. Try taking another selfie with good lighting.'}
              </p>

              {/* Action Buttons */}
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 w-full">
                {matchedPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadAllMatched}
                    disabled={downloadingZip}
                    className="w-full sm:w-auto bg-[#c5a880] hover:bg-[#b09672] active:scale-95 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-[0_4px_18px_rgba(197,168,128,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
                  >
                    {downloadingZip ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Creating ZIP ({downloadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                        <span>Download All Photos (ZIP)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetScanner}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold px-5 py-3.5 rounded-xl text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Scan Another Face</span>
                </button>

                <Link
                  href={`/e/${slug}`}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 active:scale-95 text-slate-800 hover:text-slate-950 font-bold px-5 py-3.5 rounded-xl text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all min-h-[46px]"
                >
                  <span>View Full Album</span>
                </Link>
              </div>
            </div>

            {/* Photos Grid */}
            {matchedPhotos.length > 0 ? (
              <div className="w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-8 px-1">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 sm:gap-3">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#c5a880]" />
                    <span>Your Photos ({matchedPhotos.length})</span>
                  </h3>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#c5a880] uppercase tracking-wider bg-[#c5a880]/10 border border-[#c5a880]/25 px-3.5 py-1.5 rounded-full hidden sm:inline-flex">
                      AI Curated
                    </span>

                    {/* Photo Size Switcher */}
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPhotoSize('big')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          photoSize === 'big'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Large photo view"
                      >
                        Big
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoSize('huge')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          photoSize === 'huge'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Extra large photo view"
                      >
                        Extra Big
                      </button>
                    </div>
                  </div>
                </div>

                {/* Big Spacious Responsive Grid */}
                <div className={`w-full grid gap-2.5 sm:gap-6 lg:gap-8 transition-all duration-300 ${
                  photoSize === 'huge'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                }`}>
                  {matchedPhotos.map((photo, index) => {
                    const imgSrc = resolveMediaUrl(photo);
                    return (
                      <div
                        key={photo._id}
                        onClick={() => setSelectedPhoto(photo)}
                        className="smooth-photo-zoom-card group aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-slate-200 cursor-pointer active:scale-[0.98] transition-all bg-slate-100"
                      >
                        <img
                          src={imgSrc}
                          alt={`Matched Memory ${index + 1}`}
                          className="w-full h-full object-cover smooth-zoom-img"
                          loading="lazy"
                          onError={(e) => {
                            const fallback = photo.r2Url || photo.thumbnailUrl || photo.url;
                            if (fallback && e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                        />

                        {/* Smooth Luxury Hover Overlay */}
                        <div className="photo-card-overlay absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
                          <div className="flex justify-end">
                            <span className="bg-white/95 backdrop-blur-md text-slate-900 rounded-full px-3.5 py-1.5 text-xs font-black shadow-lg flex items-center gap-1.5 border border-white/40">
                              <ZoomIn className="w-3.5 h-3.5 text-[#c5a880]" />
                              View Full
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-white drop-shadow-md">
                              Photo #{index + 1}
                            </span>
                            <a
                              href={imgSrc}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-[#c5a880] text-slate-900 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                              title="Download Photo"
                            >
                              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full py-10 sm:py-14 text-center bg-[#faf9f6] border border-slate-200 rounded-2xl p-5 sm:p-8">
                <ScanFace className="w-9 h-9 sm:w-11 sm:h-11 text-slate-400 mx-auto mb-2.5 animate-pulse" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">No Matched Photos</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-sm mx-auto px-2">
                  Try uploading a clearer, well-lit photo of your face, or take a direct selfie with the front camera.
                </p>
                <button
                  type="button"
                  onClick={resetScanner}
                  className="mt-3.5 bg-[#c5a880] text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 safe-bottom">
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#c5a880] tracking-wider uppercase">
              AI Matched Photo
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={resolveMediaUrl(selectedPhoto)}
                download
                className="bg-white/10 hover:bg-white/20 border border-white/15 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="bg-white/10 hover:bg-rose-500/80 text-white p-2 rounded-xl transition-colors border border-white/10 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <img
              src={resolveMediaUrl(selectedPhoto)}
              alt="Full Size View"
              className="max-h-[75vh] sm:max-h-[82vh] max-w-full object-contain rounded-xl sm:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
            />
          </div>

          <div className="text-center py-1 text-[11px] text-slate-400 font-medium">
            Tap outside or click &apos;X&apos; to return
          </div>
        </div>
      )}

      {/* Always-mounted File & Native Camera Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="user"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />
    </div>
  );
}
