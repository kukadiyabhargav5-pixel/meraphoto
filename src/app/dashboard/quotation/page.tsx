'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
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
    errorMsg, setErrorMsg
  } = context;

  const [quotationSubView, setQuotationSubView] = useState('list');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteStatus, setNewQuoteStatus] = useState('Pending');
  const [selectedEventCodeForQuote, setSelectedEventCodeForQuote] = useState('');
  const [newQuoteItems, setNewQuoteItems] = useState([{ name: '', price: 0 }]);
  
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
    setNewQuoteItems([...newQuoteItems, { name: '', price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...newQuoteItems];
    newItems.splice(index, 1);
    setNewQuoteItems(newItems);
  };

  const handleItemChange = (index: number, field: 'name' | 'price', value: string) => {
    const newItems = [...newQuoteItems];
    if (field === 'price') {
      newItems[index].price = parseFloat(value) || 0;
    } else {
      newItems[index].name = value;
    }
    setNewQuoteItems(newItems);
  };

  const handleEdit = (quote: any) => {
    setEditingId(quote._id || quote.id); // Backward compat if id is used
    setNewQuoteClient(quote.clientName || quote.client || '');
    setNewQuoteStatus(quote.status || 'Pending');
    setNewQuoteItems(quote.items?.length > 0 ? quote.items : [{ name: quote.scope || 'General', price: quote.amount || quote.value || 0 }]);
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
    // A simple print logic - ideally would open a print-friendly page
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Quotation - ${quote.clientName || quote.client}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              h1 { color: #c5a880; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f8f9fa; }
              .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <h1>Price Quotation</h1>
            <p><strong>Client:</strong> ${quote.clientName || quote.client}</p>
            <p><strong>Status:</strong> ${quote.status}</p>
            <p><strong>Date:</strong> ${new Date(quote.createdAt || Date.now()).toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price (INR)</th>
                </tr>
              </thead>
              <tbody>
                ${(quote.items || []).map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>₹${item.price.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">Total: ₹${(quote.amount || quote.value || 0).toLocaleString()}</div>
            <script>
              window.onload = () => window.print();
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
    setNewQuoteItems([{ name: '', price: 0 }]);
    setNewQuoteStatus('Pending');
  };

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
                  <button onClick={() => { resetForm(); setQuotationSubView('add'); }} className="bg-[#c5a880] hover:bg-[#E05E00] text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md w-full md:w-auto">
                    <Plus className="h-4 w-4" /> New Quotation
                  </button>
                </div>
                
                {/* Quotation Blocks / Grid View */}
                {quotations.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
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
                                <div key={idx} className="flex justify-between text-xs text-slate-600">
                                  <span className="truncate pr-2">• {item.name}</span>
                                  <span className="font-semibold text-slate-800 shrink-0">₹{item.price.toLocaleString()}</span>
                                </div>
                              ))}
                              {quote.items?.length > 3 && (
                                <div className="text-xs text-slate-400 italic">+ {quote.items.length - 3} more items...</div>
                              )}
                              {(!quote.items || quote.items.length === 0) && quote.scope && (
                                <div className="text-xs text-slate-600 truncate">• {quote.scope}</div>
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
                <button onClick={() => { setQuotationSubView('list'); resetForm(); }} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-white hover:text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
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
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-6 text-left shadow-sm">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-bold tracking-wider">Prospective Client <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="e.g. Rahul & Neha" required value={newQuoteClient} onChange={(e) => setNewQuoteClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm" />
                  </div>
                  
                  <hr className="border-slate-200 my-2" />

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs text-slate-600 uppercase font-bold tracking-wider">Line Items</label>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {newQuoteItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Pre-Wedding Shoot" 
                            value={item.name} 
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm" 
                          />
                          <input 
                            type="number" 
                            required 
                            placeholder="Price" 
                            min="0"
                            value={item.price || ''} 
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-40 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm" 
                          />
                          {newQuoteItems.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(index)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button type="button" onClick={handleAddItem} className="mt-4 text-sm font-bold text-[#c5a880] hover:text-[#b69970] flex items-center gap-1.5 px-2">
                      <Plus className="h-4 w-4" /> Add Item
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  <div className="flex items-center justify-between bg-slate-100 p-5 rounded-xl">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Amount</span>
                    <span className="text-2xl font-black text-[#c5a880]">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <button type="submit" className="bg-[#c5a880] hover:bg-[#b69970] text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md mt-6">
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
