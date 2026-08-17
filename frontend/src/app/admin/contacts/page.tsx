'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Search, RefreshCw, CheckCircle, Clock, Send, X, Phone, User, Calendar, MessageSquare, ChevronRight, Inbox } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import apiClient from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contact');
      if (res.data.success) {
        setContacts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiClient.put(`/contact/${id}/status`, { status });
      if (res.data.success) {
        setContacts(contacts.map(c => c._id === id ? { ...c, status: status as any } : c));
        if (selectedContact?._id === id) {
          setSelectedContact({ ...selectedContact, status: status as any });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedContact || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await apiClient.post(`/contact/${selectedContact._id}/reply`, {
        replyMessage: replyText
      });
      if (res.data.success) {
        setContacts(contacts.filter(c => c._id !== selectedContact._id));
        setSelectedContact(null);
        setIsReplying(false);
        setReplyText('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(197, 168, 128, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(197, 168, 128, 0.6);
        }
      `}} />
      
      <div className="flex flex-col gap-8 h-[calc(100vh-100px)]">
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Contact Queries
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c5a880]/10 text-[#a07c4c] border border-[#c5a880]/20">
                {contacts.filter(c => c.status === 'new').length} New
              </span>
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.15em]">Manage public inquiries & support requests</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-64 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c5a880]/40 focus:border-[#c5a880]/60 transition-all placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={fetchContacts}
              className="p-2.5 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 hover:bg-[#c5a880]/5 transition-all group"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </motion.div>

        {/* Main Workspace */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          
          {/* Sidebar List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[400px] flex flex-col bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100/50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                <Inbox className="w-4 h-4 text-[#c5a880]" />
                Inbox
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-40 gap-3"
                  >
                    <div className="w-6 h-6 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading...</span>
                  </motion.div>
                ) : filteredContacts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-600 mb-1">All caught up!</h3>
                    <p className="text-xs font-medium text-slate-400">No contact queries found.</p>
                  </motion.div>
                ) : (
                  filteredContacts.map((contact, index) => {
                    const isSelected = selectedContact?._id === contact._id;
                    const isNew = contact.status === 'new';

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        key={contact._id}
                        onClick={() => {
                          setSelectedContact(contact);
                          setIsReplying(false);
                          setReplyText('');
                          if (contact.status === 'new') updateStatus(contact._id, 'read');
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#c5a880]/10 to-transparent border-[#c5a880]/30 shadow-sm'
                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        {isNew && !isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c5a880]"></div>
                        )}
                        
                        <div className="flex gap-3 items-start">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black ${
                            isSelected 
                              ? 'bg-gradient-to-br from-[#c5a880] to-[#b09672] text-white shadow-md' 
                              : isNew
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {getInitials(contact.name)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className={`font-bold text-sm truncate pr-2 ${isNew ? 'text-slate-900' : 'text-slate-700'}`}>
                                {contact.name}
                              </span>
                              <span className={`text-[10px] font-bold whitespace-nowrap ${isNew ? 'text-[#c5a880]' : 'text-slate-400'}`}>
                                {formatDate(contact.createdAt)}
                              </span>
                            </div>
                            
                            <div className="text-xs font-medium text-slate-500 truncate mb-1.5 flex items-center gap-1">
                              {contact.email}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <p className={`text-xs truncate flex-1 ${isNew ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                {contact.message}
                              </p>
                              {contact.status === 'replied' && (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Detail View */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden relative"
          >
            <AnimatePresence mode="wait">
              {selectedContact ? (
                <motion.div
                  key={selectedContact._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                >
                  {/* Detail Header */}
                  <div className="p-6 md:p-8 border-b border-slate-100/60 bg-gradient-to-b from-slate-50/80 to-transparent">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      
                      <div className="flex gap-5 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c5a880] to-[#b09672] flex items-center justify-center text-xl font-black text-white shadow-lg shadow-[#c5a880]/20">
                          {getInitials(selectedContact.name)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedContact.name}</h2>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`mailto:${selectedContact.email}`} className="hover:text-[#c5a880] transition-colors">{selectedContact.email}</a>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${selectedContact.phone}`} className="hover:text-[#c5a880] transition-colors">{selectedContact.phone}</a>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(selectedContact.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex">
                          {['new', 'read', 'replied'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateStatus(selectedContact._id, status)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                selectedContact.status === status
                                  ? 'bg-slate-900 text-white shadow-md'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                  
                  {/* Message Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-white/40 flex flex-col gap-8">
                    
                    {/* User's Message */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-[#c5a880]/10 flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-[#c5a880]" />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Message from User</h3>
                      </div>
                      
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 whitespace-pre-wrap leading-relaxed text-sm shadow-inner relative">
                        <div className="absolute top-0 left-6 w-px h-full bg-slate-200 -z-10"></div>
                        <span className="relative z-10">{selectedContact.message}</span>
                      </div>
                    </div>

                    {/* Reply Section */}
                    <AnimatePresence>
                      {isReplying && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                <Send className="w-3 h-3 text-emerald-600" />
                              </div>
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Your Reply</h3>
                            </div>
                            <button 
                              onClick={() => setIsReplying(false)}
                              className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                          
                          <div className="relative group">
                            <textarea 
                              className="w-full p-5 pb-16 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#c5a880] focus:ring-4 focus:ring-[#c5a880]/10 resize-none shadow-sm transition-all min-h-[200px]"
                              placeholder="Write a professional reply here..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              disabled={isSendingReply}
                              autoFocus
                            />
                            
                            <div className="absolute bottom-4 right-4 flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
                                Mail will be sent as Mara Photo
                              </span>
                              <button 
                                onClick={handleSendReply}
                                disabled={isSendingReply || !replyText.trim()}
                                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-[#c5a880] hover:shadow-lg hover:shadow-[#c5a880]/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-[#c5a880]"
                              >
                                {isSendingReply ? (
                                  <>Sending... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
                                ) : (
                                  <>Send Mail <Send className="w-4 h-4" /></>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer Action */}
                  {!isReplying && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-5 border-t border-slate-100 bg-white flex justify-end"
                    >
                      <button 
                        onClick={() => setIsReplying(true)}
                        className="px-6 py-3 bg-[#c5a880] text-white text-sm font-black uppercase tracking-wider rounded-xl hover:bg-slate-900 hover:shadow-lg transition-all flex items-center gap-2 group"
                      >
                        Reply to User <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                  
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="w-32 h-32 mb-8 relative">
                    <div className="absolute inset-0 bg-[#c5a880]/5 rounded-full animate-ping opacity-75 duration-3000"></div>
                    <div className="absolute inset-4 bg-[#c5a880]/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Mail className="w-12 h-12 text-[#c5a880]" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">No Query Selected</h2>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">
                    Select a contact query from the inbox on the left to view their message and send a reply.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
