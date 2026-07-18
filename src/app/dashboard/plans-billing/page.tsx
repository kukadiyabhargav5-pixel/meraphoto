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
    <div className="flex-1 overflow-y-auto bg-slate-50/50 text-black p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
      <div className="flex flex-col gap-8 w-full max-w-5xl bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-200 animate-fade-in">
        
        <div className="text-center mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plans & Subscriptions</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Manage your studio's billing and current plan.</p>
        </div>
        
        {/* Active Plan Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#c5a880]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10">
            <span className="text-[10px] text-[#c5a880] font-extrabold uppercase tracking-widest bg-[#c5a880]/10 px-3 py-1.5 rounded-lg border border-[#c5a880]/20 shadow-sm">
              Active Plan
            </span>
            <h3 className="text-3xl font-black mt-5 text-white tracking-tight">{studio.subscriptionPlan || 'BASIC'}</h3>
            <p className="text-xs text-slate-400 font-semibold mt-2 tracking-wide flex items-center gap-1.5">
              Status: <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {studio.subscriptionStatus || 'ACTIVE'}</span>
            </p>
          </div>
          
          <div className="relative z-10">
            {(studio.subscriptionPlan && studio.subscriptionPlan !== 'BASIC') && studio.subscriptionStatus !== 'CANCELLED' && studio.subscriptionStatus !== 'INACTIVE' ? (
              <button onClick={handleCancelSub} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-3.5 rounded-xl border border-rose-500/20 text-xs font-extrabold transition-all cursor-pointer shadow-sm">
                Cancel Subscription
              </button>
            ) : (
              <button onClick={() => setActiveTab('billing')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-6 py-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_20px_rgba(197,168,128,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                Upgrade Subscription
              </button>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          {[
            { name: 'BASIC', price: '₹3,500/yr', desc: 'Store 50,000 photos, 10 videos, branding.' },
            { name: 'STANDARD', price: '₹7,900/yr', desc: 'Store 1,50,000 photos, 100 videos, watermark.' },
            { name: 'ESSENTIAL', price: '₹15,900/yr', desc: 'Store 3,00,000 photos, 200 videos, portfolio.' },
            { name: 'PREMIUM', price: '₹31,900/yr', desc: 'Store 7,50,000 photos, 500 videos, digital album.' }
          ].map((p) => (
            <div key={p.name} className={`relative bg-white p-7 rounded-3xl flex flex-col justify-between h-[300px] border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${studio.subscriptionPlan === p.name ? 'border-[#c5a880] shadow-lg ring-4 ring-[#c5a880]/10 bg-[#c5a880]/[0.02]' : 'border-slate-200 shadow-sm'}`}>
              {studio.subscriptionPlan === p.name && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c5a880] text-[#09090b] text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  YOUR PLAN
                </div>
              )}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 tracking-widest uppercase">{p.name}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{p.price.split('/')[0]}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">/{p.price.split('/')[1]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-5 leading-relaxed font-semibold pr-2">{p.desc}</p>
              </div>
              
              {studio.subscriptionPlan === p.name ? (
                <span className="w-full text-center py-3 rounded-xl bg-[#c5a880]/10 text-[#b59a72] border border-[#c5a880]/20 text-[11px] font-extrabold shadow-inner">
                  Current Plan
                </span>
              ) : (
                <button onClick={() => handleSubscribe(p.name)} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 py-3 rounded-xl text-[11px] font-extrabold text-slate-700 transition-all cursor-pointer shadow-sm hover:shadow">
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
