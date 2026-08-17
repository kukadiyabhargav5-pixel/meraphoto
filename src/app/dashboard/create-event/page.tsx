'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Calendar, Clock, MapPin, Loader2, Upload, 
  Camera, ArrowRight, ArrowLeft, Check, Lock, 
  User as UserIcon, Phone, Mail, Sparkles, Image as ImageIcon,
  Settings, Type, Layers
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
  const [watermarkType, setWatermarkType] = useState('LOGO');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [watermarkLogoName, setWatermarkLogoName] = useState<string | null>(null);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState('BOTTOM_RIGHT');
  const [watermarkWidth, setWatermarkWidth] = useState(15);
  const [watermarkHeight, setWatermarkHeight] = useState(15);
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [addToPortfolio, setAddToPortfolio] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  const stepLabels = ['Client Info', 'Event Details', 'Schedule', 'Cover', 'Watermark'];

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
    if (currentStep === 1 && !canProceedStep1()) { toast.error('Please fill all required fields'); return; }
    if (currentStep === 2 && !canProceedStep2()) { toast.error('Please complete event type and access details'); return; }
    if (currentStep === 3 && !canProceedStep3()) { toast.error('Please fill date, time and location'); return; }
    if (currentStep === 4 && !canProceedStep4()) { toast.error('Cover image is required'); return; }
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const getEffectiveEventType = () => showCustomType ? customEventType : eventType;

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
    initial: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? 40 : -40, opacity: 0 }),
    in: { x: 0, opacity: 1 },
    out: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? -40 : 40, opacity: 0 })
  };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void, setName: (name: string) => void, setUploading: (loading: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setName(file.name);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/media/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) setUrl(res.data.url);
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#faf9f6] to-[#f4f2eb] text-slate-900 min-h-full font-poppins relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#c5a880]/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#e3d8c8]/20 rounded-full blur-[140px] mix-blend-multiply" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c5a880]/30 text-[#a07c4c] text-[10px] font-black uppercase tracking-widest shadow-sm mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Studio Setup
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-serif-luxury mb-3">
            Create New Event
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
            Design a stunning digital gallery experience for your clients in just a few steps.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-slate-900/5">
          
          {/* Progress Tabs */}
          <div className="bg-white/50 border-b border-slate-200/60 px-4 sm:px-8 py-4 sm:py-6 overflow-x-auto hide-scrollbar">
            <div className="flex items-center justify-between min-w-[500px]">
              {stepLabels.map((label, i) => {
                const step = i + 1;
                const isActive = currentStep === step;
                const isPast = currentStep > step;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 relative z-10 group cursor-default">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isActive ? 'bg-[#c5a880] text-white shadow-lg shadow-[#c5a880]/40 scale-110' :
                      isPast ? 'bg-slate-900 text-[#c5a880]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? <Check className="w-5 h-5" /> : step}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isActive ? 'text-[#c5a880]' : isPast ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
              {/* Connecting Lines */}
              <div className="absolute top-9 left-12 right-12 h-[2px] bg-slate-100 -z-10 hidden sm:block">
                <div 
                  className="h-full bg-gradient-to-r from-slate-900 via-[#c5a880] to-[#c5a880] transition-all duration-500 ease-in-out" 
                  style={{ width: `${((currentStep - 1) / (stepLabels.length - 1)) * 100}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-10 min-h-[400px]">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait" custom={direction}>
                
                {/* STEP 1: Client Info */}
                {currentStep === 1 && (
                  <motion.div key="step1" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      <div className="sm:col-span-2 relative group">
                        <input 
                          type="text" id="eventName" required placeholder="Event Name"
                          className="peer w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                          value={eventName} onChange={(e) => setEventName(e.target.value)} 
                        />
                        <label htmlFor="eventName" className="absolute left-4 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                          Event Name <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" id="clientName" required placeholder="Client Name"
                          className="peer w-full bg-slate-50 border border-slate-200 rounded-xl pl-[44px] pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                          value={clientName} onChange={(e) => setClientName(e.target.value)} 
                        />
                        <label htmlFor="clientName" className="absolute left-[44px] top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                          Client Name <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input 
                          type="tel" id="clientMobile" required placeholder="Mobile Number"
                          className="peer w-full bg-slate-50 border border-slate-200 rounded-xl pl-[44px] pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                          value={clientMobile} onChange={(e) => setClientMobile(e.target.value)} 
                        />
                        <label htmlFor="clientMobile" className="absolute left-[44px] top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input 
                          type="email" id="clientEmail" required placeholder="Email Address"
                          className="peer w-full bg-slate-50 border border-slate-200 rounded-xl pl-[44px] pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                          value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} 
                        />
                        <label htmlFor="clientEmail" className="absolute left-[44px] top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Event Type */}
                {currentStep === 2 && (
                  <motion.div key="step2" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Event Type <span className="text-rose-500">*</span></label>
                      <div className="flex flex-wrap gap-2.5">
                        {EVENT_TYPES.map(type => (
                          <button
                            type="button" key={type}
                            onClick={() => { setEventType(type); setShowCustomType(false); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${!showCustomType && eventType === type ? 'bg-slate-900 text-[#c5a880] border-slate-900 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-[#c5a880] hover:text-slate-900'}`}
                          >
                            {type}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setShowCustomType(true); setEventType(''); }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-dashed ${showCustomType ? 'bg-[#c5a880] text-slate-900 border-[#c5a880] shadow-md scale-105' : 'bg-white text-slate-500 border-slate-300 hover:border-[#c5a880] hover:text-slate-900'}`}
                        >
                          + Custom
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showCustomType && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="pt-3 pb-1 relative group">
                              <input 
                                type="text" id="customEventType" required placeholder="Custom Event Type" autoFocus
                                className="peer w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                                value={customEventType} onChange={(e) => setCustomEventType(e.target.value)} 
                              />
                              <label htmlFor="customEventType" className="absolute left-4 top-[18px] text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[18px] peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                                Custom Event Type <span className="text-rose-500">*</span>
                              </label>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Privacy & Access <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'PUBLIC', label: 'Public Access', icon: UserIcon },
                          { value: 'PASSWORD', label: 'Password Protected', icon: Lock },
                          { value: 'OTP', label: 'Secure PIN', icon: Settings },
                        ].map(opt => {
                          const Icon = opt.icon;
                          const isSelected = accessType === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => { setAccessType(opt.value); setPassword(''); }}
                              className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${isSelected ? 'bg-[#c5a880]/10 border-[#c5a880] ring-1 ring-[#c5a880]/50 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#c5a880] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{opt.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <AnimatePresence>
                        {accessType === 'PASSWORD' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-3 pb-1 relative group">
                            <input 
                              type="text" id="passwordAccess" required placeholder="Set Password"
                              className="peer w-full bg-[#faf9f6] border border-[#e3d8c8] rounded-xl px-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-inner placeholder-transparent" 
                              value={password} onChange={(e) => setPassword(e.target.value)} 
                            />
                            <label htmlFor="passwordAccess" className="absolute left-4 top-[18px] text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[18px] peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                              Set Event Password <span className="text-rose-500">*</span>
                            </label>
                          </motion.div>
                        )}
                        {accessType === 'OTP' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-3 pb-1 text-center relative group">
                            <input 
                              type="text" id="pinAccess" required placeholder="Set 4-Digit PIN" maxLength={4}
                              className="peer w-48 mx-auto text-center tracking-[0.5em] bg-[#faf9f6] border border-[#e3d8c8] rounded-xl px-4 pt-7 pb-2.5 text-xl font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-inner placeholder-transparent" 
                              value={password} onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))} 
                            />
                            <label htmlFor="pinAccess" className="absolute left-0 right-0 mx-auto w-max top-[18px] text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[22px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[18px] peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                              Set 4-Digit Access PIN <span className="text-rose-500">*</span>
                            </label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Schedule */}
                {currentStep === 3 && (
                  <motion.div key="step3" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Total Event Days</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number" min="1" max="14"
                          className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 text-center outline-none focus:border-[#c5a880]"
                          value={totalDays}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 1;
                            setTotalDays(num);
                            if (num > 1) {
                              const nd = [...eventDays];
                              while (nd.length < num - 1) nd.push({ date: '', time: '', location: '' });
                              setEventDays(nd.slice(0, num - 1));
                            } else {
                              setEventDays([]);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Day 1 */}
                      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-[#c5a880]/50 transition-colors">
                        <h4 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-[#c5a880] flex items-center justify-center text-xs">1</span>
                          {totalDays > 1 ? 'Day 1 Schedule' : 'Main Schedule'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="relative group rounded-xl border border-slate-200 focus-within:border-[#c5a880] focus-within:ring-2 focus-within:ring-[#c5a880]/20 bg-slate-50 transition-all">
                            <label className="absolute left-3 top-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#c5a880]">Date <span className="text-rose-500">*</span></label>
                            <div className="pt-5 pb-1 px-1">
                               <CustomDatePicker type="date" value={eventDate} onChange={(v) => setEventDate(v)} required />
                            </div>
                          </div>
                          <div className="relative group rounded-xl border border-slate-200 focus-within:border-[#c5a880] focus-within:ring-2 focus-within:ring-[#c5a880]/20 bg-slate-50 transition-all">
                            <label className="absolute left-3 top-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#c5a880]">Time <span className="text-rose-500">*</span></label>
                            <div className="pt-5 pb-1 px-1">
                              <CustomDatePicker type="time" value={eventTime} onChange={(v) => setEventTime(v)} required />
                            </div>
                          </div>
                        </div>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" id="eventLocation" required placeholder="Location Venue"
                            className="peer w-full bg-slate-50 border border-slate-200 rounded-xl pl-[38px] pr-3 pt-6 pb-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                            value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} 
                          />
                          <label htmlFor="eventLocation" className="absolute left-[38px] top-[6px] text-[9px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[6px] peer-focus:text-[9px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                            Location Venue <span className="text-rose-500">*</span>
                          </label>
                        </div>
                      </div>

                      {/* Additional Days */}
                      {totalDays > 1 && eventDays.map((day, idx) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-[#c5a880]/50 transition-colors">
                          <h4 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">{idx + 2}</span>
                            Day {idx + 2} Schedule
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="relative group rounded-xl border border-slate-200 focus-within:border-[#c5a880] focus-within:ring-2 focus-within:ring-[#c5a880]/20 bg-slate-50 transition-all">
                              <label className="absolute left-3 top-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#c5a880]">Date <span className="text-rose-500">*</span></label>
                              <div className="pt-5 pb-1 px-1">
                                <CustomDatePicker type="date" value={day.date} onChange={(v) => { const d = [...eventDays]; d[idx].date = v; setEventDays(d); }} required />
                              </div>
                            </div>
                            <div className="relative group rounded-xl border border-slate-200 focus-within:border-[#c5a880] focus-within:ring-2 focus-within:ring-[#c5a880]/20 bg-slate-50 transition-all">
                              <label className="absolute left-3 top-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-[#c5a880]">Time <span className="text-rose-500">*</span></label>
                              <div className="pt-5 pb-1 px-1">
                                <CustomDatePicker type="time" value={day.time} onChange={(v) => { const d = [...eventDays]; d[idx].time = v; setEventDays(d); }} required />
                              </div>
                            </div>
                          </div>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <input 
                              type="text" id={`eventLocation_${idx}`} required placeholder="Location Venue"
                              className="peer w-full bg-slate-50 border border-slate-200 rounded-xl pl-[38px] pr-3 pt-6 pb-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                              value={day.location} onChange={(e) => { const d = [...eventDays]; d[idx].location = e.target.value; setEventDays(d); }} 
                            />
                            <label htmlFor={`eventLocation_${idx}`} className="absolute left-[38px] top-[6px] text-[9px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[6px] peer-focus:text-[9px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                              Location Venue <span className="text-rose-500">*</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Cover Image */}
                {currentStep === 4 && (
                  <motion.div key="step4" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-black text-slate-900">Upload Hero Image</h3>
                      <p className="text-xs text-slate-500">This stunning visual will be the first thing your clients see.</p>
                    </div>

                    <label className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${coverImage ? 'border-[#c5a880] bg-[#faf9f6]' : 'border-slate-300 bg-slate-50 hover:bg-[#faf9f6] hover:border-[#c5a880]'}`}>
                      {coverImage ? (
                        <>
                          <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                            {uploadingImage ? (
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            ) : (
                              <>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white"><Camera className="w-6 h-6" /></div>
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Change Photo</span>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          {uploadingImage ? (
                            <Loader2 className="w-12 h-12 text-[#c5a880] animate-spin mb-4" />
                          ) : (
                            <>
                              <div className="w-16 h-16 rounded-full bg-[#c5a880]/10 flex items-center justify-center mb-4 text-[#c5a880]">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">Click or drag image to upload</span>
                              <span className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">High Quality JPG/PNG Recommended</span>
                            </>
                          )}
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCoverImage, setImageName, setUploadingImage)} />
                    </label>
                  </motion.div>
                )}

                {/* STEP 5: Watermark & Final Settings */}
                {currentStep === 5 && (
                  <motion.div key="step5" custom={direction} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="space-y-6">
                    
                    {/* Watermark Section */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setCustomWatermark(!customWatermark)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Layers className="w-6 h-6" /></div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Custom Watermark</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Protect your digital gallery</p>
                          </div>
                        </div>
                        <div className={`w-14 h-7 rounded-full relative transition-colors ${customWatermark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${customWatermark ? 'left-8' : 'left-1'}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {customWatermark && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="pt-4 border-t border-slate-100 space-y-5">
                              
                              <div className="flex gap-4">
                                <button type="button" onClick={() => setWatermarkType('LOGO')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${watermarkType === 'LOGO' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>Logo</button>
                                <button type="button" onClick={() => setWatermarkType('TEXT')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${watermarkType === 'TEXT' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>Text</button>
                              </div>

                              {watermarkType === 'TEXT' ? (
                                <div className="relative group">
                                  <input 
                                    type="text" id="watermarkText" required placeholder="Watermark Text"
                                    className="peer w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all outline-none shadow-sm placeholder-transparent" 
                                    value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} 
                                  />
                                  <label htmlFor="watermarkText" className="absolute left-4 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-indigo-500">
                                    Watermark Text <span className="text-rose-500">*</span>
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {uploadingWatermark ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : watermarkLogoUrl ? <img src={watermarkLogoUrl} className="max-w-[80%] max-h-[80%] object-contain" alt="WM" /> : <Camera className="w-6 h-6 text-slate-300" />}
                                  </div>
                                  <label className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                                    Upload Transparent PNG
                                    <input type="file" accept="image/png" className="hidden" onChange={(e) => handleImageUpload(e, setWatermarkLogoUrl, setWatermarkLogoName, setUploadingWatermark)} />
                                  </label>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Position</label>
                                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400" value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value)}>
                                    <option value="BOTTOM_RIGHT">Bottom Right</option>
                                    <option value="BOTTOM_LEFT">Bottom Left</option>
                                    <option value="TOP_RIGHT">Top Right</option>
                                    <option value="TOP_LEFT">Top Left</option>
                                    <option value="CENTER">Center</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Size ({watermarkWidth}%)</label>
                                  <input type="range" min="5" max="50" className="w-full accent-indigo-600" value={watermarkWidth} onChange={e => setWatermarkWidth(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opacity ({watermarkOpacity}%)</label>
                                  <input type="range" min="10" max="100" className="w-full accent-indigo-600" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))} />
                                </div>
                              </div>

                              <div className="mt-4 rounded-2xl overflow-hidden bg-slate-900 relative aspect-[3/1] border border-slate-200">
                                <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Preview" />
                                <div className="absolute inset-0 p-4">
                                  <div className="relative w-full h-full">
                                    {(watermarkType === 'LOGO' && watermarkLogoUrl) && (
                                      <img src={watermarkLogoUrl} style={{ position: 'absolute', pointerEvents: 'none', objectFit: 'contain', opacity: watermarkOpacity / 100, width: `${watermarkWidth}%`, ...(watermarkPosition === 'TOP_LEFT' ? { top: 0, left: 0 } : watermarkPosition === 'TOP_RIGHT' ? { top: 0, right: 0 } : watermarkPosition === 'BOTTOM_LEFT' ? { bottom: 0, left: 0 } : watermarkPosition === 'CENTER' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : { bottom: 0, right: 0 }) }} alt="wm" />
                                    )}
                                    {(watermarkType === 'TEXT' && watermarkText) && (
                                      <div style={{ position: 'absolute', pointerEvents: 'none', color: '#fff', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.8)', opacity: watermarkOpacity / 100, fontSize: `${Math.max(12, watermarkWidth * 0.6)}px`, ...(watermarkPosition === 'TOP_LEFT' ? { top: 0, left: 0 } : watermarkPosition === 'TOP_RIGHT' ? { top: 0, right: 0 } : watermarkPosition === 'BOTTOM_LEFT' ? { bottom: 0, left: 0 } : watermarkPosition === 'CENTER' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : { bottom: 0, right: 0 }) }}>
                                        {watermarkText}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Portfolio Section */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center justify-between cursor-pointer" onClick={() => setAddToPortfolio(!addToPortfolio)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Add to Portfolio Webpage</h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Showcase this event publicly</p>
                        </div>
                      </div>
                      <div className={`w-14 h-7 rounded-full relative transition-colors ${addToPortfolio ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${addToPortfolio ? 'left-8' : 'left-1'}`} />
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </form>
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50/80 border-t border-slate-200/60 p-4 sm:p-6 flex items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={handleBack} 
              className={`px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < 5 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-slate-900/20 hover:bg-[#c5a880] transition-colors flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl bg-[#c5a880] text-slate-900 text-xs font-black uppercase tracking-wider shadow-xl shadow-[#c5a880]/30 hover:bg-slate-900 hover:text-[#c5a880] transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Launch Event</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
