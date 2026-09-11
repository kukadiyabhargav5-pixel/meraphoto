'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Calendar, Clock, MapPin, Loader2, Upload, 
  Camera, ArrowRight, ArrowLeft, Check, Lock, 
  User as UserIcon, Phone, Mail, Sparkles, Image as ImageIcon,
  Settings, Type, Layers, ShieldCheck, HeartHandshake, Film
} from 'lucide-react';
import CustomDatePicker from '../../../components/CustomDatePicker';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useDashboard } from '../DashboardContext';
import toast from 'react-hot-toast';

export default function CreateEventPage() {
  const context = useDashboard();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Step 1: Client Details
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Step 2: Event Type & Access
  const [eventType, setEventType] = useState('WEDDING');
  const [customEventType, setCustomEventType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [accessType, setAccessType] = useState('PUBLIC');
  const [password, setPassword] = useState('');

  // Step 3: Schedule
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [eventDays, setEventDays] = useState<{date: string, time: string, location: string}[]>([]);

  // Step 4: Cover Image
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Step 5: Watermark & Portfolio
  const [customWatermark, setCustomWatermark] = useState(false);
  const [watermarkType, setWatermarkType] = useState<'LOGO' | 'TEXT'>('LOGO');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState('BOTTOM_RIGHT');
  const [watermarkWidth, setWatermarkWidth] = useState(20);
  const [watermarkHeight, setWatermarkHeight] = useState(20);
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [addToPortfolio, setAddToPortfolio] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  const POPULAR_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'ENGAGEMENT', 'BIRTHDAY', 'CORPORATE'
  ];

  const stepLabels = [
    { label: 'Client Info', icon: UserIcon },
    { label: 'Event Details', icon: Sparkles },
    { label: 'Schedule', icon: Calendar },
    { label: 'Cover Photo', icon: Camera },
    { label: 'Watermark', icon: ShieldCheck }
  ];

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 'next' : 'prev');
    setCurrentStep(step);
  };

  const canProceedStep1 = () => eventName.trim().length > 0 && clientName.trim().length > 0 && clientMobile.trim().length > 0 && clientEmail.trim().length > 0;
  const canProceedStep2 = () => {
    const selectedType = showCustomType ? customEventType.trim() : eventType;
    if (!selectedType) return false;
    if (accessType === 'PASSWORD' && !password) return false;
    if (accessType === 'OTP' && password.length !== 4) return false;
    return true;
  };
  const canProceedStep3 = () => eventDate && eventTime && eventLocation.trim().length > 0;
  const canProceedStep4 = () => !!coverImage;

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1()) { toast.error('Please fill all required client fields'); return; }
    if (currentStep === 2 && !canProceedStep2()) { toast.error('Please select an event type and complete access settings'); return; }
    if (currentStep === 3 && !canProceedStep3()) { toast.error('Please fill date, time and venue location'); return; }
    if (currentStep === 4 && !canProceedStep4()) { toast.error('Cover image is required'); return; }
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const getEffectiveEventType = () => showCustomType ? (customEventType.trim() || 'CUSTOM') : eventType;

  const getPreviewPosition = (pos: string) => {
    switch (pos) {
      case 'TOP_LEFT': return { top: '4%', left: '4%' };
      case 'TOP_RIGHT': return { top: '4%', right: '4%' };
      case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
      case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/media/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) {
        setCoverImage(res.data.url);
        setImageName(file.name);
        toast.success('Cover photo uploaded');
      }
    } catch (err) {
      console.error('Cover upload failed', err);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleWatermarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingWatermark(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await apiClient.post('/dashboard/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.url) {
        setWatermarkLogoUrl(res.data.url);
        toast.success('Watermark logo uploaded');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingWatermark(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 5) return;
    if (!eventName || !coverImage) { toast.error('Event name and Cover image are required'); return; }
    try {
      setLoading(true);
      await apiClient.post('/event', {
        name: eventName,
        clientName,
        clientMobile,
        clientEmail,
        date: eventDate || new Date().toISOString(),
        type: getEffectiveEventType(),
        location: eventLocation,
        time: eventTime,
        accessType,
        password,
        isMultiDay: totalDays > 1,
        totalDays,
        days: totalDays > 1 ? eventDays : [],
        coverImageUrl: coverImage,
        addToPortfolio,
        watermark: {
          isActive: customWatermark,
          type: watermarkType,
          text: watermarkText,
          logoUrl: watermarkLogoUrl,
          position: watermarkPosition,
          width: watermarkWidth,
          height: watermarkHeight,
          opacity: watermarkOpacity / 100,
        }
      });
      
      if (context && context.customers) {
        const existingCust = context.customers.find((c: any) => c.phone === clientMobile || c.email === clientEmail);
        if (!existingCust) {
          context.setCustomers([{ name: clientName, email: clientEmail, phone: clientMobile, events: 1, status: 'Active' }, ...context.customers]);
        }
      }

      toast.success('Event created successfully!');
      router.push('/dashboard/events');
    } catch (error: any) {
      console.error('Failed to create event', error);
      toast.error(error.response?.data?.error || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? 30 : -30, opacity: 0 }),
    in: { x: 0, opacity: 1 },
    out: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? -30 : 30, opacity: 0 })
  };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.35 };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#faf9f6] via-[#f7f5ef] to-[#efece2] text-slate-900 min-h-full font-poppins relative">
      {/* Ambient Decorative Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-[#c5a880]/15 rounded-full blur-[140px] pointer-events-none animate-aura-breathe" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#e3d8c8]/25 rounded-full blur-[150px] pointer-events-none animate-aura-breathe [animation-delay:2.5s]" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 relative z-10 space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#c5a880]/40 text-[#9c7c56] text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880] animate-pulse-soft" /> 
            <span>Studio Event Creator</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-serif-luxury">
            Create New Event
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Design an extraordinary digital experience with facial recognition, instant media delivery, and personalized watermark branding.
          </p>
        </div>

        {/* Wizard Main Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden ring-1 ring-slate-900/5 transition-all">
          
          {/* Stepper Navigation Bar */}
          <div className="bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/80 px-4 sm:px-8 py-5 overflow-x-auto hide-scrollbar relative">
            <div className="flex items-center justify-between min-w-[560px] relative">
              {stepLabels.map((item, i) => {
                const step = i + 1;
                const isActive = currentStep === step;
                const isPast = currentStep > step;
                const Icon = item.icon;

                return (
                  <div 
                    key={step} 
                    onClick={() => {
                      if (step < currentStep) goToStep(step);
                    }}
                    className={`flex flex-col items-center gap-2 relative z-10 select-none ${step < currentStep ? 'cursor-pointer group' : 'cursor-default'}`}
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                      isActive ? 'bg-[#c5a880] text-slate-900 shadow-lg shadow-[#c5a880]/40 scale-110 ring-4 ring-[#c5a880]/20' :
                      isPast ? 'bg-slate-900 text-[#c5a880] group-hover:scale-105 shadow-md' : 'bg-slate-100 text-slate-400 border border-slate-200/70'
                    }`}>
                      {isPast ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors ${
                      isActive ? 'text-[#a07c4c]' : isPast ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}

              {/* Connecting Progress Line */}
              <div className="absolute top-[21px] left-12 right-12 h-[2.5px] bg-slate-200 -z-0 hidden sm:block">
                <div 
                  className="h-full bg-gradient-to-r from-slate-900 via-[#c5a880] to-[#c5a880] transition-all duration-500 ease-out shadow-xs" 
                  style={{ width: `${((currentStep - 1) / (stepLabels.length - 1)) * 100}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Wizard Content Body */}
          <div className="p-6 sm:p-10 min-h-[420px]">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait" custom={direction}>
                
                {/* ======================================================== */}
                {/* STEP 1: Client Information */}
                {/* ======================================================== */}
                {currentStep === 1 && (
                  <motion.div key="step1" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 1: Client & Event Information</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Please provide primary contact information for your client gallery.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Event Name */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="eventName" className="edit-label">
                          Event Title / Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            id="eventName" 
                            required 
                            className="edit-input font-bold text-slate-900" 
                            value={eventName} 
                            onChange={(e) => setEventName(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Client Name */}
                      <div className="space-y-1.5">
                        <label htmlFor="clientName" className="edit-label">
                          Client Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <UserIcon className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input 
                            type="text" 
                            id="clientName" 
                            required 
                            className="edit-input edit-input-with-icon font-bold text-slate-900" 
                            style={{ paddingLeft: '44px' }}
                            value={clientName} 
                            onChange={(e) => setClientName(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="space-y-1.5">
                        <label htmlFor="clientMobile" className="edit-label">
                          Client Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input 
                            type="tel" 
                            id="clientMobile" 
                            required 
                            className="edit-input edit-input-with-icon font-bold text-slate-900" 
                            style={{ paddingLeft: '44px' }}
                            value={clientMobile} 
                            onChange={(e) => setClientMobile(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="clientEmail" className="edit-label">
                          Client Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input 
                            type="email" 
                            id="clientEmail" 
                            required 
                            className="edit-input edit-input-with-icon font-bold text-slate-900" 
                            style={{ paddingLeft: '44px' }}
                            value={clientEmail} 
                            onChange={(e) => setClientEmail(e.target.value)} 
                          />
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 2: Event Details (Custom & Preset Type Selector) */}
                {/* ======================================================== */}
                {currentStep === 2 && (
                  <motion.div key="step2" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-8">
                    
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 2: Event Type & Access Privacy</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Choose an event category and specify gallery authentication.</p>
                    </div>

                    {/* EVENT TYPE SELECTION SECTION */}
                    <div className="space-y-4">
                      
                      {/* Live Selected Banner */}
                      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#c5a880]/15 to-transparent border border-[#c5a880]/40 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#c5a880] text-slate-900 flex items-center justify-center font-black text-sm shadow-sm">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Currently Selected Event Type</p>
                            <p className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                              {showCustomType ? (customEventType.trim() || 'Custom Category (Type Below)') : eventType}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white text-[#9c7c56] font-black text-[10px] border border-[#c5a880]/30 shadow-xs uppercase tracking-wider">
                          {showCustomType ? '✨ Custom' : '🏷️ Preset'}
                        </span>
                      </div>

                      {/* Dropdown Selector */}
                      <div className="space-y-1.5">
                        <label className="edit-label">
                          Select Event Type <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          className="edit-input font-bold text-sm bg-white"
                          value={showCustomType ? 'CUSTOM' : eventType}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setShowCustomType(true);
                              setEventType('');
                            } else {
                              setShowCustomType(false);
                              setEventType(e.target.value);
                            }
                          }}
                        >
                          {EVENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                          <option value="CUSTOM">+ CUSTOM EVENT TYPE</option>
                        </select>
                      </div>

                      {/* Quick Select Preset Pills */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Popular Categories (1-Click Selection)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_TYPES.map(type => {
                            const isSelected = !showCustomType && eventType === type;
                            return (
                              <button
                                type="button" 
                                key={type}
                                onClick={() => { setEventType(type); setShowCustomType(false); }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                  isSelected 
                                    ? 'bg-slate-900 text-[#c5a880] border-slate-900 shadow-md scale-105 ring-2 ring-[#c5a880]/30' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#c5a880] hover:text-slate-900 shadow-xs'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                          
                          <button
                            type="button"
                            onClick={() => { setShowCustomType(true); setEventType(''); }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-dashed cursor-pointer ${
                              showCustomType 
                                ? 'bg-[#c5a880] text-slate-900 border-[#c5a880] shadow-md scale-105 ring-2 ring-[#c5a880]/30' 
                                : 'bg-white text-slate-600 border-slate-300 hover:border-[#c5a880] hover:text-slate-900'
                            }`}
                          >
                            + Custom Type
                          </button>
                        </div>
                      </div>

                      {/* Custom Event Type Input */}
                      <AnimatePresence>
                        {showCustomType && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }} 
                            className="overflow-hidden pt-2"
                          >
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-[#c5a880]/40 space-y-1.5 shadow-xs">
                              <label htmlFor="customEventType" className="edit-label text-[#9c7c56]">
                                Type Custom Event Category <span className="text-rose-500">*</span>
                              </label>
                              <input 
                                type="text" 
                                id="customEventType" 
                                required 
                                autoFocus
                                className="edit-input font-bold border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/30" 
                                value={customEventType} 
                                onChange={(e) => setCustomEventType(e.target.value)} 
                              />
                              <p className="text-[10px] text-slate-500 font-medium">
                                Whatever you type here will appear in your client portal and navigation filters.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                    {/* PRIVACY & ACCESS CONTROL */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <label className="edit-label">
                        Gallery Privacy & Access <span className="text-rose-500">*</span>
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {[
                          { value: 'PUBLIC', label: 'Public Access', desc: 'Direct link access for all guests', icon: UserIcon },
                          { value: 'PASSWORD', label: 'Password Protected', desc: 'Requires secret password', icon: Lock },
                          { value: 'OTP', label: 'Secure PIN', desc: '4-digit verification code', icon: Settings },
                        ].map(opt => {
                          const Icon = opt.icon;
                          const isSelected = accessType === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => { setAccessType(opt.value); setPassword(''); }}
                              className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col items-center gap-2.5 text-center group ${
                                isSelected 
                                  ? 'bg-[#c5a880]/10 border-[#c5a880] ring-2 ring-[#c5a880]/40 shadow-sm scale-[1.02]' 
                                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#c5a880] text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className={`text-xs font-black uppercase tracking-wider block ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {opt.label}
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                                  {opt.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Password Input Reveal */}
                      <AnimatePresence>
                        {accessType === 'PASSWORD' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-1.5 pt-2">
                            <label htmlFor="passwordAccess" className="edit-label">
                              Set Event Password <span className="text-rose-500">*</span>
                            </label>
                            <input 
                              type="text" 
                              id="passwordAccess" 
                              required 
                              className="edit-input font-bold" 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                            />
                          </motion.div>
                        )}
                        {accessType === 'OTP' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-1.5 pt-2 text-center">
                            <label htmlFor="pinAccess" className="edit-label text-center">
                              Set 4-Digit Access PIN <span className="text-rose-500">*</span>
                            </label>
                            <input 
                              type="text" 
                              id="pinAccess" 
                              required 
                              maxLength={4}
                              className="edit-input w-44 mx-auto text-center tracking-[0.6em] font-black text-xl border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/30" 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))} 
                            />
                            <p className="text-[10px] text-slate-500 font-medium">Guests must enter this 4-digit code to access the photos.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 3: Event Schedule & Days */}
                {/* ======================================================== */}
                {currentStep === 3 && (
                  <motion.div key="step3" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 3: Schedule & Venue Location</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Set the timing and celebration locations.</p>
                    </div>

                    {/* Total Event Days Counter */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
                      <div>
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                          Total Event Days
                        </label>
                        <p className="text-[10px] text-slate-500 font-medium">For multi-day weddings or festivals (e.g. Haldi, Sangeet, Wedding)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (totalDays > 1) {
                              const nd = totalDays - 1;
                              setTotalDays(nd);
                              setEventDays(prev => prev.slice(0, nd - 1));
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-black font-mono text-slate-900">
                          {totalDays}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (totalDays < 10) {
                              const nd = totalDays + 1;
                              setTotalDays(nd);
                              const arr = [...eventDays];
                              while (arr.length < nd - 1) arr.push({ date: '', time: '', location: '' });
                              setEventDays(arr);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Day 1 Schedule */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 hover:border-[#c5a880]/50 transition-colors">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-[#c5a880] flex items-center justify-center text-xs font-black">1</span>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          {totalDays > 1 ? 'Day 1 Schedule' : 'Main Schedule'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="edit-label">Event Date <span className="text-rose-500">*</span></label>
                          <CustomDatePicker type="date" className="edit-input font-bold" value={eventDate} onChange={(v) => setEventDate(v)} required />
                        </div>
                        <div>
                          <label className="edit-label">Event Time <span className="text-rose-500">*</span></label>
                          <CustomDatePicker type="time" className="edit-input font-bold" value={eventTime} onChange={(v) => setEventTime(v)} required />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="eventLocation" className="edit-label">Venue Location <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <MapPin className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input 
                            type="text" 
                            id="eventLocation" 
                            required 
                            className="edit-input edit-input-with-icon font-bold text-slate-900" 
                            style={{ paddingLeft: '44px' }}
                            value={eventLocation} 
                            onChange={(e) => setEventLocation(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Multi-Days */}
                    {totalDays > 1 && eventDays.map((day, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 hover:border-[#c5a880]/50 transition-colors animate-fade-in">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">{idx + 2}</span>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Day {idx + 2} Schedule
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="edit-label">Date <span className="text-rose-500">*</span></label>
                            <CustomDatePicker 
                              type="date" 
                              className="edit-input font-bold" 
                              value={day.date} 
                              onChange={(v) => { const d = [...eventDays]; d[idx].date = v; setEventDays(d); }} 
                              required 
                            />
                          </div>
                          <div>
                            <label className="edit-label">Time <span className="text-rose-500">*</span></label>
                            <CustomDatePicker 
                              type="time" 
                              className="edit-input font-bold" 
                              value={day.time} 
                              onChange={(v) => { const d = [...eventDays]; d[idx].time = v; setEventDays(d); }} 
                              required 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="edit-label">Venue Location <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                              <MapPin className="w-4 h-4 text-[#c5a880]" />
                            </div>
                            <input 
                              type="text" 
                              required 
                              className="edit-input edit-input-with-icon font-bold text-slate-900" 
                              style={{ paddingLeft: '44px' }}
                              value={day.location} 
                              onChange={(e) => { const d = [...eventDays]; d[idx].location = e.target.value; setEventDays(d); }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 4: Hero Cover Image */}
                {/* ======================================================== */}
                {currentStep === 4 && (
                  <motion.div key="step4" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 4: Hero Cover Image</h3>
                      <p className="text-xs text-slate-500 mt-0.5">This cover photo will be displayed prominently on your client&apos;s gallery landing page.</p>
                    </div>

                    {coverImage ? (
                      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-[#c5a880] bg-slate-950 shadow-md group transition-all duration-300">
                        {/* Full Image in normal flow: box expands dynamically to image height with 0% cropping! */}
                        <img 
                          src={coverImage} 
                          alt="Cover" 
                          className="w-full h-auto max-h-[750px] object-contain block mx-auto select-none" 
                        />
                        
                        {/* Hover Overlay */}
                        <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-xs cursor-pointer">
                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-10 h-10 text-[#c5a880] animate-spin" />
                              <span className="text-xs font-bold text-white">Uploading new cover...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform">
                                <Camera className="w-6 h-6" />
                              </div>
                              <span className="text-xs font-black text-white uppercase tracking-wider bg-black/60 px-4 py-2 rounded-full border border-white/20 shadow-md">
                                Click to Change Cover Photo
                              </span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleCoverUpload} 
                          />
                        </label>

                        {/* Top corner status badge */}
                        <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                          <span className="px-3 py-1 rounded-full bg-black/60 text-[#f5deb3] border border-[#c5a880]/50 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Full View
                          </span>
                        </div>
                      </div>
                    ) : (
                      <label className="relative flex flex-col items-center justify-center w-full min-h-[260px] border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-slate-300 bg-slate-50 hover:bg-[#faf9f6] hover:border-[#c5a880] group">
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-12 h-12 text-[#c5a880] animate-spin" />
                              <span className="text-xs font-bold text-slate-500">Uploading photo...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-16 h-16 rounded-2xl bg-[#c5a880]/15 flex items-center justify-center mb-4 text-[#9c7c56] border border-[#c5a880]/30 shadow-sm group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                              <span className="text-sm font-black text-slate-900">Click or drag an image to upload</span>
                              <span className="text-[11px] text-slate-500 mt-1 font-medium">Recommended: High-resolution JPG or PNG (up to 2MB)</span>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleCoverUpload} 
                        />
                      </label>
                    )}

                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 5: Watermark & Final Settings (EVENT MANAGE CSS) */}
                {/* ======================================================== */}
                {currentStep === 5 && (
                  <motion.div key="step5" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 5: Watermark Protection & Portfolio</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Protect your photography with custom watermark branding.</p>
                    </div>

                    {/* Watermark Section (Exact Event Manage CSS) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-xs font-black text-[#9c7c56]">
                            W
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Custom Event Watermark</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Stamp your logo or studio name onto gallery photos</p>
                          </div>
                        </div>
                        <div 
                          className="toggle-switch cursor-pointer" 
                          data-active={customWatermark}
                          onClick={() => setCustomWatermark(!customWatermark)}
                        />
                      </div>

                      {customWatermark && (
                        <div className="mt-6 space-y-6 border-t border-slate-100 pt-5 animate-fade-in">
                          
                          {/* Watermark Type Selector */}
                          <div>
                            <label className="edit-label">Watermark Type</label>
                            <select 
                              className="edit-input font-bold tracking-wide"
                              value={watermarkType}
                              onChange={e => setWatermarkType(e.target.value as any)}
                            >
                              <option value="LOGO">LOGO WATERMARK</option>
                              <option value="TEXT">TEXT WATERMARK</option>
                            </select>
                          </div>

                          {/* Logo Upload or Text Input */}
                          {watermarkType === 'TEXT' ? (
                            <div>
                              <label className="edit-label">Watermark Text</label>
                              <input 
                                type="text" 
                                className="edit-input font-bold" 
                                value={watermarkText}
                                onChange={e => setWatermarkText(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="edit-label">Watermark Logo Image</label>
                              <div className="flex gap-4 items-center mt-1">
                                <div className="w-[60px] h-[60px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-[#f8f7f4] text-slate-900 overflow-hidden shadow-xs">
                                  {uploadingWatermark ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" />
                                  ) : (watermarkLogoUrl ? (
                                    <img src={watermarkLogoUrl} className="max-w-[44px] max-h-[44px] object-contain" alt="WM" />
                                  ) : (
                                    <Camera className="h-5 w-5 text-slate-400" />
                                  ))}
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <label className="w-full text-center border border-slate-200 text-[#b69970] font-black text-[13px] py-2.5 rounded-xl bg-white cursor-pointer hover:bg-[#f8f7f4] transition-colors shadow-xs">
                                    {uploadingWatermark ? 'Uploading...' : 'Choose File'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkLogoUpload} />
                                  </label>
                                  <p className="text-[10px] text-slate-500 font-bold mt-1.5">PNG with transparent background recommended.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Watermark Position, Size, Opacity Controls */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-1">
                              <label className="edit-label">Watermark Position</label>
                              <select 
                                className="edit-input font-bold tracking-wide mt-1"
                                value={watermarkPosition}
                                onChange={e => setWatermarkPosition(e.target.value)}
                              >
                                <option value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                                <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                                <option value="TOP_RIGHT">TOP RIGHT</option>
                                <option value="TOP_LEFT">TOP LEFT</option>
                                <option value="CENTER">CENTER</option>
                              </select>
                            </div>
                            <div className="col-span-1 flex flex-col justify-center">
                              <label className="edit-label">Size ({watermarkWidth}%)</label>
                              <input 
                                type="range" 
                                min="5" max="100" 
                                className="w-full custom-slider mt-2"
                                value={watermarkWidth}
                                onChange={e => setWatermarkWidth(Number(e.target.value))}
                                style={{'--val': `${watermarkWidth}%`} as any}
                              />
                            </div>
                            <div className="col-span-1 flex flex-col justify-center">
                              <label className="edit-label">Opacity ({watermarkOpacity}%)</label>
                              <input 
                                type="range" 
                                min="10" max="100" 
                                className="w-full custom-slider mt-2"
                                value={watermarkOpacity}
                                onChange={e => setWatermarkOpacity(Number(e.target.value))}
                                style={{'--val': `${watermarkOpacity}%`} as any}
                              />
                            </div>
                          </div>

                          {/* EXACT LIVE PREVIEW BOX FROM EVENT MANAGE */}
                          <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            <div className="bg-[#e8ebf0] text-[#64748b] text-[11px] font-black px-4 py-2.5 uppercase tracking-wider flex items-center justify-between">
                              <span>Live Preview</span>
                              <span className="text-[10px] font-mono text-slate-500">{watermarkPosition} • {watermarkWidth}% size</span>
                            </div>
                            <div className="relative w-full aspect-[3/2] bg-slate-200 flex items-center justify-center overflow-hidden">
                              <img src="/wedding.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Preview Background" />
                              
                              {watermarkType === 'LOGO' && watermarkLogoUrl && (
                                <img 
                                  src={watermarkLogoUrl} 
                                  className="absolute pointer-events-none object-contain transition-all duration-200"
                                  style={{
                                    opacity: watermarkOpacity / 100,
                                    width: `${watermarkWidth}%`,
                                    ...getPreviewPosition(watermarkPosition)
                                  }}
                                  alt="watermark"
                                />
                              )}
                              
                              {watermarkType === 'TEXT' && watermarkText && (
                                <div 
                                  className="absolute pointer-events-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-bold whitespace-nowrap transition-all duration-200"
                                  style={{
                                    opacity: watermarkOpacity / 100,
                                    fontSize: `${Math.max(12, watermarkWidth * 0.35)}px`, 
                                    ...getPreviewPosition(watermarkPosition)
                                  }}
                                >
                                  {watermarkText}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Portfolio Toggle (Exact Event Manage Style) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
                          P
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Add to Public Portfolio</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Showcase this event on your studio public portfolio</p>
                        </div>
                      </div>
                      <div 
                        className="toggle-switch cursor-pointer" 
                        data-active={addToPortfolio}
                        onClick={() => setAddToPortfolio(!addToPortfolio)}
                      />
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </form>
          </div>

          {/* Footer Wizard Controls */}
          <div className="bg-slate-50/90 border-t border-slate-200/80 p-4 sm:p-6 flex items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={handleBack} 
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < 5 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="px-7 py-3 rounded-xl bg-slate-900 text-white hover:bg-[#c5a880] hover:text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-slate-900/15 hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span> 
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-[#c5a880] text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#c5a880]/30 hover:bg-slate-900 hover:text-[#c5a880] transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> <span>Launch Event</span></>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
