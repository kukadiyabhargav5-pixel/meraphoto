'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Search,
  X,
  ChevronLeft,
  ChevronDown,
  Edit,
  CheckCircle,
  AlertCircle,
  Shield,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Send,
  ArrowUpRight,
  RefreshCw,
  Building2,
  FileCheck,
  FileText,
  Sparkles,
  Check,
} from 'lucide-react';
import CustomDatePicker from '../../../components/CustomDatePicker';
import toast from 'react-hot-toast';

export default function BillPage() {
  const context = useDashboard();
  const { user } = useAuth();

  // Support both context state and standalone state so page never crashes
  const [localBills, setLocalBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [billSubView, setBillSubView] = useState<'list' | 'add' | 'edit'>('list');

  // Form states
  const [newBillClient, setNewBillClient] = useState('');
  const [newBillEmail, setNewBillEmail] = useState('');
  const [newBillMobile, setNewBillMobile] = useState('');
  const [newBillGst, setNewBillGst] = useState('');
  const [newBillEventName, setNewBillEventName] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newBillDate, setNewBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventDate, setNewEventDate] = useState('');
  const [newTokenPaymentDate, setNewTokenPaymentDate] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Cash');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillAdvance, setNewBillAdvance] = useState('');
  const [newBillStatus, setNewBillStatus] = useState('Pending');
  const [editingBill, setEditingBill] = useState<any>(null);

  // Filter & Search states
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [quotationsData, setQuotationsData] = useState<any[]>([]);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorTab, setSelectorTab] = useState<'ALL' | 'EVENT' | 'QUOTATION'>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{
    type: 'EVENT' | 'QUOTATION';
    id: string;
    name: string;
    clientName?: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [studioProfile, setStudioProfile] = useState<any>(null);

  // Close auto-fill dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active bills: from context if available, else local
  const bills = context?.bills || localBills;
  const setBills = (newBills: any[]) => {
    if (context?.setBills) context.setBills(newBills);
    setLocalBills(newBills);
  };

  // Fetch Bills, Studio Profile, Events & Quotations
  const fetchBillsAndStudio = async () => {
    try {
      setLoading(true);
      const [billsRes, studioRes, eventsRes, quotesRes] = await Promise.allSettled([
        apiClient.get('/dashboard/bills', { params: { _t: Date.now() } }),
        apiClient.get('/studio/profile', { params: { _t: Date.now() } }),
        apiClient.get('/event/my', { params: { _t: Date.now() } }),
        apiClient.get('/dashboard/quotations', { params: { _t: Date.now() } }),
      ]);

      if (billsRes.status === 'fulfilled' && Array.isArray(billsRes.value.data)) {
        setBills(billsRes.value.data);
      }
      if (studioRes.status === 'fulfilled' && studioRes.value.data?.studio) {
        setStudioProfile(studioRes.value.data.studio);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.events) {
        setEventsData(eventsRes.value.data.events);
      }
      if (quotesRes.status === 'fulfilled' && Array.isArray(quotesRes.value.data)) {
        setQuotationsData(quotesRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndStudio();
  }, []);

  // Combined Auto-Fill Items (Events + Quotations)
  const combinedAutoFillItems = useMemo(() => {
    const items: Array<{
      type: 'EVENT' | 'QUOTATION';
      id: string;
      title: string;
      clientName: string;
      clientMobile: string;
      clientEmail: string;
      date: string;
      amount?: number;
      status?: string;
      rawData: any;
    }> = [];

    // Map Events
    eventsData.forEach((ev: any) => {
      items.push({
        type: 'EVENT',
        id: ev._id || ev.code,
        title: ev.name || 'Unnamed Event',
        clientName: ev.clientName || 'Client Name Not Set',
        clientMobile: ev.clientMobile || '',
        clientEmail: ev.clientEmail || '',
        date: ev.date ? ev.date.split('T')[0] : '',
        status: ev.status || ev.type || 'Event',
        rawData: ev,
      });
    });

    // Map Quotations
    quotationsData.forEach((q: any) => {
      const scopeDesc = q.scope || (q.items && q.items.length > 0 ? q.items.map((it: any) => it.name).join(', ') : '');
      items.push({
        type: 'QUOTATION',
        id: q._id,
        title: scopeDesc ? `Quote: ${scopeDesc}` : `Quotation #${q._id.slice(-6)}`,
        clientName: q.clientName || 'Quotation Client',
        clientMobile: '',
        clientEmail: '',
        date: q.validUntil ? q.validUntil.split('T')[0] : (q.createdAt ? q.createdAt.split('T')[0] : ''),
        amount: q.amount || 0,
        status: q.status || 'Pending',
        rawData: q,
      });
    });

    return items;
  }, [eventsData, quotationsData]);

  // Search & Filter Auto-Fill Items
  const filteredAutoFillItems = useMemo(() => {
    return combinedAutoFillItems.filter((item) => {
      if (selectorTab === 'EVENT' && item.type !== 'EVENT') return false;
      if (selectorTab === 'QUOTATION' && item.type !== 'QUOTATION') return false;

      if (!selectorSearch.trim()) return true;
      const q = selectorSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.clientMobile.toLowerCase().includes(q) ||
        item.clientEmail.toLowerCase().includes(q) ||
        (item.amount ? item.amount.toString().includes(q) : false) ||
        item.date.includes(q)
      );
    });
  }, [combinedAutoFillItems, selectorTab, selectorSearch]);

  // Select Item and Auto-Fill Form
  const handleSelectAutoFill = (item: typeof combinedAutoFillItems[0]) => {
    setSelectedSource({
      type: item.type,
      id: item.id,
      name: item.title,
      clientName: item.clientName,
    });
    setIsDropdownOpen(false);

    if (item.type === 'EVENT') {
      const ev = item.rawData;
      setNewBillClient(ev.clientName || '');
      setNewBillEmail(ev.clientEmail || '');
      setNewBillMobile(ev.clientMobile || '');
      setNewBillEventName(ev.name || '');
      if (ev.date) setNewEventDate(ev.date.split('T')[0]);
      setSelectedEventId(ev._id || ev.code);
      toast.success(`✨ Auto-filled from Event: ${ev.name}`);
    } else {
      const q = item.rawData;
      setNewBillClient(q.clientName || '');
      if (q.amount) setNewBillAmount(q.amount.toString());
      setNewBillEventName(item.title);
      if (q.validUntil) setNewEventDate(q.validUntil.split('T')[0]);
      else if (q.createdAt) setNewEventDate(q.createdAt.split('T')[0]);
      setSelectedEventId('');
      toast.success(`✨ Auto-filled from Quotation: ${q.clientName} (₹${(q.amount || 0).toLocaleString('en-IN')})`);
    }
  };

  const handleClearAutoFill = () => {
    setSelectedSource(null);
    setSelectedEventId('');
    toast.success('Auto-fill selection cleared');
  };

  // Format GSTIN uppercase
  const handleGstChange = (val: string) => {
    const raw = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setNewBillGst(raw);
  };

  // Edit an existing bill
  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setNewBillClient(bill.clientName || bill.client || '');
    setNewBillEmail(bill.clientEmail || '');
    setNewBillMobile(bill.clientMobile || '');
    setNewBillGst(bill.gstNumber || bill.gstNo || '');
    setNewBillEventName(bill.eventName || '');
    setSelectedEventId(bill.eventId || '');
    setSelectedSource(bill.eventName ? { type: 'EVENT', id: bill.eventId || '', name: bill.eventName } : null);
    setIsDropdownOpen(false);
    setNewEventDate(bill.eventDate ? bill.eventDate.split('T')[0] : '');
    setNewBillDate(bill.issueDate ? bill.issueDate.split('T')[0] : (bill.date ? bill.date.split('T')[0] : new Date().toISOString().split('T')[0]));
    setNewBillAmount(bill.amount?.toString() || '');
    setNewBillAdvance(bill.advance?.toString() || '');
    setNewTokenPaymentDate(bill.tokenPaymentDate ? bill.tokenPaymentDate.split('T')[0] : '');
    setNewPaymentMethod(bill.paymentMethod || 'Cash');
    setNewBillStatus(bill.status || 'Pending');
    setBillSubView('edit');
  };

  // Delete invoice
  const handleDelete = async (bill: any) => {
    if (!confirm(`Are you sure you want to delete invoice ${bill.invoiceNo || 'this invoice'}?`)) return;
    try {
      await apiClient.delete(`/dashboard/bills/${bill._id}`);
      const updated = bills.filter((b: any) => b._id !== bill._id);
      setBills(updated);
      toast.success('Invoice deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete invoice');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingBill(null);
    setNewBillClient('');
    setNewBillEmail('');
    setNewBillMobile('');
    setNewBillGst('');
    setNewBillEventName('');
    setSelectedEventId('');
    setSelectedSource(null);
    setSelectorSearch('');
    setIsDropdownOpen(false);
    setNewEventDate('');
    setNewTokenPaymentDate('');
    setNewPaymentMethod('Cash');
    setNewBillDate(new Date().toISOString().split('T')[0]);
    setNewBillAmount('');
    setNewBillAdvance('');
    setNewBillStatus('Pending');
    setBillSubView('list');
  };

  // Print Window generator
  const openPrintWindow = (invoice: any) => {
    const studio = studioProfile || context?.studio || {};
    const studioName = studio?.name || 'Mara Photo Studio';
    const studioLogo = studio?.logoUrl || '';
    const studioPhone = studio?.phone || user?.phone || '';
    const studioEmail = studio?.email || user?.email || '';
    const studioAddress = studio?.address || '';
    const studioGst = studio?.gstNumber || '';

    const clientName = invoice.clientName || invoice.client || 'Client';
    const clientPhone = invoice.clientMobile || '';
    const clientEmail = invoice.clientEmail || '';
    const clientGst = invoice.gstNumber || invoice.gstNo || '';
    const total = parseFloat(invoice.amount || 0);
    const advance = parseFloat(invoice.advance || 0);
    const balance = invoice.balance !== undefined ? parseFloat(invoice.balance) : Math.max(0, total - advance);
    const invoiceDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
    const invoiceNumber = invoice.invoiceNo || `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const eventName = invoice.eventName || 'Photography & Videography Services';
    const eventDateStr = invoice.eventDate ? new Date(invoice.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const paymentMode = invoice.paymentMethod || 'Cash';
    const status = invoice.status || (balance === 0 ? 'Paid' : 'Pending');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the invoice');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber} - ${clientName}</title>
          <meta charset="utf-8" />
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #ffffff;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              line-height: 1.5;
            }
            @page { size: A4; margin: 15mm; }
            .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
            .studio-title { font-size: 26px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
            .studio-sub { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px; }
            .tax-badge { background: #faf5ee; border: 1px solid #c5a880; color: #9c7c56; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 8px; display: inline-block; margin-bottom: 8px; }
            .inv-num { font-size: 28px; font-weight: 900; color: #c5a880; line-height: 1; }
            .inv-meta { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 6px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 28px 0; padding: 20px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; }
            .info-block h4 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 8px; }
            .info-block .name { font-size: 16px; font-weight: 800; color: #0f172a; }
            .info-block .desc { font-size: 12px; font-weight: 600; color: #475569; margin-top: 3px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            .items-table th { background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 16px; text-align: left; }
            .items-table th.right { text-align: right; }
            .items-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #334155; }
            .items-table td.right { text-align: right; }
            .totals-container { margin-top: 24px; display: flex; justify-content: flex-end; }
            .totals-card { width: 320px; background: #faf8f5; border: 1px solid #e8dfd3; border-radius: 12px; padding: 16px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #475569; padding: 6px 0; }
            .total-row.highlight { color: #059669; }
            .total-row.grand { border-top: 2px dashed #c5a880; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 900; color: #0f172a; }
            .total-row.grand span.val { color: ${balance === 0 ? '#059669' : '#dc2626'}; }
            .footer-box { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
            .notes { font-size: 11px; color: #64748b; font-weight: 500; max-width: 450px; }
            .sign-box { text-align: center; }
            .sign-line { width: 160px; height: 1px; background: #94a3b8; margin: 35px 0 6px 0; }
            .sign-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header-top">
              <div>
                ${studioLogo ? `<img src="${studioLogo}" alt="Studio Logo" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
                <h1 class="studio-title">${studioName}</h1>
                <div class="studio-sub">Professional Photography & Cinematic Films</div>
                ${studioAddress ? `<div class="studio-sub">${studioAddress}</div>` : ''}
                ${studioPhone ? `<div class="studio-sub">Phone: ${studioPhone} • Email: ${studioEmail}</div>` : ''}
                ${studioGst ? `<div class="studio-sub"><strong>GSTIN:</strong> ${studioGst}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <span class="tax-badge">Tax Invoice</span>
                <div class="inv-num">${invoiceNumber}</div>
                <div class="inv-meta"><strong>Date:</strong> ${invoiceDate}</div>
                <div class="inv-meta"><strong>Status:</strong> <span style="color: ${status === 'Paid' ? '#059669' : '#d97706'}; font-weight: 800;">${status.toUpperCase()}</span></div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-block">
                <h4>Billed To (Client Details)</h4>
                <div class="name">${clientName}</div>
                ${clientPhone ? `<div class="desc">Mobile: ${clientPhone}</div>` : ''}
                ${clientEmail ? `<div class="desc">Email: ${clientEmail}</div>` : ''}
                ${clientGst ? `<div class="desc"><strong>GSTIN:</strong> ${clientGst}</div>` : ''}
              </div>
              <div class="info-block">
                <h4>Event & Payment Details</h4>
                <div class="name">${eventName}</div>
                ${eventDateStr ? `<div class="desc">Event Date: ${eventDateStr}</div>` : ''}
                <div class="desc">Payment Mode: <strong>${paymentMode}</strong></div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Service Description</th>
                  <th>Event</th>
                  <th class="right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>${eventName}</strong>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                      High-Resolution Digital Album Delivery, AI Face Matching & Cloud Gallery
                    </div>
                  </td>
                  <td>${eventDateStr || 'Full Coverage'}</td>
                  <td class="right font-black">₹${total.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-container">
              <div class="totals-card">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${total.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row highlight">
                  <span>Advance / Token Paid:</span>
                  <span>- ₹${advance.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row grand">
                  <span>Balance Due:</span>
                  <span class="val">₹${balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div class="footer-box">
              <div class="notes">
                <strong>Terms & Conditions:</strong><br/>
                1. Full balance must be cleared prior to final album delivery.<br/>
                2. Payments can be completed via Cash, UPI, or Bank Transfer.<br/>
                3. This is a computer-generated GST invoice issued by ${studioName}.
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-label">Authorized Signatory</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Share reminder
  const sendWhatsAppReminder = (invoice: any) => {
    const phone = invoice.clientMobile?.replace(/[^0-9]/g, '');
    if (!phone) {
      toast.error('Client mobile number not available');
      return;
    }
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const clientName = invoice.clientName || invoice.client || 'Client';
    const invoiceNo = invoice.invoiceNo || 'Invoice';
    const total = parseFloat(invoice.amount || 0).toLocaleString('en-IN');
    const advance = parseFloat(invoice.advance || 0).toLocaleString('en-IN');
    const balance = parseFloat(invoice.balance || 0).toLocaleString('en-IN');
    const studioName = studioProfile?.name || 'our studio';

    const text = encodeURIComponent(
      `Hello ${clientName},\n\nHere are your billing details from *${studioName}*:\n\n*Invoice No:* ${invoiceNo}\n*Total Amount:* ₹${total}\n*Advance Paid:* ₹${advance}\n*Balance Due:* ₹${balance}\n*Status:* ${invoice.status || 'Pending'}\n\nThank you for choosing ${studioName}!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Save or Update Invoice
  const handleSaveInvoice = async (shouldPrint: boolean) => {
    if (!newBillClient.trim()) {
      toast.error('Please enter client full name');
      return;
    }

    if (newBillGst.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(newBillGst.trim())) {
        toast.error('Invalid GSTIN format (15 characters required, e.g. 24AAAAA0000A1Z5)');
        return;
      }
    }

    const totalVal = parseFloat(newBillAmount) || 0;
    const advVal = parseFloat(newBillAdvance) || 0;
    const balVal = Math.max(0, totalVal - advVal);

    try {
      const reqBody: any = {
        clientName: newBillClient.trim(),
        clientEmail: newBillEmail.trim(),
        clientMobile: newBillMobile.trim(),
        gstNumber: newBillGst ? newBillGst.trim().toUpperCase() : undefined,
        eventName: newBillEventName.trim(),
        eventDate: newEventDate ? newEventDate : undefined,
        amount: totalVal,
        advance: advVal,
        balance: balVal,
        tokenPaymentDate: newTokenPaymentDate ? newTokenPaymentDate : undefined,
        paymentMethod: newPaymentMethod,
        issueDate: newBillDate ? newBillDate : undefined,
        status: newBillStatus || (balVal === 0 ? 'Paid' : 'Pending'),
      };

      if (billSubView === 'edit' && editingBill) {
        reqBody.invoiceNo = editingBill.invoiceNo;
        const res = await apiClient.put(`/dashboard/bills/${editingBill._id}`, reqBody);
        const updated = bills.map((b: any) => (b._id === editingBill._id ? res.data : b));
        setBills(updated);
        toast.success('Invoice updated successfully!');
      } else {
        reqBody.invoiceNo = `INV-2026-${String(bills.length + 101).padStart(3, '0')}`;
        const res = await apiClient.post('/dashboard/bills', reqBody);
        setBills([res.data, ...bills]);
        toast.success('GST Invoice created successfully!');
      }

      if (shouldPrint) {
        openPrintWindow(reqBody);
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save invoice');
    }
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill: any) => {
      const search = searchQuery.toLowerCase().trim();
      const clientName = (bill.clientName || bill.client || '').toLowerCase();
      const invoiceNo = (bill.invoiceNo || bill.id || '').toLowerCase();
      const eventName = (bill.eventName || '').toLowerCase();
      const mobile = (bill.clientMobile || '').toLowerCase();
      const status = (bill.status || '').toLowerCase();

      const matchesSearch =
        !search ||
        clientName.includes(search) ||
        invoiceNo.includes(search) ||
        eventName.includes(search) ||
        mobile.includes(search) ||
        status.includes(search);

      const matchesFilter = filterStatus === 'All' || bill.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [bills, searchQuery, filterStatus]);

  // Aggregate metrics
  const pendingAmount = useMemo(() => {
    return bills
      .filter((b: any) => b.status === 'Pending')
      .reduce((acc: number, b: any) => acc + (parseFloat(b.balance) || 0), 0);
  }, [bills]);

  const overdueAmount = useMemo(() => {
    return bills
      .filter((b: any) => b.status === 'Overdue')
      .reduce((acc: number, b: any) => acc + (parseFloat(b.balance) || 0), 0);
  }, [bills]);

  const paidAmount = useMemo(() => {
    return bills.reduce((acc: number, b: any) => {
      if (b.status === 'Paid') return acc + (parseFloat(b.amount) || 0);
      return acc + (parseFloat(b.advance) || 0);
    }, 0);
  }, [bills]);

  const totalBilled = useMemo(() => {
    return bills.reduce((acc: number, b: any) => acc + (parseFloat(b.amount) || 0), 0);
  }, [bills]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex flex-col gap-6">
        {billSubView === 'list' ? (
          <>
            {/* ═══ TOP HEADER & PRIMARY ACTIONS ═══ */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-[#e8dfd3] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#faf8f5] to-amber-100 border border-[#c5a880] flex items-center justify-center text-amber-900 shadow-xs shrink-0">
                  <Receipt className="w-6 h-6 text-[#9c7c56]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#c5a880] bg-[#faf8f5] px-2 py-0.5 rounded-md border border-[#e8dfd3]">
                      Billing & Accounts
                    </span>
                    <span className="text-xs text-slate-400 font-bold">•</span>
                    <span className="text-xs text-slate-500 font-bold">
                      {studioProfile?.name || 'Studio Invoices'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    GST Invoices & Billing Management
                  </h1>
                </div>
              </div>

              {/* Action Buttons: Status Filter, Search, New Invoice */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={fetchBillsAndStudio}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#faf8f5] hover:bg-white border border-[#e8dfd3] text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                  title="Refresh bills"
                >
                  <RefreshCw className={`w-4 h-4 text-[#c5a880] ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#faf8f5] border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all cursor-pointer"
                >
                  <option value="All">All Invoices ({bills.length})</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>

                {/* Search */}
                <div className="relative flex-1 sm:w-56 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by client, invoice..."
                    className="w-full bg-[#faf8f5] border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Create Invoice Primary Button */}
                <button
                  type="button"
                  onClick={() => setBillSubView('add')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a880] to-[#b89665] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Invoice</span>
                </button>
              </div>
            </div>

            {/* ═══ FINANCIAL KPI OVERVIEW CARDS ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Total Billed
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  ₹{totalBilled.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Across {bills.length} invoices
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Total Received
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
                  ₹{paidAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Advance & full payments
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Pending Balance
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  To be collected
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Overdue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-red-600 mt-2">
                  ₹{overdueAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Action required
                </p>
              </div>
            </div>

            {/* ═══ INVOICES TABLE (DESKTOP & TABLET) ═══ */}
            <div className="bg-white border border-[#e8dfd3] rounded-2xl overflow-hidden shadow-xs">
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#e8dfd3] bg-[#faf8f5] text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-3.5 px-4 text-center">Invoice No</th>
                      <th className="py-3.5 px-4 text-left">Client & Contact</th>
                      <th className="py-3.5 px-4 text-left">Event Details</th>
                      <th className="py-3.5 px-4 text-center">Date</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4 text-right">Token Paid</th>
                      <th className="py-3.5 px-4 text-right">Balance Due</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBills.map((invoice: any, i: number) => {
                      const balance = parseFloat(invoice.balance || 0);
                      return (
                        <tr key={invoice._id || i} className="hover:bg-[#fbf9f6] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-900 text-center">
                            <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              {invoice.invoiceNo || `INV-${i + 1}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {invoice.clientName || invoice.client}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-semibold text-[11px]">
                              {invoice.clientMobile && <span>📞 {invoice.clientMobile}</span>}
                              {invoice.gstNumber && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  GST: {invoice.gstNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <div className="font-bold text-slate-800">
                              {invoice.eventName || 'General Event'}
                            </div>
                            {invoice.eventDate && (
                              <div className="text-[11px] text-slate-400 font-medium">
                                {new Date(invoice.eventDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600 text-center">
                            {(invoice.issueDate || invoice.date)?.split('T')[0] || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 text-right text-sm">
                            ₹{(parseFloat(invoice.amount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700 text-right">
                            ₹{(parseFloat(invoice.advance) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-black text-right text-sm">
                            <span className={balance === 0 ? 'text-emerald-700' : 'text-red-600'}>
                              ₹{balance.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                invoice.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : invoice.status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  invoice.status === 'Paid'
                                    ? 'bg-emerald-500'
                                    : invoice.status === 'Overdue'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {invoice.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openPrintWindow(invoice)}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                                title="Print / Download PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print</span>
                              </button>
                              {invoice.clientMobile && (
                                <button
                                  type="button"
                                  onClick={() => sendWhatsAppReminder(invoice)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                                  title="Send WhatsApp Invoice Link"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEdit(invoice)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-all cursor-pointer"
                                title="Edit Invoice"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(invoice)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-all cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredBills.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                          <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="text-base font-bold text-slate-700">No invoices found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {searchQuery
                              ? 'No invoices match your search keyword.'
                              : 'Create your first GST invoice using the button above.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ═══ MOBILE CARDS VIEW ═══ */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100">
                {filteredBills.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No invoices found</p>
                  </div>
                ) : (
                  filteredBills.map((invoice: any, i: number) => {
                    const balance = parseFloat(invoice.balance || 0);
                    return (
                      <div key={invoice._id || i} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md">
                            {invoice.invoiceNo || `INV-${i + 1}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              invoice.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : invoice.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {invoice.status || 'Pending'}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-slate-900 text-base">
                            {invoice.clientName || invoice.client}
                          </h3>
                          <div className="text-xs text-slate-500 font-semibold mt-0.5">
                            {invoice.eventName || 'Event Coverage'}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-[#faf8f5] p-2.5 rounded-xl border border-[#e8dfd3] text-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                            <div className="text-xs font-black text-slate-900 mt-0.5">
                              ₹{(parseFloat(invoice.amount) || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Advance</span>
                            <div className="text-xs font-bold text-emerald-700 mt-0.5">
                              ₹{(parseFloat(invoice.advance) || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                            <div
                              className={`text-xs font-black mt-0.5 ${
                                balance === 0 ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              ₹{balance.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openPrintWindow(invoice)}
                            className="flex-1 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                          {invoice.clientMobile && (
                            <button
                              type="button"
                              onClick={() => sendWhatsAppReminder(invoice)}
                              className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl"
                              title="Send on WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(invoice)}
                            className="p-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(invoice)}
                            className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          /* ═══ CREATE / EDIT INVOICE FORM VIEW ═══ */
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dfd3]">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-[#e8dfd3] shadow-2xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
                <span>Back to Invoices</span>
              </button>
              <span className="text-[11px] font-black text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
                {billSubView === 'edit' ? 'Editing Invoice' : 'New GST Invoice'}
              </span>
            </div>

            <div className="bg-white border border-[#e8dfd3] rounded-2xl p-5 sm:p-8 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {billSubView === 'edit' ? 'Edit GST Invoice' : 'Create New GST Invoice'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enter client, event, and payment details. All totals and balance are calculated automatically.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveInvoice(false);
                }}
                className="space-y-4 sm:space-y-5"
              >
                {/* ═══ AUTO-FILL FROM EVENT OR QUOTATION (WITH LIVE SEARCHBAR & TABS) ═══ */}
                <div
                  ref={dropdownRef}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#faf8f5] via-white to-[#fbf9f6] border-2 border-[#e8dfd3] shadow-2xs space-y-3 relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c5a880]" />
                      <span>Auto-fill from Event or Quotation</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Search and select an Event or Quotation to instantly auto-fill details
                    </span>
                  </div>

                  {/* Selector Trigger Button / Active Selection Display */}
                  {selectedSource ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border-2 border-[#c5a880] shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${
                            selectedSource.type === 'EVENT'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {selectedSource.type === 'EVENT' ? '📅 EVENT' : '📄 QUOTATION'}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {selectedSource.name}
                          </h4>
                          {selectedSource.clientName && (
                            <p className="text-[11px] font-semibold text-slate-500 truncate">
                              Client: <strong className="text-slate-700">{selectedSource.clientName}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen((prev) => !prev)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#99732e] bg-[#faf4ea] hover:bg-[#f5ebd8] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAutoFill}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Clear auto-fill"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white border-2 border-[#e8dfd3] hover:border-[#c5a880] text-left transition-all shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-slate-500 group-hover:text-slate-800">
                        <Search className="w-4 h-4 text-[#c5a880]" />
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                          Choose an Event or Quotation to Auto-Fill (Optional)...
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-[#99732e]' : ''
                        }`}
                      />
                    </button>
                  )}

                  {/* ═══ EXPANDABLE SEARCHABLE DROPDOWN POPOVER ═══ */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-[#c5a880]/70 rounded-2xl shadow-2xl overflow-hidden p-3.5 space-y-3">
                      {/* Search Bar on Top */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#c5a880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by event name, client, quotation, date, amount..."
                          value={selectorSearch}
                          onChange={(e) => setSelectorSearch(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-[#e8dfd3] focus:border-[#c5a880] text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden transition-all shadow-inner"
                        />
                        {selectorSearch && (
                          <button
                            type="button"
                            onClick={() => setSelectorSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Tabs: ALL, EVENTS, QUOTATIONS */}
                      <div className="flex items-center gap-2 border-b border-[#e8dfd3] pb-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectorTab('ALL')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            selectorTab === 'ALL'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          All Items ({combinedAutoFillItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectorTab('EVENT')}
                          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectorTab === 'EVENT'
                              ? 'bg-amber-700 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Events ({eventsData.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectorTab('QUOTATION')}
                          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectorTab === 'QUOTATION'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Quotations ({quotationsData.length})</span>
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                        {filteredAutoFillItems.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            <Search className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-[#c5a880]" />
                            <p className="text-xs font-bold text-slate-600">No matching events or quotations found</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name or client</p>
                          </div>
                        ) : (
                          filteredAutoFillItems.map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              onClick={() => handleSelectAutoFill(item)}
                              className="pt-1 first:pt-0"
                            >
                              <div className="p-3 rounded-xl hover:bg-[#faf7f2] border border-transparent hover:border-[#c5a880]/50 transition-all cursor-pointer flex items-center justify-between gap-3 group">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                      item.type === 'EVENT'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 group-hover:scale-105'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 group-hover:scale-105'
                                    } transition-transform`}
                                  >
                                    {item.type === 'EVENT' ? (
                                      <Calendar className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                                          item.type === 'EVENT'
                                            ? 'bg-amber-100/70 text-amber-900 border-amber-300'
                                            : 'bg-emerald-100/70 text-emerald-900 border-emerald-300'
                                        }`}
                                      >
                                        {item.type}
                                      </span>
                                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate group-hover:text-[#99732e] transition-colors">
                                        {item.title}
                                      </h5>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-semibold mt-1">
                                      {item.clientName && <span>👤 {item.clientName}</span>}
                                      {item.clientMobile && <span>📞 {item.clientMobile}</span>}
                                      {item.date && <span>📅 {item.date}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  {item.amount !== undefined && item.amount > 0 && (
                                    <div className="text-xs sm:text-sm font-black text-emerald-700">
                                      ₹{item.amount.toLocaleString('en-IN')}
                                    </div>
                                  )}
                                  <span className="text-[10px] font-bold text-[#c5a880] group-hover:underline block">
                                    Select & Fill →
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Bottom close helper */}
                      <div className="pt-2 border-t border-[#e8dfd3] flex items-center justify-between text-[11px] text-slate-500">
                        <span>Showing {filteredAutoFillItems.length} of {combinedAutoFillItems.length} items</span>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                        >
                          Close Dropdown
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Client Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhargav Kukadiya"
                    value={newBillClient}
                    onChange={(e) => setNewBillClient(e.target.value)}
                    className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                  />
                </div>

                {/* Client Email, Mobile & GST */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Client Mobile
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={newBillMobile}
                      onChange={(e) => setNewBillMobile(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Client Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={newBillEmail}
                      onChange={(e) => setNewBillEmail(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      {newBillGst.length > 0 && (
                        <span className={`text-[10px] font-mono font-bold ${newBillGst.length === 15 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {newBillGst.length}/15
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="24AAAAA0000A1Z5"
                      value={newBillGst}
                      onChange={(e) => handleGstChange(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono uppercase font-bold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Event Name & Event Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Event / Shoot Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wedding & Reception Coverage"
                      value={newBillEventName}
                      onChange={(e) => setNewBillEventName(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Event Date
                    </label>
                    <CustomDatePicker
                      type="date"
                      value={newEventDate}
                      onChange={(val) => setNewEventDate(val)}
                      className="w-full bg-white border border-[#e8dfd3] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                {/* Invoice Date & Total Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <CustomDatePicker
                      type="date"
                      required
                      value={newBillDate}
                      onChange={(val) => setNewBillDate(val)}
                      className="w-full bg-white border border-[#e8dfd3] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#c5a880]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Total Invoice Amount (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={newBillAmount}
                        onChange={(e) => setNewBillAmount(e.target.value)}
                        className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Token Paid, Token Date, Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Advance / Token Paid (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={newBillAdvance}
                        onChange={(e) => setNewBillAdvance(e.target.value)}
                        className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Token Date
                    </label>
                    <CustomDatePicker
                      type="date"
                      value={newTokenPaymentDate}
                      onChange={(val) => setNewTokenPaymentDate(val)}
                      className="w-full bg-white border border-[#e8dfd3] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#c5a880]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Payment Method
                    </label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / UPI</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Auto Calculated Balance & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Balance Due (Auto Calculated)
                    </label>
                    <div className="w-full bg-[#faf8f5] border border-[#e8dfd3] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between shadow-2xs">
                      <span>Remaining Balance:</span>
                      <span className="font-mono font-black text-base text-red-600">
                        ₹{Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Invoice Status
                    </label>
                    <select
                      value={newBillStatus}
                      onChange={(e) => setNewBillStatus(e.target.value)}
                      className="w-full bg-white border border-[#e8dfd3] hover:border-[#c5a880] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#c5a880] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-all active:scale-98 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-5 rounded-xl text-xs sm:text-sm cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Save Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice(true)}
                    className="flex-1 bg-gradient-to-r from-[#d4af37] via-[#c5a880] to-[#b89665] text-slate-950 font-black py-3 px-5 rounded-xl text-xs sm:text-sm cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
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
