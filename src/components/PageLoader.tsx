'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.6s, fully hidden at 2s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
    const hideTimer = setTimeout(() => setVisible(false), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="page-loader-overlay"
      style={{ opacity: fadeOut ? 0 : 1 }}
    >
      {/* Animated background layers */}
      <div className="page-loader-bg" />
      <div className="page-loader-glow" />

      {/* Center content */}
      <div className="page-loader-content">
        {/* Logo container */}
        <div className="page-loader-logo-ring">
          <div className="page-loader-logo-ring-inner" />
          <div className="page-loader-logo-ring-spin" />
          <div className="page-loader-logo-box">
            <img
              src="/logo.png"
              alt="Mara Photo"
              className="page-loader-logo-img"
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="page-loader-brand">
          <span className="page-loader-brand-text">MARA</span>
          <span className="page-loader-brand-dot">●</span>
          <span className="page-loader-brand-text">PHOTO</span>
        </div>

        {/* Tagline */}
        <p className="page-loader-tagline">AI-Powered Event Photography</p>

        {/* Progress bar */}
        <div className="page-loader-bar-track">
          <div className="page-loader-bar-fill" />
          <div className="page-loader-bar-shimmer" />
        </div>

        {/* Loading text */}
        <p className="page-loader-status">Preparing your experience...</p>
      </div>

      {/* Corner decorations */}
      <div className="page-loader-corner page-loader-corner-tl" />
      <div className="page-loader-corner page-loader-corner-tr" />
      <div className="page-loader-corner page-loader-corner-bl" />
      <div className="page-loader-corner page-loader-corner-br" />
    </div>
  );
}
