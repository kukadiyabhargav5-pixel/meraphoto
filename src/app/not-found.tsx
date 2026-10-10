'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Camera } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#faf9f6] to-[#f4f2eb] text-slate-900 px-6 py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#c5a880]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#e3d8c8]/15 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Camera Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="w-24 h-24 rounded-full bg-white shadow-lg border border-[#c5a880]/20 flex items-center justify-center mx-auto mb-8"
        >
          <Camera className="w-10 h-10 text-[#c5a880]" />
        </motion.div>

        {/* 404 number */}
        <h1 className="text-8xl sm:text-9xl font-black text-slate-900/10 tracking-tighter font-serif-luxury select-none leading-none">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-4 mb-3">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-10">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to capturing moments.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-[#c5a880] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-widest border-2 border-slate-200 hover:border-[#c5a880]/40 transition-all duration-300 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
