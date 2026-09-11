'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, Copy, ZoomIn, Play, ShieldCheck, RefreshCw, ScanFace, ChevronRight, ChevronLeft, ChevronDown, LayoutGrid, Sliders, X, Download, Loader, Sparkles, CalendarDays, Lock, Key, AlertCircle, Search, HelpCircle, Send, CheckCircle, Globe } from 'lucide-react';
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
  const [otpVals, setOtpVals] = useState(['', '', '', '']);
  const [authError, setAuthError] = useState('');

  // Guest Sign-In States
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // Gallery view configurations
  const [viewType, setViewType] = useState<'grid' | 'masonry' | 'timeline'>('masonry');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  
  // Selfie Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'upload' | 'camera'>('upload');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isMatchedSuccess, setIsMatchedSuccess] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState('');
  
  // Search Matches State
  const [searchActive, setSearchActive] = useState(false);
  const [matchedMedia, setMatchedMedia] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<{ totalSearched: number; message: string } | null>(null);

  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  // Ticket / Support State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', mobile: '', complaint: '' });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketMessage, setTicketMessage] = useState({ type: '', text: '' });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketMessage({ type: '', text: '' });
    setTicketSubmitting(true);
    try {
      await apiClient.post('/client-tickets', {
        studioId: event.studioId,
        eventId: event._id,
        customerName: ticketForm.name,
        email: ticketForm.email,
        mobileNumber: ticketForm.mobile,
        complaint: ticketForm.complaint
      });
      setTicketMessage({ type: 'success', text: 'Ticket raised successfully. The studio will get back to you shortly.' });
      setTicketForm({ name: '', email: '', mobile: '', complaint: '' });
      setTimeout(() => setTicketModalOpen(false), 3000);
    } catch (err: any) {
      setTicketMessage({ type: 'error', text: err.response?.data?.error || 'Failed to raise ticket' });
    } finally {
      setTicketSubmitting(false);
    }
  };


  const resolveMediaUrl = (m: any, isThumbnail = false) => {
    if (!m) return '';
    if (m.type === 'VIDEO' && isThumbnail) {
      if (m.thumbnailUrl && !m.thumbnailUrl.endsWith('.mp4')) return m.thumbnailUrl;
      const base = m.compressedUrl || m.url || m.r2Url || '';
      if (base.includes('imagekit.io')) {
        return `${base}/ik-thumbnail.jpg`;
      }
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
      
      if (res.data.event.accessType === 'PASSWORD' || res.data.event.accessType === 'OTP') {
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
    if (typeof window !== 'undefined') {
      const guestStatus = localStorage.getItem(`mara_guest_${slug}`);
      if (guestStatus === 'true') {
        setIsGuest(true);
      }
    }
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
      fetchGalleryMedia(event._id);
    } catch (err: any) {
      setAuthError('Incorrect access code.');
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');
    setGuestSubmitting(true);
    
    if (!guestName.trim() || !guestPhone.trim()) {
      setGuestError('Name and Phone are required.');
      setGuestSubmitting(false);
      return;
    }

    try {
      await apiClient.post(`/visitors/event/code/${slug}`, {
        name: guestName,
        phone: guestPhone,
        email: guestEmail
      });
      
      localStorage.setItem(`mara_guest_${slug}`, 'true');
      setIsGuest(true);
    } catch (err: any) {
      console.error(err);
      setGuestError(err.response?.data?.error || 'Failed to submit details. Please try again.');
    } finally {
      setGuestSubmitting(false);
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

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setSearchError('');
    setIsMatchedSuccess(false);

    // Trigger camera shutter flash effect
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 300);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Capture primary frame
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const primaryBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!primaryBlob) {
      setIsCapturing(false);
      return;
    }

    const primaryFile = new File([primaryBlob], 'selfie_primary.jpg', { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(primaryFile);
    setSelfiePreview(previewUrl);
    setSelfieFile(primaryFile);

    const frames: File[] = [primaryFile];

    // Capture 2 rapid burst frames to improve AI recognition accuracy
    for (let i = 1; i <= 2; i++) {
      await new Promise(r => setTimeout(r, 120));
      if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const b = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (b) {
          frames.push(new File([b], `frame_${i}.jpg`, { type: 'image/jpeg' }));
        }
      }
    }

    stopWebcam();
    setIsCapturing(false);

    // Trigger AI Biometric multi-frame search with scanning animation
    await performMultiFrameSearch(frames);
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
    setIsMatchedSuccess(false);
  };

  // ── AI Search ──────────────────────────
  const performMultiFrameSearch = async (files: File[]) => {
    if (!event || files.length === 0) return;
    setSearchLoading(true);
    setIsMatchedSuccess(false);
    setSearchError('');
    setSearchProgress(10);
    setSearchStage('Scanning facial geometry & landmark coordinates...');
    
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));

    // Realistic multi-stage biometric progress animation
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
      const res = await apiClient.post(`/event/${event._id}/face-search`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressTimer);
      setSearchProgress(100);

      const matches = res.data.matches || [];
      const status = res.data.indexingStatus;
      
      setMatchedMedia(matches);
      setIndexingStatus(status);
      setSearchStats({
        totalSearched: res.data.totalSearched || 0,
        message: res.data.message || '',
      });
      setSearchActive(true);

      if (matches.length > 0) {
        setIsMatchedSuccess(true);
        setSearchStage(`Face matched! Found ${matches.length} photo${matches.length > 1 ? 's' : ''}`);
        
        // Let user see the green biometric lock-in state for 1.2 seconds
        setTimeout(() => {
          setSearchModalOpen(false);
          clearSelfie();
          setSearchProgress(0);
          setSearchStage('');
          setIsMatchedSuccess(false);
          setSearchLoading(false);
        }, 1200);

        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#c5a880', '#FF6B00', '#10B981', '#3B82F6', '#EC4899'],
          });
        }, 300);
      } else {
        setSearchLoading(false);
        setIsMatchedSuccess(false);
        if (status && status.pending > 0) {
          setSearchError(`No photos matched yet, but ${status.pending} photos are still being indexed.`);
        } else {
          setSearchError('No matching photos found. Try scanning with better lighting or looking directly at the camera.');
        }
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setSearchProgress(0);
      setSearchStage('');
      setSearchLoading(false);
      setIsMatchedSuccess(false);
      
      const errorMsg = err.response?.data?.error || 'AI Face Search failed. Please try again.';
      setSearchError(errorMsg);
    }
  };

  const handleAISearch = async () => {
    if (!selfieFile) return;
    await performMultiFrameSearch([selfieFile]);
  };

  const clearSearch = () => {
    setSearchActive(false);
    setMatchedMedia([]);
    setSearchStats(null);
    setIndexingStatus(null);
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
    setSearchLoading(false);
    setIsMatchedSuccess(false);
    setShutterFlash(false);
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
        
        <div className="w-full max-w-md glass-panel bg-white border-slate-200 p-6 sm:p-8 rounded-3xl text-center shadow-lg relative z-10">
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
                    onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\\D/g, ''))}
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
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:bg-white text-center tracking-wider" />
              </div>
              <button type="submit" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20">
                Unlock Gallery
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. Guest Sign-In Page
  if (!isGuest && !isLocked) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] text-[#0F172A] flex flex-col items-center justify-center p-4 sm:p-6 relative">
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] p-6 sm:p-10 rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#fdfbf9] border border-[#c5a880]/20 flex items-center justify-center mx-auto mb-6">
            <User className="h-6 w-6 text-[#c5a880]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">{event?.name || 'Event Gallery'}</h2>
          <p className="text-xs text-[#6b7280] font-medium mt-2 mb-8">Please enter your details to view the album.</p>
          
          <form onSubmit={handleGuestSubmit} className="flex flex-col gap-5 text-left">
            <div>
              <label className="text-[11px] font-bold text-[#4b5563] mb-1.5 block uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-[#e5e7eb] rounded-xl px-4 py-3.5 pl-11 text-sm text-[#111827] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:bg-white transition-all shadow-sm"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9ca3af]" />
              </div>
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-[#4b5563] mb-1.5 block uppercase tracking-wider">Phone Number *</label>
              <div className="relative">
                <input 
                  type="tel" 
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-[#e5e7eb] rounded-xl px-4 py-3.5 pl-11 text-sm text-[#111827] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:bg-white transition-all shadow-sm"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9ca3af]" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#4b5563] mb-1.5 block uppercase tracking-wider">Email Address (Optional)</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-[#e5e7eb] rounded-xl px-4 py-3.5 pl-11 text-sm text-[#111827] focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] focus:bg-white transition-all shadow-sm"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9ca3af]" />
              </div>
            </div>

            {guestError && (
              <div className="mt-2 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 font-semibold shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{guestError}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={guestSubmitting}
              className="mt-6 bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] font-extrabold py-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(197,168,128,0.39)] w-full flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {guestSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Gallery'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const baseGalleryMedia = searchActive ? matchedMedia : media;
  const galleryMedia = baseGalleryMedia.filter(m => mediaTypeFilter === 'ALL' || m.type === mediaTypeFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative selection:bg-orange-500 selection:text-white">
      {/* Whitelabel Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl && (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-10 sm:h-14 max-w-[140px] sm:max-w-[250px] object-contain transition-all hover:opacity-90 drop-shadow-sm rounded" />
            )}
            <span className="font-extrabold text-sm sm:text-base tracking-widest text-[#c5a880] uppercase ml-2">
              {event?.studioId?.name}
            </span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons */}
            <div className="flex items-center gap-2 sm:gap-3 mr-2">
              {event?.studioId?.instagramUrl && (
                <a href={event.studioId.instagramUrl} target="_blank" rel="noreferrer" className="group w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center text-slate-600 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:bg-gradient-to-tr hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 hover:text-white hover:border-transparent transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {event?.studioId?.facebookUrl && (
                <a href={event.studioId.facebookUrl} target="_blank" rel="noreferrer" className="group w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center text-slate-600 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(24,119,242,0.3)] hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {event?.studioId?.customDomain && (
                <a href={`https://${event.studioId.customDomain}`} target="_blank" rel="noreferrer" className="group w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center text-slate-600 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:bg-slate-900 hover:text-white hover:border-transparent transition-all duration-300">
                  <Globe className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold text-slate-500 hidden sm:flex">
              <span className="truncate max-w-[120px] sm:max-w-none">{event?.name}</span>
              <span className="h-4 w-[1px] bg-slate-200" />
              <span>{new Date(event?.date).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Top Action Buttons (Replaced Hero Banner) */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
          <button onClick={() => setSearchModalOpen(true)} className="bg-[#c5a880] hover:bg-[#b09672] text-slate-900 font-extrabold px-6 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(197,168,128,0.39)] flex justify-center items-center gap-2 transition-all">
            <ScanFace className="h-5 w-5" />
            Find My Face
          </button>
          
          <button 
            onClick={async () => {
              try {
                // If the user hasn't selected any, download ALL by mapping media
                const idsToDownload = selectedMediaIds.length > 0 ? selectedMediaIds : media.map(m => m._id);
                if (idsToDownload.length === 0) return;
                const res = await apiClient.post('/media/download-bulk', { mediaIds: idsToDownload });
                const downloads = res.data.downloads || [];
                for (const d of downloads) {
                  window.open(d.url, '_blank');
                }
              } catch (err) {
                console.error(err);
              }
            }} 
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] flex items-center gap-2 transition-all"
          >
            <Download className="h-5 w-5" />
            Download All Images
          </button>
        </div>
      </div>

      {/* Gallery Controls bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-slate-700 font-extrabold hover:border-[#c5a880] cursor-pointer shadow-sm min-w-[140px] transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                {mediaTypeFilter === 'ALL' && <LayoutGrid className="w-4 h-4 text-[#c5a880]" />}
                {mediaTypeFilter === 'PHOTO' && <ImageIcon className="w-4 h-4 text-[#c5a880]" />}
                {mediaTypeFilter === 'VIDEO' && <Video className="w-4 h-4 text-[#c5a880]" />}
                <span>
                  {mediaTypeFilter === 'ALL' && 'All Media'}
                  {mediaTypeFilter === 'PHOTO' && 'Photos'}
                  {mediaTypeFilter === 'VIDEO' && 'Videos'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                  <button 
                    onClick={() => { setMediaTypeFilter('ALL'); setFilterDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors ${mediaTypeFilter === 'ALL' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <LayoutGrid className="w-4 h-4" /> All Media
                  </button>
                  <button 
                    onClick={() => { setMediaTypeFilter('PHOTO'); setFilterDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors ${mediaTypeFilter === 'PHOTO' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> Photos
                  </button>
                  <button 
                    onClick={() => { setMediaTypeFilter('VIDEO'); setFilterDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors ${mediaTypeFilter === 'VIDEO' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Video className="w-4 h-4" /> Videos
                  </button>
                </div>
              </>
            )}
          </div>

          {searchActive && searchStats && (
            <span className="text-xs text-slate-400 font-semibold ml-4">
              Scanned {searchStats.totalSearched} face(s) in album
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
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
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
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
                    src: resolveMediaUrl(m, true),
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
                         style={{ ...style, overflow: 'hidden', borderRadius: '1rem' }} 
                         className={`group relative transition-all duration-500 ease-out bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#c5a880] ring-4 ring-[#c5a880]/20 shadow-lg scale-95' : 'shadow-sm hover:shadow-2xl z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: ({ style, className, ...rest }) => (
                     <img 
                       {...rest} 
                       style={{ ...style, transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
                       className={`${className} group-hover:scale-[1.03] object-cover`} 
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

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#c5a880] border-[#c5a880] text-white shadow-md' : 'border-white/60 bg-black/20 backdrop-blur-sm hover:bg-black/40'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 cursor-pointer z-30" onClick={() => setSelectedItem(m)} />
                         )}
                       </>
                     );
                   }
                 }}
               />
            ) : (
               <RowsPhotoAlbum 
                 photos={galleryMedia.map(m => ({
                    src: resolveMediaUrl(m, true),
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
                         style={{ ...style, overflow: 'hidden', borderRadius: '1rem' }} 
                         className={`group relative transition-all duration-500 ease-out bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#c5a880] ring-4 ring-[#c5a880]/20 shadow-lg scale-95' : 'shadow-sm hover:shadow-2xl z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: ({ style, className, ...rest }) => (
                     <img 
                       {...rest} 
                       style={{ ...style, transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
                       className={`${className} group-hover:scale-[1.03] object-cover`} 
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

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#c5a880] border-[#c5a880] text-white shadow-md' : 'border-white/60 bg-black/20 backdrop-blur-sm hover:bg-black/40'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-[#0f172a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end items-center pb-6 cursor-pointer z-30" onClick={() => setSelectedItem(m)}>
                             <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl hover:bg-white/25 hover:scale-110">
                               <ZoomIn className="h-5 w-5" />
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



      {/* ── Professional Selfie Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-500 animate-fade-in">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl p-0 rounded-[2rem] relative shadow-[0_0_50px_-12px_rgba(197,168,128,0.4)] overflow-y-auto max-h-[90vh] border border-white/40 transform transition-all animate-in zoom-in-95 duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-[#c5a880]/20 to-transparent blur-3xl rounded-full pointer-events-none" />

            {/* Modal Header */}
            <div className="relative bg-gradient-to-b from-[#fcfaf7] to-white border-b border-slate-100 p-8 pb-8 rounded-t-[2rem]">
              <button 
                onClick={closeSearchModal} 
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 hover:rotate-90 transition-all duration-300 shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#c5a880]/30 shadow-lg shadow-[#c5a880]/10 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#c5a880]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <ScanFace className="h-7 w-7 text-[#c5a880] animate-pulse-soft" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Find My Photos</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 tracking-wide">Upload a photo or scan your face to magically find all your photos.</p>
                </div>
              </div>
            </div>

            <div className="p-8 -mt-2 bg-white rounded-b-[2rem] relative z-10">
              {/* Error message */}
              {searchError && (
                <div className="mb-6 bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-600 p-4 rounded-2xl text-xs flex items-start gap-3 font-semibold shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 animate-pulse text-rose-500" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
              )}

              {searchLoading || isMatchedSuccess ? (
                /* ── FULL BIOMETRIC AI FACE SCANNING VIEW ── */
                <div className="flex flex-col items-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-500">
                  {/* Biometric Viewport */}
                  <div className={`relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 transition-all duration-700 shadow-2xl flex items-center justify-center ${
                    isMatchedSuccess 
                      ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]' 
                      : 'border-[#c5a880]/60 shadow-[0_0_40px_rgba(197,168,128,0.35)] animate-biometric-glow'
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
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <ScanFace className="w-20 h-20 text-[#c5a880]/40 animate-pulse" />
                      </div>
                    )}

                    {/* Cyber Grid Texture Overlay */}
                    <div className="absolute inset-0 biometric-grid-overlay pointer-events-none opacity-50" />

                    {/* Radial Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                    {/* ── High-Tech Biometric HUD Overlay ── */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      
                      {/* Outer Rotating Segmented Ring */}
                      <div className={`absolute w-56 h-56 rounded-full border border-dashed transition-all duration-700 ${
                        isMatchedSuccess 
                          ? 'border-emerald-400 scale-105 opacity-100' 
                          : 'border-[#c5a880]/60 animate-spin-slow opacity-80'
                      }`} />

                      {/* Inner Rotating Segmented Ring */}
                      <div className={`absolute w-44 h-44 rounded-full border border-dotted transition-all duration-700 ${
                        isMatchedSuccess 
                          ? 'border-emerald-300 scale-100 opacity-90' 
                          : 'border-[#c5a880]/90 animate-spin-reverse-slow opacity-80'
                      }`} />

                      {/* Center Target Crosshairs */}
                      <div className="absolute w-14 h-14 flex items-center justify-center pointer-events-none">
                        <div className={`w-full h-[1px] ${isMatchedSuccess ? 'bg-emerald-400' : 'bg-[#c5a880]/60'}`} />
                        <div className={`h-full w-[1px] absolute ${isMatchedSuccess ? 'bg-emerald-400' : 'bg-[#c5a880]/60'}`} />
                      </div>

                      {/* Concentric Radar Pulse Waves */}
                      {!isMatchedSuccess && (
                        <div className="absolute w-44 h-44 rounded-full border border-[#c5a880]/50 animate-radar-pulse" />
                      )}

                      {/* ── 4 HUD Corner Target Brackets ── */}
                      <div className="absolute inset-3 pointer-events-none">
                        {/* Top-Left */}
                        <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -top-3 left-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">SCAN_ID</span>
                        </div>
                        {/* Top-Right */}
                        <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -top-3 right-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">LIVE●</span>
                        </div>
                        {/* Bottom-Left */}
                        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -bottom-3 left-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">512-D</span>
                        </div>
                        {/* Bottom-Right */}
                        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-colors duration-500 ${isMatchedSuccess ? 'border-emerald-400' : 'border-[#c5a880]'}`}>
                          <span className="absolute -bottom-3 right-0 text-[8px] font-mono tracking-wider text-[#c5a880] font-bold">AI_LOCK</span>
                        </div>
                      </div>

                      {/* ── Sweeping Holographic Laser Scanner ── */}
                      {!isMatchedSuccess && (
                        <div className="absolute inset-x-0 animate-scan-laser pointer-events-none z-20">
                          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c5a880] to-transparent shadow-[0_0_14px_rgba(197,168,128,1)]" />
                          <div className="h-12 w-full bg-gradient-to-b from-[#c5a880]/20 to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* ── Facial Landmark Feature Points (Biometric Nodes) ── */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-56 h-64 overflow-visible" viewBox="0 0 200 240">
                          {/* Eye nodes */}
                          <circle cx="68" cy="88" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="132" cy="88" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          
                          {/* Eyebrows */}
                          <circle cx="58" cy="74" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="78" cy="72" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="122" cy="72" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="142" cy="74" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />

                          {/* Nose bridge & tip */}
                          <circle cx="100" cy="100" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="120" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="88" cy="122" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="112" cy="122" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />

                          {/* Mouth & jaw nodes */}
                          <circle cx="78" cy="148" r="3" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="122" cy="148" r="3" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="144" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="154" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="100" cy="188" r="3.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880] animate-node-point"} />
                          <circle cx="65" cy="168" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />
                          <circle cx="135" cy="168" r="2.5" className={isMatchedSuccess ? "fill-emerald-400" : "fill-[#c5a880]/80 animate-node-point"} />

                          {/* Facial Geometry Mesh Lines */}
                          <path 
                            d="M 68 88 L 100 100 L 132 88 M 100 100 L 100 120 M 88 122 L 100 120 L 112 122 M 78 148 L 100 144 L 122 148 M 78 148 L 100 154 L 122 148 M 100 154 L 100 188 M 65 168 L 100 188 L 135 168" 
                            className={`transition-colors duration-500 fill-none stroke-[1] stroke-dasharray-[2_2] ${
                              isMatchedSuccess ? 'stroke-emerald-400/80' : 'stroke-[#c5a880]/50'
                            }`}
                          />
                        </svg>
                      </div>

                      {/* Top Floating HUD Badges */}
                      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                        <div className="bg-black/75 backdrop-blur-md border border-[#c5a880]/30 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                          <span className={`w-2 h-2 rounded-full ${isMatchedSuccess ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-emerald-500 animate-pulse'}`} />
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-200">
                            {isMatchedSuccess ? 'TARGET LOCKED' : 'AI NEURAL SCAN'}
                          </span>
                        </div>

                        <div className="bg-black/75 backdrop-blur-md border border-[#c5a880]/30 rounded-full px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-[#c5a880] shadow-lg">
                          {isMatchedSuccess ? 'MATCHED' : `${searchProgress}%`}
                        </div>
                      </div>

                      {/* Match Confirmed Overlay */}
                      {isMatchedSuccess && (
                        <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.9)] mb-3 animate-bounce">
                            <Check className="w-9 h-9 stroke-[3]" />
                          </div>
                          <h4 className="text-xl font-black text-white tracking-wider drop-shadow-md">FACE IDENTIFIED!</h4>
                          <p className="text-xs text-emerald-300 font-extrabold mt-1">Personal gallery ready</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Progress & Stage Status Card */}
                  <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c5a880] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isMatchedSuccess ? 'Biometric Match Complete' : 'AI Facial Processing'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {searchProgress}%
                      </span>
                    </div>

                    {/* Shimmering Glowing Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className={`h-full transition-all duration-300 ease-out relative ${
                          isMatchedSuccess 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-[#c5a880] via-orange-400 to-[#9c7c56]'
                        }`}
                        style={{ width: `${searchProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] -skew-x-12" />
                      </div>
                    </div>

                    {/* Stage Description Text */}
                    <div className="mt-3.5 flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                        {isMatchedSuccess ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Loader className="w-3.5 h-3.5 text-[#c5a880] animate-spin" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 tracking-wide">
                        {searchStage || 'Processing face detection...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab Switcher */}
                  <div className="bg-slate-50 p-1.5 rounded-2xl flex mb-8 border border-slate-100 shadow-inner">
                    <button 
                      onClick={() => { setSearchTab('upload'); stopWebcam(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                        searchTab === 'upload' 
                          ? 'bg-white text-slate-900 shadow-md transform scale-[1.02] border border-slate-100' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                      }`}
                    >
                      <Upload className={`h-4 w-4 ${searchTab === 'upload' ? 'text-[#c5a880]' : ''}`} />
                      Upload Photo
                    </button>
                    <button 
                      onClick={startWebcam}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                        searchTab === 'camera' 
                          ? 'bg-white text-slate-900 shadow-md transform scale-[1.02] border border-slate-100' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                      }`}
                    >
                      <Camera className={`h-4 w-4 ${searchTab === 'camera' ? 'text-[#c5a880]' : ''}`} />
                      Face Scan
                    </button>
                  </div>

                  {/* Camera View */}
                  {searchTab === 'camera' && webcamStream && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-full rounded-3xl border-4 border-slate-50 overflow-hidden bg-slate-900 relative shadow-xl group">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[50vh] object-contain scale-x-[-1] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                        
                        {/* Shutter flash effect */}
                        {shutterFlash && (
                          <div className="absolute inset-0 bg-white z-50 animate-shutter-flash pointer-events-none" />
                        )}

                        {/* Face guide overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-56 h-56 border-2 border-[#c5a880]/80 rounded-full border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-105 group-hover:border-[#c5a880]" />
                          {/* Scanning laser */}
                          <div className="absolute w-56 h-0.5 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent animate-scan-laser shadow-[0_0_8px_rgba(197,168,128,0.8)]" />
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center animate-pulse-soft">
                          <span className="text-[11px] tracking-widest text-white font-bold bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg">
                            POSITION YOUR FACE IN CIRCLE
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={capturePhoto} 
                        disabled={isCapturing}
                        className="w-full bg-gradient-to-r from-[#c5a880] to-[#b09672] hover:from-[#b09672] hover:to-[#9c7c56] text-white font-extrabold py-4 rounded-2xl text-sm transition-all duration-300 shadow-[0_8px_20px_rgba(197,168,128,0.4)] hover:shadow-[0_8px_25px_rgba(197,168,128,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isCapturing ? (
                          <>
                            <Loader className="h-5 w-5 animate-spin" />
                            <span>Scanning & Analyzing Face...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-5 w-5" />
                            <span>Capture Photo & Scan Face</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Upload View */}
                  {searchTab === 'upload' && (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {selfieFile && selfiePreview ? (
                        <div className="flex flex-col items-center gap-6">
                          {/* Preview */}
                          <div className="relative w-full group">
                            <div className="w-full rounded-3xl border-4 border-slate-50 overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg relative">
                              <img src={selfiePreview} alt="Selfie Preview" className="w-full h-auto max-h-[300px] object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <button 
                              onClick={clearSelfie} 
                              className="absolute top-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 p-2.5 rounded-xl transition-all duration-300 shadow-xl border border-slate-200 hover:scale-110 hover:text-rose-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="w-full space-y-4">
                            <button 
                              onClick={() => fileInputRef.current?.click()} 
                              className="w-full text-xs text-[#c5a880] hover:text-[#b09672] font-extrabold py-2 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Remove & choose another
                            </button>

                            {/* Search button */}
                            <button 
                              onClick={handleAISearch} 
                              className="relative w-full bg-slate-900 hover:bg-black text-white font-extrabold py-4 rounded-2xl text-sm transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden group"
                            >
                              <span className="relative flex items-center gap-2.5 z-10 tracking-wide">
                                <Sparkles className="h-5 w-5 text-[#c5a880] group-hover:animate-pulse" />
                                <span>Search Matches with AI</span>
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
                          className={`w-full min-h-[260px] rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-4 p-8 relative overflow-hidden group ${
                            isDragOver 
                              ? 'border-[#c5a880] bg-[#fcfaf7] scale-[1.02]' 
                              : 'border-slate-200 bg-slate-50 hover:border-[#c5a880]/50 hover:bg-[#fcfaf7]'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-[#c5a880]/5 to-transparent opacity-0 transition-opacity duration-500 ${isDragOver ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                          
                          <div className={`w-16 h-16 rounded-2xl bg-white border shadow-sm flex items-center justify-center relative z-10 transition-all duration-500 ${isDragOver ? 'border-[#c5a880] shadow-[#c5a880]/20 scale-110' : 'border-slate-100 group-hover:scale-110 group-hover:shadow-md'}`}>
                            <Upload className={`h-7 w-7 transition-colors duration-300 ${isDragOver ? 'text-[#c5a880]' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                          </div>
                          
                          <div className="text-center relative z-10">
                            <p className="text-sm font-extrabold text-slate-800 transition-colors group-hover:text-slate-900">
                              {isDragOver ? 'Drop your photo here!' : 'Drag & drop your photo here'}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-1.5 tracking-wide">
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
                </>
              )}

              {/* Privacy note */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 py-2.5 px-4 rounded-xl">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Your photo is never stored permanently</span>
              </div>

              {/* Indexing Status Banner */}
              {indexingStatus && indexingStatus.pending > 0 && (
                <div className="mt-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-orange-100">
                    <Loader className="w-5 h-5 text-orange-500 animate-spin" />
                  </div>
                  <div className="mt-0.5">
                    <h4 className="text-sm font-extrabold text-orange-900">Photo indexing in progress</h4>
                    <p className="text-xs font-medium text-orange-700/80 mt-1 leading-relaxed">
                      {indexingStatus.pending} photos are still being processed. Check back later to find more matches!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox - Kept dark for focus on media */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6">
          <div className="flex items-center justify-between w-full absolute top-6 left-0 px-6 z-10 pointer-events-none">
            <div></div>
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

      {/* ── Raise a Ticket Floating Button ── */}
      {!isLocked && event && (
        <button
          onClick={() => setTicketModalOpen(true)}
          className="fixed bottom-6 right-6 bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] p-4 rounded-full shadow-[0_10px_25px_rgba(197,168,128,0.4)] transition-all z-40 hover:-translate-y-1 flex items-center justify-center group"
          title="Raise a Ticket / Complaint"
        >
          <HelpCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 font-bold text-sm transition-all duration-300">
            Raise a Ticket
          </span>
        </button>
      )}

      {/* ── Raise a Ticket Modal ── */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-[60] bg-[#0F172A]/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-white p-0 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            
            {/* Modal Header */}
            <div className="relative bg-[#f8f7f4] border-b border-[#e5e7eb] p-6 pb-8">
              <button 
                onClick={() => setTicketModalOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#c5a880]/30 shadow-sm flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-[#c5a880]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">Raise a Ticket</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Submit a complaint or request to the Studio</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white">
              {ticketMessage.text && (
                <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold shadow-sm ${
                  ticketMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                    : 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]'
                }`}>
                  {ticketMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{ticketMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={ticketForm.name} 
                    onChange={e => setTicketForm({...ticketForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880]/50" 
                    placeholder="Enter your name" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={ticketForm.mobile} 
                      onChange={e => setTicketForm({...ticketForm, mobile: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880]/50" 
                      placeholder="Your mobile" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={ticketForm.email} 
                      onChange={e => setTicketForm({...ticketForm, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880]/50" 
                      placeholder="For updates" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Complaint / Message *</label>
                  <textarea 
                    required 
                    value={ticketForm.complaint} 
                    onChange={e => setTicketForm({...ticketForm, complaint: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-[#c5a880]/50" 
                    placeholder="Describe your issue or request in detail..." 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={ticketSubmitting} 
                  className="w-full bg-[#09090b] hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {ticketSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
