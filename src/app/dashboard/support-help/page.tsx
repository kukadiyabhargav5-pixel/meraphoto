'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase,
  Mail, Phone, Clock
} from 'lucide-react';


export default function SupportHelpPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    tickets, setTickets,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg
  } = context;

  const handleCreateTicket = (e: any) => { e.preventDefault(); setSuccessMsg('Ticket submitted (Dummy)'); };
  const handleOpenTicket = (ticket: any) => { setSuccessMsg('Opening ticket... (Dummy)'); };
  
  const [supportSubView, setSupportSubView] = useState('list');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const handleReplyTicket = (e: any) => { e.preventDefault(); setSuccessMsg('Reply sent (Dummy)'); setReplyMessage(''); };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 text-black p-4 md:p-8">
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        {/* ── TOP HERO BANNER: Dark Expert Support Card ── */}
        <div className="w-full bg-[#09090b] text-white rounded-3xl p-8 md:p-14 relative overflow-hidden border border-[#e3d8c8]/20 shadow-2xl flex flex-col items-center text-center">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-6">
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tight">
              Studio <span className="italic text-[#c5a880]">Help Desk</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-poppins font-medium">
              Get fast responses, expert guidance, and reliable solutions from our dedicated support team.
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs md:text-sm font-bold uppercase tracking-wider text-gray-300 font-poppins">
              <div className="flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>Priority Support</span>
              </div>
              <div className="hidden sm:block text-[#e3d8c8]/30">•</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>9 AM - 6 PM IST</span>
              </div>
              <div className="hidden sm:block text-[#e3d8c8]/30">•</div>
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>Expert Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-poppins">
          {/* Email Pill */}
          <div className="bg-white border border-[#e3d8c8]/25 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-[#c5a880]/40 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center shrink-0 border border-[#e3d8c8]/10">
              <Mail className="w-5.5 h-5.5 text-[#c5a880]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest mb-0.5">Email Support</p>
              <p className="text-sm font-bold text-[#09090b]">maraphoto303@gmail.com</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">We'll reply within 24 hours</p>
            </div>
          </div>

          {/* Phone Pill */}
          <div className="bg-white border border-[#e3d8c8]/25 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-[#c5a880]/40 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center shrink-0 border border-[#e3d8c8]/10">
              <Phone className="w-5.5 h-5.5 text-[#c5a880]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest mb-0.5">Phone Support</p>
              <p className="text-sm font-bold text-[#09090b]">+91 87994 95028</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Available 9 AM - 6 PM IST</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tickets List and New Ticket Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Open Tickets ({tickets.length})</h3>
              {tickets.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {tickets.map((t) => (
                    <div key={t._id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedTicket?._id === t._id ? 'bg-[#c5a880]/10 text-slate-900 border-[#c5a880] shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-[#c5a880]/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900 truncate pr-2">{t.subject}</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider shrink-0 ${t.status === 'OPEN' ? 'bg-[#c5a880]/20 text-[#9e825a]' : t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold font-mono">
                        Last Updated: {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl text-center text-sm text-slate-500 font-medium border border-dashed border-slate-200">
                  No support tickets found
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-5">Open New Ticket</h3>
              <form onSubmit={handleCreateTicket} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Subject</label>
                  <input type="text" required value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)}  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Message Description</label>
                  <textarea required value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)}  rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] resize-none" />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-[#c5a880] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md">
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Ticket Thread */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white border border-slate-200 rounded-3xl flex flex-col h-[650px] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest mb-1">Ticket Thread</h4>
                    <h3 className="text-lg font-black text-slate-900">{selectedTicket.subject}</h3>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${selectedTicket.status === 'OPEN' ? 'bg-[#c5a880]/20 text-[#9e825a]' : selectedTicket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/50">
                  {selectedTicket.messages.map((msg: any, i: number) => {
                    const isAdmin = msg.sender === 'ADMIN';
                    return (
                      <div key={i} className={`flex flex-col max-w-[85%] ${isAdmin ? 'self-start' : 'self-end items-end'}`}>
                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isAdmin ? 'bg-white border border-slate-200 rounded-tl-sm text-slate-700' : 'bg-[#c5a880] text-white rounded-tr-sm'}`}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold mt-1.5 font-mono uppercase tracking-wider">
                          {isAdmin ? 'System Admin' : 'Studio Owner'} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {selectedTicket.status !== 'RESOLVED' ? (
                  <form onSubmit={handleReplyTicket} className="p-5 border-t border-slate-100 bg-white flex gap-3">
                    <input type="text" required placeholder="Type your reply..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)}  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]" />
                    <button type="submit" className="bg-[#c5a880] hover:bg-slate-900 text-white px-5 rounded-xl transition-all flex items-center justify-center">
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <div className="p-5 bg-emerald-50 text-emerald-700 text-center text-sm border-t border-emerald-100 font-bold">
                    This support ticket has been resolved.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-slate-400 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <HelpCircle className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Ticket Selected</h3>
                <span className="text-sm font-medium max-w-[250px]">Select a support ticket from the list to view the conversation thread.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
