'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, CheckCircle, Copy, ChevronDown, LayoutGrid, Sparkles, Crown, ArrowRight, ShieldCheck, Flame, RefreshCw, ZoomIn, Play, X, Clock, AlertTriangle, Zap, Activity, Gauge } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import { useAuth } from '../../../../lib/AuthContext';

export default function EventUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';

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
  const [coverDimensions, setCoverDimensions] = useState<{ width: number; height: number } | null>(null);
  const [coverRatioMismatch, setCoverRatioMismatch] = useState(false);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadStats, setUploadStats] = useState({
    speedMBps: '0.0',
    photosPerSec: '0',
    bytesUploaded: 0,
    totalBytes: 0,
    elapsedSec: 0,
    etaSec: 0,
    activeStreams: 0,
    compressedCount: 0,
    bytesSavedMB: '0.0',
  });
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  // Uncredited media in this event waiting to be saved & deducted
  const uncreditedPhotos = mediaItems.filter(item => item.type === 'PHOTO' && item.creditDeducted === false);
  const uncreditedVideos = mediaItems.filter(item => item.type === 'VIDEO' && item.creditDeducted === false);
  const pendingPhotosCount = credits?.photos?.pendingSave !== undefined ? credits.photos.pendingSave : uncreditedPhotos.length;
  const pendingVideosCount = credits?.videos?.pendingSave !== undefined ? credits.videos.pendingSave : uncreditedVideos.length;

  const currentPhotoRemaining = credits?.photos?.remaining !== undefined ? credits.photos.remaining : 0;
  const projectedPhotoRemaining = credits?.photos?.projectedRemaining !== undefined ? credits.photos.projectedRemaining : Math.max(0, currentPhotoRemaining - pendingPhotosCount);

  const currentVideoRemaining = credits?.videos?.remaining !== undefined ? credits.videos.remaining : 0;
  const projectedVideoRemaining = credits?.videos?.projectedRemaining !== undefined ? credits.videos.projectedRemaining : Math.max(0, currentVideoRemaining - pendingVideosCount);

  // Credit limit flags
  const isPhotoLimitReached = !isSuperAdmin && projectedPhotoRemaining <= 0 && credits?.photos?.remaining !== undefined;
  const isVideoLimitReached = !isSuperAdmin && projectedVideoRemaining <= 0 && credits?.videos?.remaining !== undefined;
  const isAllCreditsExhausted = !isSuperAdmin && isPhotoLimitReached && isVideoLimitReached;

  // Top Tier Plan Detection (Premium / Enterprise / 31999 / 4,00,000 photos limit)
  const isTopTierPlan = isSuperAdmin || Boolean(
    ['PREMIUM', 'ENTERPRISE'].includes((credits?.plan || '').toUpperCase()) ||
    ['PREMIUM', 'ENTERPRISE'].includes((credits?.planName || '').toUpperCase()) ||
    ['PREMIUM', 'ENTERPRISE'].includes((event?.studioId?.subscriptionPlan || '').toUpperCase()) ||
    (credits?.photos?.totalLimit && credits.photos.totalLimit >= 400000) ||
    (credits?.planName && /31999|enterprise|premium|vip|max/i.test(credits.planName)) ||
    (credits?.plan && /31999|enterprise|premium|vip|max/i.test(credits.plan))
  );
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
    
    const fileArray = Array.from(files);
    const totalBytes = fileArray.reduce((acc, f) => acc + (f.size || 0), 0);
    const startTime = Date.now();
    let bytesUploadedTotal = 0;
    let successful = 0;
    let failed = 0;
    let currentFileIndex = 0;
    let activeStreamsCount = 0;
    let compressedCount = 0;
    let bytesSavedTotal = 0;

    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: fileArray.length });
    setUploadStats({
      speedMBps: '0.0',
      photosPerSec: '0',
      bytesUploaded: 0,
      totalBytes,
      elapsedSec: 0,
      etaSec: 0,
      activeStreams: 0,
      compressedCount: 0,
      bytesSavedMB: '0.0',
    });
    
    try {
      // ── Step 1: Ultra-fast Parallel Presigned URLs Fetching in Chunks of 250 ──
      const presignedMap: Record<number, any> = {};
      const BATCH_SIZE = 250;
      const presignBatches: { startIdx: number; batch: File[] }[] = [];
      for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        presignBatches.push({ startIdx: i, batch: fileArray.slice(i, i + BATCH_SIZE) });
      }

      await Promise.all(
        presignBatches.map(async ({ startIdx, batch }) => {
          try {
            const res = await apiClient.post(`/media/event/${event._id}/presigned-urls`, {
              files: batch.map(f => ({
                name: f.name,
                type: f.type,
                size: f.size,
                folderPath: f.webkitRelativePath || ''
              }))
            });
            if (res.data?.urls) {
              res.data.urls.forEach((item: any, idx: number) => {
                presignedMap[startIdx + idx] = item;
              });
            }
          } catch (presignErr: any) {
            console.warn('[R2 Turbo Engine] Presigned URL batch warning, fallback will engage if needed:', presignErr);
          }
        })
      );

      // ── Step 2: Streamed Background Database Registration Buffer ──
      // Persists records in continuous chunks of 40-50 while uploads are streaming
      const mediaListToCreate: any[] = [];
      let flushChain = Promise.resolve();

      const flushMediaBuffer = async (force: boolean = false) => {
        if (mediaListToCreate.length >= 40 || (force && mediaListToCreate.length > 0)) {
          const chunk = mediaListToCreate.splice(0, mediaListToCreate.length);
          flushChain = flushChain.then(async () => {
            try {
              await apiClient.post(`/media/event/${event._id}/bulk-create`, { mediaList: chunk });
            } catch (dbErr) {
              console.error('[Bulk Create Chunk Error]:', dbErr);
            }
          });
        }
      };

      // ── Step 3: High-Frequency Real-Time Telemetry Ticker ──
      const statsTimer = setInterval(() => {
        const elapsedSec = Math.max(0.2, (Date.now() - startTime) / 1000);
        const speedMBps = ((bytesUploadedTotal / (1024 * 1024)) / elapsedSec).toFixed(1);
        const photosPerSec = (successful / elapsedSec).toFixed(0);
        const remainingBytes = Math.max(0, totalBytes - bytesUploadedTotal);
        const bytesPerSec = bytesUploadedTotal / elapsedSec;
        const etaSec = bytesPerSec > 0 ? Math.ceil(remainingBytes / bytesPerSec) : 0;
        const bytesSavedMB = (bytesSavedTotal / (1024 * 1024)).toFixed(1);

        setUploadStats({
          speedMBps,
          photosPerSec,
          bytesUploaded: bytesUploadedTotal,
          totalBytes,
          elapsedSec: Math.round(elapsedSec),
          etaSec,
          activeStreams: activeStreamsCount,
          compressedCount,
          bytesSavedMB,
        });
      }, 200);

      // ── Step 4: 32 Parallel Turbo Streams Directly to Cloudflare R2 ──
      const concurrency = Math.min(32, fileArray.length);

      const worker = async () => {
        while (currentFileIndex < fileArray.length) {
          const idx = currentFileIndex++;
          const file = fileArray[idx];
          const presignedItem = presignedMap[idx];
          activeStreamsCount++;

          const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.name);
          let fileToUpload: File = file;

          // ⚡ SMART HIGH-SPEED PHOTO COMPRESSION:
          // Photos > 2MB: Compress to <= 1.95MB via Web Worker (zero UI lag)
          // Photos <= 2MB: Skip compression completely for raw gigabit throughput
          if (!isVideo && file.size > 2 * 1024 * 1024) {
            try {
              const imageCompression = (await import('browser-image-compression')).default;
              const compPromise = imageCompression(file, {
                maxSizeMB: 1.95, // Strictly under 2MB target
                maxWidthOrHeight: 2560, // Crystal-clear 2.5K/4K resolution preservation
                useWebWorker: true,
                initialQuality: 0.88,
                fileType: file.type || 'image/jpeg',
              });
              const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Compression timeout')), 3500)
              );
              const compressedBlob = (await Promise.race([compPromise, timeoutPromise])) as Blob | null;
              if (compressedBlob && compressedBlob.size < file.size) {
                fileToUpload = new File([compressedBlob], file.name, {
                  type: compressedBlob.type || file.type || 'image/jpeg',
                  lastModified: file.lastModified,
                });
                compressedCount++;
                bytesSavedTotal += (file.size - compressedBlob.size);
              }
            } catch (compErr) {
              console.warn(`[Smart Compress] Fallback to raw for ${file.name}:`, compErr);
              fileToUpload = file;
            }
          }

          let uploadedSuccessfully = false;

          // Attempt 1: Direct Gigabit Cloudflare R2 PUT
          if (presignedItem && presignedItem.uploadUrl) {
            try {
              const response = await fetch(presignedItem.uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': fileToUpload.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
                },
                body: fileToUpload,
              });

              if (response.ok) {
                mediaListToCreate.push({
                  url: presignedItem.url,
                  publicId: presignedItem.publicId,
                  type: isVideo ? 'VIDEO' : 'PHOTO',
                  size: fileToUpload.size,
                  folderPath: file.webkitRelativePath || ''
                });
                successful++;
                bytesUploadedTotal += fileToUpload.size;
                uploadedSuccessfully = true;
                flushMediaBuffer(false);
              }
            } catch (directUploadErr) {
              console.warn('[Direct R2 PUT] fallback triggered:', directUploadErr);
            }
          }

          // Attempt 2: Resilient High-Speed Backend Upload Fallback
          if (!uploadedSuccessfully) {
            try {
              const backendForm = new FormData();
              backendForm.append('file', fileToUpload, fileToUpload.name);
              if (file.webkitRelativePath) {
                backendForm.append('folderPaths', file.webkitRelativePath);
              }
              const backendRes = await apiClient.post(`/media/event/${event._id}/upload`, backendForm, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              if (backendRes.data && backendRes.data.media) {
                successful++;
                bytesUploadedTotal += fileToUpload.size;
                uploadedSuccessfully = true;
              } else {
                throw new Error('Backend upload failed');
              }
            } catch (backendErr) {
              console.error('All upload methods failed for file:', file.name, backendErr);
              failed++;
            }
          }

          activeStreamsCount--;
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      };

      // Launch 32 parallel worker streams
      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      clearInterval(statsTimer);
      activeStreamsCount = 0;

      // Final flush of any remaining media documents to database
      await flushMediaBuffer(true);
      await flushChain;

      // ── Upload complete: show 100% telemetry then auto-dismiss ──
      setUploadProgress(prev => ({ ...prev, current: prev.total }));

      const totalElapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const finalSpeedMBps = ((bytesUploadedTotal / (1024 * 1024)) / totalElapsedSec).toFixed(1);
      const finalPhotosPerSec = (successful / totalElapsedSec).toFixed(0);
      const finalBytesSavedMB = (bytesSavedTotal / (1024 * 1024)).toFixed(1);

      setUploadStats(prev => ({
        ...prev,
        speedMBps: finalSpeedMBps,
        photosPerSec: finalPhotosPerSec,
        elapsedSec: totalElapsedSec,
        etaSec: 0,
        activeStreams: 0,
        compressedCount,
        bytesSavedMB: finalBytesSavedMB,
      }));

      setTimeout(() => {
        setUploadingMedia(false);
        setUploadProgress({ current: 0, total: 0 });
      }, 1800);

      if (failed > 0) {
        toast.error(`Uploaded ${successful}, failed ${failed}`);
      } else {
        toast.success(`⚡ Turbo Upload Complete: ${successful} files transferred in ${totalElapsedSec}s (${finalSpeedMBps} MB/s)${compressedCount > 0 ? ` • ${compressedCount} photos auto-compressed (${finalBytesSavedMB} MB saved)` : ''}! Click "Save Event Details" to lock.`, { duration: 6000 });
      }

      // Refresh event data & credits in background
      fetchEventDetails();
      fetchCredits();
      window.dispatchEvent(new Event('studio_plan_updated'));
    } catch (err: any) {
       console.error('Upload error:', err);
       toast.error(err?.response?.data?.error || err.message || 'Upload failed. Please check console.');
       setUploadingMedia(false);
       setUploadProgress({ current: 0, total: 0 });
    } finally {
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
      case 'TOP_LEFT':
        return { top: '5%', left: '5%', right: 'auto', bottom: 'auto', transform: 'none' };
      case 'TOP_RIGHT':
        return { top: '5%', right: '5%', left: 'auto', bottom: 'auto', transform: 'none' };
      case 'TOP':
      case 'TOP_CENTER':
        return { top: '5%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' };
      case 'BOTTOM_LEFT':
        return { bottom: '5%', left: '5%', right: 'auto', top: 'auto', transform: 'none' };
      case 'CENTER':
        return { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' };
      case 'BOTTOM':
      case 'BOTTOM_CENTER':
        return { bottom: '5%', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' };
      case 'BOTTOM_RIGHT':
      default:
        return { bottom: '5%', right: '5%', left: 'auto', top: 'auto', transform: 'none' };
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
    code: '',
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
  const [isCustomType, setIsCustomType] = useState(false);

  useEffect(() => {
    if (event) {
      const isCustom = !!event.type && !EVENT_TYPES.includes(event.type);
      setIsCustomType(isCustom);
      setFormData({
        name: event.name || '',
        code: event.code || '',
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
    if (!formData.coverImageUrl) {
      setCoverDimensions(null);
      setCoverRatioMismatch(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = w / h;
      const targetRatio = 16 / 9;
      const is16by9 = Math.abs(ratio - targetRatio) <= 0.05;
      setCoverDimensions({ width: w, height: h });
      setCoverRatioMismatch(!is16by9);
    };
    img.src = formData.coverImageUrl;
  }, [formData.coverImageUrl]);

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
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-3 xs:p-4 md:p-8 font-poppins">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 w-full sm:w-auto">
            <Link 
              href="/dashboard/events" 
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px]"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
              <span>Back</span>
              <span className="hidden xs:inline">to Events</span>
            </Link>

            <button
              onClick={() => { fetchEventDetails(); fetchCredits(); }}
              className="sm:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 transition-all shadow-xs cursor-pointer shrink-0"
              title="Refresh Storage Credits & Media"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 min-w-0 flex-1 sm:border-l-2 sm:border-slate-200 sm:pl-4">
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate max-w-full">
              {event.name}
            </h1>
            {(() => {
              const baseDateStr = event.date || event.createdAt;
              if (!baseDateStr) return null;
              const baseDate = new Date(baseDateStr);
              const now = new Date();
              const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();
              const diffDays = Math.floor((todayMidnight - baseMidnight) / (1000 * 60 * 60 * 24));
              const days = diffDays <= 0 ? 30 : Math.max(0, 30 - diffDays);
              const label = days === 0 ? 'Expires today' : `${days} ${days === 1 ? 'day' : 'days'} left`;
              return (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs shrink-0">
                  <Clock className={`w-3.5 h-3.5 ${days <= 5 ? 'text-rose-500 animate-pulse' : 'text-[#c5a880]'}`} />
                  <span>{label}</span>
                </span>
              );
            })()}
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => { fetchEventDetails(); fetchCredits(); }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 transition-all shadow-xs cursor-pointer"
              title="Refresh Storage Credits & Media"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sleek, Ultra-Modern Storage Credits Box */}
        <div className="w-full max-w-4xl mx-auto p-[1px] rounded-3xl bg-gradient-to-r from-[#c5a880]/30 via-white/10 to-[#c5a880]/40 shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_50px_rgba(197,168,128,0.18)] transition-all duration-500 group relative">
          
          <div className="w-full bg-[#0b0b0e]/95 backdrop-blur-2xl text-white rounded-[23px] p-3.5 xs:p-4 sm:p-5 relative overflow-hidden">
            {/* Ambient Animated Aura Lighting */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-[#c5a880]/20 via-[#f3d9a2]/10 to-transparent rounded-full blur-[65px] pointer-events-none animate-aura-breathe" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-[#9c7c56]/20 via-[#c5a880]/10 to-transparent rounded-full blur-[65px] pointer-events-none animate-aura-breathe [animation-delay:2.5s]" />
            
            {/* Subtle Grid / Starfield Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />
            
            {/* Glowing Accent Top Beam */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent animate-beam-scan pointer-events-none" />

            {/* Header Row */}
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#2a241d] to-[#141312] text-[#e6d0a7] border border-[#c5a880]/40 flex items-center justify-center shadow-[0_0_15px_rgba(197,168,128,0.25)] shrink-0 relative group/icon">
                  <div className="absolute inset-0 rounded-xl bg-[#c5a880]/20 blur-sm opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300" />
                  <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#f3d9a2] animate-pulse-soft relative z-10" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-[0.16em] bg-gradient-to-r from-amber-100 via-[#f5deb3] to-[#c5a880] bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {credits?.planName || 'Standard'} Plan Storage
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                      Live Balance • Deducts on event save
                    </p>
                  </div>
                </div>
              </div>

              {/* White Luxe Upgrade Button OR Top Tier Badge */}
              {isTopTierPlan ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-yellow-400/15 to-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-xs" />
                  <span className="font-extrabold tracking-wider">Top Tier Plan</span>
                </div>
              ) : (
                <Link
                  href="/dashboard/plans-billing"
                  className="relative overflow-hidden group/btn inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-950 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 border border-white shrink-0 cursor-pointer"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none" />
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 drop-shadow-xs" />
                  <span className="font-extrabold tracking-wide">Upgrade</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] text-slate-950 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            {/* 2 Credit Metric Cards: Photos & Videos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 relative z-10">
              
              {/* Photo Credits Card */}
              <div className={`relative rounded-2xl p-3 xs:p-3.5 sm:p-4 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border transition-all duration-300 group/card shadow-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden flex flex-col justify-between space-y-2.5 sm:space-y-3 ${pendingPhotosCount > 0 ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-white/10 hover:border-[#c5a880]/50'}`}>
                {/* Glowing top line highlight */}
                <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${pendingPhotosCount > 0 ? 'via-amber-400 opacity-100' : 'via-[#c5a880]/40 group-hover/card:via-[#c5a880] opacity-70 group-hover/card:opacity-100'} transition-all duration-500`} />
                
                {/* Card Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#c5a880]/20 to-[#c5a880]/5 border border-[#c5a880]/30 flex items-center justify-center text-[#e6d0a7] shadow-[0_0_10px_rgba(197,168,128,0.15)] shrink-0">
                      <ImageIcon className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover/card:text-white transition-colors tracking-wider uppercase">
                      Photos
                    </span>
                  </div>

                  {pendingPhotosCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[9px] xs:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse shrink-0">
                      ⏳ {pendingPhotosCount} Pending Save
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 text-[9px] xs:text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 shrink-0 ${isPhotoLimitReached ? 'text-red-400 bg-red-500/15 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-[#f5deb3] bg-[#c5a880]/15 border-[#c5a880]/30 shadow-[0_0_10px_rgba(197,168,128,0.12)] group-hover/card:border-[#c5a880]/60'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      {credits?.photos ? `${Number(currentPhotoRemaining).toLocaleString('en-IN')} Left` : 'Active'}
                    </span>
                  )}
                </div>

                {/* Primary Numbers */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono group-hover/card:text-[#fef3c7] transition-colors leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(currentPhotoRemaining).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-bold font-mono tracking-wide">
                      / {credits?.photos?.totalLimit ? Number(credits.photos.totalLimit).toLocaleString('en-IN') : '---'}
                    </span>
                  </div>

                  {pendingPhotosCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300/90 pt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        ⚡ -{pendingPhotosCount} on Save
                      </span>
                      <span className="text-slate-300 flex items-center gap-1">
                        → <strong className="text-white font-black bg-white/10 px-1 py-0.5 rounded">{Number(projectedPhotoRemaining).toLocaleString('en-IN')}</strong> Remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* High-Tech Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="relative w-full bg-black/60 rounded-full h-2 p-[1px] overflow-hidden border border-white/10 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-[#9c7c56] via-[#c5a880] to-[#fde68a] h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden animate-progress-stripe shadow-[0_0_10px_rgba(197,168,128,0.5)]"
                      style={{ 
                        width: (credits?.photos?.used || 0) > 0 
                          ? `${Math.min(100, Math.max(2, credits?.photos?.percentUsed || 0))}%` 
                          : '0%' 
                      }}
                    >
                      {/* Sweeping Shimmer Highlight */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-credit-shimmer" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] xs:text-[10px] font-mono tracking-wide text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                      {(credits?.photos?.used || 0) > 0 ? `${Number(credits.photos.used).toLocaleString('en-IN')} Used (${(credits.photos.percentUsed || 0) < 0.01 ? '0.01%' : `${credits.photos.percentUsed}%`})` : '0 Used'}
                    </span>
                    {pendingPhotosCount > 0 ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                        +{pendingPhotosCount} queued
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover/card:text-slate-300 transition-colors">
                        {100 - Math.min(100, Math.round(credits?.photos?.percentUsed || 0))}% Available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Credits Card */}
              <div className={`relative rounded-2xl p-3 xs:p-3.5 sm:p-4 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border transition-all duration-300 group/card shadow-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden flex flex-col justify-between space-y-2.5 sm:space-y-3 ${pendingVideosCount > 0 ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-white/10 hover:border-[#c5a880]/50'}`}>
                {/* Glowing top line highlight */}
                <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${pendingVideosCount > 0 ? 'via-amber-400 opacity-100' : 'via-[#c5a880]/40 group-hover/card:via-[#c5a880] opacity-70 group-hover/card:opacity-100'} transition-all duration-500`} />
                
                {/* Card Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#c5a880]/20 to-[#c5a880]/5 border border-[#c5a880]/30 flex items-center justify-center text-[#e6d0a7] shadow-[0_0_10px_rgba(197,168,128,0.15)] shrink-0">
                      <Video className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover/card:text-white transition-colors tracking-wider uppercase">
                      Videos
                    </span>
                  </div>

                  {pendingVideosCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[9px] xs:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse shrink-0">
                      ⏳ {pendingVideosCount} Pending Save
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 text-[9px] xs:text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 shrink-0 ${isVideoLimitReached ? 'text-red-400 bg-red-500/15 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-[#f5deb3] bg-[#c5a880]/15 border-[#c5a880]/30 shadow-[0_0_10px_rgba(197,168,128,0.12)] group-hover/card:border-[#c5a880]/60'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      {credits?.videos ? `${Number(currentVideoRemaining)} Left` : 'Active'}
                    </span>
                  )}
                </div>

                {/* Primary Numbers */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono group-hover/card:text-[#fef3c7] transition-colors leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(currentVideoRemaining)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-bold font-mono tracking-wide">
                      / {credits?.videos?.totalLimit ? Number(credits.videos.totalLimit) : '---'}
                    </span>
                  </div>

                  {pendingVideosCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300/90 pt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        ⚡ -{pendingVideosCount} on Save
                      </span>
                      <span className="text-slate-300 flex items-center gap-1">
                        → <strong className="text-white font-black bg-white/10 px-1 py-0.5 rounded">{Number(projectedVideoRemaining)}</strong> Remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* High-Tech Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="relative w-full bg-black/60 rounded-full h-2 p-[1px] overflow-hidden border border-white/10 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-[#9c7c56] via-[#c5a880] to-[#fde68a] h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden animate-progress-stripe shadow-[0_0_10px_rgba(197,168,128,0.5)]"
                      style={{ 
                        width: (credits?.videos?.used || 0) > 0 
                          ? `${Math.min(100, Math.max(2, credits?.videos?.percentUsed || 0))}%` 
                          : '0%' 
                      }}
                    >
                      {/* Sweeping Shimmer Highlight */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-credit-shimmer" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] xs:text-[10px] font-mono tracking-wide text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                      {(credits?.videos?.used || 0) > 0 ? `${credits.videos.used} Used (${(credits.videos.percentUsed || 0) < 0.01 ? '0.01%' : `${credits.videos.percentUsed}%`})` : '0 Used'}
                    </span>
                    {pendingVideosCount > 0 ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                        +{pendingVideosCount} queued
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover/card:text-slate-300 transition-colors">
                        {100 - Math.min(100, Math.round(credits?.videos?.percentUsed || 0))}% Available
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2-Column Content Layout (Upload Media & Media Files on Left, Edit Event Details on Right - level with each other!) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Upload Media & Media Files */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm mb-6 sm:mb-8">
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 text-center">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-[#c5a880] mb-2 sm:mb-3" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Upload Media</h2>
              <p className="text-xs sm:text-sm text-slate-500">Select a category below or drag and drop files.</p>
            </div>

            {/* Credit Exhausted Warning Banner */}
            {isAllCreditsExhausted && (
              <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">All Storage Credits Exhausted</p>
                    <p className="text-xs text-red-500 mt-0.5">Your photo and video upload limits have been reached.</p>
                  </div>
                </div>
                {!isTopTierPlan && (
                  <Link href="/dashboard/plans-billing" className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0">
                    Upgrade
                  </Link>
                )}
              </div>
            )}
            {!isAllCreditsExhausted && (isPhotoLimitReached || isVideoLimitReached) && (
              <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-700">
                      {isPhotoLimitReached ? 'Photo' : 'Video'} Credits Exhausted
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Your {isPhotoLimitReached ? 'photo' : 'video'} upload limit has been reached. You can still upload {isPhotoLimitReached ? 'videos' : 'photos'}.
                    </p>
                  </div>
                </div>
                {!isTopTierPlan && (
                  <Link href="/dashboard/plans-billing" className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0">
                    Upgrade
                  </Link>
                )}
              </div>
            )}

            {/* Pending Save Alert Banner */}
            {(pendingPhotosCount > 0 || pendingVideosCount > 0) && (
              <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-600 shadow-inner">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      <span>
                        {pendingPhotosCount > 0 && `${pendingPhotosCount} Photo${pendingPhotosCount > 1 ? 's' : ''}`}
                        {pendingPhotosCount > 0 && pendingVideosCount > 0 && ' & '}
                        {pendingVideosCount > 0 && `${pendingVideosCount} Video${pendingVideosCount > 1 ? 's' : ''}`} Uploaded
                      </span>
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 font-mono font-bold shrink-0">
                        Pending Save
                      </span>
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                      Your credit balance will deduct <strong className="text-slate-900 font-bold">{pendingPhotosCount > 0 ? `-${pendingPhotosCount} photo credit${pendingPhotosCount > 1 ? 's' : ''}` : ''}</strong> once you click <strong>Save Event Details</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('save-event-button');
                    btn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    btn?.focus();
                  }}
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-[#09090b] text-[11px] font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg shrink-0 cursor-pointer"
                >
                  Save Event Details →
                </button>
              </div>
            )}

            {/* ⚡ High-Speed Real-time Upload Telemetry Banner */}
            {uploadingMedia && (
              <div className={`mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#e8ded1] text-slate-900 shadow-md animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden ring-1 ring-slate-100 ${
                uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total
                  ? 'border-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.12)]'
                  : 'shadow-[0_4px_20px_rgba(197,168,128,0.12)]'
              }`}>
                {/* Gold Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-3">
                    {uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#faf6f0] border border-[#ebdccb] flex items-center justify-center text-[#c5a880] shadow-xs">
                        <Zap className="w-5 h-5 text-[#c5a880] animate-pulse fill-[#c5a880]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                          {uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total
                            ? '⚡ Upload Complete'
                            : '⚡ R2 Turbo Stream Active (32 Threads)'}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                          GIGABIT
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total
                          ? `All ${uploadProgress.total} files successfully secured on Cloudflare R2`
                          : `Streaming ${uploadProgress.current} of ${uploadProgress.total} files directly to Cloudflare R2...`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-2.5 py-1 rounded-lg bg-[#faf7f2] border border-[#ece3d5] text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Speed</span>
                      <span className="text-xs font-mono font-black text-[#b69970]">{uploadStats.speedMBps} MB/s</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-[#faf7f2] border border-[#ece3d5] text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Rate</span>
                      <span className="text-xs font-mono font-black text-emerald-600">{uploadStats.photosPerSec} /s</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#c5a880]/15 text-[#8c6f47] border border-[#c5a880]/30 font-mono font-black text-sm">
                      {uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0}%
                    </div>
                  </div>
                </div>

                {/* Loading Patti (Progress strip) */}
                <div className="w-full h-2.5 bg-[#f3efe8] rounded-full overflow-hidden mb-2 border border-[#e5ddd0] relative p-[1px]">
                  <div 
                    className={`h-full transition-all duration-200 rounded-full relative overflow-hidden ${
                      uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-[#b69970] via-[#c5a880] to-[#b69970]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-turbo-shimmer" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>{uploadProgress.current} / {uploadProgress.total} Files Streamed</span>
                  </span>
                  <span>
                    {uploadStats.etaSec > 0 ? `ETA: ~${uploadStats.etaSec}s remaining` : `Elapsed: ${uploadStats.elapsedSec}s`}
                  </span>
                </div>

                {/* Smart Compression Telemetry Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Zap className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" />
                    <span>Smart Compression: Photos &gt; 2MB &rarr; &lt; 2MB | Videos &gt; 18MB &rarr; 15-20MB</span>
                  </div>
                  {uploadStats.compressedCount > 0 && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✨ {uploadStats.compressedCount} Photos Compressed ({uploadStats.bytesSavedMB} MB Saved)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 3 Upload Action Buttons (Responsive Grid) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
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
                className={`border rounded-xl p-3 sm:p-6 flex flex-col items-center justify-center text-center transition-all group ${
                  isAllCreditsExhausted 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md active:scale-95'
                }`}
              >
                <FolderUp className={`h-6 w-6 sm:h-8 sm:w-8 mb-1.5 sm:mb-3 transition-colors shrink-0 ${isAllCreditsExhausted ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-xs sm:text-sm leading-tight ${isAllCreditsExhausted ? 'text-slate-400' : 'text-slate-700'}`}>Entire Folder</span>
                {isAllCreditsExhausted && <span className="text-[9px] sm:text-[10px] font-bold text-red-400 mt-1 uppercase">Exhausted</span>}
              </div>

              <div 
                onClick={() => {
                  if (isPhotoLimitReached) {
                    toast.error('📸 Photo credits exhausted! Please upgrade your plan to upload more photos.', { duration: 4000 });
                    return;
                  }
                  photoInputRef.current?.click();
                }}
                className={`border rounded-xl p-3 sm:p-6 flex flex-col items-center justify-center text-center transition-all group ${
                  isPhotoLimitReached 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md active:scale-95'
                }`}
              >
                <ImageIcon className={`h-6 w-6 sm:h-8 sm:w-8 mb-1.5 sm:mb-3 transition-colors shrink-0 ${isPhotoLimitReached ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-xs sm:text-sm leading-tight ${isPhotoLimitReached ? 'text-slate-400' : 'text-slate-700'}`}>Photos</span>
                {isPhotoLimitReached && <span className="text-[9px] sm:text-[10px] font-bold text-red-400 mt-1 uppercase">Exhausted</span>}
              </div>

              <div 
                onClick={() => {
                  if (isVideoLimitReached) {
                    toast.error('🎬 Video credits exhausted! Please upgrade your plan to upload more videos.', { duration: 4000 });
                    return;
                  }
                  videoInputRef.current?.click();
                }}
                className={`border rounded-xl p-3 sm:p-6 flex flex-col items-center justify-center text-center transition-all group ${
                  isVideoLimitReached 
                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50' 
                    : 'bg-white border-slate-200 cursor-pointer hover:border-[#c5a880] hover:shadow-md active:scale-95'
                }`}
              >
                <Video className={`h-6 w-6 sm:h-8 sm:w-8 mb-1.5 sm:mb-3 transition-colors shrink-0 ${isVideoLimitReached ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#c5a880]'}`} />
                <span className={`font-bold text-xs sm:text-sm leading-tight ${isVideoLimitReached ? 'text-slate-400' : 'text-slate-700'}`}>Videos</span>
                {isVideoLimitReached && <span className="text-[9px] sm:text-[10px] font-bold text-red-400 mt-1 uppercase">Exhausted</span>}
              </div>
            </div>
          </div>

          <div className="mt-8">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Media Files ({mediaItems.filter(item => mediaFilter === 'ALL' || item.type === mediaFilter).length})</h3>
                  {mediaItems.length > 0 && (
                    <button 
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedMediaIds([]);
                      }}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider min-h-[36px] flex items-center cursor-pointer ${isSelectionMode ? 'bg-[#c5a880] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
                  )}
                  {isSelectionMode && selectedMediaIds.length > 0 && (
                    <button 
                      onClick={() => handleDeleteMedia(selectedMediaIds)}
                      disabled={isDeleting}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 uppercase tracking-wider min-h-[36px] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isDeleting ? 'Deleting...' : `Delete (${selectedMediaIds.length})`}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                   <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-[#ede5d8] ring-1 ring-black/5 relative overflow-hidden flex flex-col items-center text-center">
                      {/* Top gold accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent" />
                      {/* Soft ambient background glow */}
                      <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#c5a880]/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                      {uploadProgress.total > 0 && uploadProgress.current >= uploadProgress.total ? (
                        <div className="w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-400">
                          {/* Circular Success Badge */}
                          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                              <circle cx="60" cy="60" r="50" className="stroke-emerald-100" strokeWidth="8" fill="transparent" />
                              <circle cx="60" cy="60" r="50" stroke="#10b981" strokeWidth="8" strokeDasharray={314.16} strokeDashoffset={0} strokeLinecap="round" fill="transparent" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                                <Check className="h-7 w-7 stroke-[3] text-emerald-600" />
                              </div>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> Upload Complete
                          </div>

                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                            All Files Uploaded!
                          </h3>
                          <p className="text-xs font-medium text-slate-500 mb-5 max-w-sm">
                            All <span className="text-slate-900 font-bold font-mono">{uploadProgress.total.toLocaleString()}</span> files were successfully streamed to Cloudflare R2 and synced with your event gallery.
                          </p>

                          {/* Completed Green Loading Patti */}
                          <div className="w-full bg-emerald-100 rounded-full h-3 mb-4 overflow-hidden border border-emerald-200 shadow-inner">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-full rounded-full transition-all duration-500 shadow-sm" />
                          </div>

                          <div className="w-full grid grid-cols-3 gap-2 text-xs font-mono mb-2">
                            <div className="p-2.5 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-slate-700">
                              <span className="text-[10px] text-slate-400 block uppercase">Total Files</span>
                              <span className="font-black text-slate-900">{uploadProgress.total}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-slate-700">
                              <span className="text-[10px] text-slate-400 block uppercase">Speed</span>
                              <span className="font-black text-[#c5a880]">{uploadStats.speedMBps} MB/s</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-slate-700">
                              <span className="text-[10px] text-slate-400 block uppercase">Total Time</span>
                              <span className="font-black text-slate-900">{uploadStats.elapsedSec}s</span>
                            </div>
                          </div>

                          {uploadStats.compressedCount > 0 && (
                            <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800 flex items-center justify-between">
                              <span>✨ Auto-Compressed (&lt; 2MB):</span>
                              <span className="font-black">{uploadStats.compressedCount} Photos ({uploadStats.bytesSavedMB} MB Saved)</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center text-center">
                          {/* Top Badge */}
                          <div className="flex items-center justify-between w-full mb-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f2] border border-[#ece3d5] text-[#8c6f47] text-[10px] font-mono font-bold uppercase tracking-wider">
                              <Zap className="w-3 h-3 text-[#c5a880] fill-[#c5a880] animate-pulse" />
                              32 Parallel Streams
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[9px] font-bold">
                              R2 DIRECT
                            </span>
                          </div>

                          {/* 🔄 CIRCULAR PROGRESS LOADER */}
                          <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                              {/* Background Circle */}
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                className="stroke-[#f3ede4]"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              {/* Progress Animated Circle */}
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="#c5a880"
                                strokeWidth="8"
                                strokeDasharray={314.16}
                                strokeDashoffset={314.16 - ((Math.min(100, Math.round((uploadProgress.current / uploadProgress.total) * 100)) || 0) / 100) * 314.16}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-300 ease-out"
                              />
                            </svg>
                            {/* Inner Circle Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none font-mono">
                                {Math.round((uploadProgress.current / uploadProgress.total) * 100) || 0}%
                              </span>
                              <span className="text-[10px] font-bold text-[#b69970] uppercase tracking-widest mt-1">
                                Uploading
                              </span>
                            </div>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 tracking-tight mb-0.5">
                            Uploading Photos &amp; Media
                          </h3>
                          <p className="text-[11px] font-medium text-slate-500 mb-4">
                            Direct high-speed streaming to Cloudflare R2
                          </p>

                          {/* ── LOADING PATTI (Progress Strip) ── */}
                          <div className="w-full relative mb-2">
                            <div className="w-full bg-[#f3ede4] rounded-full h-3.5 overflow-hidden shadow-inner border border-[#e5ded2] p-[2px]">
                              <div
                                className="h-full bg-gradient-to-r from-[#b69970] via-[#c5a880] to-[#b69970] rounded-full transition-all duration-200 relative overflow-hidden shadow-sm"
                                style={{ width: `${Math.max(3, (uploadProgress.current / uploadProgress.total) * 100)}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-turbo-shimmer" />
                              </div>
                            </div>
                          </div>

                          {/* Files Count & ETA Strip Footer */}
                          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-600 mb-4 px-1">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" />
                              {uploadProgress.current.toLocaleString()} <span className="text-slate-400 font-normal">/</span> {uploadProgress.total.toLocaleString()} Files
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {uploadStats.etaSec > 0 ? `ETA: ~${uploadStats.etaSec}s left` : `${uploadStats.elapsedSec}s elapsed`}
                            </span>
                          </div>

                          {/* 4 Telemetry Stats in White Theme */}
                          <div className="w-full grid grid-cols-4 gap-2 mb-3 font-mono">
                            <div className="p-2 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-center shadow-xs">
                              <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                <Zap className="w-2.5 h-2.5 text-[#c5a880]" /> Speed
                              </div>
                              <span className="text-xs font-black text-[#b69970] block">{uploadStats.speedMBps}</span>
                              <span className="text-[8px] text-slate-400 font-sans">MB/s</span>
                            </div>

                            <div className="p-2 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-center shadow-xs">
                              <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                <Activity className="w-2.5 h-2.5 text-emerald-600" /> Rate
                              </div>
                              <span className="text-xs font-black text-emerald-600 block">{uploadStats.photosPerSec}</span>
                              <span className="text-[8px] text-slate-400 font-sans">Files/s</span>
                            </div>

                            <div className="p-2 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-center shadow-xs">
                              <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                <Clock className="w-2.5 h-2.5 text-sky-600" /> Time
                              </div>
                              <span className="text-xs font-black text-sky-600 block">{uploadStats.elapsedSec}s</span>
                              <span className="text-[8px] text-slate-400 font-sans">Elapsed</span>
                            </div>

                            <div className="p-2 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-center shadow-xs">
                              <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-purple-600" /> ETA
                              </div>
                              <span className="text-xs font-black text-purple-600 block">{uploadStats.etaSec > 0 ? `${uploadStats.etaSec}s` : '...'}</span>
                              <span className="text-[8px] text-slate-400 font-sans">Remaining</span>
                            </div>
                          </div>

                          {/* Smart Compression Pill */}
                          <div className="w-full p-2.5 rounded-xl bg-[#faf7f2] border border-[#ece3d5] text-[10px] font-mono text-slate-600 flex flex-wrap items-center justify-between gap-1 shadow-xs">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Zap className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" />
                              <span>Smart Compression: &gt;2MB &rarr; &lt;2MB | Videos &gt;18MB</span>
                            </div>
                            {uploadStats.compressedCount > 0 && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                ✨ {uploadStats.compressedCount} Compressed ({uploadStats.bytesSavedMB} MB Saved)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                   </div>
                </div>
            )}

             {mediaItems.length === 0 ? (
               <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-500 text-sm">
                 No media files uploaded yet. Select files to start.
               </div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 pb-12">
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
            <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm sticky top-8">
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
                
                const cleanSlug = (formData.code || formData.name)
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-|-$/g, '');

                const payload = {
                  ...formData,
                  name: formData.name.trim(),
                  code: cleanSlug,
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
                  setFormData(prev => ({
                    ...prev,
                    name: res.data.event.name,
                    code: res.data.event.code
                  }));
                  setHasSavedDetails(true);
                  if (res.data.credits) {
                    setCredits(res.data.credits);
                  }
                  window.dispatchEvent(new Event('studio_plan_updated'));
                  await fetchEventDetails();
                  await fetchCredits();

                  if (res.data.deductedPhotos > 0) {
                    toast.success(
                      `🎉 Event saved! ${res.data.deductedPhotos} photo credit${res.data.deductedPhotos > 1 ? 's' : ''} deducted. Remaining: ${Number(res.data.credits?.photos?.remaining ?? 0).toLocaleString('en-IN')} credits.`,
                      { duration: 6000 }
                    );
                  } else {
                    toast.success('Event updated successfully!');
                  }
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
                  onChange={e => {
                    const newName = e.target.value;
                    const autoSlug = newName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                    setFormData({
                      ...formData, 
                      name: newName,
                      code: autoSlug
                    });
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="edit-label mb-0">Public Gallery Link / Slug</label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Auto-synced with name
                  </span>
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus-within:border-[#c5a880] focus-within:bg-white transition-all">
                  <span className="font-semibold text-slate-400 select-none">/e/</span>
                  <input 
                    type="text" 
                    className="bg-transparent flex-1 font-bold text-slate-900 outline-none px-1 min-w-0"
                    placeholder="event-slug"
                    value={formData.code}
                    onChange={e => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      setFormData({ ...formData, code: clean });
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  Share link: <span className="font-mono text-slate-700 font-semibold">{typeof window !== 'undefined' ? window.location.origin : ''}/e/{formData.code || 'event-slug'}</span>
                </p>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="edit-label !mb-0">Event Type</label>
                    <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-wider bg-[#c5a880]/10 px-2 py-0.5 rounded-md border border-[#c5a880]/20">
                      {formData.type || 'WEDDING'}
                    </span>
                  </div>
                  <select 
                    className="edit-input font-bold" 
                    value={EVENT_TYPES.includes(formData.type) ? formData.type : 'CUSTOM'}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomType(true);
                      } else {
                        setIsCustomType(false);
                        setFormData({...formData, type: e.target.value});
                      }
                    }}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="CUSTOM">+ CUSTOM EVENT TYPE</option>
                  </select>
                  {(!EVENT_TYPES.includes(formData.type) || isCustomType) && (
                    <div className="mt-2 relative animate-fade-in">
                      <input 
                        type="text" 
                        className="edit-input border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 font-bold" 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Whatever you type will be saved as this event&apos;s type</p>
                    </div>
                  )}
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
                
                {/* 🔴 Top Notice in Red Text - Shown ONLY if ratio is NOT 16:9 */}
                {coverRatioMismatch && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 shadow-xs mb-2.5 animate-in fade-in duration-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-red-700">Notice:</span> Image is not in <strong>1920 × 1080 px (16:9 ratio)</strong> and will not fit properly!
                      {coverDimensions && (
                        <span className="block font-mono text-[10px] text-red-600 mt-0.5 font-bold">
                          Current Size: {coverDimensions.width} × {coverDimensions.height} px • Required: 1920 × 1080 px (16:9)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 🟢 Green Success - Shown when 16:9 ratio is verified */}
                {formData.coverImageUrl && !coverRatioMismatch && coverDimensions && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 shadow-xs mb-2.5 animate-in fade-in duration-300">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <div className="text-[11px] font-medium leading-tight">
                      <span className="font-bold text-emerald-700">Perfect Fit:</span> Cover image matches 16:9 ratio ({coverDimensions.width} × {coverDimensions.height} px).
                    </div>
                  </div>
                )}

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
                  <div className="w-full xs:w-44 aspect-video rounded-xl border border-slate-300 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 relative shadow-xs">
                    {formData.coverImageUrl ? (
                      <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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

                        // Pre-check dimensions via object URL
                        const objectUrl = URL.createObjectURL(file);
                        const testImg = new Image();
                        testImg.onload = () => {
                          const w = testImg.naturalWidth;
                          const h = testImg.naturalHeight;
                          const ratio = w / h;
                          const is16by9 = Math.abs(ratio - 16 / 9) <= 0.05;
                          setCoverDimensions({ width: w, height: h });
                          setCoverRatioMismatch(!is16by9);
                          if (!is16by9) {
                            toast.error(`Warning: Image is not in 1920 × 1080 px (16:9 ratio)! (Current: ${w} × ${h} px)`, {
                              duration: 5000,
                              icon: '⚠️'
                            });
                          }
                          URL.revokeObjectURL(objectUrl);
                        };
                        testImg.src = objectUrl;

                        setUploadingCover(true);
                        try {
                          const uploadData = new FormData();
                          uploadData.append('file', file);
                          const res = await apiClient.post('/media/upload-asset', uploadData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data && res.data.url) {
                            setFormData(prev => ({ ...prev, coverImageUrl: res.data.url }));
                            toast.success('Cover image updated');
                          }
                        } catch (err) {
                          console.error("Cover upload failed", err);
                          toast.error('Failed to upload cover');
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                    />
                    <div className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 text-center hover:bg-slate-50 hover:border-[#c5a880] transition-colors cursor-pointer shadow-xs">
                      {uploadingCover ? 'Uploading...' : (formData.coverImageUrl ? 'Change Cover Image' : 'Choose File')}
                    </div>
                  </div>
                </div>

                {/* 🔴 Bottom Warning in Red if Ratio Does NOT Match */}
                {coverRatioMismatch && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 shadow-xs mt-2.5 animate-in fade-in duration-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-700 leading-tight">
                        ⚠️ Warning: This image is not in 1920 × 1080 px (16:9 ratio) and will not fit properly!
                      </p>
                      {coverDimensions && (
                        <p className="text-[11px] font-mono text-red-600 mt-0.5">
                          Current Size: {coverDimensions.width} × {coverDimensions.height} px • Required: 1920 × 1080 px (16:9)
                        </p>
                      )}
                    </div>
                  </div>
                )}
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

                {formData.customWatermark && (() => {
                  const previewFontSize = Math.max(13, Math.round((Number(formData.watermarkWidth || 20) / 100) * 44 + 6));

                  return (
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
                          <div className="flex items-center justify-between">
                            <label className="edit-label">Watermark Text</label>
                            <span className="text-[10px] font-bold text-emerald-600">Live Instant Preview</span>
                          </div>
                          <input 
                            type="text" 
                            className="edit-input font-medium" 
                            placeholder="Enter watermark text..."
                            value={formData.watermarkText}
                            onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="edit-label">Watermark Logo Image</label>
                          <div className="flex gap-4 items-center mt-1">
                            <div className="w-[60px] h-[60px] rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-[#f8f7f4] text-slate-900">
                               {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (formData.watermarkLogoUrl ? <img src={formData.watermarkLogoUrl} className="max-w-[40px] max-h-[40px] object-contain" alt="Logo preview" /> : <Camera className="h-5 w-5 text-slate-400" />)}
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

                      {/* Watermark Position Dropdown */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
                        <label className="edit-label text-slate-700 font-bold mb-1.5 block">Watermark Position</label>
                        <select 
                          className="edit-input font-bold tracking-wide text-xs py-2 px-3 w-full bg-white border border-slate-200 rounded-lg cursor-pointer"
                          value={formData.watermarkPosition}
                          onChange={e => setFormData({...formData, watermarkPosition: e.target.value as any})}
                        >
                          <option value="BOTTOM_RIGHT">BOTTOM RIGHT (Default)</option>
                          <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                          <option value="BOTTOM">BOTTOM CENTER</option>
                          <option value="TOP_RIGHT">TOP RIGHT</option>
                          <option value="TOP_LEFT">TOP LEFT</option>
                          <option value="TOP">TOP CENTER</option>
                          <option value="CENTER">CENTER</option>
                        </select>
                      </div>

                      {/* Size and Opacity Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="edit-label mb-0">Size ({formData.watermarkWidth}%)</label>
                            <span className="text-xs font-mono font-black text-[#c5a880] bg-white px-2 py-0.5 rounded border border-slate-200">
                              {formData.watermarkWidth}%
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="5" max="100" 
                            className="w-full custom-slider mt-2"
                            value={formData.watermarkWidth}
                            onChange={e => setFormData({...formData, watermarkWidth: Number(e.target.value)})}
                            style={{'--val': `${formData.watermarkWidth}%`} as any}
                          />
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="edit-label mb-0">Opacity ({formData.watermarkOpacity}%)</label>
                            <span className="text-xs font-mono font-black text-[#c5a880] bg-white px-2 py-0.5 rounded border border-slate-200">
                              {formData.watermarkOpacity}%
                            </span>
                          </div>
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

                      {/* LIVE PREVIEW BOX WITH FIXED PHOTO */}
                      <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-sm relative w-full aspect-[3/2] flex items-center justify-center select-none">
                         <img 
                           src="/wedding.jpg" 
                           className="absolute inset-0 w-full h-full object-cover" 
                           alt="Preview Background" 
                         />
                         
                         {formData.watermarkType === 'LOGO' && formData.watermarkLogoUrl && (
                            <img 
                              src={formData.watermarkLogoUrl} 
                              className="absolute pointer-events-none object-contain"
                              style={{
                                opacity: Number(formData.watermarkOpacity || 80) / 100,
                                width: `${formData.watermarkWidth}%`,
                                maxHeight: '65%',
                                ...getPreviewPosition(formData.watermarkPosition)
                              }}
                              alt="Live Logo Watermark"
                            />
                         )}

                         {formData.watermarkType === 'TEXT' && formData.watermarkText && (
                            <div 
                              className="absolute pointer-events-none text-white font-black whitespace-nowrap tracking-wide select-none"
                              style={{
                                opacity: Number(formData.watermarkOpacity || 100) / 100,
                                fontSize: `${previewFontSize}px`, 
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                                ...getPreviewPosition(formData.watermarkPosition)
                              }}
                            >
                              {formData.watermarkText}
                            </div>
                         )}
                      </div>
                    </div>
                  );
                })()}
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                <button 
                  id="save-event-button"
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 flex justify-center items-center gap-2 bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Save Event Details</span>
                      {pendingPhotosCount > 0 && (
                        <span className="text-[10px] font-mono font-black bg-[#09090b] text-[#e6d0a7] px-2 py-0.5 rounded-full border border-[#c5a880]/30 shadow-xs">
                          -{pendingPhotosCount} Credit{pendingPhotosCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </>
                  )}
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
                  className="flex justify-center items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer min-h-[44px]"
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
