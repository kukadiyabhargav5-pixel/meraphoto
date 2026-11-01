'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Upload,
  Camera,
  ArrowRight,
  ArrowLeft,
  Check,
  Lock,
  User as UserIcon,
  Phone,
  Mail,
  Sparkles,
  Image as ImageIcon,
  Settings,
  Type,
  Layers,
  ShieldCheck,
  HeartHandshake,
  Film,
  AlertTriangle,
  CheckCircle,
  Crop,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import CustomDatePicker from '../../../components/CustomDatePicker';
import CoverImageCropModal from '../../../components/cover/CoverImageCropModal';
import { useRouter } from 'next/navigation';
import { apiClient, resolveMediaUrl } from '@/lib/api';
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
  const [eventDate, setEventDate] = useState(() => {
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = (today.getMonth() + 1).toString().padStart(2, '0');
      const d = today.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  });
  const [eventTime, setEventTime] = useState('09:00');
  const [eventLocation, setEventLocation] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [eventDays, setEventDays] = useState<{ date: string; time: string; location: string }[]>([]);

  // Step 4: Cover Image with 16:9 interactive movement & crop
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coverDimensions, setCoverDimensions] = useState<{ width: number; height: number } | null>(null);
  const [ratioMismatch, setRatioMismatch] = useState(false);

  // 16:9 Cropper Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);
  const [rawFileName, setRawFileName] = useState<string>('cover.jpg');

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
  const [allowDownload, setAllowDownload] = useState(true);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Restore active step from sessionStorage to prevent accidental resets
  useEffect(() => {
    try {
      const savedStep = sessionStorage.getItem('mara_create_event_step');
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (parsed >= 1 && parsed <= 5) {
          setCurrentStep(parsed);
        }
      }
    } catch {}
  }, []);

  const EVENT_TYPES = [
    'WEDDING',
    'PRE WEDDING',
    'RECEPTION',
    'BIRTHDAY',
    'CORPORATE',
    'SCHOOL',
    'GARBA',
    'CONCERT',
    'RELIGIOUS',
    'ENGAGEMENT',
    'BABY SHOWER',
    'PANCHMASI',
  ];

  const POPULAR_TYPES = [
    'WEDDING',
    'PRE WEDDING',
    'RECEPTION',
    'ENGAGEMENT',
    'BIRTHDAY',
    'CORPORATE',
  ];

  const stepLabels = [
    { label: 'Client Info', icon: UserIcon },
    { label: 'Event Details', icon: Sparkles },
    { label: 'Schedule', icon: Calendar },
    { label: 'Cover Photo', icon: Camera },
    { label: 'Watermark', icon: ShieldCheck },
  ];

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 'next' : 'prev');
    setCurrentStep(step);
    try {
      sessionStorage.setItem('mara_create_event_step', step.toString());
    } catch {}
  };

  const canProceedStep1 = (showToast = true) => {
    if (!eventName.trim()) {
      if (showToast) toast.error('Please enter the Event Title / Name');
      return false;
    }
    if (!clientName.trim()) {
      if (showToast) toast.error('Please enter Client Full Name');
      return false;
    }
    if (!clientMobile.trim()) {
      if (showToast) toast.error('Please enter Client Mobile Number');
      return false;
    }
    if (clientEmail.trim() && !/^\S+@\S+\.\S+$/.test(clientEmail.trim())) {
      if (showToast) toast.error('Please enter a valid Client Email Address or leave it empty');
      return false;
    }
    return true;
  };

  const canProceedStep2 = (showToast = true) => {
    const selectedType = showCustomType ? customEventType.trim() : eventType;
    if (!selectedType) {
      if (showToast) toast.error('Please select an event type or enter custom category');
      return false;
    }
    if (accessType === 'PASSWORD' && !password.trim()) {
      if (showToast) toast.error('Please set a secret password for event privacy');
      return false;
    }
    if (accessType === 'OTP' && password.trim().length !== 4) {
      if (showToast) toast.error('Please enter a 4-digit PIN for access');
      return false;
    }
    return true;
  };

  const canProceedStep3 = (showToast = true) => {
    if (!eventDate) {
      if (showToast) toast.error('Please select the Event Date');
      return false;
    }
    if (!eventTime) {
      if (showToast) toast.error('Please select the Event Time');
      return false;
    }
    if (!eventLocation.trim()) {
      if (showToast) toast.error('Please enter the Venue Location');
      return false;
    }
    return true;
  };

  const canProceedStep4 = (showToast = true) => {
    if (!coverImage) {
      if (showToast) toast.error('Please upload a Cover Photo for the event gallery');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!canProceedStep1(true)) return;
      goToStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!canProceedStep2(true)) return;
      goToStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!canProceedStep3(true)) return;
      goToStep(4);
      return;
    }
    if (currentStep === 4) {
      if (!canProceedStep4(true)) return;
      goToStep(5);
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      goToStep(targetStep);
      return;
    }
    if (currentStep === 1 && !canProceedStep1(true)) return;
    if (targetStep > 2 && !canProceedStep2(true)) {
      if (currentStep < 2) goToStep(2);
      return;
    }
    if (targetStep > 3 && !canProceedStep3(true)) {
      if (currentStep < 3) goToStep(3);
      return;
    }
    if (targetStep > 4 && !canProceedStep4(true)) {
      if (currentStep < 4) goToStep(4);
      return;
    }
    goToStep(targetStep);
  };

  const getEffectiveEventType = () =>
    showCustomType ? customEventType.trim() || 'CUSTOM' : eventType;

  const getPreviewPosition = (pos: string) => {
    switch (pos) {
      case 'TOP_LEFT':
        return { top: '5%', left: '5%', right: 'auto', bottom: 'auto', transform: 'none' };
      case 'TOP_RIGHT':
        return { top: '5%', right: '5%', left: 'auto', bottom: 'auto', transform: 'none' };
      case 'TOP':
      case 'TOP_CENTER':
        return { top: '5%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' };
      case 'BOTTOM_LEFT':
        return { bottom: '5%', left: '5%', right: 'auto', top: 'auto', transform: 'none' };
      case 'CENTER':
        return { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' };
      case 'BOTTOM':
      case 'BOTTOM_CENTER':
        return { bottom: '5%', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' };
      case 'BOTTOM_RIGHT':
      default:
        return { bottom: '5%', right: '5%', left: 'auto', top: 'auto', transform: 'none' };
    }
  };

  /**
   * Handle user choosing a cover photo file.
   * If it is already 16:9 (±0.03 tolerance), upload directly.
   * If NOT 16:9, automatically open the interactive 16:9 movement & crop modal!
   */
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = w / h;
      const targetRatio = 16 / 9;
      const is16by9 = Math.abs(ratio - targetRatio) <= 0.035;

      setRawImageForCrop(objectUrl);
      setRawFileName(file.name);

      if (is16by9) {
        // Image is already 16:9! Upload directly
        setCoverDimensions({ width: w, height: h });
        setRatioMismatch(false);
        await uploadCoverFile(file);
      } else {
        // Image is NOT 16:9: Open the 16:9 interactive movement cropper!
        toast('Image is not 16:9. Please adjust the crop window to select your preferred frame.', {
          icon: '📐',
          duration: 4000,
        });
        setCropModalOpen(true);
      }
    };
    img.src = objectUrl;

    if (e.target) e.target.value = '';
  };

  /**
   * Uploads an image file to the asset upload endpoint.
   */
  const uploadCoverFile = async (fileToUpload: File | Blob, customName?: string) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', fileToUpload, customName || 'cover-16x9.jpg');

      const res = await apiClient.post('/media/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        setCoverImage(res.data.url);
        setImageName(customName || (fileToUpload as File).name || 'cover-16x9.jpg');
        setRatioMismatch(false);
        setCoverDimensions({ width: 1920, height: 1080 });
        toast.success('16:9 Cover photo ready!');
      }
    } catch (err) {
      console.error('Cover upload failed', err);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Callback received when user finishes moving/adjusting in the 16:9 Cropper Modal.
   */
  const handleCropComplete = async (croppedBlob: Blob, croppedFile: File, previewUrl: string) => {
    setCoverDimensions({ width: 1920, height: 1080 });
    setRatioMismatch(false);
    await uploadCoverFile(croppedFile, croppedFile.name);
  };

  /**
   * Reopen crop modal for the current image.
   */
  const handleReCrop = () => {
    if (coverImage) {
      setRawImageForCrop(resolveMediaUrl(coverImage));
      setRawFileName(imageName || 'cover-image.jpg');
      setCropModalOpen(true);
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
    if (!eventName || !coverImage) {
      toast.error('Event name and Cover image are required');
      return;
    }
    try {
      setLoading(true);
      await apiClient.post('/event', {
        name: eventName,
        clientName,
        clientMobile,
        clientEmail: clientEmail.trim() || undefined,
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
        allowDownload,
        watermark: {
          isActive: customWatermark,
          type: watermarkType,
          text: watermarkText,
          logoUrl: watermarkLogoUrl,
          position: watermarkPosition,
          width: watermarkWidth,
          height: watermarkHeight,
          opacity: watermarkOpacity / 100,
        },
      });

      if (context && context.customers) {
        const existingCust = context.customers.find(
          (c: any) => c.phone === clientMobile || c.email === clientEmail
        );
        if (!existingCust) {
          context.setCustomers([
            {
              name: clientName,
              email: clientEmail,
              phone: clientMobile,
              events: 1,
              status: 'Active',
            },
            ...context.customers,
          ]);
        }
      }

      try {
        sessionStorage.removeItem('mara_create_event_step');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mara_cached_events');
        }
      } catch {}

      toast.success('Event created successfully!');
      const isSuperAdmin =
        context?.sessionUser?.role === 'SUPER_ADMIN' ||
        context?.sessionUser?.email === 'maraphoto303@gmail.com';
      const baseEventsUrl =
        (typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/admin-dashboard')) ||
        isSuperAdmin
          ? '/admin-dashboard/events'
          : '/dashboard/events';
      router.push(baseEventsUrl);
    } catch (error: any) {
      console.error('Failed to create event', error);
      toast.error(error.response?.data?.error || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: (dir: 'next' | 'prev') => ({ x: dir === 'next' ? 24 : -24, opacity: 0 }),
    in: { x: 0, opacity: 1 },
    out: (dir: 'next' | 'prev') => ({ x: dir === 'next' ? -24 : 24, opacity: 0 }),
  };
  const pageTransition: any = { type: 'tween', ease: 'anticipate', duration: 0.3 };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#faf9f6] via-[#f7f5ef] to-[#efece2] text-slate-900 min-h-full font-poppins relative">
      {/* 16:9 Interactive Movement & Crop Modal */}
      <CoverImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageForCrop}
        fileName={rawFileName}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Ambient Decorative Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-[#c5a880]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#e3d8c8]/25 rounded-full blur-[150px] pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-3 xs:px-4 sm:px-6 py-6 sm:py-10 relative z-10 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 border border-[#c5a880]/40 text-[#9c7c56] text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Studio Event Creator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif-luxury">
            Create New Event
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed px-2">
            Design an extraordinary client gallery with facial recognition, instant delivery, and verified 16:9 cinematic cover presentation.
          </p>
        </div>

        {/* Wizard Main Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-[#e8dfd3] shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-slate-900/5 transition-all">
          {/* Stepper Navigation Bar */}
          <div className="bg-gradient-to-r from-white via-[#fcfbf9] to-white border-b border-[#e8dfd3] px-3 sm:px-8 py-3.5 sm:py-5">
            {/* Mobile Stepper (< sm) */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#a07c4c] bg-[#c5a880]/15 px-2.5 py-0.5 rounded-full border border-[#c5a880]/30">
                  Step {currentStep} of {stepLabels.length}
                </span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  {React.createElement(stepLabels[currentStep - 1].icon, {
                    className: 'w-3.5 h-3.5 text-[#c5a880]',
                  })}
                  {stepLabels[currentStep - 1].label}
                </span>
              </div>

              {/* 5 Circular Badges with Connecting Progress Line */}
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 -translate-y-1/2 left-5 right-5 h-[2px] bg-slate-200 -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (stepLabels.length - 1)) * 100}%` }}
                  />
                </div>

                {stepLabels.map((item, i) => {
                  const step = i + 1;
                  const isActive = currentStep === step;
                  const isPast = currentStep > step;
                  const Icon = item.icon;

                  return (
                    <button
                      type="button"
                      key={step}
                      onClick={() => handleStepClick(step)}
                      className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white font-black shadow-md ring-2 ring-[#c5a880]/40 scale-110'
                          : isPast
                          ? 'bg-slate-900 text-[#c5a880] cursor-pointer active:scale-95'
                          : 'bg-white text-slate-400 border border-slate-200 cursor-pointer hover:border-[#c5a880]'
                      }`}
                      title={item.label}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Stepper (>= sm) */}
            <div className="hidden sm:block relative">
              <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                {stepLabels.map((item, i) => {
                  const step = i + 1;
                  const isActive = currentStep === step;
                  const isPast = currentStep > step;
                  const Icon = item.icon;

                  return (
                    <div
                      key={step}
                      onClick={() => handleStepClick(step)}
                      className="flex flex-col items-center gap-2 relative z-10 select-none cursor-pointer group"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white shadow-lg shadow-[#c5a880]/40 scale-110 ring-4 ring-[#c5a880]/20'
                            : isPast
                            ? 'bg-slate-900 text-[#c5a880] group-hover:scale-105 shadow-md'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 group-hover:border-[#c5a880] group-hover:text-slate-700'
                        }`}
                      >
                        {isPast ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
                          isActive
                            ? 'text-[#9e7b4f]'
                            : isPast
                            ? 'text-slate-900'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* Connecting Progress Line */}
                <div className="absolute top-[22px] left-10 right-10 h-[2.5px] bg-slate-200 -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-slate-900 via-[#c5a880] to-[#9e7b4f] transition-all duration-500 ease-out shadow-xs"
                    style={{ width: `${((currentStep - 1) / (stepLabels.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wizard Content Body */}
          <div className="p-4 xs:p-6 sm:p-10 min-h-[380px]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === 5) handleSubmit(e);
                else handleNext();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  if (currentStep === 5) handleSubmit(e);
                  else handleNext();
                }
              }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                {/* ======================================================== */}
                {/* STEP 1: Client Information (ZERO PLACEHOLDERS) */}
                {/* ======================================================== */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="space-y-6"
                  >
                    <div className="border-b border-[#e8dfd3] pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Step 1: Client & Event Information
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please provide primary contact information for your client gallery.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Event Name */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="eventName" className="edit-label">
                          Event Title / Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="eventName"
                            className="edit-input font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          The main title shown on the album cover and invitation links.
                        </p>
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
                            className="edit-input edit-input-with-icon font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
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
                            className="edit-input edit-input-with-icon font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
                            style={{ paddingLeft: '44px' }}
                            value={clientMobile}
                            onChange={(e) => setClientMobile(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Used for customer records and SMS gallery link sharing.
                        </p>
                      </div>

                      {/* Email Address */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="clientEmail" className="edit-label">
                          Client Email Address <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input
                            type="email"
                            id="clientEmail"
                            className="edit-input edit-input-with-icon font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
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
                {/* STEP 2: Event Details & Access Privacy (ZERO PLACEHOLDERS) */}
                {/* ======================================================== */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="space-y-6 sm:space-y-8"
                  >
                    <div className="border-b border-[#e8dfd3] pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Step 2: Event Type & Access Privacy
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose an event category and specify gallery authentication.
                      </p>
                    </div>

                    {/* EVENT TYPE SELECTION SECTION */}
                    <div className="space-y-4">
                      {/* Live Selected Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#c5a880]/15 to-transparent border border-[#c5a880]/40 shadow-xs gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Currently Selected Event Type
                            </p>
                            <p className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide truncate">
                              {showCustomType
                                ? customEventType.trim() || 'Custom Category'
                                : eventType}
                            </p>
                          </div>
                        </div>
                        <span className="self-start sm:self-center px-3 py-1 rounded-full bg-white text-[#9c7c56] font-black text-[10px] border border-[#c5a880]/30 shadow-xs uppercase tracking-wider shrink-0">
                          {showCustomType ? '✨ Custom' : '🏷️ Preset'}
                        </span>
                      </div>

                      {/* Dropdown Selector */}
                      <div className="space-y-1.5">
                        <label className="edit-label">
                          Select Event Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          className="edit-input font-bold text-sm bg-white border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
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
                          {EVENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                          <option value="CUSTOM">+ CUSTOM EVENT TYPE</option>
                        </select>
                      </div>

                      {/* Quick Select Preset Pills */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Popular Categories (1-Click Selection)
                        </label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {POPULAR_TYPES.map((type) => {
                            const isSelected = !showCustomType && eventType === type;
                            return (
                              <button
                                type="button"
                                key={type}
                                onClick={() => {
                                  setEventType(type);
                                  setShowCustomType(false);
                                }}
                                className={`px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white border-[#c5a880] shadow-md scale-105 ring-2 ring-[#c5a880]/30'
                                    : 'bg-white text-slate-600 border-[#e8dfd3] hover:border-[#c5a880] hover:text-slate-900 shadow-xs'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomType(true);
                              setEventType('');
                            }}
                            className={`px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border border-dashed cursor-pointer ${
                              showCustomType
                                ? 'bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white border-[#c5a880] shadow-md scale-105 ring-2 ring-[#c5a880]/30'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-[#c5a880] hover:text-slate-900'
                            }`}
                          >
                            + Custom Type
                          </button>
                        </div>
                      </div>

                      {/* Custom Event Type Input (ZERO PLACEHOLDER) */}
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
                                Custom Event Category Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="customEventType"
                                autoFocus
                                className="edit-input font-bold border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/30"
                                value={customEventType}
                                onChange={(e) => setCustomEventType(e.target.value)}
                              />
                              <p className="text-[10px] text-slate-500 font-medium">
                                This custom name will appear in client portals and navigation filters.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* PRIVACY & ACCESS CONTROL */}
                    <div className="space-y-4 pt-6 border-t border-[#e8dfd3]">
                      <label className="edit-label">
                        Gallery Privacy & Access <span className="text-rose-500">*</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            value: 'PUBLIC',
                            label: 'Public Access',
                            desc: 'Direct link access for all guests',
                            icon: UserIcon,
                          },
                          {
                            value: 'PASSWORD',
                            label: 'Password Protected',
                            desc: 'Requires secret password',
                            icon: Lock,
                          },
                          {
                            value: 'OTP',
                            label: 'Secure PIN',
                            desc: '4-digit verification code',
                            icon: Settings,
                          },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = accessType === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => {
                                setAccessType(opt.value);
                                setPassword('');
                              }}
                              className={`cursor-pointer p-4 rounded-2xl border transition-all flex sm:flex-col items-center gap-3 sm:gap-2.5 text-left sm:text-center group ${
                                isSelected
                                  ? 'bg-[#c5a880]/10 border-[#c5a880] ring-2 ring-[#c5a880]/40 shadow-sm'
                                  : 'bg-white border-[#e8dfd3] hover:border-[#c5a880]/60 shadow-xs'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-[#c5a880]/15 group-hover:text-[#9e7b4f]'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1 sm:flex-none">
                                <span
                                  className={`text-xs font-black uppercase tracking-wider block ${
                                    isSelected ? 'text-slate-900' : 'text-slate-700'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium leading-tight">
                                  {opt.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Password Input Reveal (ZERO PLACEHOLDER) */}
                      <AnimatePresence>
                        {accessType === 'PASSWORD' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1.5 pt-2"
                          >
                            <label htmlFor="passwordAccess" className="edit-label">
                              Secret Password for Gallery <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="passwordAccess"
                              className="edit-input font-bold border-[#e8dfd3] hover:border-[#c5a880]"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-500 font-medium">
                              Guests must enter this password to view the event album.
                            </p>
                          </motion.div>
                        )}
                        {accessType === 'OTP' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1.5 pt-2 text-center"
                          >
                            <label htmlFor="pinAccess" className="edit-label text-center">
                              4-Digit Access PIN <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="pinAccess"
                              maxLength={4}
                              className="edit-input w-44 mx-auto text-center tracking-[0.6em] font-black text-xl border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/30"
                              value={password}
                              onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                            />
                            <p className="text-[10px] text-slate-500 font-medium">
                              Guests must enter this 4-digit code to access photos.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 3: Schedule & Locations (ZERO PLACEHOLDERS) */}
                {/* ======================================================== */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="space-y-6"
                  >
                    <div className="border-b border-[#e8dfd3] pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Step 3: Schedule & Venue Location
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set the timing and celebration locations.
                      </p>
                    </div>

                    {/* Total Event Days Counter */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e8dfd3] flex items-center justify-between shadow-xs">
                      <div>
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                          Total Event Days
                        </label>
                        <p className="text-[10px] text-slate-500 font-medium">
                          For multi-day celebrations (e.g. Haldi, Sangeet, Wedding)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (totalDays > 1) {
                              const nd = totalDays - 1;
                              setTotalDays(nd);
                              setEventDays((prev) => prev.slice(0, nd - 1));
                            }
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all text-base"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-sm font-black font-mono text-slate-900">
                          {totalDays}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (totalDays < 10) {
                              const nd = totalDays + 1;
                              setTotalDays(nd);
                              const arr = [...eventDays];
                              while (arr.length < nd - 1)
                                arr.push({ date: '', time: '', location: '' });
                              setEventDays(arr);
                            }
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Day 1 Schedule */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#e8dfd3] bg-white shadow-sm space-y-4 hover:border-[#c5a880]/50 transition-colors">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#c5a880] to-[#9e7b4f] text-white flex items-center justify-center text-xs font-black shadow-xs">
                          1
                        </span>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          {totalDays > 1 ? 'Day 1 Schedule' : 'Main Schedule'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                          <label className="edit-label">
                            Event Date <span className="text-rose-500">*</span>
                          </label>
                          <CustomDatePicker
                            type="date"
                            className="edit-input font-bold"
                            value={eventDate}
                            onChange={(v) => setEventDate(v)}
                          />
                        </div>
                        <div>
                          <label className="edit-label">
                            Event Time <span className="text-rose-500">*</span>
                          </label>
                          <CustomDatePicker
                            type="time"
                            className="edit-input font-bold"
                            value={eventTime}
                            onChange={(v) => setEventTime(v)}
                          />
                        </div>
                      </div>

                      {/* Location Input (ZERO PLACEHOLDER) */}
                      <div>
                        <label htmlFor="eventLocation" className="edit-label">
                          Venue Location <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                            <MapPin className="w-4 h-4 text-[#c5a880]" />
                          </div>
                          <input
                            type="text"
                            id="eventLocation"
                            className="edit-input edit-input-with-icon font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
                            style={{ paddingLeft: '44px' }}
                            value={eventLocation}
                            onChange={(e) => setEventLocation(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Hotel, banquet hall, resort, city, or venue address.
                        </p>
                      </div>
                    </div>

                    {/* Additional Multi-Days (ZERO PLACEHOLDERS) */}
                    {totalDays > 1 &&
                      eventDays.map((day, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl border border-[#e8dfd3] bg-white shadow-sm space-y-4 hover:border-[#c5a880]/50 transition-colors animate-fade-in"
                        >
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                              {idx + 2}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                              Day {idx + 2} Schedule
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                            <div>
                              <label className="edit-label">
                                Date <span className="text-rose-500">*</span>
                              </label>
                              <CustomDatePicker
                                type="date"
                                className="edit-input font-bold"
                                value={day.date}
                                onChange={(v) => {
                                  const d = [...eventDays];
                                  d[idx].date = v;
                                  setEventDays(d);
                                }}
                              />
                            </div>
                            <div>
                              <label className="edit-label">
                                Time <span className="text-rose-500">*</span>
                              </label>
                              <CustomDatePicker
                                type="time"
                                className="edit-input font-bold"
                                value={day.time}
                                onChange={(v) => {
                                  const d = [...eventDays];
                                  d[idx].time = v;
                                  setEventDays(d);
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="edit-label">
                              Venue Location <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400">
                                <MapPin className="w-4 h-4 text-[#c5a880]" />
                              </div>
                              <input
                                type="text"
                                className="edit-input edit-input-with-icon font-bold text-slate-900 border-[#e8dfd3] hover:border-[#c5a880] transition-colors"
                                style={{ paddingLeft: '44px' }}
                                value={day.location}
                                onChange={(e) => {
                                  const d = [...eventDays];
                                  d[idx].location = e.target.value;
                                  setEventDays(d);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </motion.div>
                )}

                {/* ======================================================== */}
                {/* STEP 4: Hero Cover Image (16:9 RATIO + MOVEMENT CROPPER) */}
                {/* ======================================================== */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="space-y-5"
                  >
                    <div className="border-b border-[#e8dfd3] pb-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            Step 4: Hero Cover Photo (16:9 Widescreen)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Upload any photo. If it is not 16:9, our interactive movement tool lets you pan and select the exact portion you want.
                          </p>
                        </div>

                        {coverImage && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleReCrop}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#c5a880]/50 text-[#9e7b4f] hover:bg-[#c5a880]/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Crop className="w-3.5 h-3.5" />
                              <span>Adjust 16:9 Frame</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 16:9 Status Banner */}
                    {coverImage && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 flex items-center justify-between gap-3 text-emerald-800 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                              Verified 16:9 Aspect Ratio
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium">
                              Perfect widescreen frame (1920 × 1080 px) ready for client display.
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          Ready
                        </span>
                      </div>
                    )}

                    {/* Cover Preview Container */}
                    {coverImage ? (
                      <div className="space-y-3">
                        <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#c5a880] bg-slate-950 shadow-xl group transition-all duration-300">
                          {/* Image rendering in pure 16:9 */}
                          <img
                            src={resolveMediaUrl(coverImage)}
                            alt="Cover"
                            className="w-full h-full object-cover block mx-auto select-none transition-transform duration-700 group-hover:scale-102"
                          />

                          {/* Hover Overlay Desktop */}
                          <div className="hidden sm:flex absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-3 backdrop-blur-xs">
                            {uploadingImage ? (
                              <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-[#c5a880] animate-spin" />
                                <span className="text-xs font-bold text-white">
                                  Processing cover...
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={handleReCrop}
                                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                  <Crop className="w-4 h-4 stroke-[2.5]" />
                                  <span>Adjust 16:9 Portion</span>
                                </button>

                                <label className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                                  <Camera className="w-4 h-4" />
                                  <span>Choose Other Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleCoverUpload}
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Mobile Touch Action Bar */}
                          <div className="sm:hidden absolute bottom-3 left-3 right-3 z-10 flex gap-2">
                            <button
                              type="button"
                              onClick={handleReCrop}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900/90 text-[#c5a880] border border-[#c5a880]/50 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
                            >
                              <Crop className="w-3.5 h-3.5" />
                              <span>Adjust Crop</span>
                            </button>

                            <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-950/90 text-white border border-white/30 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer">
                              <Camera className="w-3.5 h-3.5" />
                              <span>Change</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverUpload}
                              />
                            </label>
                          </div>

                          {/* 16:9 Corner Badge */}
                          <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                            <span className="px-3 py-1 rounded-full bg-black/70 text-[#f5deb3] border border-[#c5a880]/50 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              16:9 Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty Upload Dropzone */
                      <label className="relative flex flex-col items-center justify-center w-full min-h-[220px] sm:min-h-[280px] aspect-[16/9] border-2 border-dashed rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-[#c5a880]/50 bg-white hover:bg-[#faf7f2] hover:border-[#c5a880] hover:shadow-lg group shadow-xs">
                        <div className="flex flex-col items-center justify-center p-5 sm:p-8 text-center">
                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-10 sm:w-12 h-10 sm:h-12 text-[#c5a880] animate-spin" />
                              <span className="text-xs font-bold text-slate-600">
                                Uploading and framing photo...
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-[#c5a880]/15 flex items-center justify-center mb-3 sm:mb-4 text-[#9c7c56] border border-[#c5a880]/30 shadow-xs group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-7 sm:w-8 h-7 sm:h-8" />
                              </div>
                              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                                Click or tap to upload cover photo
                              </span>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9c7c56] font-bold">
                                <Crop className="w-3.5 h-3.5" />
                                <span>Automatic 16:9 interactive movement & crop support</span>
                              </div>
                              <span className="text-[11px] text-slate-400 mt-1 font-medium">
                                Upload any resolution or aspect ratio (JPG, PNG, WEBP)
                              </span>
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
                {/* STEP 5: Watermark Protection & Settings (ZERO PLACEHOLDERS) */}
                {/* ======================================================== */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    custom={direction}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="space-y-6"
                  >
                    <div className="border-b border-[#e8dfd3] pb-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Step 5: Watermark Protection & Portfolio
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Protect your photography with custom watermark branding.
                      </p>
                    </div>

                    {/* Watermark Section */}
                    <div className="bg-white border border-[#e8dfd3] rounded-2xl p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-xs font-black text-[#9c7c56] shrink-0">
                            W
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                              Custom Event Watermark
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                              Stamp your logo or studio name onto gallery photos
                            </p>
                          </div>
                        </div>
                        <div
                          className="toggle-switch cursor-pointer shrink-0"
                          data-active={customWatermark}
                          onClick={() => setCustomWatermark(!customWatermark)}
                        />
                      </div>

                      {customWatermark && (
                        <div className="mt-5 space-y-5 border-t border-slate-100 pt-5 animate-fade-in">
                          {/* Watermark Type Selector */}
                          <div>
                            <label className="edit-label">Watermark Type</label>
                            <select
                              className="edit-input font-bold tracking-wide border-[#e8dfd3] hover:border-[#c5a880]"
                              value={watermarkType}
                              onChange={(e) => setWatermarkType(e.target.value as any)}
                            >
                              <option value="LOGO">LOGO WATERMARK</option>
                              <option value="TEXT">TEXT WATERMARK</option>
                            </select>
                          </div>

                          {/* Logo Upload or Text Input (ZERO PLACEHOLDER) */}
                          {watermarkType === 'TEXT' ? (
                            <div>
                              <label className="edit-label">Watermark Text</label>
                              <input
                                type="text"
                                className="edit-input font-bold border-[#e8dfd3] hover:border-[#c5a880]"
                                value={watermarkText}
                                onChange={(e) => setWatermarkText(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="edit-label">Watermark Logo Image</label>
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mt-1">
                                <div className="w-[60px] h-[60px] rounded-xl border border-dashed border-[#c5a880]/60 flex items-center justify-center shrink-0 bg-[#faf8f5] text-slate-900 overflow-hidden shadow-xs mx-auto sm:mx-0">
                                  {uploadingWatermark ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" />
                                  ) : watermarkLogoUrl ? (
                                    <img
                                      src={resolveMediaUrl(watermarkLogoUrl)}
                                      className="max-w-[44px] max-h-[44px] object-contain"
                                      alt="WM"
                                    />
                                  ) : (
                                    <Camera className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <label className="w-full text-center border border-[#e8dfd3] text-[#9c7c56] font-black text-[13px] py-2.5 rounded-xl bg-white cursor-pointer hover:bg-[#faf8f5] hover:border-[#c5a880] transition-colors shadow-xs active:scale-95">
                                    {uploadingWatermark ? 'Uploading...' : 'Choose Logo File'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleWatermarkLogoUpload}
                                    />
                                  </label>
                                  <p className="text-[10px] text-slate-500 font-bold mt-1 text-center sm:text-left">
                                    PNG with transparent background recommended.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Watermark Position Dropdown */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                            <label className="edit-label text-slate-700 font-bold mb-1.5 block">
                              Watermark Position
                            </label>
                            <select
                              className="edit-input font-bold tracking-wide text-xs py-2 px-3 w-full bg-white border border-slate-200 rounded-lg cursor-pointer"
                              value={watermarkPosition}
                              onChange={(e) => setWatermarkPosition(e.target.value)}
                            >
                              <option value="BOTTOM_RIGHT">BOTTOM RIGHT (Default)</option>
                              <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                              <option value="BOTTOM">BOTTOM CENTER</option>
                              <option value="TOP_RIGHT">TOP RIGHT</option>
                              <option value="TOP_LEFT">TOP LEFT</option>
                              <option value="TOP">TOP CENTER</option>
                              <option value="CENTER">CENTER</option>
                            </select>
                          </div>

                          {/* Size and Opacity Controls */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="edit-label mb-0">Size ({watermarkWidth}%)</label>
                                <span className="text-xs font-mono font-black text-[#9c7c56] bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {watermarkWidth}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="100"
                                className="w-full custom-slider mt-2"
                                value={watermarkWidth}
                                onChange={(e) => setWatermarkWidth(Number(e.target.value))}
                                style={{ '--val': `${watermarkWidth}%` } as any}
                              />
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="edit-label mb-0">
                                  Opacity ({watermarkOpacity}%)
                                </label>
                                <span className="text-xs font-mono font-black text-[#9c7c56] bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {watermarkOpacity}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                className="w-full custom-slider mt-2"
                                value={watermarkOpacity}
                                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                                style={{ '--val': `${watermarkOpacity}%` } as any}
                              />
                            </div>
                          </div>

                          {/* Live Preview Box with Fixed Cover Photo */}
                          <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-sm relative w-full aspect-[3/2] flex items-center justify-center select-none">
                            <img
                              src="/wedding.jpg"
                              className="absolute inset-0 w-full h-full object-cover"
                              alt="Preview Background"
                            />

                            {watermarkType === 'LOGO' && watermarkLogoUrl && (
                              <img
                                src={watermarkLogoUrl}
                                className="absolute pointer-events-none object-contain"
                                style={{
                                  opacity: Number(watermarkOpacity || 80) / 100,
                                  width: `${watermarkWidth}%`,
                                  maxHeight: '65%',
                                  ...getPreviewPosition(watermarkPosition),
                                }}
                                alt="watermark"
                              />
                            )}

                            {watermarkType === 'TEXT' && watermarkText && (
                              <div
                                className="absolute pointer-events-none text-white font-black whitespace-nowrap tracking-wide select-none"
                                style={{
                                  opacity: Number(watermarkOpacity || 100) / 100,
                                  fontSize: `${Math.max(
                                    13,
                                    Math.round(((Number(watermarkWidth || 20) / 100) * 44) + 6)
                                  )}px`,
                                  filter:
                                    'drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                                  textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                                  ...getPreviewPosition(watermarkPosition),
                                }}
                              >
                                {watermarkText}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Portfolio Toggle */}
                    <div 
                      onClick={() => setAddToPortfolio(!addToPortfolio)}
                      className={`bg-white border rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                        addToPortfolio ? 'border-[#c5a880] ring-2 ring-[#c5a880]/20 bg-amber-50/20' : 'border-[#e8dfd3] hover:border-[#c5a880]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          addToPortfolio ? 'bg-[#c5a880] text-white border-[#c5a880]' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          P
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                              Add to Public Portfolio
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              addToPortfolio ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {addToPortfolio ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                            Showcase this event on your studio public portfolio
                          </p>
                        </div>
                      </div>
                      <div
                        role="switch"
                        aria-checked={addToPortfolio}
                        className="toggle-switch cursor-pointer shrink-0"
                        data-active={addToPortfolio}
                      />
                    </div>

                    {/* Album Download Toggle */}
                    <div 
                      onClick={() => setAllowDownload(!allowDownload)}
                      className={`bg-white border rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                        allowDownload ? 'border-[#c5a880] ring-2 ring-[#c5a880]/20 bg-amber-50/20' : 'border-[#e8dfd3] hover:border-[#c5a880]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          allowDownload ? 'bg-[#c5a880] text-white border-[#c5a880]' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          D
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                              Allow Album Photo Downloads
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              allowDownload ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {allowDownload ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                            Enable or disable download button for guests in this album
                          </p>
                        </div>
                      </div>
                      <div
                        role="switch"
                        aria-checked={allowDownload}
                        className="toggle-switch cursor-pointer shrink-0"
                        data-active={allowDownload}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer Wizard Controls */}
          <div className="bg-white/95 backdrop-blur-md border-t border-[#e8dfd3] p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-4 sticky bottom-0 z-20">
            <button
              type="button"
              onClick={handleBack}
              className={`px-4 sm:px-6 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                currentStep === 1
                  ? 'invisible pointer-events-none'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none justify-center px-6 sm:px-8 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white hover:brightness-105 active:scale-95 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#c5a880]/30 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 sm:flex-none justify-center px-7 sm:px-9 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-[#c5a880]/40 hover:brightness-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Event</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
