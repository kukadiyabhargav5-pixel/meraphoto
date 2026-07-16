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


export default function PaymentQRPage() {
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

  const [qrAmount, setQrAmount] = useState('');
  const [qrNote, setQrNote] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 max-w-xl bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-md animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Studio UPI Payment QR</h1>
              <p className="text-xs text-slate-600 mt-1 font-semibold font-poppins">Enable direct client scan-to-pay via PhonePe, Google Pay, Paytm, or BHIM.</p>
            </div>
            
            <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-[#c5a880]/20 shadow-inner w-72 mx-auto mt-4">
              <span className="text-[9px] text-[#09090b] font-black uppercase tracking-widest mb-3 font-poppins">Scan & Pay Directly</span>
              
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('upi://pay?pa=maraphoto@paytm&pn=Mara%20Photo%20Studio&cu=INR')}`}
                  alt="UPI QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold mt-4 font-mono">maraphoto@paytm</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5 font-poppins">Verified Merchant Account</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg('UPI configuration saved successfully!'); }} className="flex flex-col gap-4 text-left mt-6 font-poppins">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-350 font-bold uppercase tracking-wider">Your Merchant UPI ID</label>
                <input type="text" required defaultValue="maraphoto@paytm" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-slate-350 font-bold uppercase tracking-wider">Business Display Name</label>
                <input type="text" required defaultValue="Mara Photo Studio" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" />
              </div>
              <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs transition-colors shadow-md cursor-pointer">
                Update UPI Configuration
              </button>
            </form>
          </div>
    </div>
  );
}
