'use client';
import React from 'react';
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
