'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film, Edit, Printer, Search,
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
  const [newBillEmail, setNewBillEmail] = useState('');
  const [newBillMobile, setNewBillMobile] = useState('');
  const [newBillEventName, setNewBillEventName] = useState('');
  const [newBillEvent, setNewBillEvent] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [selectedEventCodeForBill, setSelectedEventCodeForBill] = useState('');
  const [newBillDate, setNewBillDate] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newTokenPaymentDate, setNewTokenPaymentDate] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Cash');
  const [newBillAdvance, setNewBillAdvance] = useState('');
  const [newBillStatus, setNewBillStatus] = useState('Pending');
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingBill, setEditingBill] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          setEventsData(res.data.events);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (bill: any) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiClient.delete(`/dashboard/bills/${bill._id}`);
        setBills(bills.filter((b: any) => b._id !== bill._id));
        setSuccessMsg('Invoice deleted successfully');
      } catch (err) {
        setErrorMsg('Failed to delete invoice');
      }
    }
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setNewBillClient(bill.clientName || bill.client || '');
    setNewBillEmail(bill.clientEmail || '');
    setNewBillMobile(bill.clientMobile || '');
    setNewBillEventName(bill.eventName || '');
    setNewEventDate(bill.eventDate ? bill.eventDate.split('T')[0] : '');
    setNewBillDate(bill.issueDate ? bill.issueDate.split('T')[0] : (bill.date || ''));
    setNewBillAmount(bill.amount?.toString() || '');
    setNewBillAdvance(bill.advance?.toString() || '');
    setNewTokenPaymentDate(bill.tokenPaymentDate ? bill.tokenPaymentDate.split('T')[0] : '');
    setNewPaymentMethod(bill.paymentMethod || 'Cash');
    setNewBillStatus(bill.status || 'Pending');
    setBillSubView('edit');
  };

  const handlePrintExisting = (bill: any) => {
    setNewBillClient(bill.clientName || bill.client || '');
    setNewBillEmail(bill.clientEmail || '');
    setNewBillMobile(bill.clientMobile || '');
    setNewBillEventName(bill.eventName || '');
    setNewEventDate(bill.eventDate ? bill.eventDate.split('T')[0] : '');
    setNewBillDate(bill.issueDate ? bill.issueDate.split('T')[0] : (bill.date || ''));
    setNewBillAmount(bill.amount?.toString() || '');
    setNewBillAdvance(bill.advance?.toString() || '');
    setNewTokenPaymentDate(bill.tokenPaymentDate ? bill.tokenPaymentDate.split('T')[0] : '');
    setNewPaymentMethod(bill.paymentMethod || 'Cash');
    setNewBillStatus(bill.status || 'Pending');
    
    setTimeout(() => {
      window.print();
      resetForm();
    }, 150);
  };

  const resetForm = () => {
    setEditingBill(null);
    setNewBillClient(''); setNewBillEmail(''); setNewBillMobile(''); setNewBillEventName('');
    setNewEventDate(''); setNewTokenPaymentDate(''); setNewPaymentMethod('Cash');
    setNewBillDate(''); setNewBillAmount(''); setNewBillAdvance(''); 
    setSelectedEventCodeForBill('');
    setBillSubView('list');
  };

  const filteredBills = bills.filter((bill: any) => {
    const searchLower = searchQuery.toLowerCase();
    const dateStr = (bill.issueDate || bill.date || '').split('T')[0];
    const amountStr = (bill.amount || 0).toString();
    const matchesSearch = (bill.clientName || bill.client || '').toLowerCase().includes(searchLower) ||
                          (bill.invoiceNo || bill.id || '').toLowerCase().includes(searchLower) ||
                          (bill.status || '').toLowerCase().includes(searchLower) ||
                          dateStr.includes(searchLower) ||
                          amountStr.includes(searchLower);
    
    const matchesFilter = filterStatus === 'All' || bill.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const pendingAmount = bills.filter((b: any) => b.status === 'Pending').reduce((acc: number, b: any) => acc + (b.balance || 0), 0);
  const overdueAmount = bills.filter((b: any) => b.status === 'Overdue').reduce((acc: number, b: any) => acc + (b.balance || 0), 0);
  const paidAmount = bills.reduce((acc: number, b: any) => {
    if (b.status === 'Paid') return acc + (b.amount || 0);
    return acc + (b.advance || 0);
  }, 0);

  const handleSaveInvoice = async (shouldPrint: boolean) => {
    if (!newBillClient) return;
    const totalVal = parseFloat(newBillAmount) || 0;
    const advVal = parseFloat(newBillAdvance) || 0;
    const balVal = Math.max(0, totalVal - advVal);
    
    try {
      const reqBody = {
        clientName: newBillClient,
        clientEmail: newBillEmail,
        clientMobile: newBillMobile,
        eventName: newBillEventName,
        eventDate: newEventDate ? newEventDate : undefined,
        invoiceNo: `INV-2026-${String(bills.length + 101).padStart(3, '0')}`,
        amount: totalVal,
        advance: advVal,
        tokenPaymentDate: newTokenPaymentDate ? newTokenPaymentDate : undefined,
        paymentMethod: newPaymentMethod,
        balance: balVal,
        issueDate: newBillDate ? newBillDate : undefined,
        status: newBillStatus || 'Pending'
      };
      
      if (billSubView === 'edit' && editingBill) {
        const res = await apiClient.put(`/dashboard/bills/${editingBill._id}`, reqBody);
        setBills(bills.map((b: any) => b._id === editingBill._id ? res.data : b));
      } else {
        const res = await apiClient.post('/dashboard/bills', reqBody);
        setBills([res.data, ...bills]);
      }
      
      if (shouldPrint) {
        setTimeout(() => {
          window.print();
          resetForm();
        }, 100);
      } else {
        setSuccessMsg(billSubView === 'edit' ? 'Invoice updated successfully!' : 'GST Invoice created successfully!');
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(billSubView === 'edit' ? 'Failed to update invoice' : 'Failed to create invoice');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {billSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Invoices & Billing Log</h1>
                    <p className="text-xs text-slate-450 mt-1 font-semibold">Generate gst-compliant invoices, track due balances, and log client payouts.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm transition-colors cursor-pointer"
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search bills..."
                        className="w-full sm:w-56 bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] pr-8 shadow-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setBillSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto">
                      <Receipt className="h-4 w-4" /> Create Invoice
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/40 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Paid Amount (Received)</p>
                    <p className="text-2xl font-black text-slate-900">₹{paidAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Overdue Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{overdueAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-center border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4 text-center">Invoice ID</th>
                        <th className="p-4 text-center">Billed Client</th>
                        <th className="p-4 text-center">Issue Date</th>
                        <th className="p-4 text-center">Total Amount</th>
                        <th className="p-4 text-slate-900 text-center">Token Paid</th>
                        <th className="p-4 text-rose-450 text-center">Balance Left</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {filteredBills.map((invoice: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#c5a880] text-center">{invoice.invoiceNo || invoice.id}</td>
                          <td className="p-4 font-bold text-slate-900 text-center">{invoice.clientName || invoice.client}</td>
                          <td className="p-4 font-semibold text-slate-700 text-center">{(invoice.issueDate || invoice.date)?.split('T')[0]}</td>
                          <td className="p-4 font-black text-slate-900 text-center">₹{invoice.amount?.toLocaleString()}</td>
                          <td className="p-4 font-bold text-[#c5a880] text-center">₹{(invoice.advance || 0).toLocaleString()}</td>
                          <td className="p-4 font-black text-rose-400 text-center">₹{(invoice.balance || 0).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handlePrintExisting(invoice)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Print Invoice">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(invoice)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-[#c5a880] hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Edit Invoice">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(invoice)} className="p-1.5 bg-rose-50 text-rose-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-rose-200 shadow-sm" title="Delete Invoice">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredBills.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            No invoices found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={resetForm} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-white hover:text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Bills</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">{billSubView === 'edit' ? 'Edit GST Invoice' : 'Create GST Invoice'}</h1>
                  </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveInvoice(false); }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  {billSubView !== 'edit' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Select Event</label>
                    <select
                      value={selectedEventCodeForBill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEventCodeForBill(val);
                        const ev = eventsData.find(event => event._id === val || event.code === val);
                        if (ev) {
                          setNewBillClient(ev.clientName || '');
                          setNewBillEmail(ev.clientEmail || '');
                          setNewBillMobile(ev.clientMobile || '');
                          setNewBillEventName(ev.name || '');
                          setNewBillDate(new Date().toISOString().split('T')[0]);
                          setNewEventDate(ev.date ? ev.date.split('T')[0] : '');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option className="bg-white text-slate-900" value="">Select Event...</option>
                      {eventsData.map((ev) => (
                        <option className="bg-white text-slate-900" key={ev._id} value={ev._id}>{ev.name} ({ev.clientName})</option>
                      ))}
                    </select>
                  </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Client Name</label>
                    <input type="text" required value={newBillClient} onChange={(e) => setNewBillClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Client Email</label>
                      <input type="email" value={newBillEmail} onChange={(e) => setNewBillEmail(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Client Mobile</label>
                      <input type="tel" value={newBillMobile} onChange={(e) => setNewBillMobile(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Event Name</label>
                      <input type="text" value={newBillEventName} onChange={(e) => setNewBillEventName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Event Date</label>
                      <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Invoice Date</label>
                      <input type="date" required value={newBillDate} onChange={(e) => setNewBillDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Total Amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" required value={newBillAmount} onChange={(e) => setNewBillAmount(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Token / Advance Paid (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" value={newBillAdvance} onChange={(e) => setNewBillAdvance(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Token Date</label>
                      <input type="date" value={newTokenPaymentDate} onChange={(e) => setNewTokenPaymentDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Method</label>
                      <select value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Balance Left / Due (Auto)</label>
                      <div className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-350 font-bold font-mono">
                        ₹{(Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0))).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Invoice status</label>
                      <select value={newBillStatus} onChange={(e) => setNewBillStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option className="bg-white text-slate-900" value="Pending">Pending</option>
                        <option className="bg-white text-slate-900" value="Paid">Paid</option>
                        <option className="bg-white text-slate-900" value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-colors shadow-md">
                      Save Invoice
                    </button>
                    <button type="button" onClick={() => handleSaveInvoice(true)} className="flex-1 bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-colors shadow-md">
                      Save & Print Invoice
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}

            {/* PRINT LAYOUT */}
            <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-12">
              <div className="max-w-4xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 mb-2">INVOICE</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Mara Photo Studio</p>
                  </div>
                  <div className="text-right">
                    <img src={studio?.logoUrl || "/logo.png"} alt="Studio Logo" className={`h-14 object-contain ml-auto mb-2 ${!studio?.logoUrl ? 'filter grayscale brightness-0 opacity-80' : ''}`} />
                    <p className="text-xs text-slate-500">maraphoto.com</p>
                    <p className="text-xs text-slate-500">+91 9876543210</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Billed To</p>
                    <h3 className="text-lg font-bold text-slate-900">{newBillClient || 'Client Name'}</h3>
                    {newBillEmail && <p className="text-sm text-slate-600">{newBillEmail}</p>}
                    {newBillMobile && <p className="text-sm text-slate-600">{newBillMobile}</p>}
                    {newBillEventName && <p className="text-sm text-slate-600 font-semibold mt-1">Event: {newBillEventName}</p>}
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Invoice Details</p>
                    <p className="text-sm text-slate-900 font-bold">No: INV-2026-{String(bills.length + 101).padStart(3, '0')}</p>
                    <p className="text-sm text-slate-600">Date: {newBillDate || new Date().toISOString().split('T')[0]}</p>
                    <p className="text-sm text-slate-600 font-bold">Status: <span className="uppercase">{newBillStatus}</span></p>
                  </div>
                </div>

                {/* Table */}
                <div className="mt-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                        <th className="py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-4 text-sm font-semibold text-slate-900">Photography / Videography Services - {newBillEventName || 'Event Package'}</td>
                        <td className="py-4 text-sm font-bold text-slate-900 text-right">₹{parseFloat(newBillAmount || '0').toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end mt-4">
                  <div className="w-1/2 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-500">Subtotal</p>
                      <p className="text-sm font-bold text-slate-900">₹{parseFloat(newBillAmount || '0').toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center text-[#c5a880]">
                      <p className="text-sm font-semibold">Advance / Token Paid</p>
                      <p className="text-sm font-bold">- ₹{parseFloat(newBillAdvance || '0').toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-1">
                      <p className="text-lg font-black text-slate-900 uppercase">Balance Due</p>
                      <p className="text-2xl font-black text-rose-500">₹{Math.max(0, parseFloat(newBillAmount || '0') - parseFloat(newBillAdvance || '0')).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-slate-200 text-center flex flex-col gap-1">
                  <p className="text-sm font-bold text-slate-900">Thank you for choosing Mara Photo Studio!</p>
                  <p className="text-xs text-slate-500">All balances are due prior to final deliverables unless agreed otherwise.</p>
                </div>
              </div>
            </div>

          </div>
    </div>
  );
}
