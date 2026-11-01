'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  Heart,
  ChevronDown,
  Check,
  Video,
  FolderOpen,
  Filter,
} from 'lucide-react';

export type EventTabKey = 'upload' | 'faces' | 'analysis' | 'favorites';

export interface EventHeaderNavProps {
  eventId: string;
  activeTab: EventTabKey;
  allCount?: number;
  photoCount?: number;
  videoCount?: number;
  facesCount?: number;
  favoritesCount?: number;
  mediaFilter?: 'ALL' | 'PHOTO' | 'VIDEO';
  onFilterChange?: (filter: 'ALL' | 'PHOTO' | 'VIDEO') => void;
  actionSlot?: React.ReactNode;
}

export default function EventHeaderNav({
  eventId,
  activeTab,
  allCount = 0,
  photoCount = 0,
  videoCount = 0,
  facesCount,
  favoritesCount,
  mediaFilter = 'ALL',
  onFilterChange,
  actionSlot,
}: EventHeaderNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterLabel =
    mediaFilter === 'PHOTO'
      ? `Photos (${photoCount})`
      : mediaFilter === 'VIDEO'
      ? `Videos (${videoCount})`
      : `All Media (${allCount})`;

  const tabs: {
    key: EventTabKey;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      key: 'upload',
      label: 'All Media',
      href: `/dashboard/events/${eventId}/upload`,
      icon: ImageIcon,
      badge: allCount > 0 ? allCount : undefined,
    },
    {
      key: 'faces',
      label: 'Faces',
      href: `/dashboard/events/${eventId}/faces`,
      icon: Sparkles,
      badge: facesCount !== undefined && facesCount > 0 ? facesCount : undefined,
    },
    {
      key: 'analysis',
      label: 'Analysis',
      href: `/dashboard/events/${eventId}/analysis`,
      icon: TrendingUp,
    },
    {
      key: 'favorites',
      label: 'Favorites',
      href: `/dashboard/events/${eventId}/favorites`,
      icon: Heart,
      badge: favoritesCount !== undefined && favoritesCount > 0 ? favoritesCount : undefined,
    },
  ];

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#e8dfd3]">
      {/* ─── LEFT: Modern Dropdown Side-menu for Photo & Video Filter ─── */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-white border border-[#e8dfd3] hover:border-[#c5a880] text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer select-none"
            title="Filter Media by Type"
          >
            <Filter className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>{filterLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-amber-600' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-48 sm:w-52 rounded-xl bg-white border border-[#e8dfd3] shadow-lg shadow-black/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Filter Media Type
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onFilterChange) onFilterChange('ALL');
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  mediaFilter === 'ALL'
                    ? 'bg-[#faf8f5] text-amber-700 font-extrabold'
                    : 'text-slate-700 hover:bg-[#fbf9f6] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <span>All Media</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-semibold">
                    {allCount}
                  </span>
                  {mediaFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onFilterChange) onFilterChange('PHOTO');
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  mediaFilter === 'PHOTO'
                    ? 'bg-[#faf8f5] text-amber-700 font-extrabold'
                    : 'text-slate-700 hover:bg-[#fbf9f6] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>Photos Only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 font-semibold">
                    {photoCount}
                  </span>
                  {mediaFilter === 'PHOTO' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onFilterChange) onFilterChange('VIDEO');
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  mediaFilter === 'VIDEO'
                    ? 'bg-[#faf8f5] text-amber-700 font-extrabold'
                    : 'text-slate-700 hover:bg-[#fbf9f6] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-500" />
                  <span>Videos Only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-[10px] text-blue-700 font-semibold">
                    {videoCount}
                  </span>
                  {mediaFilter === 'VIDEO' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── CENTER: 4 Dedicated Navigation Tabs ─── */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] shadow-inner overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] via-[#c5a880] to-[#b89665] text-slate-950 shadow-md shadow-[#c5a880]/30 ring-1 ring-[#c5a880]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ─── RIGHT: Custom Actions Slot (Select, Delete, Download, etc.) ─── */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        {actionSlot}
      </div>
    </div>
  );
}

