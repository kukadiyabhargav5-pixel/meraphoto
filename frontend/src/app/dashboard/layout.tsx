'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, Briefcase,
  Menu, X, UserPlus, ScanLine, Lock
} from 'lucide-react';
import { DashboardProvider, useDashboard } from './DashboardContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/AuthContext';
import ChatbotWidget from '../../components/ChatbotWidget';
import toast from 'react-hot-toast';

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
      { href: '/dashboard/queries', label: 'Queries', icon: HelpCircle },
      { href: '/dashboard/studio-settings', label: 'Studio Settings', icon: Settings },
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
  const router = useRouter();
  const { studio } = useDashboard();
  const { studio: authStudio } = useAuth();
  const [logoState, setLogoState] = useState<string>(studio?.logoUrl || authStudio?.logoUrl || '/logo.png');

  useEffect(() => {
    if (studio?.logoUrl) setLogoState(studio.logoUrl);
    else if (authStudio?.logoUrl) setLogoState(authStudio.logoUrl);
  }, [studio?.logoUrl, authStudio?.logoUrl]);

  useEffect(() => {
    const handleLogoUpdated = (e: any) => {
      if (e?.detail?.logoUrl) {
        setLogoState(e.detail.logoUrl);
      }
    };
    window.addEventListener('studio_logo_updated', handleLogoUpdated);
    return () => window.removeEventListener('studio_logo_updated', handleLogoUpdated);
  }, []);
  
  const currentPlan = (studio?.subscriptionPlan || authStudio?.subscriptionPlan || 'BASIC').toUpperCase();
  const isBasicPlan = currentPlan === 'BASIC' || currentPlan === 'STARTER';

  // When Basic Plan is active: ONLY Overview and Plans & Billing are accessible!
  const allowedBasicRoutes = [
    '/dashboard',
    '/dashboard/plans-billing'
  ];

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (isBasicPlan && !allowedBasicRoutes.includes(href)) {
      e.preventDefault();
      router.push('/dashboard/plans-billing');
      toast.error('Please upgrade your plan from Basic to access this feature.', {
        duration: 3500,
        icon: '🔒'
      });
      if (onLinkClick) onLinkClick();
      return;
    }
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const linkClass = (href: string) => {
    const isActive = href === '/dashboard' 
      ? pathname === href 
      : (pathname === href || pathname.startsWith(`${href}/`));
    
    const isDisabled = isBasicPlan && !allowedBasicRoutes.includes(href);
    
    if (isDisabled) {
      return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 relative group overflow-hidden opacity-40 cursor-not-allowed text-slate-500 bg-transparent select-none`;
    }

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
          <img src={logoState} alt="Studio Logo" className={`max-h-20 w-auto object-contain ${logoState === '/logo.png' ? 'filter invert' : ''}`} />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-start">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.flatMap((section) => section.links).map(({ href, label, icon: Icon }) => {
            const isLocked = isBasicPlan && !allowedBasicRoutes.includes(href);
            return (
              <Link
                key={href}
                prefetch={!isLocked}
                href={isLocked ? '/dashboard/plans-billing' : href}
                className={linkClass(href)}
                onClick={(e) => handleLinkClick(e, href)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {isLocked && <Lock className="h-3 w-3 text-amber-400/70 shrink-0 ml-auto" />}
              </Link>
            );
          })}

          {/* Generate QR Code Link */}
          {(() => {
            const isLocked = isBasicPlan && !allowedBasicRoutes.includes('/dashboard/generate-qr');
            return (
              <Link
                href={isLocked ? '/dashboard/plans-billing' : '/dashboard/generate-qr'}
                className={linkClass('/dashboard/generate-qr')}
                onClick={(e) => handleLinkClick(e, '/dashboard/generate-qr')}
              >
                <ScanLine className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Generate QR Code</span>
                {isLocked && <Lock className="h-3 w-3 text-amber-400/70 shrink-0 ml-auto" />}
              </Link>
            );
          })()}
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
  const { user, logout, studio: authStudio } = useAuth();
  const { studio } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoState, setLogoState] = useState<string>(studio?.logoUrl || authStudio?.logoUrl || '/logo.png');

  useEffect(() => {
    if (studio?.logoUrl) setLogoState(studio.logoUrl);
    else if (authStudio?.logoUrl) setLogoState(authStudio.logoUrl);
  }, [studio?.logoUrl, authStudio?.logoUrl]);

  useEffect(() => {
    const handleLogoUpdated = (e: any) => {
      if (e?.detail?.logoUrl) {
        setLogoState(e.detail.logoUrl);
      }
    };
    window.addEventListener('studio_logo_updated', handleLogoUpdated);
    return () => window.removeEventListener('studio_logo_updated', handleLogoUpdated);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const currentPlan = (studio?.subscriptionPlan || authStudio?.subscriptionPlan || 'BASIC').toUpperCase();
  const isBasicPlan = currentPlan === 'BASIC' || currentPlan === 'STARTER';

  const allowedBasicRoutes = [
    '/dashboard',
    '/dashboard/plans-billing'
  ];

  // Auto-redirect to /dashboard/plans-billing if user navigates to any disabled route on Basic plan
  useEffect(() => {
    if (isBasicPlan && !allowedBasicRoutes.includes(pathname)) {
      router.replace('/dashboard/plans-billing');
      toast.error('Please upgrade your plan from Basic to access this feature.', {
        duration: 3500,
        icon: '🔒'
      });
    }
  }, [isBasicPlan, pathname, router]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen bg-[#f8f7f4] text-[#09090b] flex overflow-hidden">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex w-64 bg-[#0c0c0e] text-slate-100 flex-col justify-between p-6 shrink-0 border-r border-white/5 shadow-2xl sticky top-0 h-screen">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== MOBILE SIDEBAR DRAWER ===== */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] w-72 max-w-[85vw] bg-[#0c0c0e] text-slate-100 flex flex-col p-5 sm:p-6 z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3.5 right-3.5 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Close menu"
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
        <header className="lg:hidden flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0c0c0e] border-b border-white/5 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 shrink-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="flex-1 flex justify-center overflow-hidden px-2">
            <img src={logoState} alt="Studio Logo" className={`h-8 w-auto max-w-[150px] xs:max-w-[180px] object-contain ${logoState === '/logo.png' ? 'filter invert' : ''}`} />
          </Link>
          <div className="w-11 shrink-0" /> {/* spacer to balance the menu button */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8f7f4]">
          {children}
        </div>
        
        {/* AI Chatbot Widget */}
        <ChatbotWidget />
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
