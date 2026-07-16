import os
import re

def update_layout():
    layout_path = 'src/app/dashboard/layout.tsx'
    if os.path.exists(layout_path):
        with open(layout_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We need the sidebar to be dark but the main background to be white.
        # Actually, layout wraps everything.
        # <div className="min-h-screen bg-[#09090b] text-[#faf9f6] flex overflow-hidden">
        content = content.replace('bg-[#09090b] text-[#faf9f6]', 'bg-white text-black')
        content = content.replace('border-white/5', 'border-slate-200')
        with open(layout_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated layout.tsx")

def update_pages():
    base_dir = 'src/app/dashboard'
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file == 'page.tsx' and root != base_dir:
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                content = content.replace('bg-[#09090b] text-white', 'bg-white text-black')
                content = content.replace('text-slate-300', 'text-slate-700')
                content = content.replace('text-slate-400', 'text-slate-600')
                content = content.replace('bg-white/[0.02]', 'bg-slate-50')
                content = content.replace('border-white/10', 'border-slate-200')
                content = content.replace('glass-panel', '')
                content = content.replace('text-white', 'text-slate-900')
                content = content.replace('bg-[#0c0c0e]', 'bg-white')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")

def simplify_main_dashboard():
    dashboard_page = 'src/app/dashboard/page.tsx'
    clean_code = """'use client';
import React, { useState } from 'react';
import { useDashboard } from './DashboardContext';
import { Users, Calendar, IndianRupee, Image as ImageIcon } from 'lucide-react';

export default function DashboardOverview() {
  const context = useDashboard();
  if (!context) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Total Clients</p>
                <p className="text-2xl font-black text-slate-900">124</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Calendar className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Events</p>
                <p className="text-2xl font-black text-slate-900">45</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Revenue</p>
                <p className="text-2xl font-black text-slate-900">₹ 8.5L</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><ImageIcon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Photos</p>
                <p className="text-2xl font-black text-slate-900">12.4K</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
           <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
           <p className="text-slate-600">All systems operational. Your recent uploads have been processed successfully.</p>
        </div>
      </div>
    </div>
  );
}
"""
    with open(dashboard_page, 'w', encoding='utf-8') as f:
        f.write(clean_code)
    print("Replaced main dashboard/page.tsx with a clean overview component")

if __name__ == '__main__':
    update_layout()
    update_pages()
    simplify_main_dashboard()
