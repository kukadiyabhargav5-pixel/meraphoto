'use client';

import React, { useState, useEffect, use, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Users,
  Image as ImageIcon,
  ZoomIn,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
  Download,
  Camera,
  CheckCircle2,
  Sliders,
  Filter,
} from 'lucide-react';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EventHeaderNav from '@/components/events/EventHeaderNav';

interface FaceCluster {
  id: string;
  label: string;
  avatarUrl: string;
  faceCount: number;
  photoCount: number;
  mediaIds: string[];
}

export default function EventFacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [clusters, setClusters] = useState<FaceCluster[]>([]);
  const [allMediaItems, setAllMediaItems] = useState<any[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Lightbox preview modal
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);

  // Horizontal scroll container ref for round faces
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Fetch event, all media, and face clusters
  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, mediaRes, clustersRes] = await Promise.allSettled([
        apiClient.get(`/event/${eventId}`, { params: { _t: Date.now() } }),
        apiClient.get(`/media/event/${eventId}`, { params: { _t: Date.now() } }),
        apiClient.get(`/face-index/clusters/${eventId}`, { params: { _t: Date.now() } }),
      ]);

      if (eventRes.status === 'fulfilled' && eventRes.value.data) {
        setEvent(eventRes.value.data.event || eventRes.value.data);
      }

      let mediaList: any[] = [];
      if (mediaRes.status === 'fulfilled' && mediaRes.value.data) {
        mediaList = (mediaRes.value.data.media || mediaRes.value.data || []).map((m: any) =>
          Array.isArray(m) ? m[0] : m
        );
        setAllMediaItems(mediaList);
      }

      if (clustersRes.status === 'fulfilled' && clustersRes.value.data) {
        const clusterList: FaceCluster[] = clustersRes.value.data.clusters || [];
        setClusters(clusterList);
        if (clusterList.length > 0 && !selectedClusterId) {
          // Default to first person
          setSelectedClusterId(clusterList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load faces data:', err);
      toast.error('Failed to load face detection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  // Selected cluster object
  const activeCluster = useMemo(() => {
    if (!selectedClusterId) return null;
    return clusters.find((c) => c.id === selectedClusterId) || null;
  }, [selectedClusterId, clusters]);

  // Filtered photos based on active person cluster
  const displayedPhotos = useMemo(() => {
    if (!activeCluster) {
      // If "All Faces" selected (selectedClusterId === null)
      const allClusterMediaIds = new Set(clusters.flatMap((c) => c.mediaIds));
      return allMediaItems.filter((m) => allClusterMediaIds.has(String(m._id)));
    }
    const clusterMediaIds = new Set(activeCluster.mediaIds.map(String));
    return allMediaItems.filter((m) => clusterMediaIds.has(String(m._id)));
  }, [activeCluster, clusters, allMediaItems]);

  // Lightbox navigation
  const previewIndex = useMemo(() => {
    if (!previewPhoto) return -1;
    return displayedPhotos.findIndex((m) => String(m._id) === String(previewPhoto._id));
  }, [previewPhoto, displayedPhotos]);

  const handlePrevPreview = () => {
    if (displayedPhotos.length <= 1) return;
    const prevIdx = (previewIndex - 1 + displayedPhotos.length) % displayedPhotos.length;
    setPreviewPhoto(displayedPhotos[prevIdx]);
  };

  const handleNextPreview = () => {
    if (displayedPhotos.length <= 1) return;
    const nextIdx = (previewIndex + 1) % displayedPhotos.length;
    setPreviewPhoto(displayedPhotos[nextIdx]);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewPhoto) return;
      if (e.key === 'Escape') setPreviewPhoto(null);
      if (e.key === 'ArrowLeft') handlePrevPreview();
      if (e.key === 'ArrowRight') handleNextPreview();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhoto, previewIndex, displayedPhotos]);

  // Trigger rebuild face indexing
  const handleReindex = async () => {
    try {
      setReindexing(true);
      toast.loading('Starting AI Face Clustering...', { id: 'face-indexing' });
      const res = await apiClient.post(`/face-index/rebuild/${eventId}`);
      toast.success(res.data?.message || 'AI Face indexing queued! Refreshing...', {
        id: 'face-indexing',
      });
      setTimeout(() => {
        fetchData();
        setReindexing(false);
      }, 3500);
    } catch (err: any) {
      console.error('Re-index error:', err);
      toast.error(err.response?.data?.error || 'Failed to start AI indexing', {
        id: 'face-indexing',
      });
      setReindexing(false);
    }
  };

  // Toggle favorite on photo (synchronizes with database, favorites page, and album page)
  const toggleFavorite = async (photoId: string, currentStatus: boolean) => {
    try {
      const res = await apiClient.put(`/media/${photoId}/favorite`, {
        isFavorite: !currentStatus,
      });
      const newStatus = res.data?.isFavorite ?? !currentStatus;

      setAllMediaItems((prev) =>
        prev.map((m) =>
          String(m._id) === String(photoId)
            ? { ...m, isFavorite: newStatus, favoriteCount: res.data?.favoriteCount ?? m.favoriteCount }
            : m
        )
      );

      // Clean or add in localStorage
      if (typeof window !== 'undefined') {
        const slug = event?.slug || event?.code || '';
        const storageKey = `mara_favs_${slug}`;
        const raw = localStorage.getItem(storageKey);
        let ids: string[] = raw ? JSON.parse(raw) : [];
        if (newStatus) {
          if (!ids.includes(String(photoId))) ids.push(String(photoId));
        } else {
          ids = ids.filter((id) => String(id) !== String(photoId));
        }
        localStorage.setItem(storageKey, JSON.stringify(ids));
        window.dispatchEvent(new Event('favorites_updated'));
      }

      if (previewPhoto && String(previewPhoto._id) === String(photoId)) {
        setPreviewPhoto((prev: any) => ({
          ...prev,
          isFavorite: newStatus,
          favoriteCount: res.data?.favoriteCount ?? prev.favoriteCount,
        }));
      }
      toast.success(newStatus ? 'Photo added to favorites ❤️' : 'Removed from favorites');
    } catch (err: any) {
      toast.error('Failed to update favorite');
    }
  };

  // Download all photos for the selected person
  const handleDownloadPersonZip = async () => {
    if (displayedPhotos.length === 0) {
      toast.error('No photos to download');
      return;
    }

    try {
      setDownloadingZip(true);
      const personLabel = activeCluster?.label || 'all_faces';
      toast.loading(`Creating ZIP of ${displayedPhotos.length} photos for ${personLabel}...`, {
        id: 'zip-download',
      });

      const response = await apiClient.post(
        '/media/download-zip',
        {
          eventId,
          mediaIds: displayedPhotos.map((p) => String(p._id)),
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.name || 'event'}-${personLabel}-photos.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Photos ZIP downloaded successfully!', { id: 'zip-download' });
    } catch (err: any) {
      console.error('Download person zip error:', err);
      toast.error('Failed to create ZIP', { id: 'zip-download' });
    } finally {
      setDownloadingZip(false);
    }
  };

  const totalFacesDetected = useMemo(() => {
    return clusters.reduce((acc, c) => acc + c.faceCount, 0);
  }, [clusters]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 pb-20 font-sans">
      {/* ─── TOP BREADCRUMB / EVENT BANNER ─── */}
      <div className="bg-white border-b border-[#e8dfd3] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/events/${eventId}`}
              className="p-2 rounded-xl bg-[#faf8f5] hover:bg-slate-100 border border-[#e8dfd3] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to Event Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#c5a880] bg-[#faf8f5] px-2 py-0.5 rounded-md border border-[#e8dfd3]">
                  AI Face Match Studio
                </span>
                <span className="text-xs text-slate-400 font-bold">•</span>
                <span className="text-xs text-slate-500 font-bold">
                  {event?.name || 'Event Photos'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <Sparkles className="w-5 h-5 text-[#c5a880]" />
                Event Face Detection & People Gallery
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReindex}
              disabled={reindexing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#faf8f5] border border-[#c5a880] text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Rescan and cluster all faces"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#c5a880] ${reindexing ? 'animate-spin' : ''}`} />
              <span>{reindexing ? 'Scanning...' : 'Rescan AI Faces'}</span>
            </button>
            {event?.code && (
              <a
                href={`/e/${event.slug || event.code}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#faf8f5] text-xs font-bold transition-all shadow-xs"
              >
                <span>Live Album</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#c5a880]" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* ═══ LUXURY NAVIGATION HEADER WITH 4 TABS ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-3.5 sm:p-5 mb-6">
          <EventHeaderNav
            eventId={eventId}
            activeTab="faces"
            allCount={allMediaItems.length}
            photoCount={allMediaItems.filter((m) => (m.type || '').toUpperCase() !== 'VIDEO').length}
            videoCount={allMediaItems.filter((m) => (m.type || '').toUpperCase() === 'VIDEO').length}
            facesCount={clusters.length}
            favoritesCount={allMediaItems.filter((m) => m.isFavorite || (m.favoriteCount || 0) > 0).length}
            actionSlot={
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700 bg-[#faf8f5] border border-[#e8dfd3] px-3 py-1.5 rounded-xl">
                  {clusters.length} {clusters.length === 1 ? 'Person' : 'People'} Found • {totalFacesDetected} Faces
                </span>
              </div>
            }
          />

          {/* ═══ ROUND SHAPE FACE AVATARS SHOWCASE (PROPERLY ALIGNED & CROPPED) ═══ */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#c5a880] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Identified People in this Event
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Click any round face to view all photos containing this person
                  </p>
                </div>
              </div>

              {clusters.length > 5 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={scrollLeft}
                    className="p-1.5 rounded-xl bg-[#faf8f5] hover:bg-white border border-[#e8dfd3] text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollRight}
                    className="p-1.5 rounded-xl bg-[#faf8f5] hover:bg-white border border-[#e8dfd3] text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#c5a880]" />
                <span className="text-sm font-bold">Aligning and matching faces...</span>
              </div>
            ) : clusters.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl bg-[#faf8f5] border border-dashed border-[#e8dfd3] text-center">
                <Sparkles className="w-10 h-10 text-[#c5a880] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-700">No faces identified yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Photos uploaded to this event can be scanned by the AI face detection engine to automatically find and cluster every person.
                </p>
                <button
                  type="button"
                  onClick={handleReindex}
                  disabled={reindexing}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a880] to-[#b89665] text-slate-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Face Clustering Now</span>
                </button>
              </div>
            ) : (
              /* Centered, beautifully aligned horizontal carousel of round avatars */
              <div
                className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-3 sm:gap-4.5 pt-2 pb-4 px-1"
              >
                {/* 1. "All People" Avatar */}
                <button
                  type="button"
                  onClick={() => setSelectedClusterId(null)}
                  className="group flex flex-col items-center w-full cursor-pointer focus:outline-hidden select-none"
                >
                  <div
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-3 ${
                      selectedClusterId === null
                        ? 'border-[#c5a880] ring-4 ring-[#c5a880]/40 bg-gradient-to-tr from-amber-100 to-[#faf8f5] scale-105 shadow-xl shadow-[#c5a880]/20'
                        : 'border-[#e8dfd3] bg-[#faf8f5] group-hover:border-[#c5a880] group-hover:scale-102 shadow-xs'
                    }`}
                  >
                    <Users
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        selectedClusterId === null ? 'text-amber-800' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    {selectedClusterId === null && (
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-black tracking-tight transition-colors ${
                      selectedClusterId === null ? 'text-slate-950' : 'text-slate-600 group-hover:text-slate-900'
                    }`}
                  >
                    All People
                  </span>
                  <span className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500">
                    {clusters.reduce((acc, c) => acc + c.photoCount, 0)} photos
                  </span>
                </button>

                {/* 2. Individual Round Shape Face Avatars */}
                {clusters.map((cluster) => {
                  const isSelected = selectedClusterId === cluster.id;

                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className="group flex flex-col items-center w-full cursor-pointer focus:outline-hidden select-none"
                    >
                      {/* Round Face Circle */}
                      <div
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden transition-all duration-300 border-3 bg-slate-100 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#c5a880] ring-4 ring-[#c5a880]/40 scale-105 shadow-xl shadow-[#c5a880]/30'
                            : 'border-[#e8dfd3] group-hover:border-[#c5a880] group-hover:scale-102 shadow-xs'
                        }`}
                      >
                        {cluster.avatarUrl ? (
                          <img
                            src={cluster.avatarUrl}
                            alt={cluster.label}
                            className="w-full h-full object-cover object-center scale-105 select-none"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}

                        {/* Active Selection Glow & Indicator */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#c5a880]/15 pointer-events-none">
                            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Person Label & Photo Count Badge */}
                      <span
                        className={`mt-2 text-xs font-black tracking-tight transition-colors ${
                          isSelected ? 'text-amber-900 font-black' : 'text-slate-700 group-hover:text-slate-900'
                        }`}
                      >
                        {cluster.label}
                      </span>
                      <span
                        className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-800'
                        }`}
                      >
                        {cluster.photoCount} {cluster.photoCount === 1 ? 'photo' : 'photos'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ FILTERED PHOTOS DISPLAY GRID ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-3.5 sm:p-5 md:p-6">
          {/* Active Person Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e8dfd3]">
            <div className="flex items-center gap-3">
              {activeCluster && activeCluster.avatarUrl ? (
                <div className="w-12 h-12 rounded-full border-2 border-[#c5a880] overflow-hidden flex-shrink-0 shadow-md">
                  <img
                    src={activeCluster.avatarUrl}
                    alt={activeCluster.label}
                    className="w-full h-full object-cover object-center scale-105"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-50 to-[#faf8f5] border border-[#e8dfd3] flex items-center justify-center text-[#c5a880]">
                  <Users className="w-6 h-6" />
                </div>
              )}

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{activeCluster ? `${activeCluster.label}'s Photos` : 'All Face-Detected Photos'}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                    {displayedPhotos.length} {displayedPhotos.length === 1 ? 'Photo' : 'Photos'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {activeCluster
                    ? `Showing every photo containing ${activeCluster.label} (${activeCluster.faceCount} face detections)`
                    : 'Showing all photos with detected people in this event'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {displayedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadPersonZip}
                  disabled={downloadingZip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-white border border-[#c5a880] text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Download all photos for this person as ZIP"
                >
                  {downloadingZip ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#c5a880]" />
                  )}
                  <span>Download ZIP ({displayedPhotos.length})</span>
                </button>
              )}

              {selectedClusterId && (
                <button
                  type="button"
                  onClick={() => setSelectedClusterId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Show All People
                </button>
              )}
            </div>
          </div>

          {/* Photos Grid */}
          {displayedPhotos.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] flex items-center justify-center mx-auto mb-3 text-slate-300">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-700">No photos found for this person</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select another face above or click "Show All People" to browse all photos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayedPhotos.map((photo, index) => {
                const photoSrc =
                  photo.thumbnailUrl ||
                  photo.compressedUrl ||
                  photo.compressedR2Url ||
                  photo.r2Url ||
                  photo.url ||
                  photo.previewUrl ||
                  resolveMediaUrl(photo, true);

                return (
                  <motion.div
                    key={photo._id || index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-[#e8dfd3] shadow-xs hover:shadow-lg hover:border-[#c5a880] transition-all cursor-pointer"
                    onClick={() => setPreviewPhoto(photo)}
                  >
                    <img
                      src={photoSrc}
                      alt={photo.originalName || 'Photo'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Quick Favorite Heart Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo._id, photo.isFavorite);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-transform cursor-pointer shadow-md ${
                        photo.isFavorite
                          ? 'bg-red-500 text-white scale-110'
                          : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                      }`}
                      title={photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Heart
                        className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`}
                      />
                    </button>

                    {/* Bottom Info bar */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1.5 text-white/90">
                        <span className="p-1 rounded-md bg-black/60">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[11px] font-bold truncate max-w-[120px]">
                          {photo.originalName || `Photo #${index + 1}`}
                        </span>
                      </div>
                      {photo.faceCount > 0 && (
                        <span className="text-[10px] font-black bg-amber-500/90 text-slate-950 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          <span>{photo.faceCount}</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ FULLSCREEN LIGHTBOX WITH < > ARROWS ═══ */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
            onClick={() => setPreviewPhoto(null)}
          >
            {/* Top Toolbar */}
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-bold text-white/90 truncate max-w-xs sm:max-w-md">
                  {previewPhoto.originalName || 'Photo Preview'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({previewIndex + 1} of {displayedPhotos.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(previewPhoto._id, previewPhoto.isFavorite)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    previewPhoto.isFavorite
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={previewPhoto.isFavorite ? 'Favorited' : 'Add to Favorites'}
                >
                  <Heart
                    className={`w-4 h-4 ${previewPhoto.isFavorite ? 'fill-current' : ''}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Left Nav Arrow */}
            {displayedPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPreview();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer z-10"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Photo */}
            <div
              className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={
                  previewPhoto.r2Url ||
                  previewPhoto.compressedUrl ||
                  previewPhoto.thumbnailUrl ||
                  previewPhoto.compressedR2Url ||
                  previewPhoto.url ||
                  resolveMediaUrl(previewPhoto)
                }
                alt={previewPhoto.originalName || 'Full preview'}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Right Nav Arrow */}
            {displayedPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPreview();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer z-10"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
