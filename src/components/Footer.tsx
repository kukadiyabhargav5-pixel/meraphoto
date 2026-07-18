import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#09090b] text-white pt-24 pb-8 overflow-hidden relative border-t border-white/5 font-poppins">
      {/* Abstract Background Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#c5a880]/10 to-transparent rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-tl from-[#c5a880]/5 to-transparent rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Top Section: CTA & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-6xl font-light font-[family-name:var(--font-cormorant-garamond)] mb-6 text-white leading-tight">
              Ready to elevate your <br />
              <em className="text-[#c5a880] italic">photography business?</em>
            </h2>
            <p className="text-gray-400 text-lg mb-8 font-medium">
              Join elite studios worldwide and deliver personalized event galleries instantly with AI.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/signup" 
                className="bg-[#c5a880] text-[#09090b] px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white transition-all duration-500 hover:-translate-y-1 shadow-[0_10px_40px_rgba(197,168,128,0.2)]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto min-w-[320px]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Stay Updated</h3>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880] transition-colors duration-300"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-[#c5a880] text-white hover:text-[#09090b] p-3 rounded-xl transition-all duration-300 group-focus-within:bg-[#c5a880] group-focus-within:text-[#09090b]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-12 border-t border-white/10">
          <div>
            <img src="/logo.png" alt="Mara Photo" className="h-8 w-auto mb-8 brightness-0 invert" />
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              AI-powered event photo sharing. High speed, zero limits.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Platform</h4>
            <ul className="space-y-4">
              {['Features', 'AI Face Match', 'Pricing', 'Testimonials'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-gray-300 hover:text-[#c5a880] text-sm font-medium transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-0 h-[1px] bg-[#c5a880] transition-all duration-300 group-hover:w-4" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Contact', 'Blog', 'Careers'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-gray-300 hover:text-[#c5a880] text-sm font-medium transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-0 h-[1px] bg-[#c5a880] transition-all duration-300 group-hover:w-4" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Connect</h4>
            <div className="flex gap-4">
              {['Instagram', 'Twitter', 'LinkedIn'].map((social) => (
                <a 
                  key={social}
                  href="#" 
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#c5a880] hover:text-[#09090b] hover:border-[#c5a880] transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="sr-only">{social}</span>
                  {social === 'Instagram' && (
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  )}
                  {social === 'Twitter' && (
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                  )}
                  {social === 'LinkedIn' && (
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Giant Typography & Copyright */}
        <div className="pt-12 flex flex-col items-center">
          <div className="w-full overflow-hidden flex justify-center mb-12 select-none pointer-events-none opacity-[0.03]">
            <h1 className="text-[15vw] leading-none font-bold tracking-tighter text-white whitespace-nowrap">
              MARA PHOTO
            </h1>
          </div>
          
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Mara Photo. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
