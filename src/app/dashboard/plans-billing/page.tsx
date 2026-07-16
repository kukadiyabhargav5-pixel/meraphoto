'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';


export default function PlansBillingPage() {
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

  const [billingCycle, setBillingCycle] = useState('monthly');
  const handleCancelSub = () => { setSuccessMsg("Subscription cancelled (Dummy)"); };
  const handleSubscribe = (plan: string) => { setSuccessMsg("Subscribed to " + plan + " (Dummy)"); };
  const setActiveTab = (tab: string) => {};

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-900">Plans & Subscriptions</h1>
            
            <div className=" bg-white border border-[#c5a880] p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-[#c5a880] font-bold uppercase tracking-widest">Active Plan</span>
                <h3 className="text-xl font-bold mt-1 text-slate-900">{studio.subscriptionPlan || 'BASIC'}</h3>
                <p className="text-sm text-slate-700 font-medium mt-1">Status: <strong className="text-emerald-400">{studio.subscriptionStatus || 'ACTIVE'}</strong></p>
              </div>
              
              {(studio.subscriptionPlan && studio.subscriptionPlan !== 'BASIC') && studio.subscriptionStatus !== 'CANCELLED' && studio.subscriptionStatus !== 'INACTIVE' ? (
                <button onClick={handleCancelSub} className="bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 px-4 py-2.5 rounded-xl border border-rose-500/20 text-xs font-bold transition-all cursor-pointer">
                  Cancel Subscription
                </button>
              ) : (
                <button onClick={() => setActiveTab('billing')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Upgrade Subscription
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'BASIC', price: '₹3,500/yr', desc: 'Store 50,000 photos, 10 videos, branding.' },
                { name: 'STANDARD', price: '₹7,900/yr', desc: 'Store 1,50,000 photos, 100 videos, watermark.' },
                { name: 'ESSENTIAL', price: '₹15,900/yr', desc: 'Store 3,00,000 photos, 200 videos, portfolio.' },
                { name: 'PREMIUM', price: '₹31,900/yr', desc: 'Store 7,50,000 photos, 500 videos, digital album.' }
              ].map((p) => (
                <div key={p.name} className={` bg-white p-5 rounded-2xl flex flex-col justify-between h-64 border border-slate-200 shadow-sm ${studio.subscriptionPlan === p.name ? 'border-[#c5a880] ring-1 ring-[#c5a880]/10' : ''}`}>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-wide">{p.name}</h4>
                    <span className="text-xl font-extrabold text-[#c5a880] mt-2 block font-mono">{p.price}</span>
                    <p className="text-[11px] text-slate-350 mt-2 leading-relaxed font-semibold">{p.desc}</p>
                  </div>
                  
                  {studio.subscriptionPlan === p.name ? (
                    <span className="w-full text-center py-2 rounded-lg bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/10 text-[10px] font-bold">
                      Current Plan
                    </span>
                  ) : (
                    <button onClick={() => handleSubscribe(p.name)} className="w-full bg-slate-50 hover:bg-white/[0.04] border border-slate-200 py-2 rounded-lg text-[10px] font-bold text-slate-200 transition-colors cursor-pointer">
                      Select Plan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
    </div>
  );
}
