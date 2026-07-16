'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';


export default function OrderBookingPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    customers, setCustomers,
    team, setTeam,
    bookings, setBookings,
    quotations, setQuotations,
    bills, setBills,
    studio, setStudio,
    sessionUser,
    tickets, setTickets,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg

    
  } = context;

  const [bookingSubView, setBookingSubView] = useState('list');
  const [newBookingClient, setNewBookingClient] = useState('');
  const [newBookingEvent, setNewBookingEvent] = useState('');
  const [newBookingDate, setNewBookingDate] = useState('');
  const [newBookingAmount, setNewBookingAmount] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {bookingSubView === 'list' ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Event Bookings Log</h1>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Track scheduled photography shoots, client details, and revenue contracts.</p>
                  </div>
                  <button onClick={() => setBookingSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
                    <Plus className="h-4 w-4" /> New Booking
                  </button>
                </div>
                <div className=" bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4">Client Name</th>
                        <th className="p-4">Shoot Type</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Contract Value</th>
                        <th className="p-4 text-[#c5a880]">Token Paid</th>
                        <th className="p-4 text-rose-455">Balance Left</th>
                        <th className="p-4 text-center">Payment status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {bookings.map((booking, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-bold text-slate-900">{booking.client}</td>
                          <td className="p-4 text-slate-700 font-semibold">{booking.type}</td>
                          <td className="p-4 font-mono font-semibold">{booking.date}</td>
                          <td className="p-4 font-black text-slate-900">₹{booking.value.replace('₹', '')}</td>
                          <td className="p-4 font-bold text-[#c5a880]">₹{booking.advance ? booking.advance.replace('₹', '') : '0'}</td>
                          <td className="p-4 font-black text-rose-400">₹{booking.balance ? booking.balance.replace('₹', '') : '0'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.status === 'Fully Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : booking.status === 'Paid Advance' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="max-w-xl flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setBookingSubView('list'); setSelectedEventCodeForBooking(''); }} className="text-slate-700 hover:text-slate-900 text-xs font-bold underline cursor-pointer">
                    ← Back to Bookings
                  </button>
                  <h1 className="text-2xl font-extrabold text-slate-900">Create Event Booking</h1>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newBookingClient) {
                    const totalVal = parseFloat(newBookingValue) || 0;
                    const advVal = parseFloat(newBookingAdvance) || 0;
                    const balVal = Math.max(0, totalVal - advVal);
                    
                    try {
                      const reqBody = { 
                        clientName: newBookingClient, 
                        eventType: newBookingType, 
                        date: newBookingDate || '2026-07-21', 
                        amount: totalVal,
                        status: newBookingStatus === 'Fully Paid' ? 'Confirmed' : 'Pending'
                      };
                      const res = await apiClient.post('/dashboard/bookings', reqBody);
                      setBookings([res.data, ...bookings]);
                      setNewBookingClient(''); setNewBookingDate(''); setNewBookingValue(''); setNewBookingAdvance(''); setNewBookingBalance('');
                      setSelectedEventCodeForBooking('');
                      setBookingSubView('list');
                      setSuccessMsg('New booking record added successfully!');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg('Failed to create booking');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Select Event</label>
                    <select
                      value={selectedEventCodeForBooking}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEventCodeForBooking(val);
                        const ev = events.find(event => event._id === val || event.code === val);
                        if (ev) {
                          setNewBookingClient(`${ev.clientName} (${ev.name})`);
                          setNewBookingType(ev.eventType === 'WEDDING' ? 'Destination Wedding' : ev.eventType === 'CORPORATE' ? 'Corporate Office Shoot' : 'Outdoor Pre-Wedding');
                          setNewBookingDate(ev.date ? ev.date.split('T')[0] : '2026-07-21');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option className="bg-white text-slate-900" value="">-- Or Select Existing Event --</option>
                      {events.map((ev) => (
                        <option className="bg-white text-slate-900" key={ev._id} value={ev._id}>{ev.name} ({ev.clientName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Client Name</label>
                    <input type="text" required value={newBookingClient} onChange={(e) => setNewBookingClient(e.target.value)} placeholder="Amit Shah (Wedding)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Shoot Type</label>
                    <select value={newBookingType} onChange={(e) => setNewBookingType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                      <option className="bg-white text-slate-900" value="Destination Wedding">Destination Wedding</option>
                      <option className="bg-white text-slate-900" value="Outdoor Pre-Wedding">Outdoor Pre-Wedding</option>
                      <option className="bg-white text-slate-900" value="Indoor Gala Coverage">Indoor Gala Coverage</option>
                      <option className="bg-white text-slate-900" value="Corporate Office Shoot">Corporate Office Shoot</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Shoot Date</label>
                      <input type="date" required value={newBookingDate} onChange={(e) => setNewBookingDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Contract Value (INR)</label>
                      <input type="number" required value={newBookingValue} onChange={(e) => setNewBookingValue(e.target.value)} placeholder="150000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Token / Advance Paid (INR)</label>
                      <input type="number" value={newBookingAdvance} onChange={(e) => setNewBookingAdvance(e.target.value)} placeholder="50000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Balance Left / Due (Auto)</label>
                      <div className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-350 font-bold font-mono">
                        ₹{(Math.max(0, (parseFloat(newBookingValue) || 0) - (parseFloat(newBookingAdvance) || 0))).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Payment Status</label>
                    <select value={newBookingStatus} onChange={(e) => setNewBookingStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                      <option className="bg-white text-slate-900" value="Paid Advance">Paid Advance</option>
                      <option className="bg-white text-slate-900" value="Fully Paid">Fully Paid</option>
                      <option className="bg-white text-slate-900" value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    Register Booking Record
                  </button>
                </form>
              </div>
            )}
          </div>
    </div>
  );
}
