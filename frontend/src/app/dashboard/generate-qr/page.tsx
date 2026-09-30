'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode, Search, Download, Calendar, Loader2, Check, Sparkles, ChevronDown,
  Image as ImageIcon, Share2, X, ExternalLink, Copy, CheckCircle2,
  Printer, Smartphone
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { useDashboard } from '../DashboardContext';

interface Event {
  _id: string;
  name: string;
  code: string;
  eventCode?: string;
  type?: string;
  date?: string;
  coverImageUrl?: string;
  clientName?: string;
  createdAt?: string;
}

export default function GenerateQRPage() {
  const { studio } = useDashboard();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // QR configuration
  const [qrTheme, setQrTheme] = useState<'classic' | 'gold' | 'inverted'>('classic');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch studio events sorted by date/created descending (latest first)
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          const list: Event[] = res.data.events;
          list.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.date || 0).getTime();
            const timeB = new Date(b.createdAt || b.date || 0).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
          });
          setEvents(list);
          // Pre-select first event if available
          if (list.length > 0) {
            setSelectedEvent(list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [dropdownOpen]);

  // Gallery URL computation
  const getGalleryUrl = useCallback((event: Event | null) => {
    if (!event) return '';
    const code = event.code || event.eventCode || event._id;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/e/${code}`;
    }
    return `/e/${code}`;
  }, []);

  const galleryUrl = getGalleryUrl(selectedEvent);

  // Generate QR code whenever selected event or theme changes
  useEffect(() => {
    if (!selectedEvent) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    const generateCode = async () => {
      setGenerating(true);
      try {
        const url = getGalleryUrl(selectedEvent);

        let darkColor = '#09090b';
        let lightColor = '#ffffff';

        if (qrTheme === 'gold') {
          darkColor = '#8a6e42';
          lightColor = '#ffffff';
        } else if (qrTheme === 'inverted') {
          darkColor = '#ffffff';
          lightColor = '#09090b';
        }

        const dataUrl = await QRCode.toDataURL(url, {
          width: 1200,
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel: 'H',
        });

        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('QR generation error:', err);
      } finally {
        if (isMounted) setGenerating(false);
      }
    };

    generateCode();

    return () => {
      isMounted = false;
    };
  }, [selectedEvent, qrTheme, getGalleryUrl]);

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.type && event.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.code && event.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.clientName && event.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Download high-resolution PNG
  const handleDownloadPng = async () => {
    if (!qrDataUrl || !selectedEvent) return;
    setDownloadingPng(true);
    try {
      const link = document.createElement('a');
      link.download = `QR_${selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      link.href = qrDataUrl;
      link.click();
      toast.success('High-resolution QR code downloaded!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloadingPng(false);
    }
  };

  // Generate and download printable standee card
  const handleDownloadStandeeCard = async () => {
    if (!qrDataUrl || !selectedEvent) return;
    setDownloadingCard(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1200 x 1800 (4:6 portrait display standee)
      canvas.width = 1200;
      canvas.height = 1800;

      // Background gradient (rich dark luxury)
      const grad = ctx.createLinearGradient(0, 0, 0, 1800);
      grad.addColorStop(0, '#0c0c0e');
      grad.addColorStop(0.5, '#141418');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1800);

      // Gold decorative border
      ctx.strokeStyle = '#c5a880';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, 1080, 1680);

      ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(76, 76, 1048, 1648);

      // Header: Studio Logo / Name
      let logoDrawn = false;
      if (studio?.logoUrl) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((res, rej) => {
            logoImg.onload = res;
            logoImg.onerror = rej;
            logoImg.src = studio.logoUrl!;
          });
          const maxLogoH = 80;
          const maxLogoW = 320;
          const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height, 1);
          const dw = logoImg.width * scale;
          const dh = logoImg.height * scale;
          ctx.drawImage(logoImg, 600 - dw / 2, 130 - dh / 2, dw, dh);
          logoDrawn = true;
        } catch (e) {
          console.warn('Could not draw studio logo onto canvas', e);
        }
      }

      if (!logoDrawn) {
        const studioTitle = studio?.name ? studio.name.toUpperCase() : 'MARA PHOTO STUDIO';
        ctx.fillStyle = '#c5a880';
        ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(studioTitle, 600, 170);
      }

      // Subtitle
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 22px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('EXCLUSIVE PHOTO GALLERY', 600, 220);

      // Event Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px "Segoe UI", Roboto, sans-serif';
      const eventTitle = selectedEvent.name.length > 28 
        ? selectedEvent.name.slice(0, 26) + '...' 
        : selectedEvent.name;
      ctx.fillText(eventTitle, 600, 340);

      // Event Date if available
      if (selectedEvent.date) {
        const formattedDate = new Date(selectedEvent.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        ctx.fillStyle = '#c5a880';
        ctx.font = 'bold 24px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(formattedDate.toUpperCase(), 600, 395);
      }

      // Draw QR Code Background Card
      const qrBoxX = 220;
      const qrBoxY = 460;
      const qrBoxSize = 760;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
      ctx.fill();

      // Border around QR box
      ctx.strokeStyle = '#e2d5c3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
      ctx.stroke();

      // Load QR Image onto canvas
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      // Draw QR image centered
      const qrPad = 40;
      ctx.drawImage(qrImg, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);

      // Scan Instructions
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SCAN WITH YOUR CAMERA', 600, 1320);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '22px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Point your phone camera to view & download photos instantly', 600, 1375);

      // Direct URL
      ctx.fillStyle = '#c5a880';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(galleryUrl, 600, 1435);

      // Footer
      ctx.fillStyle = '#71717a';
      ctx.font = '600 18px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('POWERED BY MARA PHOTO', 600, 1620);

      // Export as PNG
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `Standee_Card_${selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Printable Standee Card created & downloaded!');
      }
    } catch (err) {
      console.error('Standee card error:', err);
      toast.error('Failed to create Standee Card');
    } finally {
      setDownloadingCard(false);
    }
  };

  // Copy gallery link
  const handleCopyLink = () => {
    if (!galleryUrl) return;
    navigator.clipboard.writeText(galleryUrl);
    setLinkCopied(true);
    toast.success('Gallery link copied to clipboard!');
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    if (!galleryUrl || !selectedEvent) return;
    const text = encodeURIComponent(
      `Hello! You can view all photos from *${selectedEvent.name}* here:\n${galleryUrl}\n\nScan or click to enjoy the gallery!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Native share
  const handleSystemShare = async () => {
    if (!galleryUrl || !selectedEvent) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedEvent.name,
          text: `View photos from ${selectedEvent.name}`,
          url: galleryUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="w-full min-h-full bg-[#f8f7f4] text-slate-900 p-4 sm:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c5a880] to-[#9e7d53] flex items-center justify-center text-white shadow-lg shadow-[#c5a880]/20 shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Generate QR Code
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#c5a880]/15 text-[#8a6e42] px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Instant high-resolution QR codes for client galleries, prints, and table standees.
              </p>
            </div>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-3 bg-[#f8f7f4] border border-slate-200 px-4 py-2.5 rounded-2xl shrink-0 self-start md:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">
                {events.length} Available Event{events.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Main Grid: Left Controls + Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Event Selection & Options (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Event Picker Box */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Select Gallery Event</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Pick the event you want to generate a QR for</p>
                </div>
              </div>

              {/* Dropdown Container */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-3 bg-[#f8f7f4] hover:bg-slate-100/80 border border-slate-200 hover:border-[#c5a880] rounded-2xl p-3.5 transition-all text-left cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#c5a880]/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {selectedEvent ? (
                      <>
                        {selectedEvent.coverImageUrl ? (
                          <img
                            src={selectedEvent.coverImageUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {selectedEvent.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6e42] bg-[#c5a880]/15 px-2 py-0.5 rounded-md">
                              {selectedEvent.type || 'EVENT'}
                            </span>
                            {selectedEvent.date && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-dashed border-slate-300">
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Choose an event...</span>
                      </>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      dropdownOpen ? 'rotate-180 text-[#c5a880]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Search Field */}
                    <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search event name or code..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-8 py-2 bg-[#f8f7f4] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] transition-colors"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Events List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {loading ? (
                        <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#c5a880]" />
                          Loading events...
                        </div>
                      ) : filteredEvents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No matching events found.
                        </div>
                      ) : (
                        filteredEvents.map((event) => {
                          const isCur = selectedEvent?._id === event._id;
                          return (
                            <button
                              key={event._id}
                              type="button"
                              onClick={() => {
                                setSelectedEvent(event);
                                setDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors cursor-pointer hover:bg-[#faf8f5] ${
                                isCur ? 'bg-[#c5a880]/10' : ''
                              }`}
                            >
                              {event.coverImageUrl ? (
                                <img
                                  src={event.coverImageUrl}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {event.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                                  <span>{event.type || 'EVENT'}</span>
                                  {event.date && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {isCur && (
                                <div className="w-5 h-5 rounded-full bg-[#c5a880] flex items-center justify-center text-white shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Event Details Preview */}
              {selectedEvent && (
                <div className="bg-[#faf8f5] border border-[#e6d5c0]/60 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[#8a6e42]">
                      Active Event Info
                    </span>
                    <a
                      href={galleryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#8a6e42] hover:text-[#5e4b2d] flex items-center gap-1 underline underline-offset-2"
                    >
                      Visit Gallery <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedEvent.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      Event Code: <span className="font-bold text-slate-700">{selectedEvent.code || selectedEvent.eventCode || selectedEvent._id}</span>
                    </p>
                    {selectedEvent.clientName && (
                      <p className="text-xs text-slate-500 font-medium">
                        Client: <span className="text-slate-700">{selectedEvent.clientName}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QR Appearance Styling */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">2. QR Code Style</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Select your preferred color profile</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setQrTheme('classic')}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    qrTheme === 'classic'
                      ? 'border-[#c5a880] bg-[#c5a880]/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-[#f8f7f4]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Classic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQrTheme('gold')}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    qrTheme === 'gold'
                      ? 'border-[#c5a880] bg-[#c5a880]/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-[#f8f7f4]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#c5a880] flex items-center justify-center text-white">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Gold Tone</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQrTheme('inverted')}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    qrTheme === 'inverted'
                      ? 'border-[#c5a880] bg-[#c5a880]/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-[#f8f7f4]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-[#c5a880]">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Dark Invert</span>
                </button>
              </div>
            </div>

            {/* Quick Share Options */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900">3. Quick Share</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={!selectedEvent}
                  className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer border border-[#25D366]/30 disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4 text-[#25D366]" />
                  Share WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSystemShare}
                  disabled={!selectedEvent}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4 text-slate-500" />
                  Share Gallery
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: Live High-Def Display & Download Studio (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">QR Code Live Display</h2>
                  <p className="text-xs text-slate-400 font-medium">Scannable with any iOS or Android camera</p>
                </div>
                {selectedEvent && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>

              {/* QR Showcase Frame */}
              <div className="flex flex-col items-center justify-center py-6">
                {generating ? (
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-[#f8f7f4] flex flex-col items-center justify-center gap-3 border border-dashed border-slate-300">
                    <Loader2 className="w-8 h-8 text-[#c5a880] animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Rendering high-res QR...</span>
                  </div>
                ) : qrDataUrl && selectedEvent ? (
                  <div className="flex flex-col items-center w-full max-w-sm">

                    {/* QR Display Card */}
                    <div className="w-full bg-[#f8f7f4] border border-slate-200/80 rounded-3xl p-6 shadow-inner flex flex-col items-center text-center space-y-4">
                      {/* Studio Top Label & Logo */}
                      <div className="flex flex-col items-center gap-1.5">
                        {studio?.logoUrl ? (
                          <img
                            src={studio.logoUrl}
                            alt={studio?.name || 'Studio Logo'}
                            className="max-h-12 max-w-[160px] object-contain rounded-md"
                          />
                        ) : null}
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#8a6e42]">
                          {studio?.name || 'MARA PHOTO STUDIO'}
                        </p>
                      </div>

                      {/* The QR Image */}
                      <div className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-md">
                        <img
                          src={qrDataUrl}
                          alt="Event QR Code"
                          className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                        />
                      </div>

                      {/* Event Title */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 line-clamp-1">
                          {selectedEvent.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Scan camera to view & download photos
                        </p>
                      </div>
                    </div>

                    {/* Copy Link Bar */}
                    <div className="w-full mt-4 flex items-center bg-[#f8f7f4] border border-slate-200 rounded-2xl overflow-hidden p-1.5 shadow-sm">
                      <input
                        type="text"
                        readOnly
                        value={galleryUrl}
                        className="flex-1 bg-transparent px-3 text-xs text-slate-600 font-mono outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          linkCopied
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{linkCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="w-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-[#f8f7f4] border border-dashed border-slate-300 flex items-center justify-center text-slate-300 mb-3">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No Event Selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select an event from the left to view and download QR</p>
                  </div>
                )}
              </div>

              {/* Download Action Buttons */}
              {selectedEvent && qrDataUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {/* Option 1: Standard High-Res PNG */}
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={downloadingPng}
                    className="flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {downloadingPng ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#c5a880]" />
                    ) : (
                      <Download className="w-4 h-4 text-[#c5a880]" />
                    )}
                    <span>Download QR (PNG)</span>
                  </button>

                  {/* Option 2: Table Standee Display Card */}
                  <button
                    type="button"
                    onClick={handleDownloadStandeeCard}
                    disabled={downloadingCard}
                    className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#c5a880] to-[#b0936b] hover:from-[#b0936b] hover:to-[#9e7d53] text-[#09090b] font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {downloadingCard ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#09090b]" />
                    ) : (
                      <Printer className="w-4 h-4 text-[#09090b]" />
                    )}
                    <span>Download Standee Card</span>
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
