'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ScanLine, RefreshCw, AlertTriangle, CheckCircle, Search, ShieldAlert, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FaceIndexDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchStatus(selectedEventId);
      // Auto-refresh status every 5 seconds if an action is running
      const interval = setInterval(() => {
        if (status?.faceIndex?.processing > 0 || status?.faceIndex?.pending > 0) {
          fetchStatus(selectedEventId);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get('/event/studio-events');
      setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to load events');
    }
  };

  const fetchStatus = async (eventId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/face-index/status/${eventId}`);
      setStatus(res.data);
    } catch (err) {
      toast.error('Failed to load face index status');
    } finally {
      setLoading(false);
    }
  };

  const handleRebuild = async () => {
    if (!confirm('Rebuilding the index will re-scan every photo for this event using the AI service. This may take a while. Proceed?')) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/face-index/rebuild/${selectedEventId}`);
      toast.success(res.data.message);
      fetchStatus(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Rebuild failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/face-index/retry/${selectedEventId}`);
      toast.success(res.data.message);
      fetchStatus(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Retry failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] text-slate-900 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Face Index Diagnostics</h1>
            <p className="text-sm text-slate-500 mt-1">Manage AI face detection and vector indexing status for your events.</p>
          </div>
        </div>

        {/* Event Selector */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Event to Inspect</label>
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:outline-none"
          >
            <option value="">-- Select an Event --</option>
            {events.map((ev: any) => (
              <option key={ev._id} value={ev._id}>{ev.name} ({new Date(ev.date).toLocaleDateString()})</option>
            ))}
          </select>
        </div>

        {selectedEventId && status && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Photos</span>
                <span className="text-3xl font-black text-slate-800">{status.totalPhotos}</span>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between bg-emerald-50/30">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Indexed
                </span>
                <span className="text-3xl font-black text-emerald-700">{status.faceIndex.indexed}</span>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-sm flex flex-col justify-between bg-orange-50/30">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Loader className="w-3 h-3" /> Pending / Processing
                </span>
                <span className="text-3xl font-black text-orange-700">{status.faceIndex.pending + status.faceIndex.processing}</span>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm flex flex-col justify-between bg-rose-50/30">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Failed
                </span>
                <span className="text-3xl font-black text-rose-700">{status.faceIndex.failed}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-slate-400" /> Vector Database Stats
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-600">Total Faces Detected</span>
                    <span className="text-sm font-black text-slate-800">{status.faceIndex.totalFacesDetected}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-600">Photos with No Faces</span>
                    <span className="text-sm font-black text-slate-800">{status.faceIndex.noFace}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-600">AI Model Version</span>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{status.modelVersion}</span>
                  </li>
                  <li className="flex justify-between items-center pb-1">
                    <span className="text-sm font-semibold text-slate-600">Search Match Threshold</span>
                    <span className="text-sm font-black text-slate-800">{status.searchThreshold * 100}%</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-slate-400" /> Admin Actions
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Use these tools if "Find My Photos" is missing results. The AI will scan the original high-resolution photos again.
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={handleRetryFailed}
                    disabled={actionLoading || status.faceIndex.failed === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry {status.faceIndex.failed} Failed Photos
                  </button>

                  <button 
                    onClick={handleRebuild}
                    disabled={actionLoading || status.totalPhotos === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 hover:bg-black text-white transition-colors disabled:opacity-50"
                  >
                    <ScanLine className="w-4 h-4" /> Rebuild Entire Face Index
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
