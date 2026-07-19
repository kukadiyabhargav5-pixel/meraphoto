'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film, Edit,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsData, setEventsData] = useState([]);

  const [editingCust, setEditingCust] = useState<any>(null);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (cust: any) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        if (cust.source === 'EVENT') {
          await apiClient.delete(`/event/${cust._id}`);
          fetchEvents();
        } else {
          await apiClient.delete(`/dashboard/customers/${cust._id}`);
          setCustomers(customers.filter((c: any) => c._id !== cust._id));
        }
        setSuccessMsg('Record deleted successfully');
      } catch (err) {
        setErrorMsg('Failed to delete record');
      }
    }
  };

  const handleEdit = (cust: any) => {
    setEditingCust(cust);
    setNewCustName(cust.name);
    setNewCustEmail(cust.email === 'N/A' ? '' : cust.email);
    setNewCustPhone(cust.phone === 'N/A' ? '' : cust.phone);
    setCustomerSubView('edit');
  };

  const resetForm = () => {
    setEditingCust(null);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setCustomerSubView('list');
  };

  const uniqueCustomers: any[] = [];
  const seen = new Set();

  eventsData.forEach((ev: any) => {
    if(!ev.clientName) return;
    const key = `${ev.clientName}-${ev.clientEmail || ''}-${ev.clientMobile || ''}-${ev.name || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCustomers.push({
        _id: ev._id,
        source: 'EVENT',
        name: ev.clientName,
        email: ev.clientEmail || 'N/A',
        phone: ev.clientMobile || 'N/A',
        eventName: ev.name || 'N/A'
      });
    }
  });

  customers.forEach((cust: any) => {
    if(!cust.name) return;
    const exists = uniqueCustomers.some(u => u.phone === cust.phone && u.email === cust.email);
    if (!exists) {
      const key = `${cust.name}-${cust.email || ''}-${cust.phone || ''}--`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCustomers.push({
          _id: cust._id,
          source: 'CUSTOMER',
          name: cust.name,
          email: cust.email || 'N/A',
          phone: cust.phone || 'N/A',
          eventName: '-'
        });
      }
    }
  });

  const filteredCustomers = uniqueCustomers.filter((cust: any) => 
    cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.phone?.includes(searchQuery) ||
    cust.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {customerSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Customers Directory</h1>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Manage your client relationships, contact details, and bookings.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <input 
                        type="text" 
                         
                        className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] pr-8 shadow-sm transition-colors"
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
                    <button onClick={() => setCustomerSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto">
                      <Plus className="h-4 w-4" /> Add Customer
                    </button>
                  </div>
                </div>
                <div className="bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4 text-center">Customer Name</th>
                        <th className="p-4 text-center">Email</th>
                        <th className="p-4 text-center">Mobile</th>
                        <th className="p-4 text-center">Event Name</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {filteredCustomers.map((cust: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 text-center font-bold text-slate-900">{cust.name}</td>
                          <td className="p-4 text-center text-slate-700 font-semibold">{cust.email}</td>
                          <td className="p-4 text-center font-mono font-semibold text-slate-700">{cust.phone}</td>
                          <td className="p-4 text-center font-bold text-[#c5a880]">{cust.eventName}</td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handleEdit(cust)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-[#c5a880] hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(cust)} className="p-1.5 bg-rose-50 text-rose-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-rose-200 shadow-sm">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            No customers found.
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
                <button onClick={resetForm} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#c5a880] text-[11px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#c5a880] transition-all duration-300 shadow-sm hover:shadow group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Customers</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">
                      {customerSubView === 'edit' ? 'Edit Customer' : 'Add New Customer'}
                    </h1>
                  </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newCustName) {
                    try {
                      if (customerSubView === 'edit' && editingCust) {
                        if (editingCust.source === 'EVENT') {
                          await apiClient.put(`/event/${editingCust._id}`, {
                            clientName: newCustName,
                            clientEmail: newCustEmail,
                            clientMobile: newCustPhone
                          });
                          fetchEvents();
                        } else {
                          await apiClient.put(`/dashboard/customers/${editingCust._id}`, {
                            name: newCustName,
                            email: newCustEmail,
                            phone: newCustPhone
                          });
                          setCustomers(customers.map((c:any) => c._id === editingCust._id ? { ...c, name: newCustName, email: newCustEmail, phone: newCustPhone } : c));
                        }
                        setSuccessMsg('Record updated successfully!');
                      } else {
                        const res = await apiClient.post('/dashboard/customers', { name: newCustName, email: newCustEmail || 'n/a', phone: newCustPhone || 'n/a', totalEvents: 0, status: 'Active' });
                        setCustomers([...customers, res.data]);
                        setSuccessMsg('Customer added successfully!');
                      }
                      resetForm();
                    } catch (err) {
                      console.error(err);
                      setErrorMsg(customerSubView === 'edit' ? 'Failed to update record' : 'Failed to add customer');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Full Name</label>
                    <input type="text" required value={newCustName} onChange={(e) => setNewCustName(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Email Address</label>
                    <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Mobile Phone</label>
                    <input type="tel" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    {customerSubView === 'edit' ? 'Save Changes' : 'Save Customer Profile'}
                  </button>
                </form>
              </div>
              </div>
            )}
          </div>
    </div>
  );
}
