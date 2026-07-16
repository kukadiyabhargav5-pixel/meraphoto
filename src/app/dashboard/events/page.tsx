'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function EventsManagementPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          setEvents([...res.data.events].reverse());
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
    <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-4 md:p-8 font-poppins">
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
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Events Management</h1>
        <p className="text-slate-500 text-sm font-medium mb-8">Manage all your upcoming and past photography events here.</p>


        {/* Create Event Block */}
        <div className="mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
            <div className="col-span-full py-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
            </div>
          ) : (
            events.map((event, idx) => (
              <Link key={event._id || idx} href={`/dashboard/events/${event.code || event.eventCode || event._id}`}>
                <div className="relative group overflow-hidden rounded-2xl cursor-pointer aspect-video flex flex-col justify-between p-5 border border-slate-200 hover:border-[#c5a880] transition-all shadow-sm hover:shadow-md">
                  {/* Background Image & Overlay */}
                  <div className="absolute inset-0 z-0">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt={event.name} className="w-full h-full object-contain bg-slate-900 transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/40" />
                  </div>

                  {/* Content (z-10 relative) */}
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] font-bold text-[#c5a880] uppercase tracking-wider backdrop-blur-md">
                      {event.type || 'EVENT'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider backdrop-blur-md">
                      PUBLISHED
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-tight">{event.name}</h3>
                    
                    <div className="h-[1px] w-full bg-white/20" />
                  </div>
                </div>
              </Link>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
