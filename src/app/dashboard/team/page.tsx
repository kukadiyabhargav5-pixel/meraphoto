'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film, Edit, Search,
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
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Lead Photographer');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (member: any) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        await apiClient.delete(`/dashboard/team/${member._id}`);
        setTeam(team.filter((m: any) => m._id !== member._id));
        setSuccessMsg('Team member deleted successfully');
      } catch (err) {
        setErrorMsg('Failed to delete team member');
      }
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setNewMemberEmail(member.email);
    setNewMemberPhone(member.phone || '');
    setNewMemberRole(member.role || 'Lead Photographer');
    setTeamSubView('edit');
  };

  const resetForm = () => {
    setEditingMember(null);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberRole('Lead Photographer');
    setTeamSubView('list');
  };

  const filteredTeam = team.filter((member: any) => 
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone?.includes(searchQuery)
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {teamSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Studio Team & Collaborators</h1>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Assign permissions, manage editors, and invite second-shooters.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search team members..."
                        className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] pr-8 shadow-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-400 focus:outline-none cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setTeamSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto">
                      <Plus className="h-4 w-4" /> Invite Member
                    </button>
                  </div>
                </div>
                <div className="bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4 text-center">Member Name</th>
                        <th className="p-4 text-center">Email Address</th>
                        <th className="p-4 text-center">Mobile</th>
                        <th className="p-4 text-center">Role / Designation</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredTeam.map((member: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 text-center font-bold text-slate-900">{member.name}</td>
                          <td className="p-4 text-center text-slate-600 font-semibold">{member.email}</td>
                          <td className="p-4 text-center font-mono font-semibold text-slate-600">{member.phone || '-'}</td>
                          <td className="p-4 text-center font-bold text-[#c5a880]">{member.role}</td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handleEdit(member)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-[#c5a880] hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(member)} className="p-1.5 bg-rose-50 text-rose-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-rose-200 shadow-sm">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTeam.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            No team members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={resetForm} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Team</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">
                      {teamSubView === 'edit' ? 'Edit Team Member' : 'Invite Team Member'}
                    </h1>
                  </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newMemberName && !isSubmitting) {
                    try {
                      setIsSubmitting(true);
                      if (teamSubView === 'edit' && editingMember) {
                        const res = await apiClient.put(`/dashboard/team/${editingMember._id}`, { name: newMemberName, email: newMemberEmail, phone: newMemberPhone, role: newMemberRole });
                        setTeam(team.map((m: any) => m._id === editingMember._id ? res.data : m));
                        setSuccessMsg('Team member updated successfully!');
                      } else {
                        const res = await apiClient.post('/dashboard/team', { name: newMemberName, email: newMemberEmail, phone: newMemberPhone, role: newMemberRole, status: 'Active' });
                        setTeam([res.data, ...team]);
                        setSuccessMsg('Team member invitation sent!');
                      }
                      resetForm();
                    } catch (err: any) {
                      console.error(err);
                      setErrorMsg(err.response?.data?.error || (teamSubView === 'edit' ? 'Failed to update member' : 'Failed to invite member'));
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }} className="bg-[#f8f7f4] text-slate-900 border border-slate-200 p-8 sm:p-10 rounded-2xl flex flex-col gap-5 text-center shadow-sm mt-2">
                  <div className="flex flex-col gap-1.5 items-center">
                    <label className="text-[11px] text-slate-400 uppercase font-black tracking-widest text-center">Full Name</label>
                    <input type="text" required value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <label className="text-[11px] text-slate-400 uppercase font-black tracking-widest text-center">Mobile Number</label>
                    <input type="tel" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <label className="text-[11px] text-slate-400 uppercase font-black tracking-widest text-center">Email Address</label>
                    <input type="email" required value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <label className="text-[11px] text-slate-400 uppercase font-black tracking-widest text-center">Role / Specialization</label>
                    <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880] transition-all cursor-pointer">
                      <optgroup label="Photography Team" className="text-slate-500 font-bold bg-[#f8f7f4] text-slate-900">
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Lead Photographer">Lead Photographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Second Shooter">Second Shooter</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Assistant Photographer">Assistant Photographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Candid Photographer">Candid Photographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Traditional Photographer">Traditional Photographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Pre-Wedding Specialist">Pre-Wedding Specialist</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Portrait Specialist">Portrait Specialist</option>
                      </optgroup>
                      <optgroup label="Videography & Cinematography Team" className="text-slate-500 font-bold bg-[#f8f7f4] text-slate-900">
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Lead Cinematographer">Lead Cinematographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Traditional Videographer">Traditional Videographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Candid Videographer">Candid Videographer</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Drone/Aerial Specialist">Drone / Aerial Specialist</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Assistant Videographer">Assistant Videographer</option>
                      </optgroup>
                      <optgroup label="Editing & Post-Production" className="text-slate-500 font-bold bg-[#f8f7f4] text-slate-900">
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Chief Photo Editor">Chief Photo Editor</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Chief Video Editor">Chief Video Editor</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="AI Tuning & Retoucher">AI Tuning & Retoucher</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Highlight Reel Editor">Highlight Reel Editor</option>
                      </optgroup>
                      <optgroup label="Management & Support" className="text-slate-500 font-bold bg-[#f8f7f4] text-slate-900">
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Studio Manager">Studio Manager</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Client Coordinator">Client Coordinator</option>
                        <option className="bg-[#f8f7f4] text-slate-900 font-semibold" value="Lighting Technician">Lighting Technician</option>
                      </optgroup>
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="flex justify-center items-center gap-2 w-full bg-white hover:bg-[#c5a880] text-slate-900 hover:text-[#09090b] uppercase tracking-wider font-bold py-4 rounded-xl text-xs mt-4 cursor-pointer transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : (teamSubView === 'edit' ? 'Save Changes' : 'Send Invitation Link')}
                  </button>
                </form>
              </div>
              </div>
            )}
          </div>
    </div>
  );
}
