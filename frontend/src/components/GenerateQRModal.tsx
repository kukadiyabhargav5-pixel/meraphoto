'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Search, X, Download, ChevronDown, Calendar, Loader2, Check, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface Event {
  _id: string;
  name: string;
  code: string;
  eventCode?: string;
  type?: string;
  date?: string;
  coverImageUrl?: string;
}

export default function GenerateQRModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch events
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEvent(null);
      setQrDataUrl('');
      setSearchQuery('');
      setDropdownOpen(false);
      setGenerated(false);
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [isOpen]);

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
    (event.code && event.code.toLowerCase().includes(searchQuery.toLowerCase()))
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
      const galleryUrl = `${window.location.origin}/e/${selectedEvent.code || selectedEvent.eventCode}`;
      
      // Add a unique timestamp to make QR unique every time
      const uniqueUrl = `${galleryUrl}?ref=${Date.now().toString(36)}`;

      const qrDataUrl = await QRCode.toDataURL(uniqueUrl, {
        width: 1024,
        margin: 2,
        color: {
          dark: '#0c0c0e',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      // Small delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setQrDataUrl(qrDataUrl);
      setGenerated(true);
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

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 100);

    try {
      // Short delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 600));

      const link = document.createElement('a');
      link.download = `QR_${selectedEvent.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = qrDataUrl;
      link.click();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('QR Code downloaded successfully!');
    } catch (err) {
      clearInterval(progressInterval);
      toast.error('Download failed');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [qrDataUrl, selectedEvent]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-[61] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
          style={{ animation: 'qrModalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#c5a880]/20 to-[#c5a880]/5 rounded-xl">
                <QrCode className="w-5 h-5 text-[#c5a880]" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Generate Gallery QR</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Select event & generate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Event Selector Dropdown */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                Select Event
              </label>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between bg-[#f8f7f4] border border-slate-200 hover:border-[#c5a880] rounded-xl px-4 py-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {selectedEvent ? (
                    <>
                      {selectedEvent.coverImageUrl ? (
                        <img src={selectedEvent.coverImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{selectedEvent.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedEvent.type || 'EVENT'}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">Choose an event...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-10 overflow-hidden"
                  style={{ animation: 'qrDropdownFade 0.2s ease-out', maxHeight: '320px' }}
                >
                  {/* Search */}
                  <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f8f7f4] border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#c5a880] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Event List */}
                  <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-[#c5a880] animate-spin" />
                      </div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-slate-400 font-medium">No events found</p>
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
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8f7f4] transition-colors text-left cursor-pointer ${
                            selectedEvent?._id === event._id ? 'bg-[#c5a880]/5 border-l-2 border-[#c5a880]' : ''
                          }`}
                        >
                          {event.coverImageUrl ? (
                            <img src={event.coverImageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4 text-slate-300" />
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
                            </div>
                          </div>
                          {selectedEvent?._id === event._id && (
                            <Check className="w-4 h-4 text-[#c5a880] shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            {selectedEvent && !generated && (
              <button
                onClick={handleGenerateQR}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-60 cursor-pointer"
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

            {/* QR Code Display */}
            {generated && qrDataUrl && (
              <div
                className="flex flex-col items-center"
                style={{ animation: 'qrCodeReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                {/* QR Code Image */}
                <div className="relative p-5 bg-white rounded-2xl border-2 border-dashed border-[#c5a880]/30 shadow-inner mb-4">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedEvent?.name}`}
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                  {/* Center badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#c5a880] text-[#09090b] text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                    Gallery QR
                  </div>
                </div>

                {/* Event Info */}
                <p className="text-sm font-bold text-slate-800 text-center mt-2 mb-1 truncate max-w-full">
                  {selectedEvent?.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium text-center mb-5">
                  Scan to view the gallery
                </p>

                {/* Download Button with Progress */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 bg-[#c5a880] hover:bg-[#b0936b] text-[#09090b] font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer disabled:cursor-wait"
                >
                  {/* Progress bar background */}
                  {downloading && (
                    <div
                      className="absolute inset-0 bg-[#b0936b] transition-all duration-100 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading... {Math.round(downloadProgress)}%
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </>
                    )}
                  </span>
                </button>

                {/* Regenerate */}
                <button
                  onClick={() => { setGenerated(false); setQrDataUrl(''); }}
                  className="mt-3 text-[10px] font-bold text-slate-400 hover:text-[#c5a880] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Generate New QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes qrModalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes qrDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes qrCodeReveal {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
