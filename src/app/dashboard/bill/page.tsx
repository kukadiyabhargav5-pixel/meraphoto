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


export default function BillPage() {
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

  const [billSubView, setBillSubView] = useState('list');
  const [newBillClient, setNewBillClient] = useState('');
  const [newBillEvent, setNewBillEvent] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {billSubView === 'list' ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Invoices & Billing Log</h1>
                    <p className="text-xs text-slate-450 mt-1 font-semibold">Generate gst-compliant invoices, track due balances, and log client payouts.</p>
                  </div>
                  <button onClick={() => setBillSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
                    <Receipt className="h-4 w-4" /> Create Invoice
                  </button>
                </div>
                <div className=" bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4">Invoice ID</th>
                        <th className="p-4">Billed Client</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4 text-[#c5a880]">Token Paid</th>
                        <th className="p-4 text-rose-450">Balance Left</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {bills.map((invoice, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#c5a880]">{invoice.id}</td>
                          <td className="p-4 font-bold text-slate-900">{invoice.client}</td>
                          <td className="p-4 font-semibold text-slate-700">{invoice.date}</td>
                          <td className="p-4 font-black text-slate-900">₹{invoice.amount.replace('₹', '')}</td>
                          <td className="p-4 font-bold text-[#c5a880]">₹{invoice.advance ? invoice.advance.replace('₹', '') : '0'}</td>
                          <td className="p-4 font-black text-rose-400">₹{invoice.balance ? invoice.balance.replace('₹', '') : '0'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={() => { setBillSubView('list'); setSelectedEventCodeForBill(''); }} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#c5a880] text-[11px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#c5a880] transition-all duration-300 shadow-sm hover:shadow group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Bills</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">Create GST Invoice</h1>
                  </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newBillClient) {
                    const totalVal = parseFloat(newBillAmount) || 0;
                    const advVal = parseFloat(newBillAdvance) || 0;
                    
                    try {
                      const reqBody = {
                        clientName: newBillClient,
                        invoiceNo: `INV-2026-${String(bills.length + 101).padStart(3, '0')}`,
                        amount: totalVal,
                        status: newBillStatus || 'Pending'
                      };
                      const res = await apiClient.post('/dashboard/bills', reqBody);
                      setBills([res.data, ...bills]);
                      setNewBillClient(''); setNewBillDate(''); setNewBillAmount(''); setNewBillAdvance(''); setNewBillBalance('');
                      setSelectedEventCodeForBill('');
                      setBillSubView('list');
                      setSuccessMsg('GST Invoice created successfully!');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg('Failed to create invoice');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Select Event</label>
                    <select
                      value={selectedEventCodeForBill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEventCodeForBill(val);
                        const ev = events.find(event => event._id === val || event.code === val);
                        if (ev) {
                          setNewBillClient(`${ev.clientName} (${ev.name})`);
                          setNewBillDate(ev.date ? ev.date.split('T')[0] : '2026-07-14');
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
                    <input type="text" required value={newBillClient} onChange={(e) => setNewBillClient(e.target.value)} placeholder="Amit Shah (Wedding)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Invoice Date</label>
                      <input type="date" required value={newBillDate} onChange={(e) => setNewBillDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Total Amount (INR)</label>
                      <input type="number" required value={newBillAmount} onChange={(e) => setNewBillAmount(e.target.value)} placeholder="150000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Token / Advance Paid (INR)</label>
                      <input type="number" value={newBillAdvance} onChange={(e) => setNewBillAdvance(e.target.value)} placeholder="50000" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Balance Left / Due (Auto)</label>
                      <div className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-350 font-bold font-mono">
                        ₹{(Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0))).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Invoice status</label>
                    <select value={newBillStatus} onChange={(e) => setNewBillStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                      <option className="bg-white text-slate-900" value="Unpaid">Unpaid</option>
                      <option className="bg-white text-slate-900" value="Paid">Paid</option>
                      <option className="bg-white text-slate-900" value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    Generate Invoice
                  </button>
                </form>
              </div>
              </div>
            )}
          </div>
    </div>
  );
}
