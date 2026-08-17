'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useDashboard } from '../DashboardContext';
import apiClient from '@/lib/api';
import {
  Send, Loader2, X, CheckCircle, Video, Trash2,
  MessageSquare, ChevronRight, MessageCircle,
  Headphones, Clock, ArrowRight, Plus, Paperclip,
  Shield, AlertCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Toast ─────────────────────────────────────────────── */
function Toast({ msg, kind, onClose }: { msg: string; kind: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
    >
      <div className={`flex items-center gap-3 pl-5 pr-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${
        kind === 'ok'
          ? 'bg-emerald-950/90 text-emerald-100 border-emerald-800/40 shadow-emerald-500/10'
          : 'bg-red-950/90 text-red-100 border-red-800/40 shadow-red-500/10'
      }`}>
        {kind === 'ok'
          ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
        <span className="text-sm font-semibold">{msg}</span>
        <button onClick={onClose} className="ml-3 p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function StudioQueriesPage() {
  const { user } = useAuth();
  const { studio } = useDashboard();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [picked, setPicked] = useState<any | null>(null);

  /* ── fetch ── */
  const pull = useCallback(async () => {
    try {
      const r = await apiClient.get('/support/tickets');
      if (r.data.tickets) {
        setHistory([...r.data.tickets].sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      }
    } catch {}
  }, []);

  useEffect(() => { pull(); }, [pull]);

  /* ── files ── */
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(p => [...p, ...Array.from(e.target.files!)].slice(0, 5));
  };

  /* ── submit ── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setToast(null);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append('file', f);
        const u = await apiClient.post('/media/upload-asset', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (u.data.url) urls.push(u.data.url);
      }
      const r = await apiClient.post('/support/ticket', {
        subject,
        message,
        phone: studio?.phone || user?.phone || 'N/A',
        attachments: urls,
      });
      if (r.status === 201) {
        setToast({ msg: 'Query submitted! Our team will respond shortly.', kind: 'ok' });
        setSubject('');
        setMessage('');
        setFiles([]);
        pull();
      }
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error || 'Submission failed.', kind: 'err' });
    } finally {
      setSubmitting(false);
    }
  };

  const newCount = history.filter(t => t.status === 'RESOLVED' || t.status === 'IN_PROGRESS').length;

  /* ── render ── */
  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      {/* ─── Background Orbs ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #c5a880 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-8 max-w-3xl mx-auto pb-32">

        {/* ═══ Header ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #c5a880, #a07c4c)' }}>
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Support & Queries</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                Get help from the Mara Photo team
              </p>
            </div>
          </div>

          <button
            onClick={() => { setDrawerOpen(true); setPicked(null); }}
            className="group relative flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold
              bg-white border border-slate-200 text-slate-700
              hover:border-[#c5a880]/50 hover:shadow-lg hover:shadow-[#c5a880]/5
              active:scale-[0.98] transition-all duration-200"
          >
            <MessageSquare className="w-4.5 h-4.5 text-slate-500 group-hover:text-[#c5a880] transition-colors" />
            My Queries
            {history.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black bg-[#c5a880] text-white shadow-sm">
                {history.length}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* ═══ Quick Stats Bar ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: 'Total Queries', value: history.length, icon: FileText, color: '#6366f1' },
            { label: 'Awaiting Reply', value: history.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length, icon: Clock, color: '#f59e0b' },
            { label: 'Resolved', value: history.filter(t => t.status === 'RESOLVED').length, icon: Shield, color: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}12` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">{s.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ═══ Form Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-6 lg:px-8 pt-7 pb-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#c5a880]/10 flex items-center justify-center">
                <Send className="w-4.5 h-4.5 text-[#c5a880]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">New Query</h2>
                <p className="text-[11px] text-slate-400 font-medium">We usually respond within 24 hours</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="p-6 lg:p-8 space-y-5">
            {/* ── Contact Info ── */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Studio</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium">
                    <div className="w-6 h-6 rounded-lg bg-[#c5a880] flex items-center justify-center shrink-0">
                      <span className="text-white text-[9px] font-black">{(studio?.name || user?.name || 'S')[0]}</span>
                    </div>
                    <span className="truncate">{studio?.name || user?.name || '—'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                  <div className="bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium truncate">
                    {studio?.phone || user?.phone || '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <div className="bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium truncate">
                  {user?.email || '—'}
                </div>
              </div>
            </div>

            {/* ── Subject ── */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Subject</label>
              <input
                type="text" required value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-xl text-sm font-medium
                  focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] outline-none transition-all"
              />
            </div>

            {/* ── Message ── */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Message</label>
              <textarea
                required value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-xl text-sm font-medium
                  focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] outline-none transition-all resize-none"
              />
            </div>

            {/* ── Attachments ── */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                Attachments <span className="text-slate-400 font-semibold normal-case tracking-normal">(optional, max 5)</span>
              </label>
              <div className="flex flex-wrap gap-3 items-start">
                {files.map((file, i) => {
                  const isVid = file.type.startsWith('video/');
                  const isImg = file.type.startsWith('image/');
                  return (
                    <div key={i} className="relative w-[72px] h-[72px] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-sm">
                      {isImg && <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />}
                      {isVid && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                          <Video className="w-5 h-5" />
                        </div>
                      )}
                      {!isImg && !isVid && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                          <Paperclip className="w-5 h-5" />
                        </div>
                      )}
                      <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {files.length < 5 && (
                  <label className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-slate-200 hover:border-[#c5a880]/50
                    text-slate-400 hover:text-[#c5a880] flex flex-col items-center justify-center cursor-pointer
                    transition-all bg-white hover:bg-[#c5a880]/5 hover:shadow-sm">
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onFiles} />
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Add</span>
                  </label>
                )}
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2.5
                transition-all duration-200
                bg-gradient-to-r from-slate-900 to-slate-800 text-white
                shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25
                hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                : <><Send className="w-4.5 h-4.5" /> Submit Query</>}
            </button>
          </form>
        </motion.div>
      </div>

      {/* ═══ Toast ═══ */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ═══ Drawer ═══ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 w-full max-w-md z-[101] flex flex-col
                bg-white shadow-2xl border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="h-[72px] border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#c5a880]/10 flex items-center justify-center">
                    <MessageSquare className="w-4.5 h-4.5 text-[#c5a880]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base leading-none">My Queries</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{history.length} Total</span>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {picked ? (
                    /* ── Detail View ── */
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-5"
                    >
                      <button onClick={() => setPicked(null)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#c5a880] mb-5 transition-colors group">
                        <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        Back to list
                      </button>

                      <div className="bg-slate-50/80 rounded-2xl border border-slate-100 overflow-hidden">
                        {/* Detail Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <StatusBadge status={picked.status} />
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(picked.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>

                        <div className="p-5">
                          <h4 className="font-black text-slate-800 text-lg leading-snug mb-6">{picked.subject}</h4>

                          {/* Messages thread */}
                          <div className="space-y-5">
                            {picked.messages.map((m: any, i: number) => (
                              <div key={i} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black ${
                                    m.sender === 'ADMIN'
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-[#c5a880] text-white'
                                  }`}>
                                    {m.sender === 'ADMIN' ? 'A' : 'Y'}
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {m.sender === 'ADMIN' ? 'Admin Reply' : 'You'}
                                  </span>
                                  <span className="text-[9px] text-slate-300 ml-auto">
                                    {new Date(m.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                                  m.sender === 'ADMIN'
                                    ? 'bg-slate-900 text-slate-100 ml-2 rounded-tl-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 ml-2 rounded-tl-sm shadow-sm'
                                }`}>
                                  {m.message}

                                  {m.attachments && m.attachments.length > 0 && (
                                    <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2 ${
                                      m.sender === 'ADMIN' ? 'border-white/10' : 'border-slate-100'
                                    }`}>
                                      {m.attachments.map((att: string, ai: number) => {
                                        const vid = att.toLowerCase().match(/\.(mp4|webm|ogg)$/);
                                        return (
                                          <a key={ai} href={att} target="_blank" rel="noopener noreferrer"
                                            className="block w-14 h-14 rounded-lg overflow-hidden border border-white/20 hover:ring-2 hover:ring-[#c5a880]/40 transition-all">
                                            {vid ? (
                                              <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                                <Video className="w-4 h-4 text-white/80" />
                                              </div>
                                            ) : (
                                              <img src={att} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* ── List View ── */
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 space-y-2"
                    >
                      {history.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <MessageCircle className="w-7 h-7 text-slate-300" />
                          </div>
                          <h4 className="text-slate-700 font-black text-base mb-1">No Queries Yet</h4>
                          <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">
                            Submit your first query and it will appear here.
                          </p>
                        </div>
                      ) : (
                        history.map((t, idx) => (
                          <motion.button
                            key={t._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            onClick={() => setPicked(t)}
                            className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-white
                              hover:border-[#c5a880]/30 hover:shadow-md hover:shadow-[#c5a880]/5
                              transition-all duration-200 group relative overflow-hidden"
                          >
                            {/* Hover accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c5a880] rounded-r-full
                              opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center justify-between mb-2">
                              <StatusBadge status={t.status} />
                              <span className="text-[10px] font-bold text-slate-400">
                                {new Date(t.createdAt).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-[#c5a880] transition-colors leading-snug">
                              {t.subject}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {t.messages[0]?.message}
                            </p>

                            {/* Admin reply indicator */}
                            {t.messages.some((m: any) => m.sender === 'ADMIN') && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-slate-900 flex items-center justify-center">
                                  <span className="text-[7px] font-black text-white">A</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600">Admin replied</span>
                                <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            )}
                          </motion.button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    OPEN:        { bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700', label: 'Open' },
    IN_PROGRESS: { bg: 'bg-blue-50 border-blue-200/60',   text: 'text-blue-700',  label: 'In Progress' },
    RESOLVED:    { bg: 'bg-emerald-50 border-emerald-200/60', text: 'text-emerald-700', label: 'Resolved' },
  };
  const s = map[status] || map.OPEN;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${s.bg} ${s.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'OPEN' ? 'bg-amber-500' : status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      {s.label}
    </span>
  );
}
