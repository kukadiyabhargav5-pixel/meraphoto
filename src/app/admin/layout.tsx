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
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { href: '/admin/tickets', icon: <LifeBuoy className="w-5 h-5" />, label: 'Support Tickets' },
        { href: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
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
              MARA <span className="text-gradient-gold">ADMIN</span>
            </h1>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Control Panel</div>
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

          <button onClick={async () => {
            await logout();
            router.push('/auth/login');
          }} className="flex items-center gap-3 px-3 py-2.5 bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 rounded-xl transition-all group border-none">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-[13px]">Logout</span>
          </button>
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

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/30 hover:shadow-lg hover:shadow-[#c5a880]/5 transition-all duration-300 relative">
              <Bell className="w-[18px] h-[18px]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-black text-white">3</span>
              </div>
            </button>

            <div className="w-[1px] h-8 bg-slate-200" />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-bold text-slate-800 leading-none">Super Admin</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mara Photo System</div>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                  style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#c5a880' }}
                >
                  SA
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#f0f2f5]" />
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
