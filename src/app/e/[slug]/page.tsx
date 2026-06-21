'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Camera, Sparkles, LayoutGrid, Sliders, CalendarDays,
  Lock, Key, Image as ImageIcon, Download, Check,
  Play, X, AlertCircle, Loader, ZoomIn
} from 'lucide-react';
import { apiClient } from '../../../lib/api';

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
  const [viewType, setViewType] = useState<'grid' | 'masonry' | 'timeline'>('grid');
  
  // Selfie Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Search Matches State
  const [searchActive, setSearchActive] = useState(false);
  const [matchedMedia, setMatchedMedia] = useState<any[]>([]);

  // Lightbox / Detail view
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Selection for bulk downloads
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

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
        fetchGalleryMedia(res.data.event._id);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Event gallery not found.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryMedia = async (eventId: string) => {
    try {
      const res = await apiClient.get(`/media/event/${eventId}`);
      setMedia(res.data.media);
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
      fetchGalleryMedia(event._id);
    } catch (err: any) {
      setAuthError('Incorrect gallery password.');
    }
  };

  const startWebcam = async () => {
    setUseWebcam(true);
    setSearchError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setSearchError('Could not access camera. Upload a file instead.');
      setUseWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setUseWebcam(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          setSelfieFile(file);
          stopWebcam();
        }
      }, 'image/jpeg');
    }
  };

  const handleSelfieUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
    }
  };

  const handleAISearch = async () => {
    if (!selfieFile || !event) return;
    setSearchLoading(true);
    setSearchError('');
    
    const formData = new FormData();
    formData.append('selfie', selfieFile);

    try {
      const res = await apiClient.post(`/ai/search/${event._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const matches = res.data.matches || [];
      setMatchedMedia(matches);
      setSearchActive(true);
      setSearchModalOpen(false);
      setSelfieFile(null);

      if (matches.length > 0) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#22D3EE', '#0F172A'],
        });
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.error || 'AI Face Search failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchActive(false);
    setMatchedMedia([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 1. Password Lock Page
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-6 relative">
        
        <div className="w-full max-w-md glass-panel bg-white border-slate-200 p-8 rounded-3xl text-center shadow-lg relative z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-5 w-5 text-blue-600" />
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
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white text-center tracking-wider" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-blue-500/20">
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  const galleryMedia = searchActive ? matchedMedia : media;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative selection:bg-blue-500 selection:text-white">
      {/* Whitelabel Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <span className="font-extrabold text-sm tracking-widest text-blue-600 uppercase">
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
          <div className="w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 brightness-75" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#F8FAFC] to-transparent h-48" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 max-w-7xl mx-auto">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full w-max shadow-md mb-3">
            {event?.type}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-800">{event?.name}</h1>
          <p className="text-xs text-slate-500 font-semibold mt-2 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            {event?.location || 'Studio Photography Session'}
          </p>
        </div>
      </div>

      {/* Gallery Controls bar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewType('grid')} className={`p-2 rounded-lg border transition-all ${viewType === 'grid' ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewType('masonry')} className={`p-2 rounded-lg border transition-all ${viewType === 'masonry' ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Sliders className="h-4 w-4 rotate-90" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {searchActive && (
            <button onClick={clearSearch} className="text-xs text-rose-600 hover:text-rose-500 font-bold underline flex items-center gap-1">
              Clear AI Search Results
            </button>
          )}

          {isMultiSelect ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold">Selected: <strong>{selectedMediaIds.length}</strong></span>
              <button onClick={handleBulkDownload} disabled={selectedMediaIds.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
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
              <div className="mb-8 bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                <Sparkles className="h-5 w-5 shrink-0" />
                <span>Found <strong>{galleryMedia.length}</strong> photos and videos matching your facial profile.</span>
              </div>
            )}

            <div className={viewType === 'masonry' ? 'columns-4 gap-6 space-y-6' : 'grid grid-cols-4 gap-6'}>
              {galleryMedia.map((m) => {
                const isSelected = selectedMediaIds.includes(m._id);
                return (
                  <div key={m._id} className={`group rounded-2xl overflow-hidden bg-white border relative transition-all shadow-sm ${viewType === 'masonry' ? 'break-inside-avoid' : 'aspect-square'} ${isSelected ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
                    <img src={m.compressedUrl || m.thumbnailUrl || m.r2Url} alt="gallery" className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-102" />
                    
                    {m.type === 'VIDEO' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {isMultiSelect ? (
                      <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer" onClick={() => toggleSelectMedia(m._id)}>
                        <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/40 bg-black/10'}`}>
                          {isSelected && <Check className="h-4.5 w-4.5" />}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 cursor-pointer" onClick={() => setSelectedItem(m)}>
                        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-105 transition-transform">
                          <ZoomIn className="h-4.5 w-4.5" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-24 text-center glass-panel bg-white border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 max-w-xl mx-auto text-slate-500 shadow-sm">
            <ImageIcon className="h-10 w-10 text-slate-350 mb-3" />
            <h3 className="text-sm font-bold text-slate-600">No matching media files</h3>
            <p className="text-xs mt-1 font-semibold">If search is active, try uploading a clearer selfie. Otherwise, check back later once uploads are completed.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setSearchModalOpen(true)} className="fixed bottom-8 right-8 z-35 bg-gradient-to-r from-blue-600 to-blue-750 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-4 rounded-2xl shadow-2xl shadow-blue-600/25 hover:shadow-blue-600/35 transform hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        Find My Photos
      </button>

      {/* Selfie Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-panel bg-white border-slate-250 p-8 rounded-3xl relative shadow-2xl">
            <button onClick={() => { stopWebcam(); setSearchModalOpen(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Search via Selfie</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Take a webcam selfie or select a photo file. Our AI matches your face instantly.</p>
            </div>

            {searchError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {useWebcam ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-64 h-64 rounded-2xl border border-slate-200 overflow-hidden bg-black relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Capture Selfie
                  </button>
                  <button onClick={stopWebcam} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {selfieFile ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-2xl border border-slate-200 overflow-hidden relative">
                      <img src={URL.createObjectURL(selfieFile)} alt="Selfie Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setSelfieFile(null)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <button onClick={handleAISearch} disabled={searchLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                      {searchLoading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : 'Run AI Face Search'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={startWebcam} className="flex flex-col items-center justify-center gap-3 p-6 glass-panel bg-white border-slate-200 hover:border-blue-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                      <Camera className="h-6 w-6 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Snap Webcam</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 glass-panel bg-white border-slate-200 hover:border-blue-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                      <ImageIcon className="h-6 w-6 text-cyan-600" />
                      <span className="text-xs font-bold text-slate-700">Upload Photo</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleSelfieUploadChange} className="hidden" accept="image/*" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox - Kept dark for focus on media */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              {selectedItem.type} • {selectedItem.r2Key.split('/').pop()}
            </span>
            <div className="flex items-center gap-4">
              <a href={selectedItem.r2Url} target="_blank" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <Download className="h-5 w-5" />
              </a>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 max-h-[75vh]">
            {selectedItem.type === 'PHOTO' ? (
              <img src={selectedItem.r2Url} alt="detailed preview" className="max-w-full max-h-full object-contain rounded-xl border border-white/5 shadow-2xl" />
            ) : (
              <video ref={playerRef} controls src={selectedItem.r2Url} className="max-w-full max-h-full object-contain rounded-xl border border-white/5 shadow-2xl" />
            )}
          </div>

          <div className="max-w-xl mx-auto w-full glass-panel border-white/5 bg-slate-900/40 p-5 rounded-2xl text-center mb-6">
            {selectedItem.type === 'VIDEO' && selectedItem.timestamps && selectedItem.timestamps.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  AI Matched Timestamps
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedItem.timestamps.map((sec: number) => {
                    const min = Math.floor(sec / 60);
                    const remSec = sec % 60;
                    const displayTime = `${min}:${remSec < 10 ? '0' : ''}${remSec}`;
                    return (
                      <button key={sec} onClick={() => handleJumpToTimestamp(sec)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Play className="h-3 w-3 fill-white" />
                        {displayTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-bold">
                {selectedItem.type === 'PHOTO' ? 'Reviewing high-resolution photo file' : 'Playing video file'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
