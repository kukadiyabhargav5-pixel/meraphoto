'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Send, 
  Clock, 
  CheckCircle, 
  PhoneCall, 
  AlertCircle, 
  User, 
  Calendar, 
  Globe, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Edit3,
  Check
} from 'lucide-react';
import apiClient from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  _id?: string;
  sender: 'visitor' | 'admin' | 'bot';
  senderName?: string;
  text: string;
  timestamp: string;
}

interface ChatLead {
  _id: string;
  sessionId: string;
  name: string;
  phone?: string;
  email?: string;
  sourceUrl?: string;
  device?: string;
  callbackRequested: boolean;
  callbackTimeNotice?: string;
  callbackStatus: 'pending' | 'called' | 'converted' | 'closed';
  callbackRequestedAt?: string;
  callbackNotes?: string;
  messages: ChatMessage[];
  unreadForAdmin: number;
  unreadForVisitor: number;
  lastMessageText?: string;
  lastMessageAt: string;
  status: 'active' | 'archived' | 'resolved';
  createdAt: string;
}

export default function AdminChatbotPage() {
  const [conversations, setConversations] = useState<ChatLead[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_callback' | 'unread' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({
    pendingCallbacks: 0,
    unreadMessages: 0,
    totalLeadsToday: 0,
    total: 0
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const prevPendingRef = useRef<number>(0);
  const prevUnreadRef = useRef<number>(0);

  // Play audio chime for new messages / leads
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get('/chatbot/admin/conversations', {
        params: {
          filter: filter === 'all' ? undefined : filter,
          search: search.trim() || undefined
        }
      });

      if (res.data.success) {
        const newConversations: ChatLead[] = res.data.conversations;
        const newStats = res.data.stats;

        // Check if new lead/message arrived
        if (
          silent &&
          (newStats.pendingCallbacks > prevPendingRef.current ||
           newStats.unreadMessages > prevUnreadRef.current)
        ) {
          playNotificationSound();
        }

        prevPendingRef.current = newStats.pendingCallbacks;
        prevUnreadRef.current = newStats.unreadMessages;

        setConversations(newConversations);
        setStats(newStats);

        // Update selected conversation if open
        if (selectedConversation) {
          const updated = newConversations.find(c => c._id === selectedConversation._id);
          if (updated) {
            setSelectedConversation(updated);
          }
        } else if (newConversations.length > 0 && !silent) {
          // Auto select first
          setSelectedConversation(newConversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching admin conversations:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [filter, search]);

  // Polling every 5 seconds for real-time conversation updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [filter, search, selectedConversation?._id]);

  // Auto-scroll chat window when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  const selectConversation = async (conv: ChatLead) => {
    setSelectedConversation(conv);
    if (conv.unreadForAdmin > 0) {
      try {
        await apiClient.get(`/chatbot/admin/conversation/${conv._id}`);
        // update local badge
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadForAdmin: 0 } : c));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveCustomerName = async () => {
    if (!selectedConversation || !editNameValue.trim() || savingName) return;
    setSavingName(true);
    try {
      const res = await apiClient.put('/chatbot/admin/update-lead', {
        id: selectedConversation._id,
        name: editNameValue.trim(),
      });
      if (res.data.success) {
        setSelectedConversation(res.data.lead);
        setConversations(prev => prev.map(c => c._id === res.data.lead._id ? res.data.lead : c));
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('Error updating customer name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await apiClient.post('/chatbot/admin/reply', {
        id: selectedConversation._id,
        text: replyText.trim(),
        adminName: 'Super Admin',
      });
      if (res.data.success) {
        setReplyText('');
        setSelectedConversation(res.data.lead);
        setConversations(prev => prev.map(c => c._id === res.data.lead._id ? res.data.lead : c));
      }
    } catch (error) {
      console.error('Error sending admin reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateCallbackStatus = async (status: 'pending' | 'called' | 'converted' | 'closed') => {
    if (!selectedConversation) return;
    try {
      const res = await apiClient.put('/chatbot/admin/callback-status', {
        id: selectedConversation._id,
        callbackStatus: status,
      });
      if (res.data.success) {
        setSelectedConversation(res.data.lead);
        setConversations(prev => prev.map(c => c._id === res.data.lead._id ? res.data.lead : c));
        // refresh stats
        fetchConversations(true);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation record?')) return;
    try {
      const res = await apiClient.delete(`/chatbot/admin/conversation/${id}`);
      if (res.data.success) {
        const remaining = conversations.filter(c => c._id !== id);
        setConversations(remaining);
        if (selectedConversation?._id === id) {
          setSelectedConversation(remaining[0] || null);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* ─── Top Stats & Control Bar ─── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-[#c5a880]/15 text-[#9a7b4f] rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </span>
                Chatbot & Client Leads
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage website live chats, client questions, and phone callback requests (2-3 hour guarantee).
            </p>
          </div>

          {/* Quick Metrics Badges & Controls */}
          <div className="flex items-center gap-3">
            {/* Pending Callback Badge */}
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 ${
              stats.pendingCallbacks > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs animate-pulse' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <PhoneCall className={`w-4 h-4 ${stats.pendingCallbacks > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Calls Pending</div>
                <div className="text-sm font-extrabold">{stats.pendingCallbacks} client{stats.pendingCallbacks === 1 ? '' : 's'}</div>
              </div>
            </div>

            {/* Unread Messages */}
            <div className="px-3.5 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unread Chats</div>
                <div className="text-sm font-extrabold text-slate-800">{stats.unreadMessages}</div>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime sound is ON' : 'Chime sound is MUTED'}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300' 
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#9a7b4f]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchConversations()}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#9a7b4f]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content Layout (2 Columns) ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
          {/* Search & Filter Tabs */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#c5a880]/30 focus:border-[#c5a880] transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({stats.total || conversations.length})
              </button>
              <button
                onClick={() => setFilter('pending_callback')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filter === 'pending_callback'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Calls Pending ({stats.pendingCallbacks})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Unread ({stats.unreadMessages})
              </button>
            </div>
          </div>

          {/* Conversation Cards Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#9a7b4f]" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">No conversations found</p>
                <p className="text-xs text-slate-400 mt-1">Visitors who message or request a call will appear here.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?._id === conv._id;
                const isCallbackPending = conv.callbackRequested && conv.callbackStatus === 'pending';

                return (
                  <div
                    key={conv._id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 cursor-pointer transition-all relative ${
                      isSelected 
                        ? 'bg-[#faf7f2] border-l-4 border-l-[#c5a880]' 
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isCallbackPending
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                            : conv.phone
                            ? 'bg-[#c5a880]/20 text-[#9a7b4f]'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isCallbackPending ? (
                            <PhoneCall className="w-4 h-4 text-amber-600" />
                          ) : (
                            conv.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {conv.name || 'Website Visitor'}
                            </span>
                            {conv.unreadForAdmin > 0 && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            )}
                          </div>
                          {conv.phone ? (
                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#9a7b4f]" />
                              {conv.phone}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">No phone provided</div>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {formatTimeAgo(conv.lastMessageAt || conv.createdAt)}
                      </span>
                    </div>

                    {/* Status & Preview Badges */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 line-clamp-1 flex-1">
                        {conv.lastMessageText || 'Chat started'}
                      </p>

                      {isCallbackPending && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Call within 2-3 hrs
                        </span>
                      )}
                      {!isCallbackPending && conv.callbackStatus === 'called' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Called
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat History & Actions */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col h-full bg-[#faf9f6] overflow-hidden">
            {/* Top Bar of Selected Conversation */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1b1e2e] text-[#e2c799] font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedConversation.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5 bg-white border border-[#c5a880] rounded-xl p-0.5 shadow-xs">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          placeholder="Enter Customer Name"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCustomerName();
                            if (e.key === 'Escape') setIsEditingName(false);
                          }}
                        />
                        <button
                          onClick={handleSaveCustomerName}
                          disabled={savingName || !editNameValue.trim()}
                          className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                          title="Save Name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <h2 className="text-base font-bold text-slate-900">
                          {selectedConversation.name}
                        </h2>
                        <button
                          onClick={() => {
                            setEditNameValue(selectedConversation.name === 'Website Visitor' ? '' : selectedConversation.name);
                            setIsEditingName(true);
                          }}
                          className="text-slate-400 hover:text-[#9a7b4f] p-1 rounded-md hover:bg-slate-100 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                          title="Edit Customer Name"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {selectedConversation.callbackRequested && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedConversation.callbackStatus === 'pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : selectedConversation.callbackStatus === 'called'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedConversation.callbackStatus === 'pending'
                          ? '📞 Call Pending (2-3 Hours)'
                          : `Status: ${selectedConversation.callbackStatus.toUpperCase()}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {selectedConversation.phone && (
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#9a7b4f]" />
                        {selectedConversation.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Globe className="w-3 h-3" />
                      Page: {selectedConversation.sourceUrl || '/'}
                    </span>
                    <span className="text-slate-400">
                      • {selectedConversation.device || 'Web'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Call Now, WhatsApp, Status */}
              <div className="flex items-center gap-2">
                {selectedConversation.phone ? (
                  <>
                    <a
                      href={`tel:${cleanPhone(selectedConversation.phone)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                      Call Now
                    </a>
                    <a
                      href={`https://wa.me/91${cleanPhone(selectedConversation.phone)}?text=Hello%20${encodeURIComponent(selectedConversation.name)}%2C%20thank%20you%20for%20reaching%20out%20to%20Mara%20Photo!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </>
                ) : null}

                {/* Status Dropdown */}
                <select
                  value={selectedConversation.callbackStatus}
                  onChange={(e) => handleUpdateCallbackStatus(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#c5a880]/30 transition-all cursor-pointer"
                >
                  <option value="pending">🟡 Status: Pending Call</option>
                  <option value="called">🟢 Status: Called Client</option>
                  <option value="converted">⭐ Status: Deal Converted</option>
                  <option value="closed">⚪ Status: Closed</option>
                </select>

                <button
                  onClick={() => handleDeleteConversation(selectedConversation._id)}
                  title="Delete Conversation"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ─── Callback Notice Banner (If client requested a call) ─── */}
            {selectedConversation.callbackRequested && (
              <div className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                selectedConversation.callbackStatus === 'pending'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedConversation.callbackStatus === 'pending' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span>Callback Requested</span>
                      <span className="text-[11px] font-normal lowercase bg-white/70 px-2 py-0.5 rounded-md border">
                        Notice: {selectedConversation.callbackTimeNotice || 'Within 2-3 hours'}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5">
                      Client number: <strong className="font-mono text-sm underline">{selectedConversation.phone}</strong> • Requested at: {new Date(selectedConversation.callbackRequestedAt || selectedConversation.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {selectedConversation.callbackStatus === 'pending' && (
                  <button
                    onClick={() => handleUpdateCallbackStatus('called')}
                    className="px-3 py-1.5 bg-amber-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-all whitespace-nowrap"
                  >
                    Mark as Called ✓
                  </button>
                )}
              </div>
            )}

            {/* ─── Messages Scroll Area ─── */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5"
            >
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((msg, idx) => {
                  const isVisitor = msg.sender === 'visitor';
                  const isBot = msg.sender === 'bot';
                  const isAdmin = msg.sender === 'admin';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg._id || idx}
                      className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1 font-medium">
                        {isVisitor ? (
                          <span className="text-slate-600 font-semibold">{selectedConversation.name || 'Visitor'}</span>
                        ) : isBot ? (
                          <span className="text-[#9a7b4f] font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Mara AI Concierge
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Super Admin
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isVisitor
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          : isBot
                          ? 'bg-[#1e2235] text-amber-50 border border-[#c5a880]/30 rounded-tr-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs'
                      }`}>
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No messages exchanged yet.
                </div>
              )}
            </div>

            {/* ─── Canned Response Quick Pills ─── */}
            <div className="px-6 py-2 bg-white/70 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
              <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">Quick Reply:</span>
              <button
                onClick={() => setReplyText('Hello! Ayush here from Mara Photo. How can I assist your photography studio today?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#c5a880]/15 hover:text-[#9a7b4f] border border-slate-200 text-slate-700 whitespace-nowrap transition-all"
              >
                👋 Studio Intro
              </button>
              <button
                onClick={() => setReplyText(`Hello! I received your callback request. I am calling your number (${selectedConversation.phone || ''}) right now!`)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#c5a880]/15 hover:text-[#9a7b4f] border border-slate-200 text-slate-700 whitespace-nowrap transition-all"
              >
                📞 Calling You Now
              </button>
              <button
                onClick={() => setReplyText('Our plans include instant AI face search (99.8% accuracy), custom QR code gallery, dynamic watermark protection, and unlimited cloud storage. Would you like a demo?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#c5a880]/15 hover:text-[#9a7b4f] border border-slate-200 text-slate-700 whitespace-nowrap transition-all"
              >
                ⚡ Features & Demo
              </button>
            </div>

            {/* ─── Admin Reply Input Box ─── */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message to the client... (Press Enter to Send)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#c5a880]/30 focus:border-[#c5a880] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                >
                  {sendingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#c5a880]" />
                  ) : (
                    <>
                      <span>Reply Client</span>
                      <Send className="w-3.5 h-3.5 text-[#c5a880]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Select a Conversation</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Choose an inquiry from the left column to view message transcript, initiate callback, or reply directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
