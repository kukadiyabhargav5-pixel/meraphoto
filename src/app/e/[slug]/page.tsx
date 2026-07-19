'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, Copy, ZoomIn, Play, ShieldCheck, RefreshCw, ScanFace, ChevronRight, ChevronLeft, LayoutGrid, Sliders, X, Download, Loader, Sparkles, CalendarDays, Lock, Key, AlertCircle, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { MasonryPhotoAlbum, RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import "react-photo-album/rows.css";

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

export default function ClientGallery() {
  const params = useParams();
  const slug = params.slug as string;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Gallery view configurations
  const [viewType, setViewType] = useState<'grid' | 'masonry' | 'timeline'>('masonry');
  
  // Selfie Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'upload' | 'camera'>('upload');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState('');
  
  // Search Matches State
  const [searchActive, setSearchActive] = useState(false);
  const [matchedMedia, setMatchedMedia] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<{ totalSearched: number; message: string } | null>(null);

  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  const resolveMediaUrl = (m: any) => {
    if (!m) return '';
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
  };

  // Lightbox / Detail view
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Selection for bulk downloads
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  // Drag & Drop state
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchGalleryMedia = async (eventId: string) => {
    try {
      const res = await apiClient.get(`/media/event/${eventId}`);
      setMedia(res.data.media);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/event/code/${slug}`);
      setEvent(res.data.event);
      
      if (res.data.event.accessType === 'PASSWORD') {
        setIsLocked(true);
      } else {
        fetchGalleryMedia(res.data.event._id);
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

  // Clean up selfie preview URL on unmount
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!selectedItem) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
        return;
      }
      
      const galleryMedia = searchActive ? matchedMedia : media;
      const currentIndex = galleryMedia.findIndex(m => m._id === selectedItem._id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' && currentIndex < galleryMedia.length - 1) {
        setSelectedItem(galleryMedia[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedItem(galleryMedia[currentIndex - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, searchActive, matchedMedia, media]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await apiClient.post(`/event/code/${slug}/verify-password`, { password });
      setIsLocked(false);
      fetchGalleryMedia(event._id);
    } catch (err: any) {
      setAuthError('Incorrect gallery password.');
    }
  };

  // ── Camera handling ──────────────────────
  const startWebcam = async () => {
    setSearchTab('camera');
    setSearchError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setWebcamStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setSearchError('Could not access camera. Please allow camera permissions or upload a photo instead.');
      setSearchTab('upload');
    }
  };

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          setSelfieFile(file);
          setSelfiePreview(URL.createObjectURL(file));
          stopWebcam();
          setSearchTab('upload'); // Switch to upload tab to show preview
        }
      }, 'image/jpeg', 0.92);
    }
  };

  // ── File upload handling ──────────────────
  const handleSelfieUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const clearSelfie = () => {
    setSelfieFile(null);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    setSearchError('');
  };

  // ── AI Search ──────────────────────────
  const handleAISearch = async () => {
    if (!selfieFile || !event) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchProgress(0);
    setSearchStage('Detecting face in your photo...');
    
    const formData = new FormData();
    formData.append('selfie', selfieFile);

    // Simulate progress stages
    const progressTimer = setInterval(() => {
      setSearchProgress(prev => {
        if (prev < 30) {
          setSearchStage('Detecting face in your photo...');
          return prev + 3;
        } else if (prev < 60) {
          setSearchStage('Generating facial embedding...');
          return prev + 2;
        } else if (prev < 85) {
          setSearchStage('Matching against album photos...');
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const res = await apiClient.post(`/ai/search/${event._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressTimer);
      setSearchProgress(100);
      setSearchStage('Complete!');

      const matches = res.data.matches || [];
      setMatchedMedia(matches);
      setSearchStats({
        totalSearched: res.data.totalSearched || 0,
        message: res.data.message || '',
      });
      setSearchActive(true);

      // Close modal after a brief success moment
      setTimeout(() => {
        setSearchModalOpen(false);
        clearSelfie();
        setSearchProgress(0);
        setSearchStage('');
      }, 600);

      if (matches.length > 0) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#2563EB', '#22D3EE', '#8B5CF6', '#EC4899', '#F59E0B'],
          });
        }, 300);
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setSearchProgress(0);
      setSearchStage('');
      
      const errorMsg = err.response?.data?.error || 'AI Face Search failed. Please try again.';
      setSearchError(errorMsg);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchActive(false);
    setMatchedMedia([]);
    setSearchStats(null);
  };

  const toggleSelectMedia = (id: string) => {
    if (selectedMediaIds.includes(id)) {
      setSelectedMediaIds(selectedMediaIds.filter((mid) => mid !== id));
    } else {
      setSelectedMediaIds([...selectedMediaIds, id]);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedMediaIds.length === 0) return;
    try {
      const res = await apiClient.post('/media/download-bulk', { mediaIds: selectedMediaIds });
      const downloads = res.data.downloads || [];
      for (const d of downloads) {
        window.open(d.url, '_blank');
      }
      setSelectedMediaIds([]);
      setIsMultiSelect(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJumpToTimestamp = (sec: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = sec;
      playerRef.current.play();
    }
  };

  const closeSearchModal = () => {
    stopWebcam();
    setSearchModalOpen(false);
    setSearchError('');
    setSearchProgress(0);
    setSearchStage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  // 1. Password Lock Page
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-6 relative">
        
        <div className="w-full max-w-md glass-panel bg-white border-slate-200 p-8 rounded-3xl text-center shadow-lg relative z-10">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-5 w-5 text-[#FF6B00]" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{event?.name || 'Private Event'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2">This gallery is password protected. Enter the password below to access the memories.</p>

          {authError && (
            <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs flex items-center justify-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4 mt-6">
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:bg-white text-center tracking-wider" />
            </div>
            <button type="submit" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20">
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  const galleryMedia = searchActive ? matchedMedia : media;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative selection:bg-orange-500 selection:text-white">
      {/* Whitelabel Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <span className="font-extrabold text-sm tracking-widest text-[#FF6B00] uppercase">
                {event?.studioId?.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <span>{event?.name}</span>
            <span className="h-4 w-[1px] bg-slate-200" />
            <span>{new Date(event?.date).toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Hero Banner Cover */}
      <div className="h-72 w-full relative overflow-hidden">
        {event?.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="Cover" className="w-full h-full object-cover brightness-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#000053] via-slate-900 to-slate-950 brightness-75" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#F8FAFC] to-transparent h-48" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 max-w-7xl mx-auto">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-[#FF6B00] text-white px-2.5 py-1 rounded-full w-max shadow-md mb-3">
            {event?.type}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-800">{event?.name}</h1>
          <p className="text-xs text-slate-500 font-semibold mt-2 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[#FF6B00]" />
            {event?.location || 'Studio Photography Session'}
          </p>
        </div>
      </div>

      {/* Gallery Controls bar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">


          {searchActive && searchStats && (
            <span className="text-xs text-slate-400 font-semibold ml-4">
              Scanned {searchStats.totalSearched} face(s) in album
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {searchActive && (
            <button onClick={clearSearch} className="text-xs text-rose-600 hover:text-rose-500 font-bold underline flex items-center gap-1">
              <X className="h-3.5 w-3.5" />
              Clear AI Results
            </button>
          )}

          {isMultiSelect ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold">Selected: <strong>{selectedMediaIds.length}</strong></span>
              <button onClick={handleBulkDownload} disabled={selectedMediaIds.length === 0} className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                <Download className="h-3.5 w-3.5" />
                Download Selected
              </button>
              <button onClick={() => { setIsMultiSelect(false); setSelectedMediaIds([]); }} className="text-xs text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setIsMultiSelect(true)} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-3.5 py-2 hover:bg-slate-50 transition-colors shadow-sm font-semibold">
              Select Multiple
            </button>
          )}
        </div>
      </div>

      {/* Gallery Items Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {galleryMedia.length > 0 ? (
          <div>
            {searchActive && (
              <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-100 text-[#FF6B00] p-5 rounded-2xl text-sm font-semibold flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center shrink-0">
                  <ScanFace className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">Found {galleryMedia.length} matching photo{galleryMedia.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-[#FF6B00] mt-0.5 font-medium">AI matched your face across the entire album. Photos are sorted by similarity.</p>
                </div>
              </div>
            )}

            {viewType === 'masonry' ? (
               <MasonryPhotoAlbum 
                 photos={galleryMedia.map(m => ({
                    src: resolveMediaUrl(m),
                    width: m.width || (m.type === 'VIDEO' ? 1920 : 1600),
                    height: m.height || (m.type === 'VIDEO' ? 1080 : 1200),
                    key: m._id,
                    media: m
                 }))}
                 columns={(containerWidth) => {
                   if (containerWidth < 400) return 2;
                   if (containerWidth < 700) return 3;
                   if (containerWidth < 1000) return 5;
                   return 6;
                 }}
                 spacing={16}
                 render={{
                   wrapper: ({ style, children, ...rest }, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <div 
                         {...rest} 
                         style={{ ...style, overflow: 'hidden', borderRadius: '0.75rem' }} 
                         className={`group relative transition-all duration-300 bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#FF6B00] ring-4 ring-[#FF6B00]/20 shadow-lg scale-95' : 'border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: ({ style, className, ...rest }) => (
                     <img 
                       {...rest} 
                       style={{ ...style, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                       className={`${className} group-hover:scale-110 object-cover`} 
                     />
                   ),
                   extras: (_, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <>
                         {/* Video overlay */}
                         {m.type === 'VIDEO' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none z-10">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                               <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                             </div>
                           </div>
                         )}

                         {/* Similarity badge */}
                         {searchActive && m.similarityPercent && (
                           <div className="absolute top-3 left-3 z-20">
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border flex items-center gap-1 ${
                               m.confidence === 'HIGH' 
                                 ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                                 : 'bg-amber-500/90 border-amber-400/50 text-white'
                             }`}>
                               <ShieldCheck className="h-3 w-3" />
                               {m.similarityPercent}% match
                             </div>
                           </div>
                         )}

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'border-white/40 bg-black/10'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 cursor-pointer z-30" onClick={() => setSelectedItem(m)}>
                             <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-105 transition-transform">
                               <ZoomIn className="h-4.5 w-4.5" />
                             </div>
                           </div>
                         )}
                       </>
                     );
                   }
                 }}
               />
            ) : (
               <RowsPhotoAlbum 
                 photos={galleryMedia.map(m => ({
                    src: resolveMediaUrl(m),
                    width: m.width || (m.type === 'VIDEO' ? 1920 : 1600),
                    height: m.height || (m.type === 'VIDEO' ? 1080 : 1200),
                    key: m._id,
                    media: m
                 }))}
                 targetRowHeight={140}
                 spacing={16}
                 render={{
                   wrapper: ({ style, children, ...rest }, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <div 
                         {...rest} 
                         style={{ ...style, overflow: 'hidden', borderRadius: '0.75rem' }} 
                         className={`group relative transition-all duration-300 bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#FF6B00] ring-4 ring-[#FF6B00]/20 shadow-lg scale-95' : 'border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: ({ style, className, ...rest }) => (
                     <img 
                       {...rest} 
                       style={{ ...style, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                       className={`${className} group-hover:scale-110 object-cover`} 
                     />
                   ),
                   extras: (_, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <>
                         {/* Video overlay */}
                         {m.type === 'VIDEO' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none z-10">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                               <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                             </div>
                           </div>
                         )}

                         {/* Similarity badge */}
                         {searchActive && m.similarityPercent && (
                           <div className="absolute top-3 left-3 z-20">
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border flex items-center gap-1 ${
                               m.confidence === 'HIGH' 
                                 ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                                 : 'bg-amber-500/90 border-amber-400/50 text-white'
                             }`}>
                               <ShieldCheck className="h-3 w-3" />
                               {m.similarityPercent}% match
                             </div>
                           </div>
                         )}

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'border-white/40 bg-black/10'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 cursor-pointer z-30" onClick={() => setSelectedItem(m)}>
                             <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-105 transition-transform">
                               <ZoomIn className="h-4.5 w-4.5" />
                             </div>
                           </div>
                         )}
                       </>
                     );
                   }
                 }}
               />
            )}
          </div>
        ) : (
          <div className="py-24 text-center glass-panel bg-white border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 max-w-xl mx-auto text-slate-500 shadow-sm">
            <ImageIcon className="h-10 w-10 text-slate-350 mb-3" />
            <h3 className="text-sm font-bold text-slate-600">
              {searchActive ? 'No matching photos found' : 'No media files yet'}
            </h3>
            <p className="text-xs mt-1 font-semibold">
              {searchActive 
                ? 'Try uploading a clearer, well-lit photo of your face. Make sure you are looking directly at the camera.'
                : 'Check back later once uploads are completed.'}
            </p>
            {searchActive && (
              <button onClick={clearSearch} className="mt-4 text-xs text-[#FF6B00] hover:text-[#FF6B00] font-bold flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Action Button ── */}
      <button 
        onClick={() => setSearchModalOpen(true)} 
        className="fixed bottom-8 right-8 z-35 group"
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 bg-orange-500 rounded-2xl animate-ping opacity-20" />
          <div className="relative bg-gradient-to-r from-[#FF6B00] via-[#FF9100] to-[#FF8000] hover:from-[#E05E00] hover:via-[#FF8000] hover:to-[#FF6B00] text-white font-bold px-6 py-4 rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/45 transform hover:-translate-y-0.5 transition-all flex items-center gap-2.5">
            <ScanFace className="h-5 w-5" />
            <span className="text-sm">Find My Photos</span>
            <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </button>

      {/* ── Professional Selfie Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white p-0 rounded-3xl relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[#FF6B00] via-[#FF9100] to-[#FF8000] p-6 pb-8">
              <button 
                onClick={closeSearchModal} 
                className="absolute top-4 right-4 text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <ScanFace className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Find My Photos</h3>
                  <p className="text-xs text-orange-100 font-medium mt-0.5">Upload a photo or scan your face to find all photos you appear in</p>
                </div>
              </div>
            </div>

            <div className="p-6 -mt-3">
              {/* Tab Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
                <button 
                  onClick={() => { setSearchTab('upload'); stopWebcam(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    searchTab === 'upload' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </button>
                <button 
                  onClick={startWebcam}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    searchTab === 'camera' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Face Scan
                </button>
              </div>

              {/* Error message */}
              {searchError && (
                <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Camera View */}
              {searchTab === 'camera' && webcamStream && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-[4/3] rounded-2xl border-2 border-slate-200 overflow-hidden bg-black relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/40 rounded-full" />
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="text-[10px] text-white/70 font-semibold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                        Position your face in the circle
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={capturePhoto} 
                    className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF9100] hover:from-[#E05E00] hover:to-[#FF8000] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4.5 w-4.5" />
                    Capture Photo
                  </button>
                </div>
              )}

              {/* Upload View */}
              {searchTab === 'upload' && (
                <div className="flex flex-col gap-4">
                  {selfieFile && selfiePreview ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* Preview */}
                      <div className="relative w-full">
                        <div className="w-full aspect-[4/3] rounded-2xl border-2 border-orange-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                          <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          onClick={clearSelfie} 
                          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-xl text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="w-full space-y-3">
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="w-full text-xs text-[#FF6B00] hover:text-[#FF6B00] font-bold py-2 flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Remove & choose another
                        </button>

                        {/* Search button with progress */}
                        <button 
                          onClick={handleAISearch} 
                          disabled={searchLoading} 
                          className="relative w-full bg-gradient-to-r from-[#FF6B00] to-[#FF9100] hover:from-[#E05E00] hover:to-[#FF8000] disabled:from-orange-300 disabled:to-orange-450 text-white font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2.5 overflow-hidden"
                        >
                          {/* Progress bar inside button */}
                          {searchLoading && (
                            <div 
                              className="absolute inset-y-0 left-0 bg-white/15 transition-all duration-300 ease-out"
                              style={{ width: `${searchProgress}%` }}
                            />
                          )}
                          <span className="relative flex items-center gap-2.5">
                            {searchLoading ? (
                              <>
                                <Loader className="h-4.5 w-4.5 animate-spin" />
                                <span>{searchStage}</span>
                              </>
                            ) : (
                              <>
                                <Search className="h-4.5 w-4.5" />
                                <span>Search Photos</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Drop zone */
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                        isDragOver 
                          ? 'border-[#FF6B00] bg-orange-50' 
                          : 'border-slate-200 bg-slate-50 hover:border-[#FF6B00] hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-[#FF6B00]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">
                          Drag & drop your photo here
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          or click to browse • JPG, PNG supported
                        </p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleSelfieUploadChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
              )}

              {/* Privacy note */}
              <div className="mt-5 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Your photo is only used for face matching and is never stored permanently.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox - Kept dark for focus on media */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6">
          <div className="flex items-center justify-between w-full absolute top-6 left-0 px-6 z-10 pointer-events-none">
            <div>
              {/* Image name removed per request, but keeping AI match badge if it exists */}
              {selectedItem.similarityPercent && (
                <span className="text-[#FF6B00] font-mono text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto">
                  {selectedItem.similarityPercent}% AI match
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 pointer-events-auto">
              <a href={resolveMediaUrl(selectedItem)} target="_blank" className="bg-white/10 hover:bg-white/20 px-4 py-2 text-white rounded-lg flex items-center gap-2 font-bold text-sm transition-colors border border-white/10">
                <Download className="h-4 w-4" />
                Download
              </a>
              <button onClick={() => setSelectedItem(null)} className="bg-white/10 hover:bg-rose-500/90 px-4 py-2 text-white rounded-lg flex items-center gap-2 font-bold text-sm transition-colors border border-white/10">
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative h-full w-full">
            {/* Previous Button */}
            {galleryMedia.findIndex(m => m._id === selectedItem._id) > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(galleryMedia[galleryMedia.findIndex(m => m._id === selectedItem._id) - 1]); }} 
                className="absolute left-4 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 z-20"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {selectedItem.type === 'PHOTO' ? (
              <img src={resolveMediaUrl(selectedItem)} alt="detailed preview" className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl select-none" />
            ) : (
              <video ref={playerRef} controls src={resolveMediaUrl(selectedItem)} className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl" />
            )}

            {/* Next Button */}
            {galleryMedia.findIndex(m => m._id === selectedItem._id) < galleryMedia.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(galleryMedia[galleryMedia.findIndex(m => m._id === selectedItem._id) + 1]); }} 
                className="absolute right-4 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 z-20"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>

          {selectedItem.type === 'VIDEO' && selectedItem.timestamps && selectedItem.timestamps.length > 0 && (
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 max-w-xl w-full glass-panel border-white/10 bg-black/60 backdrop-blur-md p-5 rounded-2xl text-center z-20">
                <h4 className="text-xs font-bold text-[#FF6B00] uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  AI Matched Timestamps
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedItem.timestamps.map((sec: number) => {
                    const min = Math.floor(sec / 60);
                    const remSec = sec % 60;
                    const displayTime = `${min}:${remSec < 10 ? '0' : ''}${remSec}`;
                    return (
                      <button key={sec} onClick={() => handleJumpToTimestamp(sec)} className="bg-[#FF6B00] hover:bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Play className="h-3 w-3 fill-white" />
                        {displayTime}
                      </button>
                    );
                  })}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
