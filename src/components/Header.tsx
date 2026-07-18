'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera, ChevronDown, Menu, X, CirclePlus, FileText,
  Globe, QrCode, Clock, ScanFace, Heart, Briefcase,
  PartyPopper, GraduationCap, Calendar
} from 'lucide-react';

const featuresItems = [
  { label: 'Manage Event',                 href: '/features/manage-event',                 icon: CirclePlus },
  { label: 'Invoice Generator',            href: '/features/invoice-generator',            icon: FileText },
  { label: 'Photographer Portfolio',       href: '/features/photographer-portfolio',       icon: Globe },
  { label: 'Event QR Code Gallery',        href: '/features/event-qr-code-gallery',       icon: QrCode },
  { label: 'Event Booking',                href: '/features/event-booking',                icon: Clock },
  { label: 'Event Face Recognition',       href: '/features/event-face-recognition',      icon: ScanFace },
  { label: 'Wedding Website Template',     href: '/features/wedding-website-template',    icon: Heart },
];

const useCaseItems = [
  { label: 'Wedding Photography',                   href: '/use-cases/wedding-photography',              icon: Heart },
  { label: 'Corporate Photography',                 href: '/use-cases/corporate-photography',            icon: Briefcase },
  { label: 'Parties Photography',                   href: '/use-cases/parties-photography',              icon: PartyPopper },
  { label: 'School & College Event',                href: '/use-cases/school-college-event-photography', icon: GraduationCap },
  { label: 'Event Photography',                     href: '/use-cases/event-photography',                icon: Calendar },
];

function DropdownMenu({ items }: { items: { label: string; href: string; icon: React.ElementType }[] }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group/item hover:bg-[#faf9f6]"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-[#c5a880]/10 text-[#c5a880] group-hover/item:bg-[#c5a880] group-hover/item:text-white">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold font-poppins text-[#09090b]">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [useCasesOpen, setUseCasesOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener('authStateChanged', checkAuth);
    return () => {
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('studio');
    setUser(null);
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = '/';
  };

  return (
    <header className="bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e3d8c8]/30 fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Mara Photo Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 font-poppins">
            {/* Features Dropdown */}
            <div className="relative group py-2">
              <button className="flex items-center gap-1 text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors focus:outline-none cursor-pointer">
                Features
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform duration-200" aria-hidden="true" />
              </button>
              <DropdownMenu items={featuresItems} />
            </div>

            {/* Use Cases Dropdown */}
            <div className="relative group py-2">
              <button className="flex items-center gap-1 text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors focus:outline-none cursor-pointer">
                Use Cases
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform duration-200" aria-hidden="true" />
              </button>
              <DropdownMenu items={useCaseItems} />
            </div>

            <Link href="/pricing" className="text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors">Pricing</Link>
            <Link href="/blog"    className="text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors">Blog</Link>
            <Link href="/about"   className="text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors">About Us</Link>
            <Link href="/#contact" className="text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-colors">Contact</Link>
          </nav>          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-6 font-poppins">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-[15px] font-bold text-[#09090b] hover:text-[#c5a880] transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[15px] font-medium text-white bg-slate-900 hover:bg-[#c5a880] px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 border border-[#e3d8c8]/30 shadow-sm cursor-pointer"
                >
                  Sign Out ({user?.name ? user.name.split(' ')[0] : 'User'})
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[15px] font-medium text-[#09090b] hover:text-[#c5a880] transition-all duration-300">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-[15px] font-medium text-white bg-[#09090b] hover:bg-[#c5a880] px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 border border-[#e3d8c8]/30 shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          {/* Mobile Hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              className="p-2 text-gray-600 hover:bg-slate-50 rounded-xl transition-all"
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* Features accordion */}
            <div>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all"
                onClick={() => setFeaturesOpen(!featuresOpen)}
              >
                <span>Features</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              {featuresOpen && (
                <div className="pl-4 mt-1 space-y-1 border-l-2 border-[#e3d8c8]/30">
                  {featuresItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-slate-50 hover:text-[#09090b] transition-all">
                        <div className="w-7 h-7 rounded-lg bg-[#c5a880]/10 text-[#c5a880] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[15px] font-medium font-poppins">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Use Cases accordion */}
            <div>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all"
                onClick={() => setUseCasesOpen(!useCasesOpen)}
              >
                <span>Use Cases</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${useCasesOpen ? 'rotate-180' : ''}`} />
              </button>
              {useCasesOpen && (
                <div className="pl-4 mt-1 space-y-1 border-l-2 border-[#e3d8c8]/30">
                  {useCaseItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-slate-50 hover:text-[#09090b] transition-all">
                        <div className="w-7 h-7 rounded-lg bg-[#c5a880]/10 text-[#c5a880] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[15px] font-medium font-poppins">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all font-poppins">Pricing</Link>
            <Link href="/blog"    onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all font-poppins">Blog</Link>
            <Link href="/about"   onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all font-poppins">About Us</Link>
            <Link href="/#contact" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-[15px] font-medium text-[#09090b] rounded-xl hover:bg-slate-50 transition-all font-poppins">Contact</Link>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-3 font-poppins">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center py-3 text-[#09090b] font-bold border border-gray-200 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-center py-3 bg-slate-900 text-white rounded-xl font-medium shadow-md hover:bg-[#c5a880] transition-all cursor-pointer"
                  >
                    Sign Out ({user?.name ? user.name.split(' ')[0] : 'User'})
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"  onClick={() => setMobileOpen(false)} className="w-full text-center py-3 text-[#09090b] font-medium border border-gray-200 rounded-xl hover:bg-slate-50 transition-all font-poppins">Login</Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="w-full text-center py-3 bg-[#09090b] text-white rounded-xl font-medium shadow-md hover:bg-[#c5a880] transition-all font-poppins">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
