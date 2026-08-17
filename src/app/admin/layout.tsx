'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Camera, FolderOpen, LifeBuoy, Settings, LogOut, ChevronRight, Bell, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email?.toLowerCase() === 'maraphoto303@gmail.com';

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (!isSuperAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${displayHours}:${mins} ${ampm}`);

      if (hours < 12) setGreeting('Good Morning');
      else if (hours < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf9f6] text-slate-800 font-poppins">
        <div className="w-10 h-10 border-3 border-[#c5a880]/30 border-t-[#c5a880] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Checking Administrator Privileges...</p>
      </div>
    );
  }

  const navSections = [
    {
      title: 'Overview',
      links: [
        { href: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
      ],
    },
    {
      title: 'Management',
      links: [
        { href: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Users' },
        { href: '/admin/studios', icon: <Camera className="w-5 h-5" />, label: 'Studios' },
        { href: '/admin/events', icon: <FolderOpen className="w-5 h-5" />, label: 'Events' },
      ],
    },
    {
      title: 'System',
      links: [
        { href: '/admin/queries', icon: <LifeBuoy className="w-5 h-5" />, label: 'Studio Queries' },
        { href: '/admin/contacts', icon: <LifeBuoy className="w-5 h-5" />, label: 'Contact Queries' },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-poppins selection:bg-[#c5a880] selection:text-white">
      {/* ─── Mobile Overlay ─── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside 
        className={`fixed inset-y-0 left-0 lg:static w-[280px] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          background: 'linear-gradient(180deg, #0c0e1a 0%, #131629 40%, #0f172a 100%)',
        }}
      >
        {/* Sidebar subtle glow */}
        <div className="absolute top-0 right-0 w-full h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(197,168,128,0.08) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="px-7 pt-8 pb-6 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative"
            style={{ background: 'linear-gradient(135deg, #c5a880, #a8875e)' }}
          >
            <span className="text-white text-lg font-black leading-none">M</span>
            <div className="absolute inset-0 rounded-xl" style={{ boxShadow: '0 0 20px rgba(197,168,128,0.3)' }} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              MARA <span className="text-gradient-gold">PHOTO</span>
            </h1>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Admin Panel</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 admin-scroll">
          {navSections.map((section, sIdx) => (
            <div key={section.title} className={sIdx > 0 ? 'mt-7' : ''}>
              <div className="text-[10px] font-black text-slate-500/70 uppercase tracking-[0.2em] mb-3 px-3 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-slate-700" />
                {section.title}
              </div>
              <div className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                  const isDashboardActive = link.href === '/admin' && pathname === '/admin';
                  const active = isDashboardActive || isActive;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`sidebar-link flex items-center justify-between px-3 py-2.5 rounded-xl group
                        ${active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="sidebar-active-indicator"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`transition-all duration-300 ${active ? 'text-[#c5a880]' : 'text-slate-500 group-hover:text-[#c5a880]'}`}>
                          {link.icon}
                        </div>
                        <span className="font-semibold text-[13px] tracking-wide">{link.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 relative z-10
                        ${active ? 'text-[#c5a880] opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}
                      `} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 pb-6 pt-3 border-t border-white/[0.06]">
          {/* Pro Badge */}
          <div className="mx-3 mb-4 p-3 rounded-xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(197,168,128,0.12), rgba(197,168,128,0.04))' }}
          >
            <div className="flex items-center gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-[#c5a880]" />
              <span className="text-xs font-bold text-[#c5a880]">Mara Pro Active</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 relative z-10">Full admin access enabled</div>
          </div>
          {/* User Profile & Logout */}
          <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-2xl border border-white/[0.05] hover:bg-white/[0.08] transition-all duration-300 group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex flex-col min-w-0 mr-2">
                <span className="text-sm font-bold text-slate-200 truncate">{user?.name || 'Admin'}</span>
                <span className="text-[9px] text-[#c5a880] font-black uppercase tracking-widest truncate mt-0.5">{user?.role?.replace('_', ' ') || 'SUPER ADMIN'}</span>
              </div>
            </div>
            
            <button onClick={async () => {
              await logout();
              router.push('/auth/login');
            }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 group/btn shrink-0" title="Logout">
              <LogOut className="w-4.5 h-4.5 group-hover/btn:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Floating Orbs */}
        <div className="admin-orb admin-orb-1" />
        <div className="admin-orb admin-orb-2" />
        <div className="admin-orb admin-orb-3" />

        {/* Header */}
        <header className="h-[72px] border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between z-10 sticky top-0 shrink-0"
          style={{
            background: 'rgba(240,242,245,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] font-bold text-slate-800"
              >
                {greeting}, <span className="text-gradient-gold font-black">Super Admin</span>
              </motion.div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse-green" />
                System running • {currentTime}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-[1] admin-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
