'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';


export default function TeamPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    customers, setCustomers,
    team, setTeam,
    bookings, setBookings,
    quotations, setQuotations,
    bills, setBills,
    studio, setStudio,
    sessionUser,
    tickets, setTickets,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg

    
  } = context;

  const [teamSubView, setTeamSubView] = useState('list');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Lead Photographer');

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {teamSubView === 'list' ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Studio Team & Collaborators</h1>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Assign permissions, manage editors, and invite second-shooters.</p>
                  </div>
                  <button onClick={() => setTeamSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
                    <Plus className="h-4 w-4" /> Invite Member
                  </button>
                </div>
                <div className=" bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4">Member Name</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Role / Designation</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {team.map((member, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-bold text-slate-900">{member.name}</td>
                          <td className="p-4 text-slate-700 font-semibold">{member.email}</td>
                          <td className="p-4 font-bold text-[#c5a880]">{member.role}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-500/10 text-slate-600 border border-slate-500/10'}`}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="max-w-xl flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setTeamSubView('list')} className="text-slate-700 hover:text-slate-900 text-xs font-bold underline cursor-pointer">
                    ← Back to Team
                  </button>
                  <h1 className="text-2xl font-extrabold text-slate-900">Invite Team Member</h1>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newMemberName) {
                    try {
                      const res = await apiClient.post('/dashboard/team', { name: newMemberName, email: newMemberEmail, role: newMemberRole, status: 'Active' });
                      setTeam([res.data, ...team]);
                      setNewMemberName(''); setNewMemberEmail('');
                      setTeamSubView('list');
                      setSuccessMsg('Team member invitation sent!');
                    } catch (err) {
                      console.error(err);
                      setErrorMsg('Failed to invite member');
                    }
                  }
                }} className=" bg-slate-50 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Full Name</label>
                    <input type="text" required value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Tirth Italiya" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Email Address</label>
                    <input type="email" required value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="tirth@studio.com" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Role / Specialization</label>
                    <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                      <option className="bg-white text-slate-900" value="Lead Photographer">Lead Photographer</option>
                      <option className="bg-white text-slate-900" value="Chief Editor (AI Tuning)">Chief Editor (AI Tuning)</option>
                      <option className="bg-white text-slate-900" value="Assistant Photographer">Assistant Photographer</option>
                      <option className="bg-white text-slate-900" value="Second Shooter">Second Shooter</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#c5a880] hover:bg-white text-[#09090b] font-bold py-3.5 rounded-lg text-xs mt-3 cursor-pointer transition-colors shadow-md">
                    Send Invitation Link
                  </button>
                </form>
              </div>
            )}
          </div>
    </div>
  );
}
