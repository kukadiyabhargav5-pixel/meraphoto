'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film, Edit, Printer, Search,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';
import CustomDatePicker from '../../../components/CustomDatePicker';


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

  const { user } = useAuth();

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

  const openPrintWindow = (invoice: any) => {
    const studioName = studio?.name || 'Mara Photo';
    const studioLogo = studio?.logoUrl || '';
    const studioEmail = user?.email || '';
    const studioPhone = user?.phone || '';
    const clientName = invoice.clientName || invoice.client || '';
    const total = parseFloat(invoice.amount || 0);
    const advance = parseFloat(invoice.advance || 0);
    const balance = invoice.balance !== undefined ? parseFloat(invoice.balance) : Math.max(0, total - advance);
    const invoiceDate = new Date(invoice.issueDate || invoice.date || Date.now());
    const invoiceNumber = invoice.invoiceNo || invoice.id || `INV-${Math.floor(Math.random()*10000)}`;
    const eventName = invoice.eventName || '';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${clientName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: white;
                color: #111827;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                line-height: 1.5;
              }
              
              @page {
                size: A4;
                margin: 0; 
              }
              
              @media print {
                body { padding: 1.5cm; }
              }

              @media screen {
                body { background: #f3f4f6; padding: 40px; }
                .invoice-page { margin: 0 auto; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); padding: 1.5cm; }
              }

              .invoice-page { max-width: 21cm; background: white; position: relative; }

              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 30px; margin-bottom: 30px; }
              .studio-info { display: flex; flex-direction: column; gap: 12px; }
              .studio-logo-wrapper { margin-bottom: 8px; }
              .studio-logo { max-width: 140px; max-height: 60px; object-fit: contain; }
              .studio-name { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #111827; text-transform: uppercase; }
              .studio-contact { font-size: 13px; font-weight: 500; color: #4b5563; }
              .studio-contact div { margin-bottom: 2px; }
              
              .invoice-title { text-align: right; }
              .invoice-title h2 { font-size: 36px; font-weight: 900; letter-spacing: 0.05em; color: #c5a880; text-transform: uppercase; line-height: 1; }
              .invoice-title .quote-num { font-size: 14px; font-weight: 600; color: #6b7280; margin-top: 8px; }

              .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .meta-block { flex: 1; }
              .meta-block.billed-to { flex: 2; }
              .meta-block h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
              .meta-block p { font-size: 15px; font-weight: 600; color: #111827; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid currentColor; }
              .status-pending { color: #d97706; background: #fffbeb; }
              .status-paid { color: #059669; background: #ecfdf5; }
              .status-overdue { color: #dc2626; background: #fef2f2; }

              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              thead th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; background-color: #111827; padding: 12px 16px; text-align: left; }
              thead th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
              thead th:last-child { text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
              
              tbody td { padding: 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
              tbody td:last-child { text-align: right; font-weight: 700; color: #111827; white-space: nowrap; }
              .item-name { font-size: 15px; font-weight: 600; color: #111827; }
              .item-num { font-size: 13px; font-weight: 500; color: #9ca3af; }
              .item-price { font-size: 15px; }

              .invoice-total { width: 350px; float: right; background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; }
              .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
              .total-row.grand { border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 16px; }
              .total-label { font-size: 13px; font-weight: 600; color: #4b5563; }
              .total-value { font-size: 15px; font-weight: 700; color: #111827; }
              .total-row.advance .total-value { color: #059669; }
              .grand .total-label { font-size: 15px; font-weight: 800; color: #111827; text-transform: uppercase; }
              .grand .total-value { font-size: 24px; font-weight: 900; color: #dc2626; }
              .clearfix::after { content: ""; clear: both; display: table; }

              .invoice-footer { margin-top: 80px; padding-top: 30px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
              .footer-note { font-size: 12px; font-weight: 500; color: #6b7280; line-height: 1.6; max-width: 400px; }
              .footer-brand { text-align: right; }
              .footer-brand .brand-name { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: 0.02em; }
              .footer-brand .brand-tagline { font-size: 10px; font-weight: 700; color: #c5a880; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="invoice-page">
              <div class="invoice-header">
                <div class="studio-info">
                  <div class="studio-logo-wrapper">
                    ${studioLogo ? `<img src="${studioLogo}" class="studio-logo" alt="Logo" />` : `<div style="font-size:28px;font-weight:900;color:#c5a880;">${studioName.charAt(0)}</div>`}
                  </div>
                  <div>
                    <div class="studio-name">${studioName}</div>
                    <div class="studio-contact">
                      ${studioEmail ? `<div>E: ${studioEmail}</div>` : ''}
                      ${studioPhone ? `<div>M: ${studioPhone}</div>` : ''}
                    </div>
                  </div>
                </div>
                <div class="invoice-title">
                  <h2>INVOICE</h2>
                  <div class="quote-num">${invoiceNumber}</div>
                </div>
              </div>

              <div class="invoice-meta">
                <div class="meta-block billed-to">
                  <h4>Billed To</h4>
                  <p>${clientName}</p>
                </div>
                <div class="meta-block">
                  <h4>Invoice Date</h4>
                  <p>${invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div class="meta-block" style="text-align:right;">
                  <h4>Status</h4>
                  <span class="status-badge status-${(invoice.status || 'Pending').toLowerCase()}">${invoice.status || 'Pending'}</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="width:40px">#</th>
                    <th>Description</th>
                    <th style="text-align:right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="item-num">01</td>
                    <td>
                      <div class="item-name">Photography / Videography Services</div>
                      ${eventName ? `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Event: ${eventName}</div>` : ''}
                    </td>
                    <td class="item-price">₹${total.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div class="clearfix">
                <div class="invoice-total">
                  <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span class="total-value">₹${total.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="total-row advance">
                    <span class="total-label">Advance / Token Paid</span>
                    <span class="total-value">- ₹${advance.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="total-row grand">
                    <span class="total-label">Balance Due</span>
                    <span class="total-value">₹${balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div class="invoice-footer">
                <div class="footer-note">
                  Thank you for choosing <strong>${studioName}</strong>!<br/>
                  All balances are due prior to final deliverables unless agreed otherwise.
                </div>
                <div class="footer-brand">
                  <div class="brand-name">${studioName}</div>
                  <div class="brand-tagline">Professional Photography</div>
                </div>
              </div>
            </div>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); }, 500); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintExisting = (bill: any) => {
    openPrintWindow(bill);
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
        openPrintWindow(reqBody);
        setSuccessMsg(billSubView === 'edit' ? 'Invoice updated successfully!' : 'GST Invoice created successfully!');
        resetForm();
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
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-400 focus:outline-none cursor-pointer"
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
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredBills.map((invoice: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#c5a880] text-center">{invoice.invoiceNo || invoice.id}</td>
                          <td className="p-4 font-bold text-slate-900 text-center">{invoice.clientName || invoice.client}</td>
                          <td className="p-4 font-semibold text-slate-600 text-center">{(invoice.issueDate || invoice.date)?.split('T')[0]}</td>
                          <td className="p-4 font-black text-slate-900 text-center">₹{invoice.amount?.toLocaleString()}</td>
                          <td className="p-4 font-bold text-[#c5a880] text-center">₹{(invoice.advance || 0).toLocaleString()}</td>
                          <td className="p-4 font-black text-rose-400 text-center">₹{(invoice.balance || 0).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handlePrintExisting(invoice)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Print Invoice">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(invoice)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-[#c5a880] hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Edit Invoice">
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
                <button onClick={resetForm} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Bills</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">{billSubView === 'edit' ? 'Edit GST Invoice' : 'Create GST Invoice'}</h1>
                  </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveInvoice(false); }} className=" bg-[#f8f7f4] text-slate-900 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  {billSubView !== 'edit' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Event</label>
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
                      <option className="bg-[#f8f7f4] text-slate-900" value="">Select Event...</option>
                      {eventsData.map((ev) => (
                        <option className="bg-[#f8f7f4] text-slate-900" key={ev._id} value={ev._id}>{ev.name} ({ev.clientName})</option>
                      ))}
                    </select>
                  </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Name</label>
                    <input type="text" required value={newBillClient} onChange={(e) => setNewBillClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Email</label>
                      <input type="email" value={newBillEmail} onChange={(e) => setNewBillEmail(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Mobile</label>
                      <input type="tel" value={newBillMobile} onChange={(e) => setNewBillMobile(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Event Name</label>
                      <input type="text" value={newBillEventName} onChange={(e) => setNewBillEventName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Event Date</label>
                      <CustomDatePicker type="date" value={newEventDate} onChange={(val) => setNewEventDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invoice Date</label>
                      <CustomDatePicker type="date" required value={newBillDate} onChange={(val) => setNewBillDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" required value={newBillAmount} onChange={(e) => setNewBillAmount(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Token / Advance Paid (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" value={newBillAdvance} onChange={(e) => setNewBillAdvance(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Token Date</label>
                      <CustomDatePicker type="date" value={newTokenPaymentDate} onChange={(val) => setNewTokenPaymentDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Method</label>
                      <select value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balance Left / Due (Auto)</label>
                      <div className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-350 font-bold font-mono">
                        ₹{(Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0))).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invoice status</label>
                      <select value={newBillStatus} onChange={(e) => setNewBillStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option className="bg-[#f8f7f4] text-slate-900" value="Pending">Pending</option>
                        <option className="bg-[#f8f7f4] text-slate-900" value="Paid">Paid</option>
                        <option className="bg-[#f8f7f4] text-slate-900" value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-900 font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-colors shadow-md">
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

            {/* Print layout removed as it's now handled by popup window */}


          </div>
    </div>
  );
}
