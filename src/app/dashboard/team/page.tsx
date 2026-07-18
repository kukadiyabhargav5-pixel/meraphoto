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
              <div className="w-full relative">
                <button onClick={() => setTeamSubView('list')} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#c5a880] text-[11px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#c5a880] transition-all duration-300 shadow-sm hover:shadow group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Team</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">Invite Team Member</h1>
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
                }} className="bg-slate-50 border border-slate-200 p-8 sm:p-10 rounded-2xl flex flex-col gap-5 text-left shadow-sm mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-600 uppercase font-black tracking-widest">Full Name</label>
                    <input type="text" required value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-600 uppercase font-black tracking-widest">Email Address</label>
                    <input type="email" required value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-600 uppercase font-black tracking-widest">Role / Specialization</label>
                    <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all cursor-pointer">
                      <optgroup label="Photography Team" className="text-slate-500 font-bold bg-slate-50">
                        <option className="bg-white text-slate-900 font-semibold" value="Lead Photographer">Lead Photographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Second Shooter">Second Shooter</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Assistant Photographer">Assistant Photographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Candid Photographer">Candid Photographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Traditional Photographer">Traditional Photographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Pre-Wedding Specialist">Pre-Wedding Specialist</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Portrait Specialist">Portrait Specialist</option>
                      </optgroup>
                      <optgroup label="Videography & Cinematography Team" className="text-slate-500 font-bold bg-slate-50">
                        <option className="bg-white text-slate-900 font-semibold" value="Lead Cinematographer">Lead Cinematographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Traditional Videographer">Traditional Videographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Candid Videographer">Candid Videographer</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Drone/Aerial Specialist">Drone / Aerial Specialist</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Assistant Videographer">Assistant Videographer</option>
                      </optgroup>
                      <optgroup label="Editing & Post-Production" className="text-slate-500 font-bold bg-slate-50">
                        <option className="bg-white text-slate-900 font-semibold" value="Chief Photo Editor">Chief Photo Editor</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Chief Video Editor">Chief Video Editor</option>
                        <option className="bg-white text-slate-900 font-semibold" value="AI Tuning & Retoucher">AI Tuning & Retoucher</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Highlight Reel Editor">Highlight Reel Editor</option>
                      </optgroup>
                      <optgroup label="Management & Support" className="text-slate-500 font-bold bg-slate-50">
                        <option className="bg-white text-slate-900 font-semibold" value="Studio Manager">Studio Manager</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Client Coordinator">Client Coordinator</option>
                        <option className="bg-white text-slate-900 font-semibold" value="Lighting Technician">Lighting Technician</option>
                      </optgroup>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#09090b] hover:bg-[#c5a880] text-white hover:text-[#09090b] uppercase tracking-wider font-bold py-4 rounded-xl text-xs mt-4 cursor-pointer transition-all shadow-md">
                    Send Invitation Link
                  </button>
                </form>
              </div>
              </div>
            )}
          </div>
    </div>
  );
}
