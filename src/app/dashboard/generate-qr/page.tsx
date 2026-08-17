'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Search, Download, Calendar, Loader2, Check, Sparkles, ChevronDown, Image as ImageIcon, RefreshCw, Share2, X } from 'lucide-react';
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
}

export default function GenerateQRPage() {
  const { studio } = useDashboard();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          setEvents(res.data.events);
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

  // Filter events based on search
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.type && event.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.code && event.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.clientName && event.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Generate unique QR code
  const handleGenerateQR = useCallback(async () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    setGenerating(true);
    setGenerated(false);
    setQrDataUrl('');

    try {
      const baseUrl = `${window.location.origin}/e/${selectedEvent.code || selectedEvent.eventCode}`;
      const uniqueRef = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const uniqueUrl = `${baseUrl}?ref=${uniqueRef}`;
      setGalleryUrl(baseUrl);

      const dataUrl = await QRCode.toDataURL(uniqueUrl, {
        width: 1024,
        margin: 3,
        color: {
          dark: '#0c0c0e',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      // Smooth animation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setQrDataUrl(dataUrl);
      setGenerated(true);
      toast.success('QR Code generated successfully!');
    } catch (err) {
      console.error('QR generation error:', err);
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  }, [selectedEvent]);

  // Download QR code with progress animation
  const handleDownload = useCallback(async () => {
    if (!qrDataUrl || !selectedEvent) return;

    setDownloading(true);
    setDownloadProgress(0);

    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        return prev + Math.random() * 12 + 4;
      });
    }, 80);

    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const link = document.createElement('a');
      link.download = `QR_${selectedEvent.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = qrDataUrl;
      link.click();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success('QR Code downloaded!');
    } catch (err) {
      clearInterval(progressInterval);
      toast.error('Download failed');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [qrDataUrl, selectedEvent]);

  // Share QR
  const handleShare = useCallback(async () => {
    if (!galleryUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedEvent?.name} - Gallery`,
          text: `View the photo gallery for ${selectedEvent?.name}`,
          url: galleryUrl,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(galleryUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Gallery link copied!');
    }
  }, [galleryUrl, selectedEvent]);

  // Copy link
  const handleCopyLink = useCallback(() => {
    if (!galleryUrl) return;
    navigator.clipboard.writeText(galleryUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [galleryUrl]);

  // Reset for new generation
  const handleReset = () => {
    setSelectedEvent(null);
    setQrDataUrl('');
    setGenerated(false);
    setGalleryUrl('');
    setSearchQuery('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes qrSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes qrScaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes qrPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(197, 168, 128, 0.3); }
          50% { box-shadow: 0 0 0 12px rgba(197, 168, 128, 0); }
        }
        @keyframes qrShine {
          from { left: -100%; }
          to { left: 200%; }
        }
        @keyframes progressStripe {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
        .qr-card { animation: qrSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .qr-card-delay { animation: qrSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .qr-result { animation: qrScaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .qr-pulse { animation: qrPulse 2s ease-in-out infinite; }
        .qr-shine {
          position: relative;
          overflow: hidden;
        }
        .qr-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: qrShine 3s ease-in-out infinite;
        }
        .progress-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255,255,255,0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255,255,255,0.15) 50%,
            rgba(255,255,255,0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
          animation: progressStripe 0.5s linear infinite;
        }
        .dropdown-item:hover .dropdown-thumb {
          transform: scale(1.08);
        }
      `}} />

      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 qr-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-[#c5a880]/20 to-[#c5a880]/5 rounded-2xl">
              <QrCode className="w-6 h-6 text-[#c5a880]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Generate QR Code</h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Create unique QR codes for your event galleries</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — Event Selection */}
          <div className="qr-card">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <span className="text-base">📋</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Select Event</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Choose a gallery event</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Event Selector Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                    Event
                  </label>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between bg-[#f8f7f4] border border-slate-200 hover:border-[#c5a880] rounded-xl px-4 py-3.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedEvent ? (
                        <>
                          {selectedEvent.coverImageUrl ? (
                            <img src={selectedEvent.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="text-left min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{selectedEvent.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-[#c5a880] uppercase tracking-wider">{selectedEvent.type || 'EVENT'}</span>
                              {selectedEvent.date && (
                                <>
                                  <span className="text-slate-200">•</span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {String(selectedEvent.date).split('T')[0].split('-').reverse().join('/')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-dashed border-slate-300">
                            <Calendar className="w-4 h-4 text-slate-300" />
                          </div>
                          <span className="text-sm text-slate-400 font-medium">Choose an event...</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Panel */}
                  {dropdownOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl z-20 overflow-hidden"
                      style={{ maxHeight: '380px' }}
                    >
                      {/* Search */}
                      <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by name, type, or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f7f4] border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#c5a880] transition-colors"
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Events List */}
                      <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                        {loading ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Loader2 className="w-6 h-6 text-[#c5a880] animate-spin" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading events...</span>
                          </div>
                        ) : filteredEvents.length === 0 ? (
                          <div className="py-10 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Search className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">No events found</p>
                            <p className="text-[10px] text-slate-300 mt-1">Try a different search term</p>
                          </div>
                        ) : (
                          filteredEvents.map((event) => (
                            <button
                              key={event._id}
                              onClick={() => {
                                setSelectedEvent(event);
                                setDropdownOpen(false);
                                setSearchQuery('');
                                setQrDataUrl('');
                                setGenerated(false);
                              }}
                              className={`dropdown-item w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#faf8f5] transition-all text-left cursor-pointer border-b border-slate-50 last:border-b-0 ${
                                selectedEvent?._id === event._id ? 'bg-[#c5a880]/5' : ''
                              }`}
                            >
                              {event.coverImageUrl ? (
                                <img src={event.coverImageUrl} alt="" className="dropdown-thumb w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 transition-transform" />
                              ) : (
                                <div className="dropdown-thumb w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 transition-transform">
                                  <ImageIcon className="w-5 h-5 text-slate-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800 truncate">{event.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{event.type || 'EVENT'}</span>
                                  {event.date && (
                                    <>
                                      <span className="text-slate-200">•</span>
                                      <span className="text-[9px] text-slate-400 font-medium">
                                        {String(event.date).split('T')[0].split('-').reverse().join('/')}
                                      </span>
                                    </>
                                  )}
                                  {event.clientName && (
                                    <>
                                      <span className="text-slate-200">•</span>
                                      <span className="text-[9px] text-slate-400 font-medium truncate">{event.clientName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {selectedEvent?._id === event._id && (
                                <div className="w-5 h-5 bg-[#c5a880] rounded-full flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Events count footer */}
                      {!loading && filteredEvents.length > 0 && (
                        <div className="px-4 py-2 bg-[#f8f7f4] border-t border-slate-100">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
                            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Event Preview Card */}
                {selectedEvent && (
                  <div className="bg-[#faf8f5] border border-[#e6d5c0]/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {selectedEvent.coverImageUrl ? (
                        <img src={selectedEvent.coverImageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-7 h-7 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{selectedEvent.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-[9px] font-black text-[#c5a880] uppercase tracking-wider bg-[#c5a880]/10 px-2 py-0.5 rounded-md">{selectedEvent.type || 'EVENT'}</span>
                          {selectedEvent.date && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {String(selectedEvent.date).split('T')[0].split('-').reverse().join('/')}
                            </span>
                          )}
                        </div>
                        {selectedEvent.clientName && (
                          <p className="text-[10px] text-slate-400 font-medium mt-1.5">Client: {selectedEvent.clientName}</p>
                        )}
                      </div>
                      <button
                        onClick={handleReset}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                        title="Clear selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                {selectedEvent && !generated && (
                  <button
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-60 cursor-pointer qr-shine"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating QR Code...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate QR Code
                      </>
                    )}
                  </button>
                )}

                {/* Regenerate after generation */}
                {generated && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setGenerated(false); setQrDataUrl(''); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      New Event
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!selectedEvent && !loading && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                      <QrCode className="w-7 h-7 text-slate-200" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Select an event above to generate a QR code</p>
                    <p className="text-[10px] text-slate-300 mt-1">The QR code will link to your event's public gallery</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — QR Code Result */}
          <div className="qr-card-delay">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#c5a880]/10 rounded-xl flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-[#c5a880]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">QR Code Preview</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {generated ? 'Ready to download' : 'Waiting for generation'}
                    </p>
                  </div>
                </div>
                {generated && (
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    ✓ Generated
                  </span>
                )}
              </div>

              <div className="p-6 flex flex-col items-center">
                {generating ? (
                  /* Generating State */
                  <div className="py-12 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-[#f8f5f0] rounded-2xl flex items-center justify-center border border-[#e6d5c0] qr-pulse">
                      <Loader2 className="w-8 h-8 text-[#c5a880] animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-800">Generating QR Code</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Creating a unique QR code for your gallery...</p>
                    </div>
                  </div>
                ) : generated && qrDataUrl ? (
                  /* Generated QR Code */
                  <div className="qr-result flex flex-col items-center w-full">
                    {/* QR Code Image */}
                    <div className="relative p-5 bg-white rounded-2xl border-2 border-dashed border-[#c5a880]/30 shadow-inner mb-5">
                      <img
                        src={qrDataUrl}
                        alt={`QR Code for ${selectedEvent?.name}`}
                        className="w-56 h-56 object-contain rounded-xl"
                      />
                      {/* Center badge */}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#c5a880] text-[#09090b] text-[7px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                        Gallery QR Code
                      </div>
                    </div>

                    {/* Event Info */}
                    <p className="text-base font-bold text-slate-800 text-center mt-2 mb-0.5 truncate max-w-full">
                      {selectedEvent?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium text-center mb-2">
                      Scan to view the photo gallery
                    </p>

                    {/* Gallery Link */}
                    {galleryUrl && (
                      <div className="w-full flex items-center bg-[#f8f7f4] border border-slate-200 rounded-lg overflow-hidden mb-5 mt-2">
                        <input
                          type="text"
                          readOnly
                          value={galleryUrl}
                          className="flex-1 bg-transparent text-[10px] sm:text-xs text-slate-500 px-3 py-2.5 outline-none font-mono"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="bg-white hover:bg-slate-50 text-slate-600 px-3 py-2.5 text-[10px] font-bold transition-colors flex items-center gap-1 border-l border-slate-200 cursor-pointer whitespace-nowrap"
                        >
                          {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <span>📋</span>}
                          {linkCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}

                    {/* Download Button with Progress */}
                    <div className="w-full space-y-3">
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 bg-[#c5a880] hover:bg-[#b0936b] text-[#09090b] font-extrabold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer disabled:cursor-wait"
                      >
                        {/* Progress bar background */}
                        {downloading && (
                          <div
                            className="absolute inset-y-0 left-0 bg-[#b0936b] transition-all duration-100 ease-out progress-striped"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2.5">
                          {downloading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing... {Math.round(downloadProgress)}%
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download QR Code
                            </>
                          )}
                        </span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share Gallery Link
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="py-16 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-[#f8f7f4] rounded-3xl flex items-center justify-center border border-dashed border-slate-200">
                      <QrCode className="w-10 h-10 text-slate-200" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-400">No QR Code Yet</p>
                      <p className="text-[10px] text-slate-300 font-medium mt-1 max-w-[220px]">Select an event and click "Generate" to create a unique QR code</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Studio branding footer */}
              {generated && studio?.name && (
                <div className="px-6 py-3 bg-[#f8f7f4] border-t border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Powered by {studio.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
