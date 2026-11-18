'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  X, 
  Send, 
  Phone, 
  PhoneCall, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ChevronDown, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface ChatMessage {
  _id?: string;
  sender: 'visitor' | 'admin' | 'bot';
  senderName?: string;
  text: string;
  timestamp: string;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');
  
  // Teaser bubble
  const [showTeaser, setShowTeaser] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat state
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Callback form state
  const [callName, setCallName] = useState(user?.name || '');
  const [callPhone, setCallPhone] = useState(user?.phone || '');
  const [callTopic, setCallTopic] = useState('Studio Pricing & Subscription');
  const [callSubmitted, setCallSubmitted] = useState(false);
  const [submittingCall, setSubmittingCall] = useState(false);

  useEffect(() => {
    if (user?.name && !callName) setCallName(user.name);
    if (user?.phone && !callPhone) setCallPhone(user.phone);
  }, [user]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't show chatbot inside /admin pages
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // Play audio chime for admin replies
  const playSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Ignored
    }
  };

  // 1. Initialize or load sessionId from localStorage
  useEffect(() => {
    let sid = localStorage.getItem('mara_chat_session_id');
    if (!sid) {
      sid = 'lead_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      localStorage.setItem('mara_chat_session_id', sid);
    }
    setSessionId(sid);

    // Initial greeting if no messages
    setMessages([
      {
        sender: 'bot',
        senderName: 'Mara AI Concierge',
        text: '👋 Welcome to **Mara Photo**! How can we help you today? You can choose a topic below, ask any question, or request a callback!',
        timestamp: new Date().toISOString(),
      }
    ]);

    // Show teaser after 4 seconds
    const timer = setTimeout(() => {
      if (!localStorage.getItem('mara_chat_teaser_closed')) {
        setShowTeaser(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // 2. Fetch existing conversation history from server
  const fetchConversation = async (sid: string, silent = false) => {
    if (!sid) return;
    try {
      const res = await apiClient.get(`/chatbot/conversation/${sid}`);
      if (res.data.success && res.data.exists && res.data.lead) {
        const serverMessages: ChatMessage[] = res.data.lead.messages || [];
        if (serverMessages.length > 0) {
          // Check if new admin message arrived
          if (silent && serverMessages.length > messages.length) {
            const last = serverMessages[serverMessages.length - 1];
            if (last.sender === 'admin') {
              playSound();
              if (!isOpen) {
                setUnreadCount(prev => prev + 1);
              }
            }
          }
          setMessages(serverMessages);
        }
        if (res.data.lead.callbackRequested) {
          setCallSubmitted(true);
        }
      }
    } catch (err) {
      // silent catch
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchConversation(sessionId);
    }
  }, [sessionId]);

  // Polling for updates when chat widget is open
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      fetchConversation(sessionId, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Handle visitor sending a message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || !sessionId || isSending) return;

    setInputMessage('');
    setIsSending(true);

    // Optimistic UI push
    const tempMsg: ChatMessage = {
      sender: 'visitor',
      senderName: 'You',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await apiClient.post('/chatbot/message', {
        sessionId,
        message: textToSend,
        visitorInfo: {
          name: user?.name || (callName.trim() || undefined),
          phone: user?.phone || (callPhone.trim() || undefined),
          email: user?.email || undefined,
          sourceUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
          device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop',
        }
      });

      if (res.data.success && res.data.lead) {
        setMessages(res.data.lead.messages);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Callback Request
  const handleSubmitCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callPhone.trim() || !sessionId || submittingCall) return;

    setSubmittingCall(true);
    try {
      const res = await apiClient.post('/chatbot/callback', {
        sessionId,
        name: callName.trim() || user?.name || 'Website Visitor',
        phone: callPhone.trim() || user?.phone || '',
        email: user?.email,
        notes: `Topic: ${callTopic}`,
        sourceUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
        device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop',
      });

      if (res.data.success) {
        setCallSubmitted(true);
        if (res.data.lead?.messages) {
          setMessages(res.data.lead.messages);
        }
        playSound();
      }
    } catch (error) {
      console.error('Error submitting callback request:', error);
    } finally {
      setSubmittingCall(false);
    }
  };

  return (
    <>
      {/* ─── Floating Launcher & Teaser (Bottom-Right) ─── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
        {/* Floating Greeting Teaser Bubble */}
        <AnimatePresence>
          {showTeaser && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="mb-3 max-w-xs bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#c5a880]/30 text-xs relative cursor-pointer"
              onClick={() => {
                setIsOpen(true);
                setShowTeaser(false);
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeaser(false);
                  localStorage.setItem('mara_chat_teaser_closed', 'true');
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 rounded-full text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-white/20"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 font-semibold text-[#e2c799] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
                Mara Photo Concierge
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Need help or want a quick callback? Chat with us or leave your number!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTeaser(false);
            setUnreadCount(0);
          }}
          className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, #1b1e2e 0%, #0d0f17 100%)',
            border: '2px solid rgba(197, 168, 128, 0.6)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(197, 168, 128, 0.2)',
          }}
          aria-label="Open Chatbot"
        >
          {/* Animated Gold Ring Glow */}
          <div className="absolute inset-0 rounded-full border border-[#c5a880]/40 animate-ping opacity-25 pointer-events-none" />

          {isOpen ? (
            <X className="w-6 h-6 text-[#e2c799] transition-transform duration-200" />
          ) : (
            <div className="relative">
              <MessageSquare className="w-6 h-6 text-[#e2c799]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
          )}

          {/* Unread Counter Badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* ─── Main Chatbot Window ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[580px] max-h-[82vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans"
            style={{
              background: 'linear-gradient(180deg, #121420 0%, #0b0c13 100%)',
              border: '1px solid rgba(197, 168, 128, 0.3)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(197, 168, 128, 0.15)',
            }}
          >
            {/* Header */}
            <div 
              className="px-5 py-4 border-b border-white/10 shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(27, 30, 46, 0.9) 0%, rgba(15, 17, 26, 0.95) 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5a880] to-[#8d6d3d] p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#121420] rounded-[14px] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#e2c799]" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white tracking-wide truncate">
                        Mara Photo Concierge
                      </h3>
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#c5a880] font-medium flex items-center gap-1.5 mt-0.5">
                      <span>⚡ Typically replies in 5 mins</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle Tabs (Grid Layout - Zero Overlap) */}
              <div className="mt-3.5 p-1 bg-black/60 rounded-2xl border border-white/10 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-[#c5a880] to-[#b39366] text-black font-extrabold shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>Live Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('call')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                    activeTab === 'call'
                      ? 'bg-gradient-to-r from-[#c5a880] to-[#b39366] text-black font-extrabold shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span>Request Call</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-tight ${
                    activeTab === 'call' ? 'bg-black/25 text-black' : 'bg-white/10 text-[#c5a880]'
                  }`}>
                    2-3h
                  </span>
                </button>
              </div>
            </div>

            {/* ─── TAB 1: LIVE CHAT & SMART AI ─── */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f17]">
                {/* Messages Container with Custom Dark Scrollbar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#c5a880]/40">
                  {messages.map((msg, idx) => {
                    const isVisitor = msg.sender === 'visitor';
                    const isBot = msg.sender === 'bot';
                    const isAdmin = msg.sender === 'admin';

                    return (
                      <motion.div
                        key={msg._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5 font-medium">
                          {isVisitor ? (
                            'You'
                          ) : isBot ? (
                            <span className="text-[#c5a880] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Mara AI
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                              <ShieldCheck className="w-3 h-3" /> Super Admin
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${
                          isVisitor
                            ? 'bg-gradient-to-r from-[#c5a880] to-[#b39366] text-slate-950 font-medium rounded-tr-xs'
                            : isAdmin
                            ? 'bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 rounded-tl-xs'
                            : 'bg-[#181b2a] text-slate-200 border border-white/10 rounded-tl-xs'
                        }`}>
                          <div className="whitespace-pre-wrap font-sans">
                            {msg.text}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="px-3 py-2 border-t border-white/5 bg-[#121420]/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                  <button
                    onClick={() => handleSendMessage('What are your pricing plans?')}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#c5a880]/20 hover:text-[#e2c799] border border-white/10 text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    💰 Pricing
                  </button>
                  <button
                    onClick={() => handleSendMessage('How does AI face recognition work?')}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#c5a880]/20 hover:text-[#e2c799] border border-white/10 text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    ⚡ Face Search
                  </button>
                  <button
                    onClick={() => setActiveTab('call')}
                    className="px-2.5 py-1 rounded-full bg-[#c5a880]/20 text-[#e2c799] border border-[#c5a880]/30 whitespace-nowrap font-medium transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call Me Back
                  </button>
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-[#121420] border-t border-white/10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message or ask anything..."
                      className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSending}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#a8895e] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ─── TAB 2: REQUEST CALL (2-3 HOURS CALLBACK) ─── */}
            {activeTab === 'call' && (
              <div className="flex-1 p-5 overflow-y-auto bg-[#0d0f17] flex flex-col justify-between [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#c5a880]/40">
                {callSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="my-auto text-center py-6 px-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">
                      Callback Request Confirmed!
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto mb-5">
                      Our specialist has received your request. You will receive a direct call on{' '}
                      <strong className="text-[#e2c799] font-mono">{callPhone}</strong> within{' '}
                      <strong className="text-emerald-400 font-semibold">2 to 3 hours</strong>.
                    </p>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left mb-6">
                      <div className="text-[11px] font-bold text-[#c5a880] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Guaranteed Callback Window
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Our representative is preparing your studio plan and live event demo.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <a
                        href={`https://wa.me/919999999999?text=Hello%20Mara%20Photo%2C%20I%20requested%20a%20callback%20for%20my%20studio.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Urgent? WhatsApp Us Directly
                      </a>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition-all"
                      >
                        Back to Live Chat
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 text-[#e2c799] text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Clock className="w-3 h-3 text-[#c5a880]" /> 2-3 Hours Guaranteed Response
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Request a Direct Callback
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Leave your mobile number and our senior executive will call you within 2 to 3 hours with custom plans and a live demo.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitCallback} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Your Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={callName}
                          onChange={(e) => setCallName(e.target.value)}
                          placeholder="e.g. Ayush Parmar"
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#c5a880] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Mobile Number <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-bold text-[#c5a880]">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            value={callPhone}
                            onChange={(e) => setCallPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Enter 10 digit number"
                            maxLength={10}
                            className="w-full bg-black/40 border border-white/15 rounded-xl pl-12 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-[#c5a880] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          What is this inquiry about?
                        </label>
                        <select
                          value={callTopic}
                          onChange={(e) => setCallTopic(e.target.value)}
                          className="w-full bg-[#181b2a] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-[#c5a880] transition-all cursor-pointer"
                        >
                          <option value="Studio Pricing & Subscription">💎 Studio Pricing & Subscription</option>
                          <option value="Wedding / Event Photography Demo">📸 Wedding & Event Demo</option>
                          <option value="AI Face Recognition Setup">⚡ AI Face Recognition Setup</option>
                          <option value="Storage & Retention Plans">☁️ Storage & Retention Plans</option>
                          <option value="General Question">❓ General Question</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={callPhone.length < 10 || submittingCall}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#9a7b4f] hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-[#c5a880]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4" />
                        {submittingCall ? 'Submitting Request...' : 'Call Me Back (Within 2-3 Hours)'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Footer Assurance */}
                <div className="pt-3 border-t border-white/10 text-center">
                  <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Your contact details are 100% confidential.</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
