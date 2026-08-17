'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Image as ImageIcon, Video, Loader2, Sparkles, Crown, ArrowRight, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function EventsManagementPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventRes, credRes] = await Promise.allSettled([
          apiClient.get('/event/my'),
          apiClient.get('/studio/credits')
        ]);
        
        if (eventRes.status === 'fulfilled' && eventRes.value.data?.events) {
          setEvents([...eventRes.value.data.events].reverse());
        }
        if (credRes.status === 'fulfilled' && credRes.value.data?.credits) {
          setCredits(credRes.value.data.credits);
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
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <style dangerouslySetInnerHTML={{__html: `
        .event-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .event-card:hover {
          transform: translateY(-2px);
          border-color: #c5a880;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .create-block {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          aspect-ratio: 16 / 9;
        }
        .create-block:hover {
          background: #f1f5f9;
          border-color: #c5a880;
        }
      `}} />
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events Management</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage all your upcoming and past photography events here.</p>
          </div>
          <Link
            href="/dashboard/plans-billing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#c5a880] text-slate-800 text-xs font-bold transition-all shadow-xs self-start sm:self-auto hover:scale-102"
          >
            <Crown className="w-4 h-4 text-[#c5a880]" />
            <span>Manage Plan & Storage</span>
          </Link>
        </div>

        {/* Create Event Block */}
        <div>
          <Link href="/dashboard/create-event">
            <div className="create-block group w-full !h-[100px] !flex-row gap-4 p-4 justify-center items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-[#c5a880] group-hover:border-transparent transition-colors shrink-0">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-black transition-colors" />
              </div>
              <div className="text-left flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-800 mb-0.5">Create New Event</h3>
                <p className="text-sm text-slate-500">Setup a new photo gallery</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search events by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c5a880]/50 focus:border-[#c5a880] transition-all text-slate-700 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
            <div className="col-span-full py-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
            </div>
          ) : (
            events.filter(event => 
              event.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (event.code || event.eventCode || event._id?.slice(-6))?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              events.filter(event => 
                event.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (event.code || event.eventCode || event._id?.slice(-6))?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((event, idx) => (
                <Link key={event._id || idx} href={`/dashboard/events/${event.code || event.eventCode || event._id}`}>
                  <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-[#c5a880] transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col h-full cursor-pointer">
                    {/* Image Section */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                      {event.coverImageUrl ? (
                        <img 
                          src={event.coverImageUrl} 
                          alt={event.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="h-10 w-10 mb-2 stroke-[1.5]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No Cover Added</span>
                        </div>
                      )}
                    </div>

                    {/* Details Section */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#c5a880] transition-colors line-clamp-1">{event.name}</h3>
                        <p className="text-slate-500 text-xs font-medium mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 font-medium">Code: <strong className="font-mono text-slate-700">{event.code || event._id.slice(-6)}</strong></span>
                        <span className="text-[#c5a880] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Manage <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium">No events found matching "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="mt-3 text-xs text-[#c5a880] hover:underline font-bold">Clear search</button>
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}
