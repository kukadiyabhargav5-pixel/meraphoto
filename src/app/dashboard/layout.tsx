'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, Briefcase
} from 'lucide-react';
import { DashboardProvider } from './DashboardContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/AuthContext';

function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // A helper to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
      isActive(path)
        ? 'bg-[#c5a880] text-[#09090b] shadow-md'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white text-black flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0c0e] text-slate-100 flex flex-col justify-between p-6 shrink-0 border-r border-slate-200 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="flex items-center justify-center w-full py-2">
              <Link href="/" className="cursor-pointer">
                <img src="/logo.png" alt="Mara Photo Logo" className="max-h-11 w-auto object-contain filter invert" />
              </Link>
            </div>
          </div>

          <nav className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {/* Category: DASHBOARD */}
            <div>
              <span className="px-4 text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">Dashboard</span>
              <Link prefetch={true} href="/dashboard" className={linkClass('/dashboard')}>
                <LayoutDashboard className="h-4.5 w-4.5" /> Overview
              </Link>
            </div>

            {/* Category: EVENTS */}
            <div className="flex flex-col gap-1">
              <span className="px-4 text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">Events</span>
              <Link prefetch={true} href="/dashboard/events" className={linkClass('/dashboard/events')}>
                <BookOpen className="h-4.5 w-4.5" /> Events Management
              </Link>
              <Link prefetch={true} href="/dashboard/create-event" className={linkClass('/dashboard/create-event')}>
                <Plus className="h-4.5 w-4.5" /> Create Event
              </Link>
              <Link prefetch={true} href="/dashboard/portfolios" className={linkClass('/dashboard/portfolios')}>
                <Briefcase className="h-4.5 w-4.5" /> Portfolios
              </Link>
            </div>

            {/* Category: MANAGEMENT */}
            <div className="flex flex-col gap-1">
              <span className="px-4 text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">Management</span>
              <Link prefetch={true} href="/dashboard/customers" className={linkClass('/dashboard/customers')}>
                <Users className="h-4.5 w-4.5" /> Customers
              </Link>
              <Link prefetch={true} href="/dashboard/team" className={linkClass('/dashboard/team')}>
                <Users2 className="h-4.5 w-4.5" /> Team
              </Link>
              <Link prefetch={true} href="/dashboard/quotation" className={linkClass('/dashboard/quotation')}>
                <FileText className="h-4.5 w-4.5" /> Quotation
              </Link>
              <Link prefetch={true} href="/dashboard/bill" className={linkClass('/dashboard/bill')}>
                <Receipt className="h-4.5 w-4.5" /> Bill
              </Link>
            </div>

            {/* Category: MORE */}
            <div className="flex flex-col gap-1">
              <span className="px-4 text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">More</span>
              <Link prefetch={true} href="/dashboard/payment-qr" className={linkClass('/dashboard/payment-qr')}>
                <QrCode className="h-4.5 w-4.5" /> Payment QR
              </Link>
              <Link prefetch={true} href="/dashboard/calendar" className={linkClass('/dashboard/calendar')}>
                <Calendar className="h-4.5 w-4.5" /> Calendar
              </Link>
              <Link prefetch={true} href="/dashboard/profile" className={linkClass('/dashboard/profile')}>
                <User className="h-4.5 w-4.5" /> Profile
              </Link>
            </div>

            {/* Category: SYSTEM */}
            <div className="flex flex-col gap-1">
              <span className="px-4 text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1.5">System</span>
              <Link prefetch={true} href="/dashboard/studio-branding" className={linkClass('/dashboard/studio-branding')}>
                <Settings className="h-4.5 w-4.5" /> Studio Branding
              </Link>
              <Link prefetch={true} href="/dashboard/plans-billing" className={linkClass('/dashboard/plans-billing')}>
                <CreditCard className="h-4.5 w-4.5" /> Plans & Billing
              </Link>
              <Link prefetch={true} href="/dashboard/support-help" className={linkClass('/dashboard/support-help')}>
                <HelpCircle className="h-4.5 w-4.5" /> Support Help
              </Link>
            </div>
          </nav>
        </div>

        <div className="border-t border-white/5 pt-4 mt-6">
          <div className="flex justify-between items-center px-1">
            <div>
              <p className="text-xs font-bold text-slate-200 truncate max-w-[140px]">{user?.name || 'User'}</p>
              <p className="text-[9px] text-[#c5a880] font-black tracking-widest uppercase mt-0.5">{user?.role === 'STUDIO_OWNER' ? 'Studio Owner' : user?.role || 'Admin'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:text-white transition-colors cursor-pointer bg-red-500/10 rounded-lg hover:bg-red-500" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      {children}
      
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <DashboardSidebar>
          {children}
        </DashboardSidebar>
      </DashboardProvider>
    </ProtectedRoute>
  );
}
