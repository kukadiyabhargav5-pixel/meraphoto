'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Download,
  Trash2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Share2,
} from 'lucide-react';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EventHeaderNav from '@/components/events/EventHeaderNav';

export default function EventFavoritesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [favoritePhotos, setFavoritePhotos] = useState<any[]>([]);
  const [allMediaItems, setAllMediaItems] = useState<any[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);

  // Selection mode for bulk download or removal
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Fetch event and favorite photos
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const [favRes, eventRes, allMediaRes] = await Promise.allSettled([
        apiClient.get(`/media/event/${eventId}/favorites`, { params: { _t: Date.now() } }),
        apiClient.get(`/event/${eventId}`, { params: { _t: Date.now() } }),
        apiClient.get(`/media/event/${eventId}`, { params: { _t: Date.now() } }),
      ]);

      let eventData: any = null;
      if (eventRes.status === 'fulfilled' && eventRes.value.data) {
        eventData = eventRes.value.data.event || eventRes.value.data;
        setEvent(eventData);
      }

      let favList: any[] = [];
      if (favRes.status === 'fulfilled' && favRes.value.data) {
        favList = (favRes.value.data.favorites || []).map((m: any) => (Array.isArray(m) ? m[0] : m));
      }

      let allList: any[] = [];
      if (allMediaRes.status === 'fulfilled' && allMediaRes.value.data) {
        allList = (allMediaRes.value.data.media || allMediaRes.value.data || []).map((m: any) =>
          Array.isArray(m) ? m[0] : m
        );
        setAllMediaItems(allList);
      }

      // Collect all favorites by ID
      const favMap = new Map<string, any>();
      favList.forEach((m) => {
        if (m && m._id) favMap.set(String(m._id), { ...m, isFavorite: true });
      });

      // Also include any media from allList marked as favorite
      allList.forEach((m) => {
        if (m && (m.isFavorite || (m.favoriteCount || 0) > 0)) {
          favMap.set(String(m._id), { ...m, isFavorite: true });
        }
      });

      // Check client/guest localStorage favorites and auto-sync
      if (typeof window !== 'undefined') {
        const slug = eventData?.slug || eventData?.code || '';
        const storedKeys = [
          `mara_favs_${slug}`,
          `event_favs_${slug}`,
          `mara_favs_${eventId}`,
          `event_favs_${eventId}`,
        ];
        storedKeys.forEach((key) => {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const ids = JSON.parse(raw);
              if (Array.isArray(ids)) {
                ids.forEach((id: string) => {
                  const match = allList.find(
                    (m) => String(m._id) === String(id) || String(m.r2Key) === String(id)
                  );
                  if (match && !favMap.has(String(match._id))) {
                    favMap.set(String(match._id), { ...match, isFavorite: true });
                    // Sync to backend DB so it persists permanently
                    apiClient.put(`/media/${match._id}/favorite`, { isFavorite: true }).catch(() => {});
                  }
                });
              }
            }
          } catch (e) {}
        });
      }

      setFavoritePhotos(Array.from(favMap.values()));
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      toast.error('Failed to load favorite photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [eventId]);

  // Toggle favorite on photo
  const toggleFavorite = async (photoId: string) => {
    try {
      await apiClient.put(`/media/${photoId}/favorite`, {
        isFavorite: false, // un-favorite from favorites page
      });

      // Instantly remove from state
      setFavoritePhotos((prev) => prev.filter((p) => String(p._id) !== String(photoId)));
      setAllMediaItems((prev) =>
        prev.map((m) =>
          String(m._id) === String(photoId)
            ? { ...m, isFavorite: false, favoriteCount: Math.max(0, (m.favoriteCount || 1) - 1) }
            : m
        )
      );

      // Clean from localStorage across all keys so the album page immediately drops it
      if (typeof window !== 'undefined') {
        const slug = event?.slug || event?.code || '';
        const keys = [
          `mara_favs_${slug}`,
          `event_favs_${slug}`,
          `mara_favs_${eventId}`,
          `event_favs_${eventId}`,
        ];
        keys.forEach((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const ids = JSON.parse(raw);
              if (Array.isArray(ids)) {
                const filtered = ids.filter((id: string) => String(id) !== String(photoId));
                localStorage.setItem(k, JSON.stringify(filtered));
              }
            }
          } catch (e) {}
        });

        // Broadcast change so the album page updates instantly without reload!
        window.dispatchEvent(new Event('favorites_updated'));
      }

      if (previewPhoto && String(previewPhoto._id) === String(photoId)) {
        setPreviewPhoto(null);
      }
      toast.success('Removed from favorites & album');
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
      toast.error('Failed to update favorite status');
    }
  };

  // Download all or selected favorites as ZIP
  const handleDownloadZip = async () => {
    const idsToDownload = selectedIds.length > 0 ? selectedIds : favoritePhotos.map((p) => String(p._id));
    if (idsToDownload.length === 0) {
      toast.error('No favorite photos to download');
      return;
    }

    try {
      setDownloadingZip(true);
      toast.loading(`Creating ZIP of ${idsToDownload.length} favorite photos...`, { id: 'zip-download' });

      const response = await apiClient.post(
        '/media/download-zip',
        {
          eventId,
          mediaIds: idsToDownload,
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.name || 'event'}-favorites.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Favorite photos ZIP downloaded!', { id: 'zip-download' });
    } catch (err: any) {
      console.error('Zip download error:', err);
      toast.error('Failed to create ZIP archive', { id: 'zip-download' });
    } finally {
      setDownloadingZip(false);
    }
  };

  // Lightbox navigation
  const previewIndex = useMemo(() => {
    if (!previewPhoto) return -1;
    return favoritePhotos.findIndex((m) => String(m._id) === String(previewPhoto._id));
  }, [previewPhoto, favoritePhotos]);

  const handlePrev = () => {
    if (favoritePhotos.length <= 1) return;
    const prevIdx = (previewIndex - 1 + favoritePhotos.length) % favoritePhotos.length;
    setPreviewPhoto(favoritePhotos[prevIdx]);
  };

  const handleNext = () => {
    if (favoritePhotos.length <= 1) return;
    const nextIdx = (previewIndex + 1) % favoritePhotos.length;
    setPreviewPhoto(favoritePhotos[nextIdx]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewPhoto) return;
      if (e.key === 'Escape') setPreviewPhoto(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhoto, previewIndex, favoritePhotos]);

  const handleSelectAll = () => {
    if (selectedIds.length === favoritePhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(favoritePhotos.map((p) => String(p._id)));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  Guest Favorites
                </span>
                <span className="text-xs text-slate-400 font-bold">•</span>
                <span className="text-xs text-slate-500 font-bold">
                  {event?.name || 'Event Photos'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                Client & Guest Favorite Photos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={downloadingZip || favoritePhotos.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a880] to-[#b89665] text-slate-950 text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {downloadingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {selectedIds.length > 0
                  ? `Download Selected ZIP (${selectedIds.length})`
                  : `Download All Favorites ZIP (${favoritePhotos.length})`}
              </span>
            </button>
            {event?.code && (
              <a
                href={`/e/${event.slug || event.code}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
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
            activeTab="favorites"
            allCount={allMediaItems.length}
            photoCount={allMediaItems.filter((m) => (m.type || '').toUpperCase() !== 'VIDEO').length}
            videoCount={allMediaItems.filter((m) => (m.type || '').toUpperCase() === 'VIDEO').length}
            favoritesCount={favoritePhotos.length}
            actionSlot={
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isSelectionMode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-[#faf8f5] border-[#e8dfd3] text-slate-700 hover:bg-white hover:border-[#c5a880]'
                  }`}
                >
                  {isSelectionMode ? 'Cancel' : 'Select'}
                </button>

                {isSelectionMode && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg border border-[#e8dfd3] bg-[#faf8f5] hover:bg-white text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    {selectedIds.length === favoritePhotos.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
            }
          />

          {/* Favorites Subheader */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-700">
                {favoritePhotos.length} {favoritePhotos.length === 1 ? 'Photo' : 'Photos'} marked as favorite by your clients
              </span>
            </div>
            <button
              type="button"
              onClick={fetchFavorites}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#c5a880] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ═══ FAVORITES PHOTO GRID ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-3.5 sm:p-5 md:p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#c5a880]" />
              <span className="text-sm font-bold">Loading favorite photos...</span>
            </div>
          ) : favoritePhotos.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3 text-red-400">
                <Heart className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-800">No favorite photos yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When guests or clients heart photos in the public gallery or you favorite them in the studio, they will appear here.
              </p>
              <Link
                href={`/dashboard/events/${eventId}/upload`}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#c5a880]" />
                <span>Go to All Media Gallery</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {favoritePhotos.map((photo, index) => {
                const photoSrc =
                  photo.thumbnailUrl ||
                  photo.compressedUrl ||
                  photo.compressedR2Url ||
                  photo.r2Url ||
                  photo.url ||
                  photo.previewUrl ||
                  resolveMediaUrl(photo, true);

                const isSelected = selectedIds.includes(String(photo._id));

                return (
                  <motion.div
                    key={photo._id || index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#c5a880] ring-4 ring-[#c5a880]/40 shadow-lg'
                        : 'border-[#e8dfd3] hover:border-[#c5a880] shadow-xs hover:shadow-md'
                    }`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelectId(String(photo._id));
                      } else {
                        setPreviewPhoto(photo);
                      }
                    }}
                  >
                    <img
                      src={photoSrc}
                      alt={photo.originalName || 'Favorite photo'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Favorite status badge (Red Heart) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                      title="Click to remove from favorites"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Checkbox for selection mode */}
                    {isSelectionMode && (
                      <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
                          isSelected
                            ? 'bg-[#c5a880] border-[#c5a880] text-slate-950'
                            : 'bg-black/40 border-white/80 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}

                    {/* Bottom Info */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 text-white/90">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold truncate max-w-[100px]">
                          {photo.originalName || `Photo #${index + 1}`}
                        </span>
                      </div>
                      {photo.favoriteCount > 0 && (
                        <span className="text-[10px] font-extrabold bg-red-500/80 text-white px-1.5 py-0.5 rounded-md">
                          {photo.favoriteCount} ❤️
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
                  {previewPhoto.originalName || 'Favorite Photo'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({previewIndex + 1} of {favoritePhotos.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(previewPhoto._id)}
                  className="p-2 rounded-xl bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                  title="Remove from favorites"
                >
                  <Heart className="w-4 h-4 fill-current" />
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
            {favoritePhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
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
            {favoritePhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
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

