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
import toast from 'react-hot-toast';


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
  const [newBillGst, setNewBillGst] = useState('');
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

  const handleGstChange = (val: string) => {
    const raw = val.toUpperCase().replace(/[^0-9A-Z]/g, '');
    let result = '';

    for (let i = 0; i < raw.length && i < 15; i++) {
      const char = raw[i];
      if (i === 0 || i === 1) {
        // Digits 1-2: Numbers only (State Code)
        if (/[0-9]/.test(char)) result += char;
        else break;
      } else if (i >= 2 && i <= 6) {
        // Digits 3-7: Letters only (PAN first 5 chars)
        if (/[A-Z]/.test(char)) result += char;
        else break;
      } else if (i >= 7 && i <= 10) {
        // Digits 8-11: Numbers only (PAN 4 digits)
        if (/[0-9]/.test(char)) result += char;
        else break;
      } else if (i === 11) {
        // Digit 12: Letter only (PAN last char)
        if (/[A-Z]/.test(char)) result += char;
        else break;
      } else if (i === 12) {
        // Digit 13: Number or Letter (Entity code)
        if (/[0-9A-Z]/.test(char)) result += char;
        else break;
      } else if (i === 13) {
        // Digit 14: Default 'Z'
        if (char === 'Z') result += char;
        else if (/[0-9A-Z]/.test(char)) result += 'Z';
        else break;
      } else if (i === 14) {
        // Digit 15: Number or Letter (Checksum)
        if (/[0-9A-Z]/.test(char)) result += char;
        else break;
      }
    }

    setNewBillGst(result);
  };

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
        toast.success('Invoice deleted successfully');
      } catch (err) {
        setErrorMsg('Failed to delete invoice');
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setNewBillClient(bill.clientName || bill.client || '');
    setNewBillEmail(bill.clientEmail || '');
    setNewBillMobile(bill.clientMobile || '');
    setNewBillGst(bill.gstNumber || bill.gstNo || '');
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
    const gstNumber = invoice.gstNumber || invoice.gstNo || '';
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
                  ${gstNumber ? `<div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 4px;"><span style="color: #64748b; font-weight: 600;">GSTIN:</span> ${gstNumber}</div>` : ''}
                  ${invoice.clientMobile ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Phone: ${invoice.clientMobile}</div>` : ''}
                  ${invoice.clientEmail ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Email: ${invoice.clientEmail}</div>` : ''}
                </div>
                <div class="meta-block">
                  <h4>Invoice Date</h4>
                  <p>${invoiceDate.toLocaleDateString('en-GB')}</p>
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
    setNewBillClient(''); setNewBillEmail(''); setNewBillMobile(''); setNewBillGst(''); setNewBillEventName('');
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
    if (!newBillClient.trim()) {
      setErrorMsg('Please enter client name');
      toast.error('Please enter client name');
      return;
    }

    if (!newBillGst.trim()) {
      setErrorMsg('Please enter 15-digit GST Number');
      toast.error('Please enter 15-digit GST Number');
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(newBillGst.trim())) {
      setErrorMsg('Invalid GST Number format. It must be 15 characters (e.g. 24AAAAA0000A1Z5)');
      toast.error('Invalid GST Number format. It must be 15 characters');
      return;
    }

    const totalVal = parseFloat(newBillAmount) || 0;
    const advVal = parseFloat(newBillAdvance) || 0;
    const balVal = Math.max(0, totalVal - advVal);
    
    try {
      const reqBody = {
        clientName: newBillClient.trim(),
        clientEmail: newBillEmail.trim(),
        clientMobile: newBillMobile.trim(),
        gstNumber: newBillGst ? newBillGst.trim().toUpperCase() : undefined,
        eventName: newBillEventName.trim(),
        eventDate: newEventDate ? newEventDate : undefined,
        invoiceNo: editingBill?.invoiceNo || `INV-2026-${String(bills.length + 101).padStart(3, '0')}`,
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
      
      const successText = billSubView === 'edit' ? 'Invoice updated successfully!' : 'GST Invoice created successfully!';
      setSuccessMsg(successText);
      toast.success(successText);

      if (shouldPrint) {
        openPrintWindow(reqBody);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      const errText = billSubView === 'edit' ? 'Failed to update invoice' : 'Failed to create invoice';
      setErrorMsg(errText);
      toast.error(errText);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-3.5 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:gap-6 font-poppins text-left">
        {billSubView === 'list' ? (
          <>
            {/* Top Bar Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-[#9c7c56] shrink-0 shadow-2xs">
                    <Receipt className="w-5 h-5 text-[#9c7c56]" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      Invoices & Billing Log
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Generate GST-compliant invoices, track due balances, and log client payouts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls: Filter, Search, Create Invoice */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                {/* Status Filter */}
                <div className="relative w-full sm:w-40 shrink-0">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-56 md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by client, invoice..."
                    className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-4 py-2.5 pl-10 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Create Invoice Primary Button */}
                <button
                  onClick={() => setBillSubView('add')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Invoice</span>
                </button>
              </div>
            </div>

            {/* Financial Overview Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-amber-50/70 border border-amber-200/90 p-4 sm:p-5 rounded-2xl shadow-2xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Balance</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 truncate">
                    ₹{pendingAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/90 p-4 sm:p-5 rounded-2xl shadow-2xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Received</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 truncate">
                    ₹{paidAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-200/90 p-4 sm:p-5 rounded-2xl shadow-2xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Balance</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 truncate">
                    ₹{overdueAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Invoices List / Cards Container */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-center border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="p-4 text-center">Invoice ID</th>
                      <th className="p-4 text-left">Billed Client</th>
                      <th className="p-4 text-center">Issue Date</th>
                      <th className="p-4 text-right">Total Amount</th>
                      <th className="p-4 text-right">Token Paid</th>
                      <th className="p-4 text-right">Balance Due</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBills.map((invoice: any, i: number) => (
                      <tr key={invoice._id || i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#9c7c56] text-center">
                          {invoice.invoiceNo || invoice.id || `INV-${i + 1}`}
                        </td>
                        <td className="p-4 text-left">
                          <div className="font-extrabold text-slate-900">{invoice.clientName || invoice.client}</div>
                          {invoice.eventName && (
                            <div className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                              {invoice.eventName}
                            </div>
                          )}
                          {invoice.gstNumber && (
                            <div className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">
                              GST: {invoice.gstNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-600 text-center">
                          {(invoice.issueDate || invoice.date)?.split('T')[0].split('-').reverse().join('/') || '—'}
                        </td>
                        <td className="p-4 font-black text-slate-900 text-right">
                          ₹{(invoice.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 font-bold text-emerald-600 text-right">
                          ₹{(invoice.advance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 font-black text-rose-600 text-right">
                          ₹{(invoice.balance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            invoice.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : invoice.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              invoice.status === 'Paid' ? 'bg-emerald-500' : invoice.status === 'Overdue' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            {invoice.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintExisting(invoice)}
                              className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Print Invoice"
                            >
                              <Printer className="w-3.5 h-3.5 text-white" />
                              <span className="hidden xl:inline">Print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice)}
                              className="p-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 rounded-lg transition-all border border-amber-300/60 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Edit Invoice"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-800" />
                              <span className="hidden xl:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all border border-rose-200 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span className="hidden xl:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBills.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-bold">
                          <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-500">No invoices found</p>
                          <p className="text-xs text-slate-400 mt-1">Try changing search keywords or create a new invoice.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden flex flex-col gap-3 p-3 sm:p-4 bg-[#faf9f6]">
                {filteredBills.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-[#c5a880]/30 flex items-center justify-center text-[#9c7c56]">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-black text-slate-800">No invoices found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {searchQuery || filterStatus !== 'All'
                        ? 'Try changing your search keywords or status filter.'
                        : 'Tap "Create Invoice" below to generate your first client bill.'}
                    </p>
                    {searchQuery || filterStatus !== 'All' ? (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setFilterStatus('All'); }}
                        className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-all active:scale-95"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBillSubView('add')}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Create Invoice</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredBills.map((invoice: any, i: number) => (
                    <div
                      key={invoice._id || i}
                      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs hover:border-[#c5a880]/50 transition-colors"
                    >
                      {/* Top Row: Invoice ID + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-[#9c7c56] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-[#c5a880]/30">
                          {invoice.invoiceNo || invoice.id || `INV-${i + 1}`}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                          invoice.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : invoice.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            invoice.status === 'Paid' ? 'bg-emerald-500' : invoice.status === 'Overdue' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {invoice.status || 'Pending'}
                        </span>
                      </div>

                      {/* Client Details */}
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                          {invoice.clientName || invoice.client || 'Unnamed Client'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                          {invoice.eventName && (
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <Briefcase className="w-3.5 h-3.5 text-[#c5a880]" />
                              {invoice.eventName}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {(invoice.issueDate || invoice.date)?.split('T')[0].split('-').reverse().join('/') || 'No date'}
                          </span>
                        </div>
                        {invoice.gstNumber && (
                          <div className="mt-1.5 inline-block text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            GSTIN: {invoice.gstNumber}
                          </div>
                        )}
                      </div>

                      {/* Figures Breakdown Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                            ₹{(invoice.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex flex-col border-x border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Token</span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">
                            ₹{(invoice.advance || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Balance</span>
                          <span className="text-xs sm:text-sm font-black text-rose-600 mt-0.5">
                            ₹{(invoice.balance || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions: 3 Clear Touch-Friendly Buttons with Distinct Styling */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handlePrintExisting(invoice)}
                          className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-white" />
                          <span>Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(invoice)}
                          className="py-2.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-amber-300/60 shadow-2xs cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-800" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(invoice)}
                          className="py-2.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-rose-200 shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* Create / Edit Form SubView */
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
                <span>Back to Bills</span>
              </button>
              <span className="text-[11px] font-extrabold text-[#9c7c56] bg-amber-500/10 px-3 py-1 rounded-full border border-[#c5a880]/30 uppercase tracking-wider">
                {billSubView === 'edit' ? 'Editing Invoice' : 'New Invoice'}
              </span>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {billSubView === 'edit' ? 'Edit GST Invoice' : 'Create GST Invoice'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Fill in the client and payment details below to generate a formatted GST invoice.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveInvoice(false); }} className="space-y-4 sm:space-y-5">
                {/* Select Event (if creating new) */}
                {billSubView !== 'edit' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Auto-fill from Existing Event
                    </label>
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
                      className="w-full bg-[#faf9f6] border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 transition-all cursor-pointer"
                    >
                      <option value="">Select an Event to Auto-Fill (Optional)...</option>
                      {eventsData.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.name} {ev.clientName ? `(${ev.clientName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Client Full Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBillClient}
                    onChange={(e) => setNewBillClient(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all"
                  />
                </div>

                {/* Client Email, Mobile & GST */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={newBillEmail}
                      onChange={(e) => setNewBillEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Client Mobile
                    </label>
                    <input
                      type="tel"
                      value={newBillMobile}
                      onChange={(e) => setNewBillMobile(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        GST Number <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold ${newBillGst.length === 15 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {newBillGst.length}/15
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={newBillGst}
                      onChange={(e) => handleGstChange(e.target.value)}
                      className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none uppercase font-mono font-bold tracking-wider shadow-2xs transition-all ${
                        newBillGst.length === 15
                          ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Event Name & Event Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={newBillEventName}
                      onChange={(e) => setNewBillEventName(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Event Date
                    </label>
                    <CustomDatePicker
                      type="date"
                      value={newEventDate}
                      onChange={(val) => setNewEventDate(val)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                {/* Invoice Date & Total Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Invoice Date <span className="text-rose-500">*</span>
                    </label>
                    <CustomDatePicker
                      type="date"
                      required
                      value={newBillDate}
                      onChange={(val) => setNewBillDate(val)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Total Amount (INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                      <input
                        type="number"
                        required
                        value={newBillAmount}
                        onChange={(e) => setNewBillAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Token Paid, Token Date, Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Advance / Token Paid (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                      <input
                        type="number"
                        value={newBillAdvance}
                        onChange={(e) => setNewBillAdvance(e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-600 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Token Date
                    </label>
                    <CustomDatePicker
                      type="date"
                      value={newTokenPaymentDate}
                      onChange={(val) => setNewTokenPaymentDate(val)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Payment Method
                    </label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / UPI</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Balance Left & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Balance Due (Auto Calculated)
                    </label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between shadow-2xs">
                      <span>Remaining:</span>
                      <span className="font-mono font-black text-sm sm:text-base text-rose-600">
                        ₹{(Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0))).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Invoice Status
                    </label>
                    <select
                      value={newBillStatus}
                      onChange={(e) => setNewBillStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20 shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons: Stacking on Mobile, High-Contrast Colors */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="order-3 sm:order-1 py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-all active:scale-95 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="order-1 sm:order-2 flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 px-5 rounded-xl text-xs sm:text-sm cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Save Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice(true)}
                    className="order-2 sm:order-3 flex-1 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 font-black py-3.5 px-5 rounded-xl text-xs sm:text-sm cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-slate-900" />
                    <span>Save & Print Invoice</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
