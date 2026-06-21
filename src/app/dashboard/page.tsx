'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film
} from 'lucide-react';
import { apiClient } from '../../lib/api';

const EVENT_TYPES = [
  'WEDDING', 'PRE_WEDDING', 'RECEPTION', 'BIRTHDAY', 
  'CORPORATE', 'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS'
];

export default function Dashboard() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Layout Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'branding' | 'billing' | 'support'>('overview');
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [studio, setStudio] = useState<any>(null);

  // States
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventMedia, setEventMedia] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selection & Lightbox States
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Analytics states
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Create Event Form
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('WEDDING');
  const [eventCover, setEventCover] = useState('');
  const [eventAccess, setEventAccess] = useState('PUBLIC');
  const [eventPassword, setEventPassword] = useState('');
  const [teamEmails, setTeamEmails] = useState('');

  // Edit Event Form
  const [editEventName, setEditEventName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientMobile, setEditClientMobile] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventType, setEditEventType] = useState('WEDDING');
  const [editEventCover, setEditEventCover] = useState('');
  const [editEventAccess, setEditEventAccess] = useState('PUBLIC');
  const [editEventPassword, setEditEventPassword] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [editEventWmIsActive, setEditEventWmIsActive] = useState(false);
  const [editEventWmType, setEditEventWmType] = useState<'TEXT' | 'LOGO'>('LOGO');
  const [editEventWmText, setEditEventWmText] = useState('');
  const [editEventWmLogo, setEditEventWmLogo] = useState('');
  const [editEventWmPos, setEditEventWmPos] = useState('BOTTOM_RIGHT');
  const [editEventWmWidth, setEditEventWmWidth] = useState(20);
  const [editEventWmHeight, setEditEventWmHeight] = useState(20);
  const [editEventWmOpacity, setEditEventWmOpacity] = useState(0.5);
  const [generatedLink, setGeneratedLink] = useState('');

  // Branding Form
  const [studioName, setStudioName] = useState('');
  const [studioLogo, setStudioLogo] = useState('');
  const [studioSubdomain, setStudioSubdomain] = useState('');
  const [studioCustomDomain, setStudioCustomDomain] = useState('');
  const [wmType, setWmType] = useState('NONE');
  const [wmText, setWmText] = useState('');
  const [wmLogo, setWmLogo] = useState('');
  const [wmPos, setWmPos] = useState('BOTTOM_RIGHT');
  const [wmOpacity, setWmOpacity] = useState(0.5);

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Info Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [processingStats, setProcessingStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/login');
      return;
    }
    const user = JSON.parse(userStr);
    setSessionUser(user);

    fetchStudioAndData();
  }, []);

  const fetchStudioAndData = async () => {
    setLoading(true);
    try {
      const resStudio = await apiClient.get('/studio/me');
      setStudio(resStudio.data.studio);
      
      const s = resStudio.data.studio;
      setStudioName(s.name);
      setStudioLogo(s.logoUrl || '');
      setStudioSubdomain(s.subdomain);
      setStudioCustomDomain(s.customDomain || '');
      setWmType(s.watermark?.type || 'NONE');
      setWmText(s.watermark?.text || '');
      setWmLogo(s.watermark?.logoUrl || '');
      setWmPos(s.watermark?.position || 'BOTTOM_RIGHT');
      setWmOpacity(s.watermark?.opacity || 0.5);

      const resEvents = await apiClient.get('/event/my');
      setEvents(resEvents.data.events);

      const resAnalytics = await apiClient.get('/analytics/studio');
      setStats(resAnalytics.data.stats);
      setChartData(resAnalytics.data.trends);

      const resTickets = await apiClient.get('/support/tickets');
      setTickets(resTickets.data.tickets);

    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // 1. EVENT ACTIONS
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: eventName,
        clientName,
        clientMobile,
        clientEmail,
        date: eventDate,
        type: eventType,
        coverImageUrl: eventCover,
        accessType: eventAccess,
        password: eventPassword,
        assignedTeamEmails: teamEmails ? teamEmails.split(',').map((email) => email.trim()) : [],
      };
      await apiClient.post('/event', payload);
      setSuccessMsg('Event created successfully!');
      
      setEventName('');
      setClientName('');
      setClientMobile('');
      setClientEmail('');
      setEventDate('');
      setEventCover('');
      setEventAccess('PUBLIC');
      setEventPassword('');
      setTeamEmails('');

      const resEvents = await apiClient.get('/event/my');
      setEvents(resEvents.data.events);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event);
    setEventMedia([]);
    setQrCodeData('');

    // Pre-populate edit event details
    setEditEventName(event.name);
    setEditClientName(event.clientName);
    setEditClientMobile(event.clientMobile);
    setEditClientEmail(event.clientEmail);
    setEditEventDate(event.date ? new Date(event.date).toISOString().split('T')[0] : '');
    setEditEventType(event.type);
    setEditEventCover(event.coverImageUrl || '');
    setEditEventAccess(event.accessType);
    setEditEventPassword('');
    setEditEventLocation(event.location || '');
    setEditEventDescription(event.description || '');
    setEditEventWmIsActive(event.watermark?.isActive || false);
    setEditEventWmType(event.watermark?.type || 'LOGO');
    setEditEventWmText(event.watermark?.text || '');
    setEditEventWmLogo(event.watermark?.logoUrl || '');
    setEditEventWmPos(event.watermark?.position || 'BOTTOM_RIGHT');
    setEditEventWmWidth(event.watermark?.width || 20);
    setEditEventWmHeight(event.watermark?.height || 20);
    setEditEventWmOpacity(event.watermark?.opacity !== undefined ? event.watermark.opacity : 0.5);
    setGeneratedLink('');

    fetchEventDetails(event._id, event.code);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: editEventName,
        clientName: editClientName,
        clientMobile: editClientMobile,
        clientEmail: editClientEmail,
        date: editEventDate,
        type: editEventType,
        coverImageUrl: editEventCover,
        accessType: editEventAccess,
        password: editEventPassword || undefined,
        location: editEventLocation,
        description: editEventDescription,
        watermark: {
          isActive: editEventWmIsActive,
          type: editEventWmType,
          text: editEventWmText,
          logoUrl: editEventWmLogo,
          position: editEventWmPos,
          width: editEventWmWidth,
          height: editEventWmHeight,
          opacity: editEventWmOpacity,
        },
      };
      const res = await apiClient.put(`/event/${selectedEvent._id}`, payload);
      setSuccessMsg('Event details updated successfully!');
      setSelectedEvent(res.data.event);
      
      const newWm = JSON.stringify(payload.watermark || {});
      const oldWm = JSON.stringify(selectedEvent.watermark || {});
      
      if (newWm !== oldWm && eventMedia.length > 0) {
        setIsProcessingModalOpen(true);
        setProcessingStats({ total: eventMedia.length, completed: 0 });
      }

      // Refresh event list
      const resEvents = await apiClient.get('/event/my');
      setEvents(resEvents.data.events);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update event details');
    }
  };

  const fetchEventDetails = async (eventId: string, eventCode: string) => {
    try {
      const resMedia = await apiClient.get(`/media/event/${eventId}`);
      setEventMedia(resMedia.data.media);

      setQrLoading(true);
      const resQR = await apiClient.get(`/event/code/${eventCode}/qr`);
      setQrCodeData(resQR.data.qrCode);
    } catch (err) {
      console.error(err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    fieldId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(fieldId);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/media/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setter(res.data.url);
      setSuccessMsg('Image uploaded to Cloudflare R2 successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to upload image file');
    } finally {
      setUploadingAsset(null);
    }
  };

  const uploadFiles = async (files: FileList) => {
    if (!selectedEvent) return;

    setErrorMsg('');
    setSuccessMsg('');

    const filesArray = Array.from(files);
    const totalFiles = filesArray.length;
    let uploadedCount = 0;
    const batchSize = 25;

    setUploadProgress(`Uploading 0 of ${totalFiles} items...`);

    for (let i = 0; i < filesArray.length; i += batchSize) {
      const batch = filesArray.slice(i, i + batchSize);
      const formData = new FormData();

      batch.forEach((file) => {
        formData.append('files', file);
        
        // Extract folder path
        let folderPath = '';
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            parts.pop(); // Remove filename
            folderPath = parts.join('/');
          }
        }
        formData.append('folderPaths', folderPath);
      });

      try {
        await apiClient.post(`/media/event/${selectedEvent._id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedCount += batch.length;
        setUploadProgress(`Uploaded ${Math.min(uploadedCount, totalFiles)} of ${totalFiles} items...`);
        fetchEventDetails(selectedEvent._id, selectedEvent.code);
      } catch (err: any) {
        console.error('Batch upload error:', err);
        setErrorMsg(err.response?.data?.error || `Failed to upload some media files. Uploaded ${uploadedCount} so far.`);
        break;
      }
    }

    if (uploadedCount === totalFiles) {
      setSuccessMsg(`Successfully uploaded all ${totalFiles} media files!`);
      setUploadProgress('');
    }

    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Filter to only image/video files from the folder
    const mediaFiles = Array.from(files).filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (mediaFiles.length === 0) {
      setErrorMsg('No image or video files found in the selected folder.');
      return;
    }
    // Create a new DataTransfer to build a FileList
    const dt = new DataTransfer();
    mediaFiles.forEach(f => dt.items.add(f));
    await uploadFiles(dt.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
  };

  const handleDeleteMedia = async (mediaId: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Are you sure you want to delete this media?')) return;
    try {
      await apiClient.delete(`/media/${mediaId}`);
      if (!skipConfirm) setSuccessMsg('Media deleted successfully.');
      fetchEventDetails(selectedEvent._id, selectedEvent.code);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Delete failed.');
    }
  };

  const toggleSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMediaIds);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMediaIds(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedMediaIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMediaIds.size} selected photos?`)) return;
    try {
      await apiClient.delete(`/media/event/${selectedEvent._id}/media`, {
        data: { mediaIds: Array.from(selectedMediaIds) }
      });
      setSuccessMsg('Selected photos deleted successfully.');
      setSelectedMediaIds(new Set());
      setIsSelectMode(false);
      fetchEventDetails(selectedEvent._id, selectedEvent.code);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Bulk delete failed.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('WARNING: Are you sure you want to delete ALL photos for this event? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/media/event/${selectedEvent._id}/media`);
      setSuccessMsg('All photos deleted successfully.');
      setSelectedMediaIds(new Set());
      setIsSelectMode(false);
      fetchEventDetails(selectedEvent._id, selectedEvent.code);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Delete all failed.');
    }
  };

  const openLightbox = (mediaId: string) => {
    const index = eventMedia.findIndex(m => m._id === mediaId);
    if (index !== -1) setLightboxIndex(index);
  };

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (lightboxIndex === null) return;
    if (direction === 'next') {
      setLightboxIndex(lightboxIndex === eventMedia.length - 1 ? 0 : lightboxIndex + 1);
    } else {
      setLightboxIndex(lightboxIndex === 0 ? eventMedia.length - 1 : lightboxIndex - 1);
    }
  };

  // Keyboard support for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') navigateLightbox('next');
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, eventMedia.length]);

  // Poll media status if processing modal is open
  useEffect(() => {
    if (!isProcessingModalOpen || !selectedEvent) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/media/event/${selectedEvent._id}`);
        const total = data.media.length;
        const completed = data.media.filter((m: any) => m.processedStatus === 'COMPLETED').length;
        
        setProcessingStats({ total, completed });
        setEventMedia(data.media);

        if (total > 0 && completed === total) {
          setIsProcessingModalOpen(false);
          setSuccessMsg('Watermarks successfully applied to all images!');
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessingModalOpen, selectedEvent]);


  // Auto-refresh gallery when media is still processing
  useEffect(() => {
    if (!selectedEvent) return;
    const hasPending = eventMedia.some(m => m.processedStatus === 'PENDING' || m.processedStatus === 'PROCESSING');
    if (!hasPending) return;

    const intervalId = setInterval(() => {
      fetchEventDetails(selectedEvent._id, selectedEvent.code);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [selectedEvent, eventMedia]);

  // 2. BRANDING UPDATE
  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: studioName,
        logoUrl: studioLogo,
        subdomain: studioSubdomain,
        customDomain: studioCustomDomain,
        watermark: {
          type: wmType,
          text: wmText,
          logoUrl: wmLogo,
          position: wmPos,
          opacity: wmOpacity,
        },
      };
      const res = await apiClient.put('/studio/me', payload);
      setStudio(res.data.studio);
      setSuccessMsg('Studio branding updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Update failed.');
    }
  };

  // 3. BILLING SUB
  const handleSubscribe = async (plan: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/payment/checkout', { plan });
      if (plan === 'STARTER') {
        setSuccessMsg('Subscribed to Starter Plan successfully!');
        fetchStudioAndData();
      } else {
        window.open(res.data.shortUrl, '_blank');
        setSuccessMsg('Subscription link opened! Complete payment and your plan will update.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Subscription checkout failed.');
    }
  };

  const handleCancelSub = async () => {
    if (!confirm('Are you sure you want to cancel your subscription plan?')) return;
    try {
      await apiClient.post('/payment/cancel');
      setSuccessMsg('Subscription cancelled successfully.');
      fetchStudioAndData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Cancellation failed.');
    }
  };

  // 4. SUPPORT ACTIONS
  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/support/ticket', {
        subject: newTicketSubject,
        message: newTicketMessage,
      });
      setSuccessMsg('Support ticket created successfully!');
      setNewTicketSubject('');
      setNewTicketMessage('');
      
      const resTickets = await apiClient.get('/support/tickets');
      setTickets(resTickets.data.tickets);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to open ticket');
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage || !selectedTicket) return;
    try {
      const res = await apiClient.post(`/support/ticket/${selectedTicket._id}/reply`, {
        message: replyMessage,
      });
      setSelectedTicket(res.data.ticket);
      setReplyMessage('');

      const resTickets = await apiClient.get('/support/tickets');
      setTickets(resTickets.data.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex overflow-hidden">
      {/* Sidebar navigation - Dark Navy background (#0F172A) */}
      <aside className="w-64 bg-[#0F172A] text-slate-100 flex flex-col justify-between p-6 shrink-0 shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
              <Camera className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">Mara Photo</span>
          </div>

          <nav className="flex flex-col gap-2">
            <button onClick={() => { setActiveTab('overview'); setSelectedEvent(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <LayoutDashboard className="h-4.5 w-4.5" />
              Overview
            </button>
            <button onClick={() => setActiveTab('events')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Calendar className="h-4.5 w-4.5" />
              Events
            </button>
            <button onClick={() => { setActiveTab('branding'); setSelectedEvent(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'branding' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Settings className="h-4.5 w-4.5" />
              Studio Branding
            </button>
            <button onClick={() => { setActiveTab('billing'); setSelectedEvent(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'billing' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <CreditCard className="h-4.5 w-4.5" />
              Plans & Billing
            </button>
            <button onClick={() => { setActiveTab('support'); setSelectedEvent(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'support' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <HelpCircle className="h-4.5 w-4.5" />
              Support Help
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          {sessionUser && (
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[120px] text-white">{sessionUser.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{sessionUser.role}</span>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative p-8">
        {/* Banner Messages */}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold leading-relaxed">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="hover:text-emerald-900">Close</button>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold leading-relaxed">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="hover:text-rose-900">Close</button>
          </div>
        )}
        {uploadProgress && (
          <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
            <Loader className="h-4.5 w-4.5 animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-extrabold text-slate-800">Studio Overview</h1>
            
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="glass-panel bg-white p-6 rounded-2xl flex flex-col gap-1.5 border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Events</span>
                <span className="text-3xl font-extrabold font-mono text-blue-600">{stats.totalEvents}</span>
              </div>
              <div className="glass-panel bg-white p-6 rounded-2xl flex flex-col gap-1.5 border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Photos Processed</span>
                <span className="text-3xl font-extrabold font-mono text-slate-800">{stats.totalPhotos}</span>
              </div>
              <div className="glass-panel bg-white p-6 rounded-2xl flex flex-col gap-1.5 border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Videos Processed</span>
                <span className="text-3xl font-extrabold font-mono text-slate-800">{stats.totalVideos}</span>
              </div>
              <div className="glass-panel bg-white p-6 rounded-2xl flex flex-col gap-1.5 border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Searches Used</span>
                <span className="text-3xl font-extrabold font-mono text-cyan-600">{stats.searchesUsed}</span>
              </div>
            </div>

            {/* Subscription & limit cards */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 glass-panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold mb-6 text-slate-700">Monthly Upload Volume</h3>
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="uploads" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No uploads recorded yet</div>
                  )}
                </div>
              </div>

              <div className="col-span-4 glass-panel bg-white p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold mb-4 text-slate-700">Subscription Status</h3>
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-extrabold text-blue-600">{stats.plan} Plan</span>
                    <span className="text-xs text-slate-500 font-semibold">Status: <strong className="text-emerald-600">{stats.status}</strong></span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Need higher event limits or AI face search limits? You can change your active plan at any time.
                  </p>
                  <button onClick={() => setActiveTab('billing')} className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl border border-blue-200 text-xs font-bold transition-colors">
                    Upgrade Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-8">
            {!selectedEvent ? (
              <div className="grid grid-cols-12 gap-8">
                {/* Event list */}
                <div className="col-span-8 flex flex-col gap-6">
                  <h1 className="text-2xl font-extrabold text-slate-800">Event Galleries</h1>
                  <div className="grid grid-cols-2 gap-6">
                    {events.map((event) => (
                      <div key={event._id} onClick={() => handleSelectEvent(event)} className="glass-panel bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-44 group shadow-sm transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase font-bold">
                              {event.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{event.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-1">{event.location || 'No location'}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                          <span className="text-[10px] text-slate-500 font-bold">Access: <strong className="text-slate-800">{event.accessType}</strong></span>
                          <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">
                            Manage
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Create Event Form */}
                <div className="col-span-4 glass-panel bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-base font-bold text-slate-850 mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    New Event
                  </h3>
                  <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Event Name</label>
                      <input type="text" required value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Sharma Wedding" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Client Name</label>
                        <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Raj Sharma" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Client Mobile</label>
                        <input type="text" required value={clientMobile} onChange={(e) => setClientMobile(e.target.value)} placeholder="+919876543210" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Client Email</label>
                      <input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@wedding.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Event Date</label>
                        <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Event Type</label>
                        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white">
                          {EVENT_TYPES.map((t) => (
                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Cover Image</label>
                      <div className="flex items-center gap-3">
                        {eventCover ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                            <img src={eventCover} alt="Cover Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEventCover('')}
                              className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors w-full text-center">
                            {uploadingAsset === 'eventCover' ? (
                              <span className="flex items-center gap-1.5 justify-center">
                                <Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...
                              </span>
                            ) : (
                              'Choose File'
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAssetUpload(e, setEventCover, 'eventCover')}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Max 5MB. JPG, PNG, WEBP</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Access Type</label>
                        <select value={eventAccess} onChange={(e) => setEventAccess(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white">
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="PASSWORD">PASSWORD</option>
                          <option value="OTP">OTP</option>
                        </select>
                      </div>
                      {eventAccess === 'PASSWORD' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Gallery Password</label>
                          <input type="password" required value={eventPassword} onChange={(e) => setEventPassword(e.target.value)} placeholder="Pass123" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Assign Team Members (Emails, comma sep.)</label>
                      <input type="text" value={teamEmails} onChange={(e) => setTeamEmails(e.target.value)} placeholder="team1@studio.com, team2@studio.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition-colors">
                      Create Event Gallery
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // MANAGE EVENT PANEL
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-slate-800 text-xs font-bold underline">
                      ← Back to Events
                    </button>
                    <h1 className="text-xl font-extrabold text-slate-800">{selectedEvent.name}</h1>
                  </div>

                  <div className="flex items-center gap-4">
                    <a href={`/e/${selectedEvent.code}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                      View Live Gallery
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  {/* Upload & Gallery Area */}
                  <div className="col-span-8 flex flex-col gap-6">
                    <div
                      className={`glass-panel p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all relative ${
                        isDragging
                          ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
                          : 'border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className={`h-8 w-8 mb-3 transition-colors ${isDragging ? 'text-blue-700 animate-bounce' : 'text-blue-600'}`} />
                      <span className="text-sm font-bold text-slate-700">Upload Media</span>
                      <span className="text-xs text-slate-450 mt-1 font-semibold mb-6">Select a category below or drag and drop files.</span>
                      
                      <div className="grid grid-cols-3 gap-4 w-full">
                        {/* Folder Upload */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <FolderUp className="h-6 w-6" />
                          <span className="text-xs font-bold">Entire Folder</span>
                        </button>
                        
                        {/* Image Upload */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-xs font-bold">Photos</span>
                        </button>
                        
                        {/* Video Upload */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <Film className="h-6 w-6" />
                          <span className="text-xs font-bold">Videos</span>
                        </button>
                      </div>

                      <input type="file" multiple ref={imageInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                      <input type="file" multiple ref={videoInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" />
                      <input
                        type="file"
                        ref={folderInputRef}
                        onChange={handleFolderUpload}
                        className="hidden"
                        /* @ts-ignore */
                        webkitdirectory=""
                        directory=""
                        multiple
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-650">Media Files ({eventMedia.length})</h3>
                        {eventMedia.length > 0 && (
                          <div className="flex items-center gap-2">
                            {isSelectMode ? (
                              <>
                                <button onClick={() => setIsSelectMode(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                                  Cancel
                                </button>
                                {selectedMediaIds.size > 0 && (
                                  <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Selected ({selectedMediaIds.size})
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button onClick={() => setIsSelectMode(true)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                                  <CheckSquare className="h-3.5 w-3.5" />
                                  Select Photos
                                </button>
                                <button onClick={handleDeleteAll} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete All
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {eventMedia.length > 0 ? (
                        <div className="flex flex-col gap-6">
                          {Object.entries(
                            eventMedia.reduce((acc, m) => {
                              const fp = m.folderPath || 'Root Folder';
                              if (!acc[fp]) acc[fp] = [];
                              acc[fp].push(m);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([folder, items]: [string, any[]]) => (
                            <div key={folder} className="flex flex-col gap-3">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{folder} ({items.length})</h4>
                              <div className="grid grid-cols-4 gap-4">
                                {items.map((m) => (
                                  <div 
                                    key={m._id} 
                                    className={`aspect-square rounded-xl overflow-hidden relative group cursor-pointer transition-all ${selectedMediaIds.has(m._id) ? 'ring-4 ring-blue-500 ring-offset-2' : 'border border-slate-250 hover:border-blue-400'}`}
                                    onClick={() => isSelectMode ? toggleSelection(m._id) : openLightbox(m._id)}
                                  >
                                    {isSelectMode && (
                                      <div className="absolute top-2 right-2 z-10 bg-white rounded-md shadow-sm pointer-events-none">
                                        {selectedMediaIds.has(m._id) ? (
                                          <CheckSquare className="h-5 w-5 text-blue-600" />
                                        ) : (
                                          <Square className="h-5 w-5 text-slate-300" />
                                        )}
                                      </div>
                                    )}
                                    {m.thumbnailUrl ? (
                                      <img src={`${m.thumbnailUrl}?t=${new Date(m.updatedAt).getTime()}`} alt="media" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold font-mono">
                                        {m.type}
                                      </div>
                                    )}
                                    
                                    <div className="absolute top-1.5 left-1.5">
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${m.processedStatus === 'COMPLETED' ? 'bg-emerald-500 text-white' : m.processedStatus === 'PROCESSING' ? 'bg-blue-600 text-white animate-pulse' : m.processedStatus === 'PENDING' ? 'bg-amber-500 text-white animate-pulse' : 'bg-rose-500 text-white'}`}>
                                        {m.processedStatus}
                                      </span>
                                    </div>

                                    <button onClick={() => handleDeleteMedia(m._id)} className="absolute bottom-2.5 right-2.5 bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 glass-panel bg-white border border-slate-200 rounded-2xl shadow-sm">
                          No media files uploaded yet. Select files to start.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Panel */}
                  <div className="col-span-4 flex flex-col gap-6">
                    <div className="glass-panel bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm">
                      <h3 className="text-sm font-bold text-slate-650 mb-4">Event Guest QR Code</h3>
                      {qrLoading ? (
                        <div className="h-48 flex items-center justify-center">
                          <Loader className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : qrCodeData ? (
                        <div className="flex flex-col items-center gap-4">
                          <img src={qrCodeData} alt="Event QR" className="w-48 h-48 rounded-xl border border-slate-200 bg-white p-2" />
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-[200px]">
                            Guests can scan this QR code to access the gallery, upload a selfie, and view all matches.
                          </p>
                          <a href={qrCodeData} download={`${selectedEvent.code}_qr.png`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm">
                            <Download className="h-3.5 w-3.5" />
                            Download QR Image
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Failed to load QR code</div>
                      )}
                    </div>

                    {/* Edit Event Details Panel */}
                    <div className="glass-panel bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-slate-650 flex items-center gap-1.5">
                        <Settings className="h-4 w-4 text-blue-600" />
                        Edit Event Details
                      </h3>
                      <form onSubmit={handleUpdateEvent} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Event Name</label>
                          <input type="text" required value={editEventName} onChange={(e) => setEditEventName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Client Name</label>
                          <input type="text" required value={editClientName} onChange={(e) => setEditClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Client Mobile</label>
                            <input type="text" required value={editClientMobile} onChange={(e) => setEditClientMobile(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Client Email</label>
                            <input type="email" required value={editClientEmail} onChange={(e) => setEditClientEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Event Date</label>
                            <input type="date" required value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Event Type</label>
                            <select value={editEventType} onChange={(e) => setEditEventType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white">
                              {EVENT_TYPES.map((t) => (
                                <option key={t} value={t}>{t.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Event Location</label>
                          <input type="text" value={editEventLocation} onChange={(e) => setEditEventLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Cover Image</label>
                          <div className="flex items-center gap-3">
                            {editEventCover ? (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                                <img src={editEventCover} alt="Cover Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setEditEventCover('')}
                                  className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white text-[9px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                                <Camera className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1">
                              <label className="inline-flex items-center justify-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors w-full text-center">
                                {uploadingAsset === 'editEventCover' ? (
                                  <span className="flex items-center gap-1.5 justify-center">
                                    <Loader className="h-3 w-3 animate-spin" /> Uploading...
                                  </span>
                                ) : (
                                  'Choose File'
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAssetUpload(e, setEditEventCover, 'editEventCover')}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Access Type</label>
                            <select value={editEventAccess} onChange={(e) => setEditEventAccess(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-blue-600 focus:bg-white">
                              <option value="PUBLIC">PUBLIC</option>
                              <option value="PASSWORD">PASSWORD</option>
                              <option value="OTP">OTP</option>
                            </select>
                          </div>
                          {editEventAccess === 'PASSWORD' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-slate-500 font-bold uppercase">New Password</label>
                              <input type="password" value={editEventPassword} onChange={(e) => setEditEventPassword(e.target.value)} placeholder="Keep blank if unchanged" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-600 focus:bg-white" />
                            </div>
                          )}
                        </div>
                        <div className="border-t border-slate-200 mt-2 pt-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-800 font-bold uppercase flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-blue-600" />
                              Custom Event Watermark
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={editEventWmIsActive} onChange={(e) => setEditEventWmIsActive(e.target.checked)} className="sr-only peer" />
                              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          {editEventWmIsActive && (
                            <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Watermark Type</label>
                                <select value={editEventWmType} onChange={(e) => setEditEventWmType(e.target.value as 'TEXT' | 'LOGO')} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-blue-600">
                                  <option value="LOGO">Logo Image</option>
                                  <option value="TEXT">Text Watermark</option>
                                </select>
                              </div>

                              {editEventWmType === 'TEXT' && (
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Watermark Text</label>
                                  <input type="text" value={editEventWmText} onChange={(e) => setEditEventWmText(e.target.value)} placeholder="© Studio Name" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-blue-600" />
                                </div>
                              )}

                              {editEventWmType === 'LOGO' && (
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Watermark Logo</label>
                                  <div className="flex items-center gap-3">
                                    {editEventWmLogo ? (
                                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                                        <img src={editEventWmLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                                        <button type="button" onClick={() => setEditEventWmLogo('')} className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white text-[8px] font-bold opacity-0 hover:opacity-100 transition-opacity">Remove</button>
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-white text-slate-400 shrink-0">
                                        <Camera className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <label className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors w-full text-center">
                                        {uploadingAsset === 'editEventWmLogo' ? <span className="flex items-center gap-1.5"><Loader className="h-3 w-3 animate-spin" /> Uploading...</span> : 'Choose Logo'}
                                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, setEditEventWmLogo, 'editEventWmLogo')} className="hidden" />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Position</label>
                                  <select value={editEventWmPos} onChange={(e) => setEditEventWmPos(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-blue-600">
                                    <option value="TOP_LEFT">Top Left</option>
                                    <option value="TOP_RIGHT">Top Right</option>
                                    <option value="BOTTOM_LEFT">Bottom Left</option>
                                    <option value="BOTTOM_RIGHT">Bottom Right</option>
                                    <option value="CENTER">Center</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Opacity ({Math.round(editEventWmOpacity * 100)}%)</label>
                                  <input type="range" min="0.1" max="1.0" step="0.05" value={editEventWmOpacity} onChange={(e) => setEditEventWmOpacity(parseFloat(e.target.value))} className="w-full h-6 cursor-pointer accent-blue-600" />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Width (%)</label>
                                  <input type="number" min="1" max="100" value={editEventWmWidth || ''} onChange={(e) => setEditEventWmWidth(parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-blue-600" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase">Height (%)</label>
                                  <input type="number" min="1" max="100" value={editEventWmHeight || ''} onChange={(e) => setEditEventWmHeight(parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-blue-600" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors">
                          Save Event Details
                        </button>
                      </form>

                      {/* Generate Event Link */}
                      <div className="border-t border-slate-200 mt-4 pt-4 flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/e/${selectedEvent.code}/photos`;
                            setGeneratedLink(link);
                            navigator.clipboard.writeText(link).then(() => {
                              setSuccessMsg('Event link copied to clipboard!');
                            }).catch(() => {});
                          }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Generate Link of Event
                        </button>
                        {generatedLink && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Public Event Link</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-blue-600 font-mono font-bold focus:outline-none select-all"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedLink).then(() => {
                                    setSuccessMsg('Link copied!');
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. BRANDING TAB */}
        {activeTab === 'branding' && studio && (
          <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-800">Studio Branding & Watermark</h1>
            
            <form onSubmit={handleUpdateBranding} className="grid grid-cols-12 gap-8">
              <div className="col-span-6 glass-panel bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-650 mb-2">Whitelabel Customizations</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Studio Name</label>
                  <input type="text" required value={studioName} onChange={(e) => setStudioName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Studio Logo</label>
                  <div className="flex items-center gap-3">
                    {studioLogo ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                        <img src={studioLogo} alt="Studio Logo Preview" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => setStudioLogo('')}
                          className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors w-full text-center">
                        {uploadingAsset === 'studioLogo' ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...
                          </span>
                        ) : (
                          'Choose File'
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAssetUpload(e, setStudioLogo, 'studioLogo')}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Max 2MB. Square ratio recommended.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Subdomain (slug.maraphoto.com)</label>
                  <input type="text" required value={studioSubdomain} onChange={(e) => setStudioSubdomain(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Custom Domain (requires Enterprise Plan)</label>
                  <input type="text" disabled={studio.subscriptionPlan !== 'ENTERPRISE'} value={studioCustomDomain} onChange={(e) => setStudioCustomDomain(e.target.value)} placeholder="gallery.yourdomain.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-50" />
                </div>
              </div>

              <div className="col-span-6 glass-panel bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-650 mb-2">Automated Photo Watermark</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Watermark Type</label>
                  <select value={wmType} onChange={(e) => setWmType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white">
                    <option value="NONE">NONE</option>
                    <option value="TEXT">TEXT WATERMARK</option>
                    <option value="LOGO">LOGO WATERMARK</option>
                  </select>
                </div>

                {wmType === 'TEXT' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Watermark Text</label>
                    <input type="text" required value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="© Dream Studio" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                  </div>
                )}

                {wmType === 'LOGO' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Watermark Logo Image</label>
                    <div className="flex items-center gap-3">
                      {wmLogo ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img src={wmLogo} alt="Watermark Logo Preview" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => setWmLogo('')}
                            className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                          <Camera className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors w-full text-center">
                          {uploadingAsset === 'wmLogo' ? (
                            <span className="flex items-center gap-1.5 justify-center">
                              <Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...
                            </span>
                          ) : (
                            'Choose File'
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAssetUpload(e, setWmLogo, 'wmLogo')}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">PNG with transparent background recommended.</p>
                      </div>
                    </div>
                  </div>
                )}

                {wmType !== 'NONE' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Watermark Position</label>
                      <select value={wmPos} onChange={(e) => setWmPos(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white">
                        <option value="TOP_LEFT">TOP LEFT</option>
                        <option value="TOP_RIGHT">TOP RIGHT</option>
                        <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                        <option value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                        <option value="CENTER">CENTER OVERLAY</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Opacity ({Math.round(wmOpacity * 100)}%)</label>
                      <input type="range" min="0.1" max="1.0" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(parseFloat(e.target.value))} className="w-full h-8 cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  Save Studio Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. BILLING TAB */}
        {activeTab === 'billing' && studio && (
          <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-800">Plans & Subscriptions</h1>
            
            <div className="glass-panel bg-white border border-blue-500 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Active Plan</span>
                <h3 className="text-xl font-bold mt-1 text-slate-800">{studio.subscriptionPlan} Tier</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Status: <strong className="text-emerald-600">{studio.subscriptionStatus}</strong></p>
              </div>
              
              {studio.subscriptionPlan !== 'STARTER' && (
                <button onClick={handleCancelSub} className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-bold transition-colors">
                  Cancel Subscription
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'STARTER', price: '$0/mo', desc: 'Starter features, max 5 events.' },
                { name: 'PROFESSIONAL', price: '$29/mo', desc: 'Max 20 events, AI matches.' },
                { name: 'BUSINESS', price: '$79/mo', desc: 'Unlimited events, WhatsApp invites.' }
              ].map((p) => (
                <div key={p.name} className={`glass-panel bg-white p-6 rounded-2xl flex flex-col justify-between h-56 border border-slate-200 shadow-sm ${studio.subscriptionPlan === p.name ? 'border-blue-500 ring-1 ring-blue-500/10' : ''}`}>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{p.name}</h4>
                    <span className="text-2xl font-extrabold text-blue-600 mt-2 block font-mono">{p.price}</span>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">{p.desc}</p>
                  </div>
                  
                  {studio.subscriptionPlan === p.name ? (
                    <span className="w-full text-center py-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold">
                      Current Plan
                    </span>
                  ) : (
                    <button onClick={() => handleSubscribe(p.name)} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-lg text-xs font-bold text-slate-700 transition-colors">
                      Select Plan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="flex flex-col gap-8 max-w-4xl">
            <h1 className="text-2xl font-extrabold text-slate-800">Studio Help Desk</h1>
            
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-5 flex flex-col gap-6">
                <div className="glass-panel bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-650">Open Tickets ({tickets.length})</h3>
                  {tickets.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {tickets.map((t) => (
                        <div key={t._id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-xl cursor-pointer border transition-colors ${selectedTicket?._id === t._id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{t.subject}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${t.status === 'OPEN' ? 'bg-blue-600 text-white' : t.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                              {t.status}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">
                            Last Updated: {new Date(t.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">No support tickets found</div>
                  )}
                </div>

                <div className="glass-panel bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-650 mb-4">Open New Ticket</h3>
                  <form onSubmit={handleOpenTicket} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Subject</label>
                      <input type="text" required value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} placeholder="Cannot upload RAW files" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Message Description</label>
                      <textarea required value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} placeholder="Explain the issue you are facing..." rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white resize-none" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition-colors">
                      Open Ticket
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-span-7">
                {selectedTicket ? (
                  <div className="glass-panel bg-white border border-slate-200 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Thread</h4>
                        <h3 className="text-sm font-bold text-slate-800 mt-0.5">{selectedTicket.subject}</h3>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${selectedTicket.status === 'OPEN' ? 'bg-blue-600 text-white' : selectedTicket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                      {selectedTicket.messages.map((msg: any, i: number) => {
                        const isAdmin = msg.sender === 'ADMIN';
                        return (
                          <div key={i} className={`flex flex-col max-w-[80%] ${isAdmin ? 'self-start' : 'self-end items-end'}`}>
                            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${isAdmin ? 'bg-slate-100 border border-slate-200 rounded-tl-none text-slate-700' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold mt-1 font-mono">
                              {isAdmin ? 'System Admin' : 'Studio Owner'} • {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedTicket.status !== 'RESOLVED' ? (
                      <form onSubmit={handleReplyTicket} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                        <input type="text" required value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply here..." className="flex-1 bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600" />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors">
                          <Send className="h-4.5 w-4.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 text-emerald-600 text-center text-xs border-t border-slate-100 font-bold">
                        This support ticket has been resolved.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full glass-panel bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-slate-400 shadow-sm">
                    <HelpCircle className="h-8 w-8 text-slate-300 mb-2" />
                    <span className="text-xs font-semibold">Select a support ticket from the list to view the message thread.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Processing Modal */}
      {isProcessingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 text-center">Applying Watermarks</h3>
            <p className="text-xs font-semibold text-slate-500 text-center">
              Please don't close this window. We are processing your high-resolution photos in the background...
            </p>
            
            <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden border border-slate-200/50">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${processingStats.total > 0 ? (processingStats.completed / processingStats.total) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between w-full mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="text-xs font-extrabold text-blue-600">
                {processingStats.completed} / {processingStats.total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && eventMedia[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!confirm('Are you sure you want to delete this photo?')) return;
                
                const mediaId = eventMedia[lightboxIndex]._id;
                
                // Optimistically update UI to instantly show the next photo
                const newMedia = [...eventMedia];
                newMedia.splice(lightboxIndex, 1);
                setEventMedia(newMedia);
                
                if (newMedia.length === 0) {
                  setLightboxIndex(null); // Close if it was the last photo
                } else if (lightboxIndex >= newMedia.length) {
                  setLightboxIndex(0); // Loop back to the first photo
                }
                // Else lightboxIndex remains the same, automatically showing the next photo
                
                handleDeleteMedia(mediaId, true);
              }}
              className="text-white hover:text-rose-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
              title="Delete Photo"
            >
              <Trash2 className="h-6 w-6" />
            </button>
            <button 
              onClick={() => setLightboxIndex(null)}
              className="text-white hover:text-slate-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
            className="absolute left-6 text-white hover:text-slate-300 transition-colors z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="w-full h-full max-w-7xl max-h-[90vh] p-8 flex flex-col items-center justify-center">
            {eventMedia[lightboxIndex].type === 'VIDEO' ? (
              <video 
                src={eventMedia[lightboxIndex].r2Url} 
                controls 
                autoPlay 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <img 
                src={`${eventMedia[lightboxIndex].compressedUrl || eventMedia[lightboxIndex].r2Url}?t=${new Date(eventMedia[lightboxIndex].updatedAt).getTime()}`} 
                alt="Fullscreen" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
            <div className="mt-4 text-slate-400 text-sm font-medium">
              {lightboxIndex + 1} / {eventMedia.length}
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
            className="absolute right-6 text-white hover:text-slate-300 transition-colors z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}
