'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Calendar, Mail, Phone, User, Users, Search, Trash2, Loader2, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GalleryVisitorsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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
      const rawEvents = res.data.events || [];
      // Sort descending by event date (so 17 Sept is FIRST at top, and 12 Sept is SECOND below it)
      const sortedEvents = [...rawEvents].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setEvents(sortedEvents);
      if (sortedEvents.length > 0) {
        setSelectedEventId(prev => {
          if (prev && sortedEvents.some(e => e._id === prev)) return prev;
          return sortedEvents[0]._id;
        });
      } else {
        setSelectedEventId(null);
        setVisitors([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
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

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This will remove the event and all guest visitor leads.`)) {
      return;
    }
    setDeletingId(eventId);
    try {
      await apiClient.delete(`/visitors/event/${eventId}`);
      toast.success('Event and visitor records deleted successfully');
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to delete event visitors:', err);
      toast.error(err.response?.data?.error || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  // Download all visitors of the currently selected event as CSV
  const handleDownloadCsv = () => {
    if (filteredVisitors.length === 0) {
      toast.error('No visitors to download for this event');
      return;
    }
    const currentEvent = events.find(e => e._id === selectedEventId);
    const eventName = currentEvent?.name || 'Event';
    const eventDate = currentEvent?.date 
      ? new Date(currentEvent.date).toLocaleDateString('en-GB') 
      : '';

    const headers = ['Sr No', 'Guest Name', 'Mobile Number', 'Email Address', 'Date Logged', 'Event Name', 'Event Date'];
    
    const rows = filteredVisitors.map((v, idx) => [
      idx + 1,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${(v.phone || '').replace(/"/g, '""')}"`,
      `"${(v.email || '').replace(/"/g, '""')}"`,
      `"${new Date(v.createdAt).toLocaleDateString('en-GB')} ${new Date(v.createdAt).toLocaleTimeString()}"`,
      `"${eventName.replace(/"/g, '""')}"`,
      `"${eventDate}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Guest_List_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Guest list CSV downloaded successfully!');
  };

  // Print all visitors of the currently selected event
  const handlePrint = () => {
    if (filteredVisitors.length === 0) {
      toast.error('No visitors to print for this event');
      return;
    }
    const currentEvent = events.find(e => e._id === selectedEventId);
    const eventName = currentEvent?.name || 'Event';
    const eventDateStr = currentEvent?.date 
      ? new Date(currentEvent.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the guest list.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest List - ${eventName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #0f172a; background: #fff; }
            .header-box { border-bottom: 2px solid #c5a880; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
            .meta { font-size: 13px; color: #64748b; font-weight: 500; }
            .total-badge { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 700; }
            td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; }
            tr:nth-child(even) { background-color: #fafbfc; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
            @media print {
              body { padding: 16px; }
              @page { margin: 1cm; size: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1>${eventName}</h1>
              <div class="meta">
                ${eventDateStr ? `Event Date: <strong>${eventDateStr}</strong> • ` : ''}
                Printed on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}
              </div>
            </div>
            <div class="total-badge">
              Total Guests: ${filteredVisitors.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>Guest Name</th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVisitors.map((v, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-weight: 700;">${v.name || '-'}</td>
                  <td style="font-family: monospace;">${v.phone || '-'}</td>
                  <td>${v.email || '-'}</td>
                  <td>${new Date(v.createdAt).toLocaleDateString('en-GB')} ${new Date(v.createdAt).toLocaleTimeString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Gallery Leads Report • Mara Photo
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1200);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 bg-[#f8f7f4] text-slate-900 flex flex-col md:flex-row overflow-hidden">
      {/* Left Pane - Event List */}
      <div className="w-full md:w-80 h-1/2 md:h-full bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
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
              className="w-full pl-9 pr-4 py-2 bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loadingEvents ? (
            <div className="text-center text-slate-400 py-8 text-sm">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">No events found.</div>
          ) : (
            filteredEvents.map((event) => {
              const isSelected = selectedEventId === event._id;
              const isDeleting = deletingId === event._id;
              const formattedDate = event.date 
                ? new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : null;

              return (
                <div
                  key={event._id}
                  className={`group relative rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? 'border-[#c5a880] bg-[#c5a880]/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-[#f8f7f4]'
                  }`}
                >
                  <button
                    onClick={() => setSelectedEventId(event._id)}
                    className="w-full text-left p-4 pr-12 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-800 text-sm truncate flex-1">{event.name}</h3>
                      {formattedDate && (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          {formattedDate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${event.isArchived ? 'text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded' : 'text-slate-500'}`}>
                        {event.isArchived ? 'Completed (30d)' : event.type || 'EVENT'}
                      </span>
                      <span className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-0.5 rounded-full">
                        {event.visitorCount || 0} {(event.visitorCount || 0) === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event._id, event.name);
                    }}
                    disabled={isDeleting}
                    className="absolute right-2.5 top-3.5 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    title="Delete event and leads"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Visitor Table */}
      <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-6 md:p-10">
        {selectedEventId ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">Guest List</h2>
                    {events.find(e => e._id === selectedEventId) && (
                      <span className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-0.5 rounded-full">
                        {events.find(e => e._id === selectedEventId)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Visitors who logged in to view the gallery</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 sm:w-60 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search guests by name or phone..."
                      value={visitorSearchQuery}
                      onChange={(e) => setVisitorSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl whitespace-nowrap">
                    Total: {filteredVisitors.length}
                  </div>

                  {/* Download CSV Button */}
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={loadingVisitors || filteredVisitors.length === 0}
                    className="flex items-center gap-1.5 bg-[#c5a880] hover:bg-[#b0936b] text-[#09090b] font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Download Guest List as CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={loadingVisitors || filteredVisitors.length === 0}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Print Guest List"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#c5a880]" />
                    <span>Print</span>
                  </button>
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
                      <tr className="bg-[#f8f7f4] text-slate-900 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        <th className="p-4 border-b border-slate-200">Name</th>
                        <th className="p-4 border-b border-slate-200">Contact Info</th>
                        <th className="p-4 border-b border-slate-200">Date Logged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((v) => (
                        <tr key={v._id} className="border-b border-slate-100 hover:bg-[#f8f7f4] text-slate-900/50 transition-colors">
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
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
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
                              {new Date(v.createdAt).toLocaleDateString('en-GB')} {new Date(v.createdAt).toLocaleTimeString()}
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
