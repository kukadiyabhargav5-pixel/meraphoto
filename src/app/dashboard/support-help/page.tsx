'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';


export default function SupportHelpPage() {
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


  const handleCreateTicket = (e: any) => { e.preventDefault(); setSuccessMsg('Ticket submitted (Dummy)'); };
  const handleOpenTicket = (ticket: any) => { setSuccessMsg('Opening ticket... (Dummy)'); };
    const [supportSubView, setSupportSubView] = useState('list');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');


  const handleReplyTicket = (a?: any, b?: any, c?: any) => {};
  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-900">Studio Help Desk</h1>
            
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-5 flex flex-col gap-6">
                <div className=" bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-650">Open Tickets ({tickets.length})</h3>
                  {tickets.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {tickets.map((t) => (
                        <div key={t._id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-xl cursor-pointer border transition-colors ${selectedTicket?._id === t._id ? 'bg-[#c5a880]/10 text-[#c5a880] border-[#c5a880]/20' : 'bg-slate-50 border-slate-200 hover:border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{t.subject}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${t.status === 'OPEN' ? 'bg-[#c5a880] text-slate-900' : t.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-slate-900'}`}>
                              {t.status}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-600 font-bold font-mono">
                            Last Updated: {new Date(t.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-700">No support tickets found</div>
                  )}
                </div>

                <div className=" bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-650 mb-4">Open New Ticket</h3>
                  <form onSubmit={handleOpenTicket} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Subject</label>
                      <input type="text" required value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Message Description</label>
                      <textarea required value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)}  rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white/[0.04] resize-none" />
                    </div>
                    <button type="submit" className="w-full bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 font-bold py-3 rounded-lg text-xs transition-colors">
                      Open Ticket
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-span-7">
                {selectedTicket ? (
                  <div className=" bg-slate-50 border border-slate-200 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-white/5 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Ticket Thread</h4>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</h3>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${selectedTicket.status === 'OPEN' ? 'bg-[#c5a880] text-slate-900' : selectedTicket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-slate-900'}`}>
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                      {selectedTicket.messages.map((msg: any, i: number) => {
                        const isAdmin = msg.sender === 'ADMIN';
                        return (
                          <div key={i} className={`flex flex-col max-w-[80%] ${isAdmin ? 'self-start' : 'self-end items-end'}`}>
                            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${isAdmin ? 'bg-white/[0.04] border border-slate-200 rounded-tl-none text-slate-200' : 'bg-[#c5a880] text-slate-900 rounded-tr-none'}`}>
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-600 font-bold mt-1 font-mono">
                              {isAdmin ? 'System Admin' : 'Studio Owner'} • {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedTicket.status !== 'RESOLVED' ? (
                      <form onSubmit={handleReplyTicket} className="p-4 border-t border-white/5 bg-slate-50 flex gap-3">
                        <input type="text" required value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)}  className="flex-1 bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#c5a880]" />
                        <button type="submit" className="bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 p-2.5 rounded-lg transition-colors">
                          <Send className="h-4.5 w-4.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 text-emerald-600 text-center text-xs border-t border-white/5 font-bold">
                        This support ticket has been resolved.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full  bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-slate-600 shadow-sm">
                    <HelpCircle className="h-8 w-8 text-slate-700 mb-2" />
                    <span className="text-xs font-semibold">Select a support ticket from the list to view the message thread.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
    </div>
  );
}
