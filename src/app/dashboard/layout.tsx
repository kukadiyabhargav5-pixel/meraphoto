'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, Briefcase,
  Menu, X, UserPlus
} from 'lucide-react';
import { DashboardProvider, useDashboard } from './DashboardContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/AuthContext';

const NAV_ITEMS = [
  {
    category: 'Dashboard',
    links: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    category: 'Events',
    links: [
      { href: '/dashboard/events', label: 'Events Management', icon: BookOpen },
      { href: '/dashboard/create-event', label: 'Create Event', icon: Plus },
      { href: '/dashboard/portfolios', label: 'Portfolios', icon: Briefcase },
      { href: '/dashboard/gallery-visitors', label: 'Gallery Visitors', icon: UserPlus },
    ],
  },
  {
    category: 'Management',
    links: [
      { href: '/dashboard/customers', label: 'Customers', icon: Users },
      { href: '/dashboard/team', label: 'Team', icon: Users2 },
      { href: '/dashboard/quotation', label: 'Quotation', icon: FileText },
      { href: '/dashboard/bill', label: 'Bill', icon: Receipt },
    ],
  },
  {
    category: 'More',
    links: [
      { href: '/dashboard/payment-qr', label: 'Payment QR', icon: QrCode },
      { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
      { href: '/dashboard/profile', label: 'Profile', icon: User },
    ],
  },
  {
    category: 'System',
    links: [
      { href: '/dashboard/studio-branding', label: 'Studio Branding', icon: Settings },
      { href: '/dashboard/plans-billing', label: 'Plans & Billing', icon: CreditCard },
      { href: '/dashboard/support-help', label: 'Support Help', icon: HelpCircle },
    ],
  },
];

function SidebarContent({
  pathname,
  user,
  onLogout,
  onLinkClick,
}: {
  pathname: string;
  user: any;
  onLogout: () => void;
  onLinkClick?: () => void;
}) {
  const { studio } = useDashboard();
  const logoUrl = studio?.logoUrl || '/logo.png';
  
  const linkClass = (href: string) => {
    const isActive = href === '/dashboard' 
      ? pathname === href 
      : (pathname === href || pathname.startsWith(`${href}/`));
    
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 relative group overflow-hidden ${
      isActive 
        ? 'bg-[#c5a880]/10 text-[#c5a880]' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center w-full py-4 mb-6 px-2 shrink-0">
        <Link href="/dashboard" className="cursor-pointer" onClick={onLinkClick}>
          <img src={logoUrl} alt="Studio Logo" className={`max-h-20 w-auto object-contain ${!studio?.logoUrl ? 'filter invert' : ''}`} />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-start">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.flatMap((section) => section.links).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              prefetch={true}
              href={href}
              className={linkClass(href)}
              onClick={onLinkClick}
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* User + Logout (Fixed at bottom) */}
      <div className="border-t border-white/5 pt-4 mt-2 shrink-0">
        <div className="flex justify-between items-center px-1">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[9px] text-[#c5a880] font-black tracking-widest uppercase mt-0.5">
              {user?.role === 'STUDIO_OWNER' ? 'Studio Owner' : user?.role || 'Admin'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 shrink-0 text-red-400 hover:text-white transition-colors cursor-pointer bg-red-500/10 rounded-lg hover:bg-red-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { studio } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoUrl = studio?.logoUrl || '/logo.png';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="h-screen bg-white text-black flex overflow-hidden">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex w-64 bg-[#0c0c0e] text-slate-100 flex-col justify-between p-6 shrink-0 border-r border-slate-200 shadow-2xl sticky top-0 h-screen">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== MOBILE SIDEBAR DRAWER ===== */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0c0c0e] text-slate-100 flex flex-col p-6 z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0c0c0e] border-b border-white/5 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard">
            <img src={logoUrl} alt="Studio Logo" className={`h-7 w-auto object-contain ${!studio?.logoUrl ? 'filter invert' : ''}`} />
          </Link>
          <div className="w-9" /> {/* spacer */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

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
