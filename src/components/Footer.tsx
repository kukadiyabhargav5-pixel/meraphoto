import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#f5f2eb] border-t border-[#e3d8c8]/40 w-full z-[90] font-poppins">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 text-left">
            <img 
              src="/logo.png" 
              alt="Mara Photo" 
              className="h-10 w-auto mb-4 object-contain" 
            />
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-semibold">
              AI-powered event photo sharing with face recognition. Find your moments instantly.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3.5 mt-6">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#c5a880] hover:text-white text-gray-500 flex items-center justify-center transition-all duration-300 border border-[#e3d8c8]/30 shadow-sm hover:-translate-y-0.5"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#c5a880] hover:text-white text-gray-500 flex items-center justify-center transition-all duration-300 border border-[#e3d8c8]/30 shadow-sm hover:-translate-y-0.5"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#c5a880] hover:text-white text-gray-500 flex items-center justify-center transition-all duration-300 border border-[#e3d8c8]/30 shadow-sm hover:-translate-y-0.5"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column 1: Company */}
          <div className="text-left">
            <h4 className="font-bold text-[#09090b] text-xs mb-5 tracking-wider uppercase">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal */}
          <div className="text-left">
            <h4 className="font-bold text-[#09090b] text-xs mb-5 tracking-wider uppercase">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Quick Links */}
          <div className="text-left">
            <h4 className="font-bold text-[#09090b] text-xs mb-5 tracking-wider uppercase">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-550 hover:text-[#c5a880] font-semibold transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e3d8c8]/30 pt-7 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-semibold">© {new Date().getFullYear()} Mara Photo. All rights reserved.</p>
          <p className="text-xs text-gray-400 font-semibold">Made with ❤️ for photographers across India</p>
        </div>
      </div>
    </footer>
  );
}
