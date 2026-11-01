'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crop,
  Check,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface CoverImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, croppedFile: File, previewUrl: string) => void;
}

export default function CoverImageCropModal({
  isOpen,
  imageSrc,
  fileName = 'cover-16x9.jpg',
  onClose,
  onCropComplete,
}: CoverImageCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // Reset state whenever new image is loaded
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setProcessing(false);

    const img = new Image();
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Compute maximum allowable pan so the image ALWAYS covers the 16:9 frame
  const getPanLimits = useCallback(
    (currentZoom: number) => {
      if (!containerRef.current || !imageMeta) return { maxX: 0, maxY: 0 };
      const { clientWidth: cw, clientHeight: ch } = containerRef.current;
      if (!cw || !ch) return { maxX: 0, maxY: 0 };

      // Consider rotation (if 90 or 270 deg, effective aspect ratio is inverted)
      const isRotated = rotation === 90 || rotation === 270;
      const naturalW = isRotated ? imageMeta.height : imageMeta.width;
      const naturalH = isRotated ? imageMeta.width : imageMeta.height;

      const baseScale = Math.max(cw / naturalW, ch / naturalH);
      const effectiveScale = baseScale * currentZoom;

      const dispW = naturalW * effectiveScale;
      const dispH = naturalH * effectiveScale;

      const maxX = Math.max(0, (dispW - cw) / 2);
      const maxY = Math.max(0, (dispH - ch) / 2);

      return { maxX, maxY, dispW, dispH, baseScale, effectiveScale, cw, ch };
    },
    [imageMeta, rotation]
  );

  // Helper to clamp pan
  const clampPan = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      const { maxX, maxY } = getPanLimits(currentZoom);
      return {
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      };
    },
    [getPanLimits]
  );

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      clientX,
      clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.clientX;
    const dy = clientY - dragStartRef.current.clientY;
    const targetX = dragStartRef.current.panX + dx;
    const targetY = dragStartRef.current.panY + dy;
    setPan(clampPan(targetX, targetY, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom changes
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3.5, newZoom));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    handleZoomChange(zoom + delta);
  };

  // Quick Preset Alignments
  const setQuickAlign = (type: 'CENTER' | 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT') => {
    const { maxX, maxY } = getPanLimits(zoom);
    if (type === 'CENTER') setPan({ x: 0, y: 0 });
    else if (type === 'TOP') setPan((prev) => ({ x: prev.x, y: maxY }));
    else if (type === 'BOTTOM') setPan((prev) => ({ x: prev.x, y: -maxY }));
    else if (type === 'LEFT') setPan((prev) => ({ x: maxX, y: prev.y }));
    else if (type === 'RIGHT') setPan((prev) => ({ x: -maxX, y: prev.y }));
  };

  // Rotate by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPan({ x: 0, y: 0 });
  };

  // Reset to default
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Process and Crop using High-Resolution HTML5 Canvas
  const handleApplyCrop = async () => {
    if (!imageSrc || !imageMeta || !containerRef.current) return;
    setProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        if (img.complete) resolve(null);
        else {
          img.onload = () => resolve(null);
          img.onerror = reject;
        }
      });

      // Target resolution: Full HD 16:9 (1920 × 1080)
      const targetW = 1920;
      const targetH = 1080;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dimensions of the viewport
      const { clientWidth: cw, clientHeight: ch } = containerRef.current;

      const isRotated = rotation === 90 || rotation === 270;
      const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;

      const baseScale = Math.max(cw / naturalW, ch / naturalH);
      const effectiveScale = baseScale * zoom;

      // Scale multiplier between canvas output and screen viewport
      const canvasScale = targetW / cw;

      // Fill canvas background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetW, targetH);

      // Save and translate to canvas center
      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);

      // Apply Pan (scaled to target canvas resolution)
      ctx.translate(pan.x * canvasScale, pan.y * canvasScale);

      // Apply Rotation
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      // Draw original image centered
      const drawW = img.naturalWidth * effectiveScale * canvasScale;
      const drawH = img.naturalHeight * effectiveScale * canvasScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Convert canvas to Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessing(false);
            return;
          }
          const cleanName = fileName.replace(/\.[^/.]+$/, '') + '-16x9.jpg';
          const croppedFile = new File([blob], cleanName, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, croppedFile, previewUrl);
          setProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.94
      );
    } catch (err) {
      console.error('Canvas crop error:', err);
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window in White & Gold Luxury Styling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#faf9f6] rounded-3xl border border-[#e8dfd3] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 sm:px-7 py-4 bg-white border-b border-[#e8dfd3] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5a880]/20 to-[#9e7b4f]/15 border border-[#c5a880]/40 flex items-center justify-center text-[#9e7b4f] shrink-0 shadow-xs">
                <Crop className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    16:9 Cover Frame Adjustment
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#c5a880]/15 text-[#9e7b4f] border border-[#c5a880]/30 text-[10px] font-black uppercase tracking-wider">
                    16:9 Ratio
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Drag and reposition the photo to choose which portion appears on your event gallery
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Crop Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center gap-4">
            {/* Viewport Frame with 16:9 Aspect Ratio */}
            <div className="w-full max-w-2xl relative select-none">
              <div
                ref={containerRef}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerDown(touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerMove(touch.clientX, touch.clientY);
                }}
                onTouchEnd={handlePointerUp}
                onWheel={handleWheel}
                className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border-2 border-[#c5a880] shadow-xl ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } group`}
              >
                {/* The Moveable / Pannable Image */}
                {imageSrc && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop target"
                      draggable={false}
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        maxWidth: 'none',
                        maxHeight: 'none',
                      }}
                      className="select-none pointer-events-none object-cover min-w-full min-h-full"
                    />
                  </div>
                )}

                {/* Rule of Thirds Composition Grid */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 transition-opacity">
                    <div className="border-r border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-b border-white/25" />
                    <div className="border-r border-white/25" />
                    <div className="border-r border-white/25" />
                    <div />
                  </div>
                )}

                {/* Corner Golden Accent Guides */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c5a880] pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#c5a880] pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#c5a880] pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c5a880] pointer-events-none" />

                {/* Top Overlay Badge */}
                <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
                  <Move className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Click & Drag to Reposition</span>
                </div>

                <div className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-[#c5a880]/40 text-[#f3e3ce] text-[11px] font-black uppercase tracking-wider">
                  1920 × 1080 (16:9)
                </div>
              </div>
            </div>

            {/* Quick Adjustment Toolbar */}
            <div className="w-full max-w-2xl bg-white border border-[#e8dfd3] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Zoom Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 0.2)}
                  disabled={zoom <= 1}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="flex-1 sm:w-36 flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="3.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full custom-slider cursor-pointer"
                    style={{ '--val': `${((zoom - 1) / 2.5) * 100}%` } as any}
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 0.2)}
                  disabled={zoom >= 3.5}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Alignment Presets */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                  Align:
                </span>
                <button
                  type="button"
                  onClick={() => setQuickAlign('TOP')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Align Top (Great for portraits)"
                >
                  <ArrowUp className="w-3 h-3" /> Top
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAlign('CENTER')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  title="Center Alignment"
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAlign('BOTTOM')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Align Bottom"
                >
                  <ArrowDown className="w-3 h-3" /> Bottom
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3 h-3" /> Rotate
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-all cursor-pointer"
                  title="Reset Zoom & Position"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-7 py-4 bg-white border-t border-[#e8dfd3] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={processing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white hover:brightness-105 active:scale-95 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#c5a880]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cropping to 16:9...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Apply 16:9 Crop</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

