import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#f5f2eb] border-t border-[#e3d8c8]/40 w-full z-[90]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img 
              src="/logo.jpg" 
              alt="Mara Photo" 
              className="h-9 w-auto mb-4 object-contain" 
            />
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-medium">
              AI-powered event photo sharing with face recognition. Find your moments instantly.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/80 hover:bg-[#c5a880] hover:text-white text-gray-500 flex items-center justify-center transition-colors text-xs font-bold border border-[#e3d8c8]/30">in</a>
              <a href="https://facebook.com"  target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/80 hover:bg-[#c5a880] hover:text-white text-gray-500 flex items-center justify-center transition-colors text-xs font-bold border border-[#e3d8c8]/30">fb</a>
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Use Cases', '/use-cases'], ['Blog', '/blog']] },
            { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Careers', '/careers']] },
            { title: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies']] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-poppins font-bold text-[#09090b] text-sm mb-4 tracking-wider uppercase">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-[#c5a880] font-medium transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#e3d8c8]/30 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Mara Photo. All rights reserved.</p>
          <p className="text-xs text-gray-400">Made with ❤️ for photographers across India</p>
        </div>
      </div>
    </footer>
  );
}
