'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
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
    studio,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg
  } = context;

  const [clientTickets, setClientTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (studio?._id) {
      fetchClientTickets();
    }
  }, [studio]);

  const fetchClientTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await apiClient.get(`/client-tickets/studio/${studio._id}?status=OPEN`);
      setClientTickets(res.data);
      // Update selected ticket if it exists
      if (selectedTicket) {
        const updated = res.data.find((t: any) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
        else setSelectedTicket(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch customer tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setReplying(true);
      await apiClient.post(`/client-tickets/${selectedTicket._id}/reply`, {
        message: replyMessage
      });
      setSuccessMsg('Reply sent successfully and emailed to customer.');
      setReplyMessage('');
      fetchClientTickets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      setResolving(true);
      await apiClient.patch(`/client-tickets/${selectedTicket._id}/status`, {
        status: 'RESOLVED'
      });
      setSuccessMsg('Ticket marked as resolved.');
      fetchClientTickets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update ticket status');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        {/* ── TOP HERO BANNER: Dark Expert Support Card ── */}
        <div className="w-full bg-slate-900 text-white rounded-3xl p-8 md:p-14 relative overflow-hidden border border-[#c5a880]/20 shadow-2xl flex flex-col items-center text-center">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/15 opacity-30 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-6">
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tight">
              Customer <span className="italic text-[#c5a880]">Help Desk</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-poppins font-medium">
              Manage client complaints, requests, and support tickets directly from your dashboard.
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs md:text-sm font-bold uppercase tracking-wider text-gray-300 font-poppins">
              <div className="flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>Client Support</span>
              </div>
              <div className="hidden sm:block text-white/30">•</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>Quick Resolution</span>
              </div>
              <div className="hidden sm:block text-white/30">•</div>
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#c5a880]" />
                <span>Direct Inbox</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-sm h-[650px]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Client Tickets</h3>
                <button onClick={fetchClientTickets} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                {loadingTickets ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <Loader className="w-6 h-6 animate-spin" />
                  </div>
                ) : clientTickets.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {clientTickets.map((t) => (
                      <div key={t._id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedTicket?._id === t._id ? 'bg-[#c5a880]/10 text-slate-900 border-[#c5a880] shadow-sm' : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-[#c5a880]/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-900 truncate pr-2">{t.customerName}</span>
                          <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider shrink-0 ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mb-2">{t.complaint}</p>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">
                          {new Date(t.updatedAt).toLocaleDateString()} {new Date(t.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 bg-slate-50 rounded-2xl text-center text-sm text-slate-500 font-medium border border-dashed border-slate-200">
                    No client tickets found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Ticket Thread */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-white border border-slate-200 rounded-3xl flex flex-col h-[650px] overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 text-slate-900 flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest mb-1 flex items-center gap-2">
                      <User className="w-3 h-3" /> {selectedTicket.customerName}
                    </h4>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedTicket.mobileNumber}</span>
                      {selectedTicket.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedTicket.email}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${selectedTicket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selectedTicket.status}
                    </span>
                    {selectedTicket.status === 'OPEN' && (
                      <button onClick={handleResolveTicket} disabled={resolving} className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 underline flex items-center gap-1">
                        {resolving ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-white text-slate-900/50">
                  {selectedTicket.messages.map((msg: any, i: number) => {
                    const isCustomer = msg.sender === 'CUSTOMER';
                    return (
                      <div key={i} className={`flex flex-col max-w-[85%] ${isCustomer ? 'self-start' : 'self-end items-end'}`}>
                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isCustomer ? 'bg-slate-50 border border-slate-200 rounded-tl-sm text-slate-700' : 'bg-[#c5a880] text-[#09090b] rounded-tr-sm'}`}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold mt-1.5 font-mono uppercase tracking-wider">
                          {isCustomer ? selectedTicket.customerName : 'Studio Owner'} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'RESOLVED' ? (
                  <form onSubmit={handleReplyTicket} className="p-5 border-t border-slate-100 bg-white flex flex-col gap-3">
                    <textarea 
                      required 
                      placeholder="Type your reply to the customer..." 
                      value={replyMessage} 
                      onChange={(e) => setReplyMessage(e.target.value)}  
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] resize-none h-[80px]" 
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Customer will receive an email notification
                      </span>
                      <button type="submit" disabled={replying} className="bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] font-bold px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                        {replying ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Reply
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-5 bg-emerald-50 text-emerald-700 text-center text-sm border-t border-emerald-100 font-bold">
                    This support ticket has been resolved.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-slate-400 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <HelpCircle className="h-8 w-8 text-[#c5a880]" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-1">No Ticket Selected</h3>
                <span className="text-sm font-medium max-w-[250px]">Select a support ticket from the list to view the conversation thread and reply to the customer.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
