'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogoutLoader() {
  return (
    <AnimatePresence>
      <motion.div
        key="logout-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999999] flex items-center justify-center bg-[#070709]/85 backdrop-blur-lg select-none"
      >
        {/* Prominent ambient warm gold radial glow */}
        <div className="absolute w-[440px] h-[440px] rounded-full bg-[#c5a880]/25 blur-[120px] pointer-events-none" />

        {/* Big Luxury Floating Pill */}
        <motion.div
          key="logout-pill"
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center gap-5 sm:gap-6 px-9 py-5 sm:px-14 sm:py-6 rounded-full bg-[#111116]/95 border-2 border-[#c5a880]/40 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(197,168,128,0.3)] backdrop-blur-2xl"
        >
          {/* Big rotating loading circle */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background circle track */}
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="9.5"
                stroke="#c5a880"
                strokeWidth="3"
              />
              {/* Spinning gradient arc */}
              <path
                d="M12 2.5C17.2467 2.5 21.5 6.75329 21.5 12"
                stroke="url(#logout-gold-gradient-big)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="logout-gold-gradient-big" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#dfcdb5" />
                  <stop offset="100%" stopColor="#c5a880" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center subtle pulsing glow */}
            <div className="absolute inset-2 rounded-full bg-[#c5a880]/10 blur-sm pointer-events-none" />
          </div>

          {/* Big bold Logout text */}
          <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white font-sans drop-shadow-sm">
            Logout
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
