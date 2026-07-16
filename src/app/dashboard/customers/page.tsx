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


export default function CustomersPage() {
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

  const [customerSubView, setCustomerSubView] = useState('list');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {customerSubView === 'list' ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Customers Directory</h1>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Manage your client relationships, contact details, and bookings.</p>
                  </div>
                  <button onClick={() => setCustomerSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
                    <Plus className="h-4 w-4" /> Add Customer
                  </button>
                </div>
                <div className=" bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4 text-center">Events Booked</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {customers.map((cust, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-bold text-slate-900">{cust.name}</td>
                          <td className="p-4 text-slate-700 font-semibold">{cust.email}</td>
                          <td className="p-4 font-mono font-semibold">{cust.phone}</td>
                          <td className="p-4 text-center font-bold text-[#c5a880]">{cust.events}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${cust.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : cust.status === 'Lead' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-slate-500/10 text-slate-600 border border-slate-500/10'}`}>
                              {cust.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="max-w-xl flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCustomerSubView('list')} className="text-slate-700 hover:text-slate-900 text-xs font-bold underline cursor-pointer">
                    ← Back to Customers
                  </button>
                  <h1 className="text-2xl font-extrabold text-slate-900">Add New Customer</h1>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newCustName) {
                    try {
                      const res = await apiClient.post('/dashboard/customers', { name: newCustName, email: newCustEmail || 'n/a', phone: newCustPhone || 'n/a', totalEvents: 0, status: 'Active' });
                      setCustomers([res.data, ...customers]);
                      setNewCustName(''); setNewCustEmail(''); setNewCustPhone('');
                      setCustomerSubView('list');
                      setSuccessMsg('Customer added successfully!');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg('Failed to add customer');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Full Name</label>
                    <input type="text" required value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="Yashvi Patel" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Email Address</label>
                    <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} placeholder="yashvi@gmail.com" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Mobile Phone</label>
                    <input type="tel" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="9876543210" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    Save Customer Profile
                  </button>
                </form>
              </div>
            )}
          </div>
    </div>
  );
}
