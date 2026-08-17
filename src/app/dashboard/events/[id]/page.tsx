'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, Copy, ChevronDown, LayoutGrid, Sparkles, Crown, ArrowRight, ShieldCheck, Flame, RefreshCw, ZoomIn, Play, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../../../components/CustomDatePicker';

export default function EventUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGalleryLink, setShowGalleryLink] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();

  const folderInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  // Credit limit flags
  const isPhotoLimitReached = credits?.photos?.remaining !== undefined && credits.photos.remaining <= 0;
  const isVideoLimitReached = credits?.videos?.remaining !== undefined && credits.videos.remaining <= 0;
  const isAllCreditsExhausted = isPhotoLimitReached && isVideoLimitReached;
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<any>(null);

  const toggleSelection = (id: string) => {
    setSelectedMediaIds(prev => 
      prev.includes(id) ? prev.filter(mediaId => mediaId !== id) : [...prev, id]
    );
  };

  const fetchCredits = async () => {
    try {
      const res = await apiClient.get('/studio/credits');
      if (res.data && res.data.credits) {
        setCredits(res.data.credits);
      }
    } catch (err) {
      console.error('Failed to fetch studio credits:', err);
    }
  };

  const handleDeleteMedia = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} media item(s)?`)) return;
    setIsDeleting(true);
    try {
      if (ids.length === 1) {
        await apiClient.delete(`/media/${ids[0]}`);
      } else {
        await apiClient.delete(`/media/event/${event?._id}/media`, { data: { mediaIds: ids } });
      }
      toast.success('Media deleted successfully');
      setSelectedMediaIds([]);
      setIsSelectionMode(false);
      fetchEventDetails();
      fetchCredits();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete media');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const res = await apiClient.get(`/event/code/${eventId}`);
      if (res.data && res.data.event) {
        setEvent(res.data.event);
        try {
           const mediaRes = await apiClient.get(`/media/event/${res.data.event._id}`);
           if (mediaRes.data && mediaRes.data.media) setMediaItems(mediaRes.data.media);
        } catch (me) {
           console.error("Failed to fetch media", me);
        }
      }
      fetchCredits();
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !event) return;

    // Block upload if credits are exhausted
    const hasVideos = Array.from(files).some(f => f.type.startsWith('video/'));
    const hasPhotos = Array.from(files).some(f => f.type.startsWith('image/'));
    if (hasPhotos && isPhotoLimitReached) {
      toast.error('📸 Photo credits exhausted! Please upgrade your plan to upload more photos.', { duration: 5000 });
      e.target.value = '';
      return;
    }
    if (hasVideos && isVideoLimitReached) {
      toast.error('🎬 Video credits exhausted! Please upgrade your plan to upload more videos.', { duration: 5000 });
      e.target.value = '';
      return;
    }
    if (type === 'FOLDER' && isAllCreditsExhausted) {
      toast.error('⚠️ All storage credits exhausted! Please upgrade your plan to continue uploading.', { duration: 5000 });
      e.target.value = '';
      return;
    }
    
    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: files.length });
    
    try {
      // 1. Get ImageKit Auth parameters for all files
      const authRes = await apiClient.get(`/media/imagekit-auth?count=${files.length}`);
      const signatures = authRes.data.signatures || [authRes.data];
      const IMAGEKIT_PUBLIC_KEY = "public_2AYAbqW1EUFL0ejxVPrCgx06Es0=";

      const imageCompression = (await import('browser-image-compression')).default;
      let uploadedCount = 0;
      let successful = 0;
      let failed = 0;
      const mediaList = [];
      const batchSize = 10;

      for (let i = 0; i < files.length; i += batchSize) {
        const chunk = Array.from(files).slice(i, i + batchSize);
        const chunkPromises = chunk.map(async (file, idx) => {
          const globalIdx = i + idx;
          const authParams = signatures[globalIdx] || signatures[0];
          
          let fileToUpload: File | Blob = file;
          const isVideo = file.type.startsWith('video/');
          
          if (!isVideo && file.type.startsWith('image/')) {
            try {
              const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 2500,
                useWebWorker: true,
                alwaysKeepResolution: true
              };
              const compressedBlob = await imageCompression(file, options);
              fileToUpload = new File([compressedBlob], file.name, { type: compressedBlob.type });
            } catch (err) {
              console.error('Compression skipped:', err);
            }
          }

          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
          formData.append('signature', authParams.signature);
          formData.append('expire', authParams.expire.toString());
          formData.append('token', authParams.token);
          formData.append('fileName', file.name);
          formData.append('folder', `mara-photo/events/${event._id}/${isVideo ? 'videos' : 'photos'}`);
          formData.append('useUniqueFileName', 'true');

          try {
            const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('ImageKit upload failed');
            }
            const data = await response.json();
            return {
              url: data.url,
              publicId: data.fileId,
              type: isVideo ? 'VIDEO' : 'PHOTO',
              size: fileToUpload.size,
              folderPath: file.webkitRelativePath || ''
            };
          } finally {
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
        });

        const results = await Promise.allSettled(chunkPromises);
        const successfulUploads = results
          .filter(r => r.status === 'fulfilled')
          .map((r: any) => r.value);
        
        mediaList.push(...successfulUploads);
        successful += successfulUploads.length;
        failed += chunk.length - successfulUploads.length;
      }

      // Send the resulting data to the backend
      if (mediaList.length > 0) {
        await apiClient.post(`/media/event/${event._id}/bulk-create`, { mediaList });
      }
      
      if (failed > 0) {
        toast.error(`Uploaded ${successful}, failed ${failed}`);
      } else {
        toast.success(`Successfully uploaded ${files.length} files!`);
      }
      fetchEventDetails();
    } catch (err: any) {
       console.error('Upload error:', err);
       toast.error(err?.response?.data?.error || err.message || 'Upload failed. Please check console.');
    } finally {
       setUploadingMedia(false);
       if (e.target) e.target.value = '';
    }
  };

  // Auto-refresh and real-time polling
  useEffect(() => {
    // Real-time credits polling (every 5 seconds)
    const creditInterval = setInterval(() => {
      fetchCredits();
    }, 5000);

    const hasPending = mediaItems.some(item => item.processedStatus === 'PENDING' || item.processedStatus === 'PROCESSING');
    if (!hasPending || !event?._id) {
      return () => clearInterval(creditInterval);
    }

    // Pending media polling
    const interval = setInterval(() => {
      apiClient.get(`/media/event/${event._id}`).then(res => {
        if (res.data && res.data.media) {
          setMediaItems(res.data.media);
        }
      }).catch(err => console.error('Polling error', err));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(creditInterval);
    };
  }, [mediaItems, event?._id]);

  const getPreviewPosition = (pos: string) => {
    switch (pos) {
      case 'TOP_LEFT': return { top: '4%', left: '4%' };
      case 'TOP_RIGHT': return { top: '4%', right: '4%' };
      case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
      case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
    }
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleWatermarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await apiClient.post('/dashboard/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.url) {
        setFormData(prev => ({...prev, watermarkLogoUrl: res.data.url}));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    date: '',
    type: 'WEDDING',
    location: '',
    accessType: 'PUBLIC',
    password: '',
    customWatermark: false,
    addToPortfolio: false,
    coverImageUrl: '',
    watermarkType: 'LOGO',
    watermarkText: '',
    watermarkLogoUrl: '',
    watermarkPosition: 'BOTTOM_RIGHT',
    watermarkWidth: 20,
    watermarkOpacity: 50
  });

  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        clientName: event.clientName || '',
        clientMobile: event.clientMobile || '',
        clientEmail: event.clientEmail || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        type: event.type || 'WEDDING',
        location: event.location || '',
        accessType: event.accessType || 'PUBLIC',
        password: '',
        customWatermark: !!event.watermark?.isActive,
        addToPortfolio: !!event.addToPortfolio,
        coverImageUrl: event.coverImageUrl || '',
        watermarkType: event.watermark?.type || 'LOGO',
        watermarkText: event.watermark?.text || '',
        watermarkLogoUrl: event.watermark?.logoUrl || '',
        watermarkPosition: event.watermark?.position || 'BOTTOM_RIGHT',
        watermarkWidth: event.watermark?.width || 20,
        watermarkOpacity: (event.watermark?.opacity !== undefined ? event.watermark.opacity * 100 : 50)
      });
    }
  }, [event]);

  useEffect(() => {
    fetchEventDetails();
    fetchCredits();

    // Instant Live Plan & Credit Sync Listeners
    const handlePlanUpdated = () => {
      fetchCredits();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCredits();
      }
    };

    window.addEventListener('focus', handlePlanUpdated);
    window.addEventListener('storage', handlePlanUpdated);
    window.addEventListener('studio_plan_updated', handlePlanUpdated);
    document.addEventListener('visibilitychange', handleVisibility);

    // Live sync polling every 10s so changes elsewhere sync instantly without delay
    const interval = setInterval(fetchCredits, 10000);

    return () => {
      window.removeEventListener('focus', handlePlanUpdated);
      window.removeEventListener('storage', handlePlanUpdated);
      window.removeEventListener('studio_plan_updated', handlePlanUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex-1 bg-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-900">Event not found</h1>
        <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer mt-4">
          <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer">
              <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
              <span>Back to Events</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 ml-2 border-l-2 border-slate-200 pl-4 tracking-tight">{event.name}</h1>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => { fetchEventDetails(); fetchCredits(); }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 transition-all shadow-xs cursor-pointer"
              title="Refresh Storage Credits & Media"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sleek, Compact Storage Credits Box */}
        <div className="w-full max-w-5xl mx-auto bg-[#09090b]/95 backdrop-blur-2xl text-white rounded-2xl p-5 sm:p-6 border border-[#c5a880]/20 hover:border-[#c5a880]/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_15px_40px_rgba(197,168,128,0.15)]">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#c5a880]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#c5a880]/25 group-hover:scale-125 transition-all duration-700 ease-out" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#e6d0a7]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#e6d0a7]/15 group-hover:scale-125 transition-all duration-700 ease-out delay-75" />

            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10 transition-colors duration-500 group-hover:border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a880]/20 via-[#c5a880]/5 to-transparent text-[#c5a880] border border-[#c5a880]/30 flex items-center justify-center shadow-[0_0_15px_rgba(197,168,128,0.1)] shrink-0 group-hover:rotate-12 group-hover:scale-110 group-hover:border-[#c5a880]/60 group-hover:text-[#e6d0a7] transition-all duration-500">
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#e6d0a7] drop-shadow-sm">
                    {credits?.planName || 'Standard'} Plan Storage
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide group-hover:text-slate-300 transition-colors duration-500">
                    Live balance. Deducts on upload.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/plans-billing"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-[#c5a880] text-[#c5a880] hover:text-[#09090b] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-[#c5a880]/30 hover:border-transparent shrink-0 hover:shadow-[0_5px_20px_rgba(197,168,128,0.3)] hover:-translate-y-0.5 group/btn"
              >
                <Crown className="w-3.5 h-3.5 transition-colors" />
                <span>Upgrade</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 2 Credit Metric Cards: Photos & Videos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative z-10">
              
              {/* Photo Credits Card */}
              <div className="bg-[#121214]/60 hover:bg-[#18181b] rounded-xl p-4 border border-white/5 hover:border-[#c5a880]/50 space-y-4 backdrop-blur-md transition-all duration-500 group/card relative overflow-hidden shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(197,168,128,0.3)] hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#c5a880]/0 to-transparent group-hover/card:via-[#c5a880] transition-all duration-500 opacity-0 group-hover/card:opacity-100" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 group-hover/card:text-white transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] group-hover/card:bg-[#c5a880]/15 group-hover/card:border-[#c5a880]/40 group-hover/card:scale-110 transition-all duration-300">
                      <ImageIcon className="w-3 h-3 group-hover/card:text-[#e6d0a7]" />
                    </div>
                    <span className="tracking-wide uppercase">Photos</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border transition-all duration-300 ${isPhotoLimitReached ? 'text-red-400 bg-red-500/10 border-red-500/20 group-hover/card:border-red-500/50' : 'text-[#e6d0a7] bg-[#c5a880]/10 border-[#c5a880]/20 group-hover/card:bg-[#c5a880]/20 group-hover/card:border-[#c5a880]/50'}`}>
                    {credits?.photos ? `${Number(credits.photos.remaining).toLocaleString('en-IN')} Left` : 'Active'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter font-mono group-hover/card:text-[#fef3c7] transition-colors duration-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {credits?.photos?.remaining !== undefined ? Number(credits.photos.remaining).toLocaleString('en-IN') : '---'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider group-hover/card:text-slate-400 transition-colors">
                    / {credits?.photos?.totalLimit ? Number(credits.photos.totalLimit).toLocaleString('en-IN') : '---'}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-black/40 group-hover/card:bg-black/60 rounded-full h-1.5 overflow-hidden shadow-inner transition-colors duration-300 relative">
                    <div 
                      className="bg-gradient-to-r from-[#c5a880] via-[#dfc49c] to-[#e6d0a7] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(197,168,128,0.5)] group-hover/card:shadow-[0_0_15px_rgba(197,168,128,0.8)] relative overflow-hidden"
                      style={{ 
                        width: (credits?.photos?.used || 0) > 0 
                          ? `${Math.min(100, Math.max(2, credits?.photos?.percentUsed || 0))}%` 
                          : '0%' 
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite] opacity-0 group-hover/card:opacity-100" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono tracking-wide text-slate-400 group-hover/card:text-slate-300 transition-colors">
                    <span>
                      {(credits?.photos?.used || 0) > 0 ? `${credits.photos.used} Used (${(credits.photos.percentUsed || 0) < 0.01 ? '0.01%' : `${credits.photos.percentUsed}%`})` : '0 Used'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Credits Card */}
              <div className="bg-[#121214]/60 hover:bg-[#18181b] rounded-xl p-4 border border-white/5 hover:border-[#c5a880]/50 space-y-4 backdrop-blur-md transition-all duration-500 group/card relative overflow-hidden shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(197,168,128,0.3)] hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#c5a880]/0 to-transparent group-hover/card:via-[#c5a880] transition-all duration-500 opacity-0 group-hover/card:opacity-100" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 group-hover/card:text-white transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] group-hover/card:bg-[#c5a880]/15 group-hover/card:border-[#c5a880]/40 group-hover/card:scale-110 transition-all duration-300">
                      <Video className="w-3 h-3 group-hover/card:text-[#e6d0a7]" />
                    </div>
                    <span className="tracking-wide uppercase">Videos</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border transition-all duration-300 ${isVideoLimitReached ? 'text-red-400 bg-red-500/10 border-red-500/20 group-hover/card:border-red-500/50' : 'text-[#e6d0a7] bg-[#c5a880]/10 border-[#c5a880]/20 group-hover/card:bg-[#c5a880]/20 group-hover/card:border-[#c5a880]/50'}`}>
                    {credits?.videos ? `${Number(credits.videos.remaining)} Left` : 'Active'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter font-mono group-hover/card:text-[#fef3c7] transition-colors duration-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {credits?.videos?.remaining !== undefined ? Number(credits.videos.remaining) : '---'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider group-hover/card:text-slate-400 transition-colors">
                    / {credits?.videos?.totalLimit ? Number(credits.videos.totalLimit) : '---'}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-black/40 group-hover/card:bg-black/60 rounded-full h-1.5 overflow-hidden shadow-inner transition-colors duration-300 relative">
                    <div 
                      className="bg-gradient-to-r from-[#c5a880] via-[#dfc49c] to-[#e6d0a7] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(197,168,128,0.5)] group-hover/card:shadow-[0_0_15px_rgba(197,168,128,0.8)] relative overflow-hidden"
                      style={{ 
                        width: (credits?.videos?.used || 0) > 0 
                          ? `${Math.min(100, Math.max(2, credits?.videos?.percentUsed || 0))}%` 
                          : '0%' 
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite] opacity-0 group-hover/card:opacity-100" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono tracking-wide text-slate-400 group-hover/card:text-slate-300 transition-colors">
                    <span>
                      {(credits?.videos?.used || 0) > 0 ? `${credits.videos.used} Used (${(credits.videos.percentUsed || 0) < 0.01 ? '0.01%' : `${credits.videos.percentUsed}%`})` : '0 Used'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
        </div>

        {/* 2-Column Content Layout (Upload Media & Media Files on Left, Edit Event Details on Right - level with each other!) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Upload Media & Media Files */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <Upload className="h-10 w-10 text-[#c5a880] mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Media</h2>
              <p className="text-sm text-slate-500">Select a category below or drag and drop files.</p>
            </div>

            {/* Credit Exhausted Warning Banner */}
            {isAllCreditsExhausted && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">All Storage Credits Exhausted</p>
                  <p className="text-xs text-red-500 mt-0.5">Your photo and video upload limits have been reached. Upgrade your plan to continue uploading.</p>
                </div>
                <Link href="/dashboard/plans-billing" className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0">
                  Upgrade
                </Link>
              </div>
            )}
            {!isAllCreditsExhausted && (isPhotoLimitReached || isVideoLimitReached) && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-700">
                    {isPhotoLimitReached ? 'Photo' : 'Video'} Credits Exhausted
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Your {isPhotoLimitReached ? 'photo' : 'video'} upload limit has been reached. You can still upload {isPhotoLimitReached ? 'videos' : 'photos'}. Upgrade your plan for more credits.
                  </p>
                </div>
                <Link href="/dashboard/plans-billing" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0">
                  Upgrade
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <input type="file" {...{ webkitdirectory: "true", directory: "true" }} multiple ref={folderInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'FOLDER')} />
              <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'PHOTO')} />
              <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'VIDEO')} />

              <div 
                onClick={() => {
                  if (isAllCreditsExhausted) {
                    toast.error('⚠️ All storage credits exhausted! Please upgrade your plan.', { duration: 4000 });
                    return;
                  }
                  folderInputRef.current?.click();
                }}
                className={`border rounded-xl p-6 flex flex-col items-center justify-center transition-all group ${
                  isAllCreditsExhausted 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md'
                }`}
              >
                <FolderUp className={`h-8 w-8 mb-3 transition-colors ${isAllCreditsExhausted ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-sm ${isAllCreditsExhausted ? 'text-slate-400' : 'text-slate-600'}`}>Entire Folder</span>
                {isAllCreditsExhausted && <span className="text-[10px] font-bold text-red-400 mt-1 uppercase">Credits Exhausted</span>}
              </div>
              <div 
                onClick={() => {
                  if (isPhotoLimitReached) {
                    toast.error('📸 Photo credits exhausted! Please upgrade your plan to upload more photos.', { duration: 4000 });
                    return;
                  }
                  photoInputRef.current?.click();
                }}
                className={`border rounded-xl p-6 flex flex-col items-center justify-center transition-all group ${
                  isPhotoLimitReached 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md'
                }`}
              >
                <ImageIcon className={`h-8 w-8 mb-3 transition-colors ${isPhotoLimitReached ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-sm ${isPhotoLimitReached ? 'text-slate-400' : 'text-slate-600'}`}>Photos</span>
                {isPhotoLimitReached && <span className="text-[10px] font-bold text-red-400 mt-1 uppercase">Credits Exhausted</span>}
              </div>
              <div 
                onClick={() => {
                  if (isVideoLimitReached) {
                    toast.error('🎬 Video credits exhausted! Please upgrade your plan to upload more videos.', { duration: 4000 });
                    return;
                  }
                  videoInputRef.current?.click();
                }}
                className={`border rounded-xl p-6 flex flex-col items-center justify-center transition-all group ${
                  isVideoLimitReached 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md'
                }`}
              >
                <Video className={`h-8 w-8 mb-3 transition-colors ${isVideoLimitReached ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-sm ${isVideoLimitReached ? 'text-slate-400' : 'text-slate-600'}`}>Videos</span>
                {isVideoLimitReached && <span className="text-[10px] font-bold text-red-400 mt-1 uppercase">Credits Exhausted</span>}
              </div>
            </div>
          </div>

          <div className="mt-8">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900">Media Files ({mediaItems.filter(item => mediaFilter === 'ALL' || item.type === mediaFilter).length})</h3>
                  {mediaItems.length > 0 && (
                    <button 
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedMediaIds([]);
                      }}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider ${isSelectionMode ? 'bg-[#c5a880] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
                  )}
                  {isSelectionMode && selectedMediaIds.length > 0 && (
                    <button 
                      onClick={() => handleDeleteMedia(selectedMediaIds)}
                      disabled={isDeleting}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isDeleting ? 'Deleting...' : `Delete (${selectedMediaIds.length})`}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                     <button 
                       onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                       className="flex items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none text-slate-700 font-bold hover:border-[#c5a880] cursor-pointer shadow-sm min-w-[120px] transition-all duration-300"
                     >
                       <div className="flex items-center gap-2">
                         {mediaFilter === 'ALL' && <LayoutGrid className="w-3.5 h-3.5 text-[#c5a880]" />}
                         {mediaFilter === 'PHOTO' && <ImageIcon className="w-3.5 h-3.5 text-[#c5a880]" />}
                         {mediaFilter === 'VIDEO' && <Video className="w-3.5 h-3.5 text-[#c5a880]" />}
                         <span>
                           {mediaFilter === 'ALL' && 'All Media'}
                           {mediaFilter === 'PHOTO' && 'Photos Only'}
                           {mediaFilter === 'VIDEO' && 'Videos Only'}
                         </span>
                       </div>
                       <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>

                     {filterDropdownOpen && (
                       <>
                         <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                         <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-100 rounded-lg shadow-lg z-20 py-1 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                           <button 
                             onClick={() => { setMediaFilter('ALL'); setFilterDropdownOpen(false); }}
                             className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${mediaFilter === 'ALL' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                             <LayoutGrid className="w-3.5 h-3.5" /> All Media
                           </button>
                           <button 
                             onClick={() => { setMediaFilter('PHOTO'); setFilterDropdownOpen(false); }}
                             className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${mediaFilter === 'PHOTO' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                             <ImageIcon className="w-3.5 h-3.5" /> Photos Only
                           </button>
                           <button 
                             onClick={() => { setMediaFilter('VIDEO'); setFilterDropdownOpen(false); }}
                             className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${mediaFilter === 'VIDEO' ? 'bg-[#fcfaf7] text-[#c5a880]' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                             <Video className="w-3.5 h-3.5" /> Videos Only
                           </button>
                         </div>
                       </>
                     )}
                   </div>
                   <button 
                     onClick={fetchEventDetails}
                     className="text-xs font-bold text-slate-500 hover:text-[#c5a880] transition-colors"
                   >
                     Refresh
                   </button>
                </div>
             </div>
            
            {uploadingMedia && (
               <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center border border-white/20">
                     <div className="w-16 h-16 bg-[#f8f5f0] border border-[#e6d5c0] text-[#c5a880] rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Upload className="h-7 w-7 animate-bounce" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-2">Uploading Media</h3>
                     <p className="text-[11px] font-bold text-slate-500 text-center mb-8 px-2 uppercase tracking-wide">
                        Optimizing & storing securely.<br/>Please keep this window open.
                     </p>
                     
                     <div className="w-full relative">
                        <div className="flex w-full justify-between items-end mb-2">
                           <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Progress</span>
                           <span className="text-xl font-black text-[#c5a880] leading-none">{Math.round((uploadProgress.current / uploadProgress.total) * 100) || 0}%</span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-full h-3.5 mb-3 overflow-hidden shadow-inner border border-slate-200">
                           <div 
                              className="bg-gradient-to-r from-[#b69970] to-[#c5a880] h-full transition-all duration-300 ease-out" 
                              style={{ width: `${Math.max(2, (uploadProgress.current / uploadProgress.total) * 100)}%` }}
                           />
                        </div>
                        <div className="text-center text-xs font-bold text-slate-700">
                           {uploadProgress.current} <span className="text-slate-400 mx-1">/</span> {uploadProgress.total} Files Completed
                        </div>
                     </div>
                  </div>
               </div>
            )}

             {mediaItems.length === 0 ? (
               <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-500 text-sm">
                 No media files uploaded yet. Select files to start.
               </div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-12">
                 {mediaItems.filter(item => mediaFilter === 'ALL' || item.type === mediaFilter).map((item, idx) => (
                   <div 
                     key={idx} 
                     className={`relative aspect-square rounded-xl overflow-hidden bg-slate-900 border transition-all group cursor-pointer ${selectedMediaIds.includes(item._id) ? 'border-[#c5a880] ring-4 ring-[#c5a880]/30' : 'border-slate-200 hover:border-[#c5a880]/50'}`}
                     onClick={() => {
                       if (isSelectionMode) {
                         toggleSelection(item._id);
                       } else {
                         setPreviewMedia(item);
                       }
                     }}
                   >
                      {item.type === 'VIDEO' ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
                            {item.thumbnailUrl || (item.r2Url && item.r2Url.includes('imagekit.io')) ? (
                              <img 
                                src={item.thumbnailUrl || `${item.r2Url}/ik-thumbnail.jpg`} 
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" 
                                alt="Video thumbnail"
                              />
                            ) : (
                              <video 
                                src={item.compressedUrl || item.r2Url} 
                                className="w-full h-full object-cover opacity-60 pointer-events-none" 
                                preload="metadata" 
                                muted 
                              />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                               <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white mb-1 shadow-md group-hover:scale-110 transition-transform">
                                  <Play className="h-5 w-5 fill-white ml-0.5" />
                               </div>
                               <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-black/50 px-2.5 py-0.5 rounded-full border border-white/20">Video</span>
                            </div>
                         </div>
                      ) : (
                         <img src={item.compressedUrl || item.r2Url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      )}

                      {/* Completed Green Badge */}
                      {item.processedStatus === 'COMPLETED' && (
                         <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-md z-10" title="Ready & Processed">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                         </div>
                      )}

                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 z-10 bg-white/90 rounded border border-slate-300 p-0.5 shadow-sm">
                          <input 
                            type="checkbox" 
                            checked={selectedMediaIds.includes(item._id)}
                            onChange={() => toggleSelection(item._id)}
                            className="w-4 h-4 cursor-pointer accent-[#c5a880]"
                          />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-3 ${isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                         <span className="text-[10px] font-bold text-white px-3 py-1.5 bg-black/60 rounded-full uppercase tracking-wider">{item.processedStatus}</span>
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setPreviewMedia(item); }}
                             className="bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/30 transition-transform hover:scale-110 shadow-lg border border-white/30"
                             title="Preview"
                           >
                             <ZoomIn className="h-4 w-4" />
                           </button>
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteMedia([item._id]); }}
                              className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg"
                              title="Delete Media"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             )}
           </div>
         </div>

          {/* Right Column: Edit Event Details Form (aligned at top with Upload Media!) */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                  <Settings className="h-5 w-5 text-[#c5a880]" />
                  <h3 className="text-lg font-bold text-slate-900">Edit Event Details</h3>
                </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              .edit-input {
                width: 100%;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                color: #0f172a;
                padding: 10px 12px;
                border-radius: 8px;
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s;
              }
              .edit-input:focus {
                border-color: #c5a880;
              }
              .edit-label {
                display: block;
                font-size: 10px;
                color: #475569;
                font-weight: 800;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .toggle-switch {
                position: relative;
                width: 36px;
                height: 20px;
                background-color: #cbd5e1;
                border-radius: 20px;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .toggle-switch[data-active="true"] {
                background-color: #c5a880;
              }
              .toggle-switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 16px;
                height: 16px;
                background-color: white;
                border-radius: 50%;
                transition: transform 0.2s;
              }
              .toggle-switch[data-active="true"]::after {
                transform: translateX(16px);
              }
              
              .custom-slider {
                -webkit-appearance: none;
                height: 6px;
                border-radius: 3px;
                background: linear-gradient(to right, #c5a880 var(--val, 50%), #475569 var(--val, 50%));
                outline: none;
              }
              .custom-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #c5a880;
                cursor: pointer;
              }
            `}} />

            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSaving(true);
                
                const payload = {
                  ...formData,
                  watermark: {
                    ...(event?.watermark || {}),
                    isActive: formData.customWatermark,
                    type: formData.watermarkType,
                    text: formData.watermarkText,
                    logoUrl: formData.watermarkLogoUrl,
                    position: formData.watermarkPosition,
                    width: formData.watermarkWidth,
                    opacity: formData.watermarkOpacity / 100
                  }
                };

                const res = await apiClient.put(`/event/${eventId}`, payload);
                if (res.data.event) {
                  setEvent(res.data.event);
                  toast.success('Event updated successfully!');
                  setHasSavedDetails(true);
                }
              } catch (err) {
                toast.error('Error updating event');
              } finally {
                setSaving(false);
              }
            }}>
              <div>
                <label className="edit-label">Event Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Client Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Client Mobile</label>
                  <input 
                    type="text" 
                    className="edit-input" 
                    value={formData.clientMobile}
                    onChange={e => setFormData({...formData, clientMobile: e.target.value})}
                  />
                </div>
                <div>
                  <label className="edit-label">Client Email</label>
                  <input 
                    type="email" 
                    className="edit-input" 
                    value={formData.clientEmail}
                    onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Event Date</label>
                  <CustomDatePicker
                    type="date"
                    className="edit-input"
                    value={formData.date}
                    onChange={val => setFormData({...formData, date: val})}
                  />
                </div>
                <div>
                  <label className="edit-label">Event Type</label>
                  <select 
                    className="edit-input" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="edit-label">Event Location</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Cover Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-40 aspect-video rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.coverImageUrl ? (
                      <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-[#c5a880] animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = '';
                        setUploadingCover(true);
                        try {
                          const uploadData = new FormData();
                          uploadData.append('file', file);
                          const res = await apiClient.post('/media/upload-asset', uploadData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data && res.data.url) {
                            setFormData(prev => ({ ...prev, coverImageUrl: res.data.url }));
                          }
                        } catch (err) {
                          console.error("Cover upload failed", err);
                          toast.error('Failed to upload cover');
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                    />
                    <div className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg py-3 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                      {uploadingCover ? 'Uploading...' : (formData.coverImageUrl ? 'Change Cover Image' : 'Choose File')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="edit-label">Access Type</label>
                <select 
                  className="edit-input"
                  value={formData.accessType}
                  onChange={e => setFormData({...formData, accessType: e.target.value})}
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PASSWORD">PASSWORD PROTECTED</option>
                  <option value="OTP">OTP VERIFICATION</option>
                </select>
              </div>

              {formData.accessType === 'PASSWORD' && (
                <div>
                  <label className="edit-label text-rose-500">New Password</label>
                  <input 
                    type="text" 
                    className="edit-input border-rose-200 focus:border-rose-500 bg-rose-50/30" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Leave empty to keep current password, or enter a new one"
                  />
                </div>
              )}

              {formData.accessType === 'OTP' && (
                <div>
                  <label className="edit-label text-[#c5a880]">New 4-Digit Access PIN</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    className="edit-input border-[#e8e4dd] focus:border-[#c5a880] bg-[#faf9f6] text-center tracking-[1em] font-black text-xl" 
                    value={formData.password}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, password: val});
                    }}
                    placeholder="••••"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium text-center">Leave empty to keep the current PIN, or enter a new 4-digit code</p>
                </div>
              )}

              <div className="flex flex-col border-t border-b border-slate-200 py-4 my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">W</span>
                    <span className="text-xs font-bold text-slate-600 uppercase">Custom Event Watermark</span>
                  </div>
                  <div 
                    className="toggle-switch" 
                    data-active={formData.customWatermark}
                    onClick={() => setFormData({...formData, customWatermark: !formData.customWatermark})}
                  />
                </div>

                {formData.customWatermark && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="edit-label">Watermark Type</label>
                      <select 
                        className="edit-input font-bold tracking-wide"
                        value={formData.watermarkType}
                        onChange={e => setFormData({...formData, watermarkType: e.target.value as any})}
                      >
                        <option value="LOGO">LOGO WATERMARK</option>
                        <option value="TEXT">TEXT WATERMARK</option>
                      </select>
                    </div>

                    {formData.watermarkType === 'TEXT' ? (
                      <div>
                        <label className="edit-label">Watermark Text</label>
                        <input 
                          type="text" 
                          className="edit-input" 
                          
                          value={formData.watermarkText}
                          onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="edit-label">Watermark Logo Image</label>
                        <div className="flex gap-4 items-center mt-1">
                          <div className="w-[60px] h-[60px] rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-[#f8f7f4] text-slate-900">
                             {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (formData.watermarkLogoUrl ? <img src={formData.watermarkLogoUrl} className="max-w-[40px] max-h-[40px] object-contain" /> : <Camera className="h-5 w-5 text-slate-400" />)}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className="w-full text-center border border-slate-200 text-[#b69970] font-bold text-[13px] py-2 rounded-lg bg-white cursor-pointer hover:bg-[#f8f7f4] text-slate-900 transition-colors shadow-sm">
                               Choose File
                               <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkLogoUpload} />
                            </label>
                            <p className="text-[10px] text-slate-600 font-bold mt-2">PNG with transparent background recommended.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <label className="edit-label">Watermark Position</label>
                        <select 
                          className="edit-input font-bold tracking-wide mt-1"
                          value={formData.watermarkPosition}
                          onChange={e => setFormData({...formData, watermarkPosition: e.target.value as any})}
                        >
                          <option value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                          <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                          <option value="TOP_RIGHT">TOP RIGHT</option>
                          <option value="TOP_LEFT">TOP LEFT</option>
                          <option value="CENTER">CENTER</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Size ({formData.watermarkWidth}%)</label>
                        <input 
                          type="range" 
                          min="5" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkWidth}
                          onChange={e => setFormData({...formData, watermarkWidth: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkWidth}%`} as any}
                        />
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Opacity ({formData.watermarkOpacity}%)</label>
                        <input 
                          type="range" 
                          min="10" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkOpacity}
                          onChange={e => setFormData({...formData, watermarkOpacity: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkOpacity}%`} as any}
                        />
                      </div>
                    </div>

                    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                       <div className="bg-[#e8ebf0] text-[#64748b] text-[11px] font-bold px-4 py-2.5">
                          LIVE PREVIEW
                       </div>
                       <div className="relative w-full aspect-[3/2] bg-slate-200 flex items-center justify-center">
                          <img src="/wedding.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Preview Background" />
                          {formData.watermarkType === 'LOGO' && formData.watermarkLogoUrl && (
                             <img 
                               src={formData.watermarkLogoUrl} 
                               className="absolute pointer-events-none object-contain"
                               style={{
                                 opacity: formData.watermarkOpacity / 100,
                                 width: `${formData.watermarkWidth}%`,
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             />
                          )}
                          {formData.watermarkType === 'TEXT' && formData.watermarkText && (
                             <div 
                               className="absolute pointer-events-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-bold whitespace-nowrap"
                               style={{
                                 opacity: formData.watermarkOpacity / 100,
                                 fontSize: `${formData.watermarkWidth * 0.3}px`, 
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             >
                               {formData.watermarkText}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">P</span>
                  <span className="text-xs font-bold text-slate-600 uppercase">Add to Portfolio</span>
                  {saving && <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-2" />}
                </div>
                <div 
                  className={`toggle-switch ${saving ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  data-active={formData.addToPortfolio}
                  onClick={async () => {
                    if (saving) return;
                    const newValue = !formData.addToPortfolio;
                    
                    setFormData({...formData, addToPortfolio: newValue});
                    setSaving(true);
                    
                    try {
                      await apiClient.patch(`/event/${eventId}/portfolio-status`, { 
                        addToPortfolio: newValue 
                      });
                      
                      if (event) {
                        setEvent({...event, addToPortfolio: newValue});
                      }
                    } catch (err) {
                      toast.error("Failed to save portfolio status.");
                      setFormData({...formData, addToPortfolio: !newValue});
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>

              {event && mediaItems.length > 0 && hasSavedDetails && (
                <div className="pt-2 mb-4">
                  <div className="bg-[#f8f5f0] border border-[#e6d5c0] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                     <h4 className="text-sm font-bold text-slate-800 mb-1">Gallery is Ready</h4>
                     <p className="text-xs text-slate-500 mb-4">Share this link with your clients to view {mediaItems.length} media files.</p>
                     <div className="relative w-full h-[48px] mt-2">
                       <button
                         type="button"
                         onClick={() => setShowGalleryLink(true)}
                         className={`absolute inset-0 w-full h-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2 ${showGalleryLink ? 'opacity-0 pointer-events-none scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}
                       >
                         <span className="text-base leading-none">🔗</span> Generate Public Gallery Link
                       </button>
                       
                       <div className={`absolute inset-0 w-full h-full flex items-center bg-white border border-[#e6d5c0] rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${!showGalleryLink ? 'opacity-0 pointer-events-none scale-105 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                          <input 
                            type="text" 
                            readOnly 
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.code}`} 
                            className="flex-1 h-full bg-transparent text-[11px] sm:text-xs text-slate-600 px-3 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.code}`);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className="h-full bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] px-4 font-bold text-xs transition-colors border-l border-[#e6d5c0] flex items-center gap-1"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {linkCopied ? 'Copied' : 'Copy'}
                          </button>
                       </div>
                     </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 flex justify-center items-center bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Event Details'}
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this event permanently?')) {
                      try {
                        setSaving(true);
                        await apiClient.delete(`/event/${eventId}`);
                        router.push('/dashboard/events');
                      } catch (error) {
                        console.error('Error deleting event:', error);
                        toast.error('Error deleting event.');
                        setSaving(false);
                      }
                    }
                  }}
                  className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
      </div>

      {/* Preview Lightbox Modal */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {previewMedia.type === 'VIDEO' ? (
              <video 
                controls 
                autoPlay 
                src={previewMedia.compressedUrl || previewMedia.r2Url} 
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10"
              />
            ) : (
              <img 
                src={previewMedia.compressedUrl || previewMedia.r2Url} 
                alt="Preview" 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            )}

            <div className="mt-4 flex items-center gap-4 text-white text-xs font-medium">
              <span>Type: <strong>{previewMedia.type}</strong></span>
              <span>Status: <strong className="text-emerald-400">{previewMedia.processedStatus}</strong></span>
              <a 
                href={previewMedia.compressedUrl || previewMedia.r2Url} 
                target="_blank" 
                rel="noreferrer"
                className="underline text-[#c5a880] hover:text-white flex items-center gap-1"
              >
                Open Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
