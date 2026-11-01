'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, CheckCircle, Copy, ChevronDown, LayoutGrid, Sparkles, Crown, ArrowRight, ShieldCheck, Flame, RefreshCw, ZoomIn, Play, X, Clock, AlertTriangle, Zap, Activity, Gauge } from 'lucide-react';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import { useAuth } from '../../../../lib/AuthContext';
import { useStorageUsage, formatBytes, ONE_GB_BYTES } from '@/lib/storage';
import { HardDrive, Cloud } from 'lucide-react';

export default function EventUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';

  const [event, setEvent] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const { usage: storageUsage, refresh: refreshStorage } = useStorageUsage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUpdatingDownload, setIsUpdatingDownload] = useState(false);
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

  // Storage limit check (pure GB storage based)
  const hasPaidActivePlan = Boolean(
    isSuperAdmin ||
    (storageUsage?.hasActivePlan &&
     storageUsage?.activePlan?.status === 'ACTIVE' &&
     storageUsage?.activePlan?.planId &&
     storageUsage?.activePlan?.planId !== 'free-starter')
  );
  const isStorageFull = !isSuperAdmin && (!hasPaidActivePlan || storageUsage?.warningState === 'FULL' || (storageUsage?.availableStorageBytes !== undefined && storageUsage.availableStorageBytes <= 0));
  const isPhotoLimitReached = isStorageFull;
  const isVideoLimitReached = isStorageFull;
  const isAllCreditsExhausted = isStorageFull;

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
           const mediaRes = await apiClient.get(`/media/event/${res.data.event._id}?_t=${Date.now()}`);
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

    // Enforce storage subscription capacity check
    if (!isSuperAdmin && storageUsage && storageUsage.availableStorageBytes !== undefined) {
      if (totalBytes > storageUsage.availableStorageBytes) {
        const reqMb = (totalBytes / (1024 * 1024)).toFixed(1);
        const availGb = (storageUsage.availableStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
        toast.error(`⚠️ Insufficient storage! Upload requires ${reqMb} MB, but only ${availGb} GB is available. Please upgrade your storage plan.`, { duration: 6000 });
        e.target.value = '';
        return;
      }
    }
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

      // ── Step 4: Optimized Parallel Turbo Streams Directly to Ultra-Fast Cloud Storage ──
      let imageCompressionModule: any = null;
      try {
        imageCompressionModule = (await import('browser-image-compression')).default;
      } catch {
        imageCompressionModule = null;
      }

      const concurrency = Math.min(16, Math.max(2, fileArray.length));

      const worker = async () => {
        while (currentFileIndex < fileArray.length) {
          const idx = currentFileIndex++;
          const file = fileArray[idx];
          const presignedItem = presignedMap[idx];
          activeStreamsCount++;

          const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.name);
          let fileToUpload: File = file;

          // ⚡ SMART HIGH-SPEED PHOTO COMPRESSION:
          // Photos > 2.5MB: Compress via Web Worker with snappy 2s timeout
          // Photos <= 2.5MB: Stream raw file straight to Ultra-Fast Cloud Storage for gigabit speed
          if (!isVideo && file.size > 2.5 * 1024 * 1024 && imageCompressionModule) {
            try {
              const compPromise = imageCompressionModule(file, {
                maxSizeMB: 2.0,
                maxWidthOrHeight: 2560,
                useWebWorker: true,
                initialQuality: 0.88,
                fileType: file.type || 'image/jpeg',
              });
              const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Compression timeout')), 2000)
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
              fileToUpload = file;
            }
          }

          let uploadedSuccessfully = false;

          // Attempt 1: Direct Gigabit Ultra-Fast Cloud Storage PUT
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
      refreshStorage();
      window.dispatchEvent(new Event('storage_updated'));
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
    allowDownload: true,
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
        allowDownload: event.allowDownload !== undefined ? !!event.allowDownload : true,
        coverImageUrl: resolveMediaUrl(event.coverImageUrl || ''),
        watermarkType: event.watermark?.type || 'LOGO',
        watermarkText: event.watermark?.text || '',
        watermarkLogoUrl: resolveMediaUrl(event.watermark?.logoUrl || ''),
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
    img.src = resolveMediaUrl(formData.coverImageUrl);
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
              let createdDate: Date;
              if (event.createdAt) {
                createdDate = new Date(event.createdAt);
              } else if (event._id && typeof event._id === 'string' && event._id.length === 24) {
                try {
                  createdDate = new Date(parseInt(event._id.substring(0, 8), 16) * 1000);
                } catch {
                  createdDate = new Date(event.date || Date.now());
                }
              } else if (event.date) {
                createdDate = new Date(event.date);
              } else {
                return null;
              }

              const now = new Date();
              const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const createdMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();
              const diffDays = Math.max(0, Math.floor((todayMidnight - createdMidnight) / (1000 * 60 * 60 * 24)));
              const days = typeof event.daysLeft === 'number' 
                ? event.daysLeft 
                : typeof storageUsage?.activePlan?.daysLeft === 'number'
                ? storageUsage.activePlan.daysLeft
                : 30;
              const label = days >= 9000 ? 'Active Lifetime' : days === 0 ? 'Plan Expired' : `${days} ${days === 1 ? 'day' : 'days'} left`;
              const isUrgent = days <= 1;
              const isWarning = days <= 5;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border shadow-xs shrink-0 transition-colors ${
                  isUrgent
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : isWarning
                    ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80'
                }`}>
                  <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600 animate-pulse' : isWarning ? 'text-amber-500' : 'text-[#c5a880]'}`} />
                  <span className={isUrgent ? 'font-black tracking-tight' : ''}>{label}</span>
                </span>
              );
            })()}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/dashboard/events/${eventId}/upload`}
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#c5a880]/25 hover:brightness-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload Media</span>
            </Link>

            <button
              onClick={() => { fetchEventDetails(); fetchCredits(); }}
              className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 transition-all shadow-xs cursor-pointer"
              title="Refresh Storage Credits & Media"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LUXURY WHITE & GOLD CLOUD STORAGE OVERVIEW BLOCK               */}
        {/* ============================================================== */}
        {(() => {
          const usedBytes = storageUsage?.usedStorageBytes ?? 0;
          const totalGb = hasPaidActivePlan ? (storageUsage?.totalStorageGb ?? 0) : 0;
          const totalBytes = hasPaidActivePlan ? (storageUsage?.totalStorageBytes ?? (totalGb * ONE_GB_BYTES)) : 0;
          const availableBytes = hasPaidActivePlan ? Math.max(0, totalBytes - usedBytes) : 0;
          const rawPct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
          const usagePct = rawPct > 0 && rawPct < 0.1 ? Math.max(0.01, Number(rawPct.toFixed(2))) : Number(rawPct.toFixed(1));
          const clampedPct = hasPaidActivePlan ? Math.min(100, Math.max(usedBytes > 0 ? 1.5 : 0, usagePct)) : 0;
          const planName = hasPaidActivePlan ? (storageUsage?.activePlan?.name || `${totalGb} GB Storage`) : 'No Active Plan';
          const warningState = hasPaidActivePlan ? (storageUsage?.warningState ?? 'NORMAL') : 'NONE';

          let progressFill = 'bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] shadow-[0_0_12px_rgba(197,168,128,0.35)]';
          if (warningState === 'FULL' || (hasPaidActivePlan && usagePct >= 100)) {
            progressFill = 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
          } else if (warningState === 'CRITICAL' || (hasPaidActivePlan && usagePct >= 95)) {
            progressFill = 'bg-gradient-to-r from-rose-500 to-amber-600 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
          } else if (warningState === 'WARNING' || (hasPaidActivePlan && usagePct >= 80)) {
            progressFill = 'bg-gradient-to-r from-amber-500 to-yellow-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
          }

          return (
            <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-[#e8dfd3] shadow-[0_10px_35px_rgba(197,168,128,0.1)] p-4 sm:p-6 mb-6 sm:mb-8 transition-all relative overflow-hidden group">
              {/* Subtle Warm Luxury Ambient Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#c5a880]/15 via-[#faf6f0]/40 to-transparent rounded-full blur-[70px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-[#e8dfd3]/30 via-transparent to-transparent rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent pointer-events-none" />

              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-[#e8dfd3] relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#c5a880]/20 to-[#9e7b4f]/15 border border-[#c5a880]/40 text-[#9e7b4f] flex items-center justify-center shadow-xs shrink-0">
                    <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-[#9e7b4f]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 font-serif-luxury truncate">
                        {planName}
                      </h3>
                      {hasPaidActivePlan ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Storage Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          No Active Plan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                      <span>Cloud Photo Storage</span>
                      <span>•</span>
                      <span>High-Speed Studio Cloud</span>
                    </p>
                  </div>
                </div>

                {/* White & Gold Upgrade / Select Plan Button */}
                <Link
                  href="/dashboard/plans-billing"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#c5a880]/25 hover:brightness-105 hover:shadow-lg active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-white" />
                  <span>{hasPaidActivePlan ? 'Upgrade Storage' : 'Select Storage Plan'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Dedicated GB Storage Metric Content in Pure White & Gold Theme */}
              <div className="pt-4 relative z-10 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Storage Used
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-sans tracking-tight leading-none">
                        {formatBytes(usedBytes)}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-500">
                        {hasPaidActivePlan ? (
                          <>of {totalGb >= 10 ? Math.round(totalGb) : totalGb.toFixed(1)} GB used</>
                        ) : (
                          <span className="text-amber-700">of 0 GB (No plan active)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-500 block">
                      {hasPaidActivePlan ? (
                        <>
                          <span className="font-extrabold text-[#9e7b4f]">
                            {rawPct > 0 && rawPct < 0.1 ? `${rawPct.toFixed(2)}%` : `${usagePct.toFixed(1)}%`} Full
                          </span>
                        </>
                      ) : (
                        '0% Allocated'
                      )}
                    </span>
                    <span className={`text-sm font-extrabold ${hasPaidActivePlan ? 'text-slate-900' : 'text-slate-400'}`}>
                      {hasPaidActivePlan ? (
                        <>{formatBytes(availableBytes)} Available</>
                      ) : (
                        '0 GB Available'
                      )}
                    </span>
                  </div>
                </div>

                {/* Smooth Animated Gold Progress Bar */}
                <div className="relative w-full bg-[#f4ece1] rounded-full h-3 overflow-hidden p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${progressFill}`}
                    style={{ width: `${clampedPct}%` }}
                  />
                </div>

                {/* Bottom Details Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ImageIcon className="w-3.5 h-3.5 text-[#9e7b4f]" />
                      <strong className="text-slate-800">{storageUsage?.totalPhotos ?? mediaItems.length}</strong> photos stored in account
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <span>Occupied:</span>
                      <strong className="text-slate-900">{formatBytes(usedBytes)}</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {storageUsage?.activePlan?.expiresAt ? (
                      <>Valid until: {new Date(storageUsage.activePlan.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    ) : (
                      <>Studio Cloud Encrypted</>
                    )}
                  </div>
                </div>

                {/* Warning Banner if storage is tight or no plan */}
                {!hasPaidActivePlan ? (
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#c5a880]/15 to-amber-500/5 border border-amber-300/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-800">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>No active storage plan. Please select a plan to activate photo uploads.</span>
                    </div>
                    <Link
                      href="/dashboard/plans-billing"
                      className="shrink-0 font-black text-[#9e7b4f] hover:underline"
                    >
                      Select Plan →
                    </Link>
                  </div>
                ) : warningState === 'FULL' || usagePct >= 100 ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Storage is 100% full. New photo uploads are blocked until upgraded.</span>
                    </div>
                    <Link href="/dashboard/plans-billing" className="shrink-0 font-bold underline">
                      Upgrade Now
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })()}

        {/* Media Gallery Access Banner */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-[#e8dfd3] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(197,168,128,0.06)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c5a880]/20 to-[#9e7b4f]/15 border border-[#c5a880]/30 text-[#9e7b4f] flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-[#9e7b4f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  Event Media & Photos ({mediaItems.length} Files)
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#9e7b4f]">
                  Dedicated Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Upload entire folders, photos, or videos with high-speed direct upload and cloud sync.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/events/${eventId}/upload`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#c5a880]/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open Upload Studio →</span>
          </Link>
        </div>

        {/* Centered Form: Edit Event Details */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white text-slate-900 border border-[#e8dfd3] rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_10px_35px_rgba(197,168,128,0.08)]">
            <div className="flex items-center gap-3 mb-8 border-b border-[#e8dfd3] pb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a880]/20 to-[#9e7b4f]/15 border border-[#c5a880]/30 flex items-center justify-center text-[#9e7b4f] shrink-0">
                <Settings className="h-5 w-5 text-[#9e7b4f]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit Event Details</h3>
                <p className="text-xs text-slate-500 font-medium">Update event metadata, client info, features, and cover image.</p>
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              .edit-input {
                width: 100%;
                background: #faf8f5;
                border: 1px solid #e8dfd3;
                color: #0f172a;
                padding: 12px 14px;
                border-radius: 12px;
                font-size: 13.5px;
                outline: none;
                transition: all 0.2s;
              }
              .edit-input:focus {
                background: #ffffff;
                border-color: #c5a880;
                box-shadow: 0 0 0 3px rgba(197, 168, 128, 0.15);
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
              if (saving || isUpdatingDownload) return;
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

                const targetId = event?._id || eventId;
                const res = await apiClient.put(`/event/${targetId}`, payload);
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
      refreshStorage();
      window.dispatchEvent(new Event('storage_updated'));
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
                      <img src={resolveMediaUrl(formData.coverImageUrl)} alt="Cover" className="w-full h-full object-cover" />
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
                               {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (formData.watermarkLogoUrl ? <img src={resolveMediaUrl(formData.watermarkLogoUrl)} className="max-w-[40px] max-h-[40px] object-contain" alt="Logo preview" /> : <Camera className="h-5 w-5 text-slate-400" />)}
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
                              src={resolveMediaUrl(formData.watermarkLogoUrl)}
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

              {/* Add to Portfolio Toggle */}
              <div 
                onClick={async () => {
                  if (saving) return;
                  const newValue = !formData.addToPortfolio;
                  const targetId = event?._id || eventId;
                  
                  setFormData(prev => ({...prev, addToPortfolio: newValue}));
                  setSaving(true);
                  
                  try {
                    await apiClient.patch(`/event/${targetId}/portfolio-status`, { 
                      addToPortfolio: newValue 
                    });
                    
                    if (event) {
                      setEvent((prev: any) => prev ? ({...prev, addToPortfolio: newValue}) : null);
                    }
                    toast.success(newValue ? 'Added to Public Portfolio!' : 'Removed from Public Portfolio');
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('mara_cached_events');
                    }
                  } catch (err) {
                    toast.error("Failed to save portfolio status.");
                    setFormData(prev => ({...prev, addToPortfolio: !newValue}));
                  } finally {
                    setSaving(false);
                  }
                }}
                className={`flex items-center justify-between py-3.5 px-4 rounded-xl border cursor-pointer select-none transition-all my-2 ${
                  formData.addToPortfolio 
                    ? 'bg-amber-50/40 border-[#c5a880] ring-1 ring-[#c5a880]/30' 
                    : 'bg-white border-slate-200 hover:border-[#c5a880]/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                    formData.addToPortfolio ? 'bg-[#c5a880] text-white border-[#c5a880]' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>P</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Add to Portfolio</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        formData.addToPortfolio ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {formData.addToPortfolio ? 'ON' : 'OFF'}
                      </span>
                      {saving && <Loader2 className="h-3 w-3 animate-spin text-[#c5a880]" />}
                    </div>
                    <span className="text-[10px] text-slate-400">Showcase this event on your studio public portfolio</span>
                  </div>
                </div>
                <div 
                  role="switch"
                  aria-checked={formData.addToPortfolio}
                  className={`toggle-switch ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                  data-active={formData.addToPortfolio}
                />
              </div>

              {/* Album Photo Download On/Off Toggle */}
              <div 
                onClick={async () => {
                  if (isUpdatingDownload || saving) return;
                  const newValue = !formData.allowDownload;
                  const targetId = event?._id || eventId;
                  
                  setFormData(prev => ({...prev, allowDownload: newValue}));
                  setIsUpdatingDownload(true);
                  
                  try {
                    await apiClient.patch(`/event/${targetId}/download-status`, { 
                      allowDownload: newValue 
                    });
                    
                    if (event) {
                      setEvent((prev: any) => prev ? ({...prev, allowDownload: newValue}) : null);
                    }
                    toast.success(newValue ? 'Photo downloads enabled for album' : 'Photo downloads disabled for album');
                  } catch (err) {
                    toast.error("Failed to update download setting.");
                    setFormData(prev => ({...prev, allowDownload: !newValue}));
                  } finally {
                    setIsUpdatingDownload(false);
                  }
                }}
                className={`flex items-center justify-between py-3.5 px-4 rounded-xl border cursor-pointer select-none transition-all my-2 ${
                  formData.allowDownload 
                    ? 'bg-amber-50/40 border-[#c5a880] ring-1 ring-[#c5a880]/30' 
                    : 'bg-white border-slate-200 hover:border-[#c5a880]/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                    formData.allowDownload ? 'bg-[#c5a880] text-white border-[#c5a880]' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>D</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Album Photo Download</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        formData.allowDownload ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {formData.allowDownload ? 'ON' : 'OFF'}
                      </span>
                      {isUpdatingDownload && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600" />
                          <span>Saving...</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formData.allowDownload ? 'Download button enabled in album for guests' : 'Download button disabled in album'}
                    </span>
                  </div>
                </div>
                <div 
                  role="switch"
                  aria-checked={formData.allowDownload}
                  className={`toggle-switch ${isUpdatingDownload || saving ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`} 
                  data-active={formData.allowDownload}
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
                  disabled={saving || isUpdatingDownload} 
                  className="flex-1 flex justify-center items-center gap-2 bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Event Details...</span>
                    </>
                  ) : isUpdatingDownload ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-800" />
                      <span>Updating Download Setting...</span>
                    </>
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
                playsInline
                preload="metadata"
                src={resolveMediaUrl(previewMedia.compressedUrl || previewMedia.r2Url)} 
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
