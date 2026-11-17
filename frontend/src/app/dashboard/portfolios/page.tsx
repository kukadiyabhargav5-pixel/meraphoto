'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, resolveMediaUrl } from '@/lib/api';
import { 
  Loader2, 
  Calendar, 
  User, 
  MapPin, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Globe, 
  Image as ImageIcon,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

export default function PortfoliosPage() {
  const { studio } = useDashboard();
  const { studio: authStudio } = useAuth();
  const [portfolioEvents, setPortfolioEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const activeStudio = studio || authStudio;
  const studioSlug = activeStudio?.slug;

  const handleCopyLink = () => {
    if (!studioSlug) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/s/${studioSlug}` : `/s/${studioSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public portfolio link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          const filtered = res.data.events.filter((e: any) => e.addToPortfolio === true);
          filtered.sort((a: any, b: any) => {
            const timeA = new Date(a.date || a.createdAt || 0).getTime();
            const timeB = new Date(b.date || b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setPortfolioEvents(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f1e5] border border-[#c5a880]/40 text-xs font-bold text-[#99732e] uppercase tracking-wider mb-2.5">
              <Briefcase className="w-3.5 h-3.5 text-[#99732e]" />
              <span>Client Showcase</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Studio Portfolios</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Showcase your best events and high-resolution galleries to impress potential clients.
            </p>
          </div>

          {studioSlug && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm hover:border-[#c5a880]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'Copied Link' : 'Copy Portfolio URL'}</span>
              </button>

              <a
                href={`/s/${studioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#b89665] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-[#c5a880]/30 transition-all hover:scale-105"
              >
                <Globe className="w-4 h-4" />
                <span>Live Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-9 w-9 text-[#c5a880] animate-spin mb-3" />
            <p className="text-slate-500 text-sm font-medium">Loading portfolio events...</p>
          </div>
        ) : portfolioEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#f8f1e5] border border-[#c5a880]/30 mx-auto flex items-center justify-center text-[#99732e] mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Portfolio Events Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Feature your photography on your public portfolio website. Go to any event in your dashboard and toggle <strong>"Add to Portfolio"</strong>.
            </p>
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white text-xs font-extrabold shadow-md shadow-[#c5a880]/30 hover:opacity-95 transition-all"
            >
              <span>Browse Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Featuring <span className="text-[#99732e] font-black">{portfolioEvents.length}</span> Published {portfolioEvents.length === 1 ? 'Event' : 'Events'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioEvents.map((event, idx) => {
                const cover = event.coverImageUrl ? resolveMediaUrl(event.coverImageUrl) : '';
                const eventDate = event.date
                  ? new Date(event.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null;

                return (
                  <Link 
                    key={event._id || idx} 
                    href={`/dashboard/events/${event.code || event.eventCode || event._id}`}
                    className="block group"
                  >
                    <div className="relative overflow-hidden rounded-2xl cursor-pointer aspect-[16/9] flex flex-col justify-between p-5 border border-slate-200/90 group-hover:border-[#c5a880] transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1 bg-slate-900">
                      {/* Background Cover Image */}
                      <div className="absolute inset-0 z-0">
                        {cover ? (
                          <img 
                            src={cover} 
                            alt={event.name} 
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-10 h-10 mb-2 text-[#c5a880]/70" />
                            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Event Gallery</span>
                          </div>
                        )}
                        {/* High-Contrast Gradient Overlay: ensures 100% readable white text on any image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 via-45% to-black/25 group-hover:from-black/95 group-hover:via-black/45 transition-colors" />
                      </div>

                      {/* Top Badges (z-10 relative) */}
                      <div className="relative z-10 flex justify-between items-start gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#c5a880]/50 text-[10px] font-extrabold text-[#e0c9a6] uppercase tracking-wider shadow-md flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-[#c5a880]" />
                          <span>{event.type || 'PORTFOLIO'}</span>
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider shadow-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>PUBLISHED</span>
                        </span>
                      </div>

                      {/* Bottom Content (z-10 relative) - Crystal Clear White Text */}
                      <div className="relative z-10 mt-auto">
                        <h3 className="text-xl md:text-2xl font-black text-white mb-2 line-clamp-1 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-[#e0c9a6] transition-colors">
                          {event.name}
                        </h3>

                        {/* Event Meta Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-200 drop-shadow-sm mb-3">
                          {eventDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                              <span>{eventDate}</span>
                            </span>
                          )}

                          {event.clientName && (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <User className="w-3.5 h-3.5 text-[#c5a880]" />
                              <span className="line-clamp-1">{event.clientName}</span>
                            </span>
                          )}

                          {event.location && (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
                              <span className="line-clamp-1">{event.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Divider & Action */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/20 text-xs">
                          <span className="text-slate-300/90 font-mono text-[11px]">
                            Code: <strong className="text-white font-mono font-bold">#{event.code || event._id?.slice(-6)}</strong>
                          </span>
                          <span className="text-[#c5a880] font-extrabold inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform drop-shadow-sm">
                            Manage Event <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
