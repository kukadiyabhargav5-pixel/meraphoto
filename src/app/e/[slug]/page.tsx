'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, Copy, ZoomIn, Play, ShieldCheck, RefreshCw, ScanFace, ChevronRight, ChevronLeft, LayoutGrid, Sliders, X, Download, Loader, Sparkles, CalendarDays, Lock, Key, AlertCircle, Search, HelpCircle, Send, CheckCircle } from 'lucide-react';
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

  const galleryMedia = searchActive ? matchedMedia : media;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative selection:bg-orange-500 selection:text-white">
      {/* Whitelabel Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-10 sm:h-14 max-w-[140px] sm:max-w-[250px] object-contain transition-all hover:opacity-90 drop-shadow-sm" />
            ) : (
              <span className="font-extrabold text-sm tracking-widest text-[#c5a880] uppercase">
                {event?.studioId?.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold text-slate-500">
            <span className="truncate max-w-[120px] sm:max-w-none">{event?.name}</span>
            <span className="h-4 w-[1px] bg-slate-200" />
            <span>{new Date(event?.date).toLocaleDateString()}</span>
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white p-0 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            
            {/* Modal Header */}
            <div className="relative bg-[#f8f7f4] border-b border-[#e5e7eb] p-6 pb-8">
              <button 
                onClick={closeSearchModal} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#c5a880]/30 shadow-sm flex items-center justify-center">
                  <ScanFace className="h-6 w-6 text-[#c5a880]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">Find My Photos</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Upload a photo or scan your face to find all photos you appear in</p>
                </div>
              </div>
            </div>

            <div className="p-6 -mt-3 bg-white">
              {/* Tab Switcher */}
              <div className="bg-slate-100/70 p-1 rounded-xl flex mb-6 border border-slate-200">
                <button 
                  onClick={() => { setSearchTab('upload'); stopWebcam(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    searchTab === 'upload' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
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
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Face Scan
                </button>
              </div>

              {/* Error message */}
              {searchError && (
                <div className="mb-5 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Camera View */}
              {searchTab === 'camera' && webcamStream && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-black relative shadow-inner">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[60vh] object-contain scale-x-[-1]" />
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-[#c5a880]/60 rounded-full border-dashed" />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="text-[10px] text-white font-semibold bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                        Position your face in the circle
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={capturePhoto} 
                    className="w-full bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(197,168,128,0.39)] flex items-center justify-center gap-2"
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
                        <div className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-[#f8f7f4] flex items-center justify-center shadow-inner">
                          <img src={selfiePreview} alt="Selfie Preview" className="w-full h-auto object-contain" />
                        </div>
                        <button 
                          onClick={clearSelfie} 
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl transition-all shadow-md border border-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="w-full space-y-3">
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="w-full text-xs text-[#c5a880] hover:text-[#b09672] font-extrabold py-2 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Remove & choose another
                        </button>

                        {/* Search button with progress */}
                        <button 
                          onClick={handleAISearch} 
                          disabled={searchLoading} 
                          className="relative w-full bg-[#c5a880] hover:bg-[#b09672] disabled:bg-[#d6c3aa] text-[#09090b] font-extrabold py-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(197,168,128,0.39)] disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2.5 overflow-hidden"
                        >
                          {/* Progress bar inside button */}
                          {searchLoading && (
                            <div 
                              className="absolute inset-y-0 left-0 bg-white/30 transition-all duration-300 ease-out"
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
                      className={`w-full min-h-[250px] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 p-6 ${
                        isDragOver 
                          ? 'border-[#c5a880] bg-[#fdfbf9]' 
                          : 'border-slate-200 bg-[#f8f7f4] hover:border-[#c5a880] hover:bg-[#fdfbf9]'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                        <Upload className="h-6 w-6 text-[#c5a880]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-extrabold text-slate-800">
                          Drag & drop your photo here
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
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
