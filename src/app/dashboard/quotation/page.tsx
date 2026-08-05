'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Plus, Trash2, Download, CheckCircle, ChevronLeft,
  FileText, User, Receipt, Briefcase, Printer, Edit, Trash
} from 'lucide-react';


export default function QuotationPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    quotations, setQuotations,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg,
    studio
  } = context;

  const { user } = useAuth();

  const [quotationSubView, setQuotationSubView] = useState('list');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteStatus, setNewQuoteStatus] = useState('Pending');
  const [selectedEventCodeForQuote, setSelectedEventCodeForQuote] = useState('');
  const [newQuoteItems, setNewQuoteItems] = useState([{ name: '', price: 0, notes: '' }]);
  
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to load events for quotes:', err);
      }
    };
    fetchEvents();
  }, []);

  const totalAmount = newQuoteItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  const handleAddItem = () => {
    setNewQuoteItems([...newQuoteItems, { name: '', price: 0, notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...newQuoteItems];
    newItems.splice(index, 1);
    setNewQuoteItems(newItems);
  };

  const handleItemChange = (index: number, field: 'name' | 'price' | 'notes', value: string) => {
    const newItems = [...newQuoteItems];
    if (field === 'price') {
      newItems[index].price = parseFloat(value) || 0;
    } else {
      (newItems[index] as any)[field] = value;
    }
    setNewQuoteItems(newItems);
  };

  const handleEdit = (quote: any) => {
    setEditingId(quote._id || quote.id);
    setNewQuoteClient(quote.clientName || quote.client || '');
    setNewQuoteStatus(quote.status || 'Pending');
    setNewQuoteItems(quote.items?.length > 0 ? quote.items.map((it: any) => ({ name: it.name || '', price: it.price || 0, notes: it.notes || '' })) : [{ name: quote.scope || 'General', price: quote.amount || quote.value || 0, notes: '' }]);
    setQuotationSubView('add');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await apiClient.delete(`/dashboard/quotations/${id}`);
      setQuotations(quotations.filter((q: any) => (q._id || q.id) !== id));
      setSuccessMsg('Quotation deleted.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete quotation');
    }
  };

  const handlePrint = (quote: any) => {
    const studioName = studio?.name || 'Mara Photo';
    const studioLogo = studio?.logoUrl || '';
    const studioEmail = user?.email || '';
    const studioPhone = user?.phone || '';
    const clientName = quote.clientName || quote.client || '';
    const total = quote.amount || quote.value || 0;
    const quoteDate = new Date(quote.createdAt || Date.now());
    const validUntil = quote.validUntil ? new Date(quote.validUntil) : new Date(quoteDate.getTime() + 30*24*60*60*1000);
    const quoteNumber = `QT-${quoteDate.getFullYear()}${String(quoteDate.getMonth()+1).padStart(2,'0')}${String(quoteDate.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

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
              
              /* Hide browser headers/footers on print */
              @page {
                size: A4;
                margin: 0; /* Removes browser header/footer text like 'about:blank' */
              }
              
              @media print {
                body {
                  padding: 1.5cm; /* Give space back inside the printable area */
                }
              }

              /* For screen preview */
              @media screen {
                body {
                  background: #f3f4f6;
                  padding: 40px;
                }
                .invoice-page {
                  margin: 0 auto;
                  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
                  padding: 1.5cm;
                }
              }

              .invoice-page {
                max-width: 21cm;
                background: white;
                position: relative;
              }

              /* ─── Header ─── */
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 30px;
                margin-bottom: 30px;
              }
              .studio-info { 
                display: flex; 
                flex-direction: column;
                gap: 12px;
              }
              .studio-logo-wrapper {
                margin-bottom: 8px;
              }
              .studio-logo {
                max-width: 140px;
                max-height: 60px;
                object-fit: contain;
              }
              .studio-name {
                font-size: 24px; 
                font-weight: 800;
                letter-spacing: -0.02em;
                color: #111827;
                text-transform: uppercase;
              }
              .studio-contact {
                font-size: 13px; 
                font-weight: 500;
                color: #4b5563;
              }
              .studio-contact div {
                margin-bottom: 2px;
              }
              
              .invoice-title {
                text-align: right;
              }
              .invoice-title h2 {
                font-size: 36px; 
                font-weight: 900;
                letter-spacing: 0.05em;
                color: #c5a880;
                text-transform: uppercase;
                line-height: 1;
              }
              .invoice-title .quote-num {
                font-size: 14px; 
                font-weight: 600;
                color: #6b7280;
                margin-top: 8px;
              }

              /* ─── Meta Section ─── */
              .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
              }
              .meta-block {
                flex: 1;
              }
              .meta-block.billed-to {
                flex: 2;
              }
              .meta-block h4 {
                font-size: 10px; 
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #9ca3af;
                margin-bottom: 6px;
              }
              .meta-block p {
                font-size: 15px; 
                font-weight: 600;
                color: #111827;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border: 1px solid currentColor;
              }
              .status-pending { color: #d97706; background: #fffbeb; }
              .status-accepted { color: #059669; background: #ecfdf5; }
              .status-rejected { color: #dc2626; background: #fef2f2; }

              /* ─── Table ─── */
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
              }
              thead th {
                font-size: 11px; 
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #ffffff;
                background-color: #111827;
                padding: 12px 16px;
                text-align: left;
              }
              thead th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
              thead th:last-child { 
                text-align: right; 
                border-top-right-radius: 6px; 
                border-bottom-right-radius: 6px;
              }
              
              tbody td {
                padding: 16px;
                border-bottom: 1px solid #e5e7eb;
                vertical-align: top;
              }
              tbody td:last-child {
                text-align: right;
                font-weight: 700;
                color: #111827;
                white-space: nowrap;
              }
              .item-name {
                font-size: 15px; 
                font-weight: 600;
                color: #111827;
              }
              .item-notes {
                font-size: 13px; 
                font-weight: 400;
                color: #6b7280; 
                margin-top: 4px;
              }
              .item-num {
                font-size: 13px; 
                font-weight: 500;
                color: #9ca3af;
              }
              .item-price {
                font-size: 15px; 
              }

              /* ─── Total Section ─── */
              .invoice-total {
                width: 350px;
                float: right;
                background: #f9fafb;
                padding: 24px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
              }
              .total-row.grand {
                border-top: 2px solid #e5e7eb;
                margin-top: 12px;
                padding-top: 16px;
              }
              .total-label {
                font-size: 13px; 
                font-weight: 600;
                color: #4b5563;
              }
              .total-value {
                font-size: 15px; 
                font-weight: 700;
                color: #111827;
              }
              .grand .total-label {
                font-size: 15px; 
                font-weight: 800;
                color: #111827;
                text-transform: uppercase;
              }
              .grand .total-value {
                font-size: 24px; 
                font-weight: 900;
                color: #c5a880;
              }
              .clearfix::after {
                content: "";
                clear: both;
                display: table;
              }

              /* ─── Footer ─── */
              .invoice-footer {
                margin-top: 80px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .footer-note {
                font-size: 12px; 
                font-weight: 500;
                color: #6b7280;
                line-height: 1.6;
                max-width: 400px;
              }
              .footer-brand {
                text-align: right;
              }
              .footer-brand .brand-name {
                font-size: 18px; 
                font-weight: 800;
                color: #111827;
                letter-spacing: 0.02em;
              }
              .footer-brand .brand-tagline {
                font-size: 10px; 
                font-weight: 700;
                color: #c5a880;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                margin-top: 4px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-page">
              
              <!-- Header -->
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
                  <h2>QUOTATION</h2>
                  <div class="quote-num">${quoteNumber}</div>
                </div>
              </div>

              <!-- Meta -->
              <div class="invoice-meta">
                <div class="meta-block billed-to">
                  <h4>Billed To</h4>
                  <p>${clientName}</p>
                </div>
                <div class="meta-block">
                  <h4>Date</h4>
                  <p>${quoteDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div class="meta-block">
                  <h4>Valid Until</h4>
                  <p>${validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <!-- Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width:40px">#</th>
                    <th>Description</th>
                    <th style="text-align:right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(quote.items || []).map((item: any, idx: number) => `
                    <tr>
                      <td class="item-num">${String(idx+1).padStart(2,'0')}</td>
                      <td>
                        <div class="item-name">${item.name}</div>
                        ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                      </td>
                      <td class="item-price">₹${Number(item.price).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Total -->
              <div class="clearfix">
                <div class="invoice-total">
                  <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span class="total-value">₹${total.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="total-row grand">
                    <span class="total-label">Total Amount</span>
                    <span class="total-value">₹${total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="invoice-footer">
                <div class="footer-note">
                  Thank you for choosing <strong>${studioName}</strong>.<br/>
                  If you have any questions concerning this quotation, please contact us.
                </div>
                <div class="footer-brand">
                  <div class="brand-name">${studioName}</div>
                  <div class="brand-tagline">Professional Photography</div>
                </div>
              </div>

            </div>

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNewQuoteClient('');
    setSelectedEventCodeForQuote('');
    setNewQuoteItems([{ name: '', price: 0, notes: '' }]);
    setNewQuoteStatus('Pending');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {quotationSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Quotations Generated</h1>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Generate and track formal price estimations sent to prospective clients.</p>
                  </div>
                  <button onClick={() => { resetForm(); setQuotationSubView('add'); }} className="bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md w-full md:w-auto">
                    <Plus className="h-4 w-4" /> New Quotation
                  </button>
                </div>
                
                {/* Quotation Blocks / Grid View */}
                {quotations.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-[#f8f7f4] text-slate-900 rounded-2xl border border-slate-200">
                    <FileText className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                    <p>No quotations created yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotations.map((quote: any, i: number) => {
                      const quoteId = quote._id || quote.id;
                      const clientName = quote.clientName || quote.client;
                      const total = quote.amount || quote.value || 0;
                      
                      return (
                        <div key={quoteId || i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
                          
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-black text-slate-900 line-clamp-1 pr-2">{clientName}</h3>
                          </div>
                          
                          {/* Items Preview */}
                          <div className="flex-1 mb-6">
                            <div className="space-y-2">
                              {(quote.items || []).slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-400">
                                  <span className="truncate pr-2">• {item.name}</span>
                                  <span className="font-semibold text-slate-800 shrink-0">₹{item.price.toLocaleString()}</span>
                                </div>
                              ))}
                              {quote.items?.length > 3 && (
                                <div className="text-xs text-slate-400 italic">+ {quote.items.length - 3} more items...</div>
                              )}
                              {(!quote.items || quote.items.length === 0) && quote.scope && (
                                <div className="text-xs text-slate-400 truncate">• {quote.scope}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <div className="text-sm font-black text-[#c5a880]">
                              ₹{total.toLocaleString()}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button onClick={() => handlePrint(quote)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Print/PDF">
                                <Printer className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleEdit(quote)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(quoteId)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={() => { setQuotationSubView('list'); resetForm(); }} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Quotations</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">{editingId ? 'Edit Quotation' : 'Generate Price Quotation'}</h1>
                  </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newQuoteClient && newQuoteItems.length > 0) {
                    try {
                      const reqBody = {
                        clientName: newQuoteClient,
                        items: newQuoteItems,
                        amount: totalAmount,
                        validUntil: new Date(Date.now() + 30*24*60*60*1000), // 30 days
                        status: newQuoteStatus || 'Pending'
                      };
                      
                      let res;
                      if (editingId) {
                        res = await apiClient.put(`/dashboard/quotations/${editingId}`, reqBody);
                        setQuotations(quotations.map((q: any) => (q._id || q.id) === editingId ? res.data : q));
                        setSuccessMsg('Quotation updated successfully!');
                      } else {
                        res = await apiClient.post('/dashboard/quotations', reqBody);
                        setQuotations([res.data, ...quotations]);
                        setSuccessMsg('Price quotation generated and logged!');
                      }
                      
                      resetForm();
                      setQuotationSubView('list');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg(editingId ? 'Failed to update quotation' : 'Failed to create quotation');
                    }
                  } else {
                    setErrorMsg('Please enter a client name and at least one item');
                  }
                }} className=" bg-[#f8f7f4] text-slate-900 border border-slate-200 p-8 rounded-2xl flex flex-col gap-6 text-left shadow-sm">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Prospective Client <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="e.g. Rahul & Neha" required value={newQuoteClient} onChange={(e) => setNewQuoteClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm" />
                  </div>
                  
                  <hr className="border-slate-200 my-2" />

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Line Items</label>
                    </div>
                    
                    <div className="flex flex-col gap-5">
                      {newQuoteItems.map((item, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative group">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Item Name *</label>
                              <input 
                                type="text" 
                                required 
                                placeholder="e.g. Pre-Wedding Shoot" 
                                value={item.name} 
                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
                              />
                            </div>
                            <div className="w-36 flex flex-col gap-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Price (₹) *</label>
                              <input 
                                type="number" 
                                required 
                                placeholder="Price" 
                                min="0"
                                value={item.price || ''} 
                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
                              />
                            </div>
                            {newQuoteItems.length > 1 && (
                              <button type="button" onClick={() => handleRemoveItem(index)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-4">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Notes (Optional)</label>
                            <textarea
                              placeholder="e.g. Includes 2 locations, 100 edited photos..."
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button type="button" onClick={handleAddItem} className="mt-4 text-sm font-bold text-[#c5a880] hover:text-[#b69970] flex items-center gap-1.5 px-2">
                      <Plus className="h-4 w-4" /> Add Item
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  <div className="flex items-center justify-between bg-slate-100 p-5 rounded-xl">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                    <span className="text-2xl font-black text-[#c5a880]">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <button type="submit" className="bg-[#c5a880] hover:bg-[#b69970] text-slate-900 font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md mt-6">
                    {editingId ? 'Update Price Quote' : 'Generate Price Quote'}
                  </button>
                </form>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
