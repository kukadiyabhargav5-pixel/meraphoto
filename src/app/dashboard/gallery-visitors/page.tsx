'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Calendar, Mail, Phone, User, Users, Search } from 'lucide-react';
import Link from 'next/link';

export default function GalleryVisitorsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [visitorSearchQuery, setVisitorSearchQuery] = useState('');

  const filteredEvents = events.filter(e => 
    e.name?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    e.type?.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const filteredVisitors = visitors.filter(v => 
    v.name?.toLowerCase().includes(visitorSearchQuery.toLowerCase()) ||
    v.phone?.includes(visitorSearchQuery) ||
    v.email?.toLowerCase().includes(visitorSearchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchVisitors(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get('/visitors/events');
      setEvents(res.data.events || []);
      if (res.data.events?.length > 0) {
        setSelectedEventId(res.data.events[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchVisitors = async (eventId: string) => {
    setLoadingVisitors(true);
    try {
      const res = await apiClient.get(`/visitors/event/${eventId}`);
      setVisitors(res.data.visitors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVisitors(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex overflow-hidden">
      {/* Left Pane - Event List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#c5a880]" />
            Gallery Leads
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">Select an event to view guests</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingEvents ? (
            <div className="text-center text-slate-400 py-8 text-sm">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">No events found.</div>
          ) : (
            filteredEvents.map((event) => (
              <button
                key={event._id}
                onClick={() => setSelectedEventId(event._id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                  selectedEventId === event._id
                    ? 'border-[#c5a880] bg-[#c5a880]/5 shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <h3 className="font-bold text-slate-800 text-sm truncate">{event.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {event.type}
                  </span>
                  <span className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 px-2 py-0.5 rounded-full">
                    {event.visitorCount} {event.visitorCount === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Visitor Table */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
        {selectedEventId ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Guest List</h2>
                  <p className="text-sm text-slate-500 mt-1">Visitors who logged in to view the gallery</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search guests by name or phone..."
                      value={visitorSearchQuery}
                      onChange={(e) => setVisitorSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl whitespace-nowrap">
                    Total: {filteredVisitors.length}
                  </div>
                </div>
              </div>

              {loadingVisitors ? (
                <div className="p-12 text-center text-slate-400 text-sm">Loading visitors...</div>
              ) : visitors.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No visitors yet</h3>
                  <p className="text-sm text-slate-500 max-w-sm">When clients view this gallery, their details will appear here.</p>
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">No guests matched your search.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        <th className="p-4 border-b border-slate-200">Name</th>
                        <th className="p-4 border-b border-slate-200">Contact Info</th>
                        <th className="p-4 border-b border-slate-200">Date Logged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((v) => (
                        <tr key={v._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#c5a880]/10 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-[#c5a880]" />
                              </div>
                              <span className="font-bold text-slate-800 text-sm">{v.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {v.phone}
                              </div>
                              {v.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  {v.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(v.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Select an event from the left sidebar to view its visitors.
          </div>
        )}
      </div>
    </div>
  );
}
