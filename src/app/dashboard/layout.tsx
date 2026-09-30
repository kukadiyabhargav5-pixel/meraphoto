'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, Briefcase,
  Menu, X, UserPlus, ScanLine, Lock, Shield, Sparkles
} from 'lucide-react';
import { DashboardProvider, useDashboard } from './DashboardContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/AuthContext';
import ChatbotWidget from '../../components/ChatbotWidget';
import toast from 'react-hot-toast';

const NAV_SECTIONS = [
  {
    category: 'Dashboard',
    links: [{ path: '', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    category: 'Events',
    links: [
      { path: '/events', label: 'Events Management', icon: BookOpen },
      { path: '/create-event', label: 'Create Event', icon: Plus },
      { path: '/portfolios', label: 'Portfolios', icon: Briefcase },
      { path: '/gallery-visitors', label: 'Gallery Visitors', icon: UserPlus },
    ],
  },
  {
    category: 'Management',
    links: [
      { path: '/customers', label: 'Customers', icon: Users },
      { path: '/team', label: 'Team', icon: Users2 },
      { path: '/quotation', label: 'Quotation', icon: FileText },
      { path: '/bill', label: 'Bill', icon: Receipt },
    ],
  },
  {
    category: 'More',
    links: [
      { path: '/payment-qr', label: 'Payment QR', icon: QrCode },
      { path: '/calendar', label: 'Calendar', icon: Calendar },
      { path: '/profile', label: 'Profile', icon: User },
    ],
  },
  {
    category: 'System',
    links: [
      { path: '/queries', label: 'Queries', icon: HelpCircle },
      { path: '/studio-settings', label: 'Studio Settings', icon: Settings },
      { path: '/studio-branding', label: 'Studio Branding', icon: Settings },
      { path: '/plans-billing', label: 'Plans & Billing', icon: CreditCard },
      { path: '/support-help', label: 'Support Help', icon: HelpCircle },
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
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';
  const isAdminDashboard = pathname.startsWith('/admin-dashboard') || (isSuperAdmin && !pathname.startsWith('/dashboard/'));
  const basePrefix = isAdminDashboard ? '/admin-dashboard' : '/dashboard';

  const studioPlanKey = (studio?.subscriptionPlan || authStudio?.subscriptionPlan || '').toUpperCase();
  const currentPlan = studioPlanKey || (isSuperAdmin ? 'PREMIUM' : 'BASIC');
  const isBasicPlan = currentPlan === 'BASIC';
  const isStartupPlan = currentPlan === 'STARTUP' || currentPlan === 'STARTER';

  // When Basic Plan is active: ONLY Overview and Plans & Billing are accessible!
  const allowedBasicRoutes = [
    '/dashboard',
    '/dashboard/plans-billing',
    '/admin-dashboard',
    '/admin-dashboard/plans-billing'
  ];

  // When Startup Plan is active: ONLY Create Event, Events Management, Plans & Billing, Quotation, and Profile are enabled!
  const allowedStartupRoutes = [
    '/dashboard/plans-billing',
    '/dashboard/create-event',
    '/dashboard/events',
    '/dashboard/quotation',
    '/dashboard/profile',
    '/admin-dashboard/plans-billing',
    '/admin-dashboard/create-event',
    '/admin-dashboard/events',
    '/admin-dashboard/quotation',
    '/admin-dashboard/profile'
  ];

  const isRouteAllowed = (href: string) => {
    if (isBasicPlan) {
      return allowedBasicRoutes.includes(href);
    }
    if (isStartupPlan) {
      return allowedStartupRoutes.some(r => href === r || href.startsWith(`${r}/`));
    }
    // Standard, Essential, and Premium: ALL buttons enabled!
    return true;
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (!isRouteAllowed(href)) {
      e.preventDefault();
      router.push(`${basePrefix}/plans-billing`);
      toast.error(isBasicPlan ? 'Please upgrade your plan from Basic to access this feature.' : 'Please upgrade to Standard or higher to unlock this feature.', {
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

  const linkClass = (href: string, isPlansBilling: boolean = false) => {
    const isActive = href === basePrefix 
      ? (pathname === basePrefix || pathname === `${basePrefix}/`) 
      : (pathname === href || pathname.startsWith(`${href}/`));
    
    const isDisabled = !isRouteAllowed(href);
    
    if (isDisabled) {
      return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 relative group overflow-hidden opacity-40 cursor-not-allowed text-slate-500 bg-transparent select-none`;
    }

    if (isPlansBilling) {
      return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 relative group overflow-hidden ${
        isActive 
          ? 'bg-yellow-400/10 text-yellow-400' 
          : 'text-yellow-400 hover:text-yellow-300 hover:bg-white/5'
      }`;
    }

    return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 relative group overflow-hidden ${
      isActive 
        ? 'bg-[#c5a880]/10 text-[#c5a880]' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center w-full py-4 mb-4 px-2 shrink-0 h-16 max-h-16 overflow-hidden">
        <Link href={basePrefix} className="cursor-pointer flex items-center justify-center h-full max-w-[150px]" onClick={onLinkClick}>
          <img
            src={logoState}
            alt="Studio Logo"
            style={{ maxHeight: '42px', maxWidth: '140px', height: '42px', width: 'auto' }}
            className={`max-h-10 h-10 w-auto max-w-[140px] object-contain shrink-0 ${logoState === '/logo.png' ? 'filter invert' : ''}`}
          />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-start">
        <nav className="flex flex-col gap-1">
          {NAV_SECTIONS.flatMap((section) => section.links).map(({ path, label, icon: Icon }) => {
            const href = path ? `${basePrefix}${path}` : basePrefix;
            const isLocked = !isRouteAllowed(href);
            const isPlansBilling = path === '/plans-billing';
            return (
              <Link
                key={path || 'overview'}
                prefetch={!isLocked}
                href={isLocked ? `${basePrefix}/plans-billing` : href}
                className={linkClass(href, isPlansBilling)}
                onClick={(e) => handleLinkClick(e, href)}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isPlansBilling ? 'text-yellow-400' : ''}`} />
                <span className={`flex-1 truncate ${isPlansBilling ? 'text-yellow-400 font-bold' : ''}`}>{label}</span>
                {isLocked && <Lock className="h-3 w-3 text-amber-400/70 shrink-0 ml-auto" />}
              </Link>
            );
          })}

          {/* Generate QR Code Link */}
          {(() => {
            const qrHref = `${basePrefix}/generate-qr`;
            const isLocked = !isRouteAllowed(qrHref);
            return (
              <Link
                href={isLocked ? `${basePrefix}/plans-billing` : qrHref}
                className={linkClass(qrHref)}
                onClick={(e) => handleLinkClick(e, qrHref)}
              >
                <ScanLine className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Generate QR Code</span>
                {isLocked && <Lock className="h-3 w-3 text-amber-400/70 shrink-0 ml-auto" />}
              </Link>
            );
          })()}
        </nav>
      </div>

      {/* VIP Admin Switcher for Super Admins */}
      {isSuperAdmin && (
        <div className="pt-2 px-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500/15 via-[#c5a880]/20 to-amber-500/10 text-amber-300 hover:text-white hover:border-[#c5a880]/50 transition-all border border-[#c5a880]/30 shadow-sm group"
          >
            <Shield className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="flex-1 truncate font-black">Super Admin Panel</span>
          </Link>
        </div>
      )}

      {/* User + Logout (Fixed at bottom) */}
      <div className="border-t border-white/5 pt-4 mt-2 shrink-0">
        {isSuperAdmin && (
          <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-black text-emerald-400 tracking-wider flex items-center justify-center gap-1">
              👑 Unlimited Free Admin
            </span>
          </div>
        )}
        <div className="flex justify-between items-center px-1">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[9px] text-[#c5a880] font-black tracking-widest uppercase mt-0.5">
              {isSuperAdmin ? '👑 Super Admin' : (user?.role === 'STUDIO_OWNER' ? 'Studio Owner' : user?.role || 'Admin')}
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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';
  const isAdminDashboard = pathname.startsWith('/admin-dashboard') || (isSuperAdmin && !pathname.startsWith('/dashboard/'));
  const basePrefix = isAdminDashboard ? '/admin-dashboard' : '/dashboard';

  const studioPlanKey = (studio?.subscriptionPlan || authStudio?.subscriptionPlan || '').toUpperCase();
  const currentPlan = studioPlanKey || (isSuperAdmin ? 'PREMIUM' : 'BASIC');
  const isBasicPlan = currentPlan === 'BASIC';
  const isStartupPlan = currentPlan === 'STARTUP' || currentPlan === 'STARTER';

  const allowedBasicRoutes = [
    '/dashboard',
    '/dashboard/plans-billing',
    '/admin-dashboard',
    '/admin-dashboard/plans-billing'
  ];

  const allowedStartupRoutes = [
    '/dashboard/plans-billing',
    '/dashboard/create-event',
    '/dashboard/events',
    '/dashboard/quotation',
    '/dashboard/profile',
    '/admin-dashboard/plans-billing',
    '/admin-dashboard/create-event',
    '/admin-dashboard/events',
    '/admin-dashboard/quotation',
    '/admin-dashboard/profile'
  ];

  const isRouteAllowed = (href: string) => {
    if (isBasicPlan) {
      return allowedBasicRoutes.includes(href);
    }
    if (isStartupPlan) {
      return allowedStartupRoutes.some(r => href === r || href.startsWith(`${r}/`));
    }
    return true;
  };

  // Global click interceptor to ensure studio admin mode routes stay under /admin-dashboard/*
  const handleGlobalLinkCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdminDashboard) return;

    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Do not intercept external links, anchors, super admin panel, or guest gallery
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('/admin-dashboard') ||
      href === '/admin' ||
      href.startsWith('/admin/') ||
      href.startsWith('/e/')
    ) {
      return;
    }

    if (href === '/dashboard' || href === '/dashboard/') {
      e.preventDefault();
      e.stopPropagation();
      router.push('/admin-dashboard');
      return;
    }

    if (href.startsWith('/dashboard/')) {
      e.preventDefault();
      e.stopPropagation();
      const newHref = href.replace(/^\/dashboard/, '/admin-dashboard');
      router.push(newHref);
      return;
    }
  };

  // Auto-redirect to /plans-billing if user navigates to any disabled route on Basic or Startup plan
  useEffect(() => {
    if (isStartupPlan && (pathname === basePrefix || pathname === `${basePrefix}/`)) {
      router.replace(`${basePrefix}/events`);
      return;
    }
    if (!isRouteAllowed(pathname)) {
      router.replace(`${basePrefix}/plans-billing`);
      toast.error(isBasicPlan ? 'Please upgrade your plan from Basic to access this feature.' : 'Please upgrade to Standard or higher to unlock this feature.', {
        duration: 3500,
        icon: '🔒'
      });
    }
  }, [isBasicPlan, isStartupPlan, pathname, router, basePrefix]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen bg-[#f8f7f4] text-[#09090b] flex overflow-hidden" onClickCapture={handleGlobalLinkCapture}>

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
        <header className="lg:hidden h-14 max-h-14 min-h-[56px] flex items-center justify-between px-3 sm:px-4 bg-[#0c0c0e] border-b border-white/5 sticky top-0 z-30 overflow-hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 shrink-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={basePrefix} className="flex-1 h-full flex items-center justify-center overflow-hidden px-2 py-1 max-w-[140px] mx-auto">
            <img
              src={logoState}
              alt="Studio Logo"
              style={{ maxHeight: '32px', maxWidth: '120px', height: '32px', width: 'auto' }}
              className={`max-h-8 h-8 w-auto max-w-[120px] object-contain shrink-0 ${logoState === '/logo.png' ? 'filter invert' : ''}`}
            />
          </Link>
          <Link
            href={`${basePrefix}/plans-billing`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#c5a880]/25 to-amber-500/15 border border-amber-400/50 text-amber-300 text-[11px] font-extrabold hover:text-white transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Plans</span>
          </Link>
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
