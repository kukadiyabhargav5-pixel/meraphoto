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


export default function QuotationPage() {
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

  const [quotationSubView, setQuotationSubView] = useState('list');
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteEvent, setNewQuoteEvent] = useState('');
  const [newQuoteAmount, setNewQuoteAmount] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {quotationSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Quotations Generated</h1>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Generate and track formal price estimations sent to prospective clients.</p>
                  </div>
                  <button onClick={() => setQuotationSubView('add')} className="bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md w-full md:w-auto">
                    <Plus className="h-4 w-4" /> New Quotation
                  </button>
                </div>
                <div className="bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4">Quote ID</th>
                        <th className="p-4">Prospective Client</th>
                        <th className="p-4">Scope of Work</th>
                        <th className="p-4">Estimated Value</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {quotations.map((quote, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#c5a880]">{quote.id}</td>
                          <td className="p-4 font-bold text-slate-900">{quote.client}</td>
                          <td className="p-4 text-slate-700 font-semibold">{quote.scope}</td>
                          <td className="p-4 font-black text-slate-900">{quote.value}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${quote.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : quote.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                              {quote.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={() => { setQuotationSubView('list'); setSelectedEventCodeForQuote(''); }} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#c5a880] text-[11px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#c5a880] transition-all duration-300 shadow-sm hover:shadow group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Quotations</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">Generate Price Quotation</h1>
                  </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newQuoteClient) {
                    try {
                      const reqBody = {
                        clientName: newQuoteClient,
                        amount: newQuoteValue ? parseFloat(newQuoteValue) : 0,
                        validUntil: new Date(Date.now() + 30*24*60*60*1000), // 30 days
                        status: newQuoteStatus || 'Pending'
                      };
                      const res = await apiClient.post('/dashboard/quotations', reqBody);
                      setQuotations([res.data, ...quotations]);
                      setNewQuoteClient(''); setNewQuoteScope(''); setNewQuoteValue('');
                      setSelectedEventCodeForQuote('');
                      setQuotationSubView('list');
                      setSuccessMsg('Price quotation generated and logged!');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg('Failed to create quotation');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Select Event</label>
                    <select
                      value={selectedEventCodeForQuote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEventCodeForQuote(val);
                        const ev = events.find(event => event._id === val || event.code === val);
                        if (ev) {
                          setNewQuoteClient(`${ev.clientName} (${ev.name})`);
                          setNewQuoteScope(`${ev.type} Photography Coverage`);
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
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Prospective Client</label>
                    <input type="text" required value={newQuoteClient} onChange={(e) => setNewQuoteClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Scope of Work</label>
                    <input type="text" required value={newQuoteScope} onChange={(e) => setNewQuoteScope(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Estimated Amount (INR)</label>
                      <input type="number" required value={newQuoteValue} onChange={(e) => setNewQuoteValue(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Status</label>
                      <select value={newQuoteStatus} onChange={(e) => setNewQuoteStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option className="bg-white text-slate-900" value="Sent">Sent</option>
                        <option className="bg-white text-slate-900" value="Approved">Approved</option>
                        <option className="bg-white text-slate-900" value="Pending Review">Pending Review</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    Generate Price Quote
                  </button>
                </form>
              </div>
              </div>
            )}
          </div>
    </div>
  );
}
