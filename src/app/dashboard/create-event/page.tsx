'use client';
import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, Calendar, Clock, MapPin, Loader2, Upload, AlertCircle, Camera, Image as ImageIcon, ArrowRight, ArrowLeft, Check, Lock, User as UserIcon, Phone, Mail, Sparkles } from 'lucide-react';
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

  const stepLabels = ['Client Info', 'Event Type', 'Schedule', 'Cover Image', 'Watermark'];

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 'next' : 'prev');
    setCurrentStep(step);
  };

  const canProceedStep1 = () => {
    return eventName.trim().length > 0 && clientName.trim().length > 0 && clientMobile.trim().length > 0 && clientEmail.trim().length > 0;
  };
  const canProceedStep2 = () => {
    const selectedType = showCustomType ? customEventType.trim() : eventType;
    if (!selectedType) return false;
    if (accessType === 'PASSWORD' && !password) return false;
    if (accessType === 'OTP' && password.length !== 4) return false;
    return true;
  };
  const canProceedStep3 = () => {
    return eventDate && eventTime && eventLocation.trim().length > 0;
  };
  const canProceedStep4 = () => {
    return !!coverImage;
  };

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
    if (!eventName) { toast.error('Event name is required'); return; }
    if (!coverImage) { toast.error('Cover image is required'); return; }
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
          context.setCustomers([{
            name: clientName,
            email: clientEmail,
            phone: clientMobile,
            events: 1,
            status: 'Active'
          }, ...context.customers]);
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 font-poppins">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .ce-wrapper {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: calc(100vh - 80px);
          padding: 28px 16px 60px;
        }
        .ce-card {
          width: 100%;
          max-width: 600px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 30px rgba(0,0,0,0.04);
        }

        /* Header */
        .ce-header { padding: 28px 32px 0; }
        .ce-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
        .ce-subtitle { font-size: 12px; font-weight: 500; color: #94a3b8; margin: 0; }

        /* Tabs */
        .ce-tabs {
          display: flex;
          border-bottom: 1.5px solid #e2e8f0;
          padding: 0 32px;
          margin-top: 20px;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .ce-tabs::-webkit-scrollbar { display: none; }
        .ce-tab {
          flex-shrink: 0;
          padding: 10px 0;
          margin-right: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          cursor: default;
          position: relative;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .ce-tab:last-child { margin-right: 0; }
        .ce-tab.active { color: #0f172a; }
        .ce-tab.completed { color: #c5a880; }
        .ce-tab::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0; right: 0;
          height: 2.5px;
          background: transparent;
          border-radius: 2px 2px 0 0;
          transition: background 0.3s;
        }
        .ce-tab.active::after { background: #c5a880; }
        .ce-tab.completed::after { background: rgba(197,168,128,0.3); }
        .ce-tab-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px; height: 18px;
          border-radius: 50%;
          font-size: 9px; font-weight: 800;
          transition: all 0.3s;
        }
        .ce-tab.active .ce-tab-num { background: #c5a880; color: #fff; }
        .ce-tab.completed .ce-tab-num { background: rgba(197,168,128,0.15); color: #c5a880; }
        .ce-tab.upcoming .ce-tab-num { background: #f1f5f9; color: #94a3b8; }

        /* Body */
        .ce-body { padding: 24px 32px 32px; }

        /* Animations */
        @keyframes ce-slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ce-slideInR { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .ce-step { animation: ce-slideIn 0.3s ease forwards; }
        .ce-step.reverse { animation: ce-slideInR 0.3s ease forwards; }

        /* Form Fields */
        .ce-field { margin-bottom: 16px; }
        .ce-label {
          display: block;
          font-size: 10px; font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .ce-req { color: #dc2626; margin-left: 2px; }
        .ce-opt { color: #94a3b8; font-weight: 600; text-transform: none; letter-spacing: normal; font-size: 9px; margin-left: 4px; }
        .ce-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .ce-input:hover { border-color: #c5a880; }
        .ce-input:focus { border-color: #c5a880; box-shadow: 0 0 0 3px rgba(197,168,128,0.1); }
        .ce-select {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .ce-select:hover { border-color: #c5a880; }
        .ce-select:focus { border-color: #c5a880; box-shadow: 0 0 0 3px rgba(197,168,128,0.1); }

        /* Grids */
        .ce-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ce-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

        /* Type Chips */
        .ce-type-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .ce-type-chip {
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 11px; font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .ce-type-chip:hover { border-color: #c5a880; color: #0f172a; }
        .ce-type-chip.selected { background: #0f172a; border-color: #0f172a; color: #c5a880; }
        .ce-type-chip.other { border-style: dashed; }
        .ce-type-chip.other.selected { background: #c5a880; border-color: #c5a880; color: #0f172a; border-style: solid; }

        /* Access Chips */
        .ce-access-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .ce-access-chip {
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 11px; font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .ce-access-chip:hover { border-color: #c5a880; color: #0f172a; }
        .ce-access-chip.selected { background: #c5a880; border-color: #c5a880; color: #0f172a; }

        /* Password box */
        .ce-pw-box {
          margin-top: 12px;
          padding: 14px;
          background: #fffbf5;
          border: 1px solid #f0e6d6;
          border-radius: 10px;
        }
        .ce-pin-input { text-align: center; letter-spacing: 0.8em; font-weight: 900; font-size: 18px; }

        /* Custom type input */
        .ce-custom-type {
          margin-top: 10px;
          padding: 12px 14px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
        }

        /* Day Card */
        .ce-day-card {
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .ce-day-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }

        /* Cover Upload */
        .ce-cover-area {
          border: 2px dashed #e2e8f0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 180px;
        }
        .ce-cover-area:hover { border-color: #c5a880; background: #fdf9f4; }
        .ce-cover-area.has-img { border-style: solid; padding: 0; min-height: auto; }
        .ce-cover-area.has-img:hover { border-color: #c5a880; }
        .ce-cover-area .ce-cover-img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          background: #f1f1f1;
        }
        .ce-cover-hover {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .ce-cover-area:hover .ce-cover-hover { opacity: 1; }
        .ce-upload-icon-box {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(197,168,128,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c5a880;
          margin-bottom: 6px;
        }
        .ce-upload-text { font-size: 13px; font-weight: 600; color: #64748b; }
        .ce-upload-hint { font-size: 10px; color: #94a3b8; font-weight: 500; }

        /* Toggle */
        .ce-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 14px;
        }
        .ce-toggle-row:hover { border-color: #e2e8f0; background: #f8f7f4; }
        .ce-toggle-left { display: flex; align-items: center; gap: 10px; }
        .ce-toggle-badge {
          width: 26px; height: 26px;
          border-radius: 7px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px; font-weight: 800; color: #64748b;
        }
        .ce-toggle-txt { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
        .ce-sw {
          position: relative;
          width: 38px; height: 20px;
          background: #cbd5e1;
          border-radius: 20px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .ce-sw[data-on="true"] { background: #c5a880; }
        .ce-sw::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 16px; height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .ce-sw[data-on="true"]::after { transform: translateX(18px); }

        /* Watermark Panel */
        .ce-wm-panel {
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 14px;
        }
        .ce-wm-upload { display: flex; align-items: center; gap: 12px; }
        .ce-wm-thumb {
          width: 50px; height: 50px;
          border-radius: 8px;
          border: 1.5px dashed #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          flex-shrink: 0;
          overflow: hidden;
        }
        .ce-wm-thumb img { max-width: 36px; max-height: 36px; object-fit: contain; }
        .ce-wm-btn {
          display: inline-block;
          padding: 7px 14px;
          font-size: 11px; font-weight: 700;
          color: #c5a880;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ce-wm-btn:hover { border-color: #c5a880; background: #fdf9f4; }

        /* Slider */
        .ce-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(to right, #c5a880 var(--val, 50%), #e2e8f0 var(--val, 50%));
          outline: none;
          margin-top: 6px;
        }
        .ce-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #c5a880;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }

        /* Preview */
        .ce-preview-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 14px;
        }
        .ce-preview-hdr {
          background: #f1f5f9;
          padding: 7px 14px;
          font-size: 9px; font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ce-preview-body {
          position: relative;
          width: 100%;
          aspect-ratio: 3/2;
          background: #e2e8f0;
          overflow: hidden;
        }
        .ce-preview-body > img:first-child { width: 100%; height: 100%; object-fit: cover; }

        /* Buttons */
        .ce-btn-row { display: flex; gap: 10px; margin-top: 24px; }
        .ce-btn {
          flex: 1;
          padding: 13px 18px;
          font-size: 12px; font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.25s;
        }
        .ce-btn-go { background: #c5a880; color: #0f172a; }
        .ce-btn-go:hover { background: #0f172a; color: #c5a880; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(15,23,42,0.12); }
        .ce-btn-go:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
        .ce-btn-go:disabled:hover { background: #c5a880; color: #0f172a; }
        .ce-btn-bk {
          background: transparent;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
          flex: 0 0 auto;
          padding: 13px 16px;
        }
        .ce-btn-bk:hover { background: #f8f7f4; color: #0f172a; border-color: #c5a880; }

        /* Responsive */
        @media (max-width: 640px) {
          .ce-header { padding: 20px 18px 0; }
          .ce-tabs { padding: 0 18px; }
          .ce-tab { font-size: 9px; margin-right: 12px; }
          .ce-body { padding: 18px 18px 24px; }
          .ce-row-2, .ce-row-3 { grid-template-columns: 1fr; }
          .ce-btn-row { flex-direction: column-reverse; }
          .ce-btn-bk { flex: 1; }
        }
      `}} />

      <div className="ce-wrapper">
        <div className="ce-card">
          {/* Header */}
          <div className="ce-header">
            <h1 className="ce-title">Create New Event</h1>
            <p className="ce-subtitle">Setup a new QR-based photo gallery for your clients</p>
          </div>

          {/* Tabs */}
          <div className="ce-tabs">
            {stepLabels.map((label, i) => {
              const step = i + 1;
              const status = currentStep > step ? 'completed' : currentStep === step ? 'active' : 'upcoming';
              return (
                <div key={step} className={`ce-tab ${status}`}>
                  <span className="ce-tab-num">
                    {currentStep > step ? <Check style={{ width: 11, height: 11 }} /> : step}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="ce-body">
            <form onSubmit={handleSubmit}>

              {/* ===== STEP 1: Client Info ===== */}
              {currentStep === 1 && (
                <div className={`ce-step ${direction === 'prev' ? 'reverse' : ''}`} key="s1">
                  <div className="ce-field">
                    <label className="ce-label">Event Name <span className="ce-req">*</span></label>
                    <input type="text" className="ce-input" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
                  </div>
                  <div className="ce-field">
                    <label className="ce-label">Client Name <span className="ce-req">*</span></label>
                    <input type="text" className="ce-input" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div className="ce-field">
                    <label className="ce-label">Client Mobile <span className="ce-req">*</span></label>
                    <input type="tel" className="ce-input" value={clientMobile} onChange={(e) => setClientMobile(e.target.value)} required />
                  </div>
                  <div className="ce-field">
                    <label className="ce-label">Client Email <span className="ce-req">*</span></label>
                    <input type="email" className="ce-input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
                  </div>
                  <div className="ce-btn-row">
                    <button type="button" className="ce-btn ce-btn-go" disabled={!canProceedStep1()} onClick={handleNext}>
                      Continue <ArrowRight style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: Event Type & Access ===== */}
              {currentStep === 2 && (
                <div className={`ce-step ${direction === 'prev' ? 'reverse' : ''}`} key="s2">
                  <div className="ce-field">
                    <label className="ce-label">Event Type <span className="ce-req">*</span></label>
                    <div className="ce-type-grid">
                      {EVENT_TYPES.map(type => (
                        <div
                          key={type}
                          className={`ce-type-chip ${!showCustomType && eventType === type ? 'selected' : ''}`}
                          onClick={() => { setEventType(type); setShowCustomType(false); }}
                        >
                          {type}
                        </div>
                      ))}
                      <div
                        className={`ce-type-chip other ${showCustomType ? 'selected' : ''}`}
                        onClick={() => { setShowCustomType(true); setEventType(''); }}
                      >
                        + Other
                      </div>
                    </div>
                    {showCustomType && (
                      <div className="ce-custom-type">
                        <label className="ce-label">Custom Event Type <span className="ce-req">*</span></label>
                        <input
                          type="text"
                          className="ce-input"
                          value={customEventType}
                          onChange={(e) => setCustomEventType(e.target.value)}
                          autoFocus
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="ce-field" style={{ marginTop: 20 }}>
                    <label className="ce-label">Access Type <span className="ce-req">*</span></label>
                    <div className="ce-access-chips">
                      {[
                        { value: 'PUBLIC', label: 'Public' },
                        { value: 'PASSWORD', label: 'Password Protected' },
                        { value: 'OTP', label: 'OTP Verification' },
                      ].map(opt => (
                        <div
                          key={opt.value}
                          className={`ce-access-chip ${accessType === opt.value ? 'selected' : ''}`}
                          onClick={() => { setAccessType(opt.value); setPassword(''); }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {accessType === 'PASSWORD' && (
                    <div className="ce-pw-box">
                      <label className="ce-label" style={{ color: '#c5a880' }}>Event Password <span className="ce-req">*</span></label>
                      <input type="text" className="ce-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password for the gallery" required />
                    </div>
                  )}
                  {accessType === 'OTP' && (
                    <div className="ce-pw-box">
                      <label className="ce-label" style={{ color: '#c5a880' }}>4-Digit Access PIN <span className="ce-req">*</span></label>
                      <input type="text" maxLength={4} className="ce-input ce-pin-input" value={password} onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))} placeholder="••••" required />
                    </div>
                  )}

                  <div className="ce-btn-row">
                    <button type="button" className="ce-btn ce-btn-bk" onClick={handleBack}><ArrowLeft style={{ width: 15, height: 15 }} /></button>
                    <button type="button" className="ce-btn ce-btn-go" disabled={!canProceedStep2()} onClick={handleNext}>
                      Continue <ArrowRight style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: Schedule ===== */}
              {currentStep === 3 && (
                <div className={`ce-step ${direction === 'prev' ? 'reverse' : ''}`} key="s3">
                  <div className="ce-field">
                    <label className="ce-label">Number of Event Days <span className="ce-req">*</span></label>
                    <input
                      type="number" className="ce-input" min="1"
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
                      required
                    />
                  </div>

                  <div className="ce-day-card">
                    <div className="ce-day-title">{totalDays > 1 ? 'Day 1 Schedule' : 'Event Schedule'}</div>
                    <div className="ce-row-2">
                      <div className="ce-field">
                        <label className="ce-label">Date <span className="ce-req">*</span></label>
                        <CustomDatePicker type="date" value={eventDate} onChange={(v) => setEventDate(v)} required />
                      </div>
                      <div className="ce-field">
                        <label className="ce-label">Time <span className="ce-req">*</span></label>
                        <CustomDatePicker type="time" value={eventTime} onChange={(v) => setEventTime(v)} required />
                      </div>
                    </div>
                    <div className="ce-field" style={{ marginTop: '4px' }}>
                      <label className="ce-label">Location <span className="ce-req">*</span></label>
                      <input type="text" className="ce-input" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} required />
                    </div>
                  </div>

                  {totalDays > 1 && eventDays.map((day, idx) => (
                    <div key={idx} className="ce-day-card">
                      <div className="ce-day-title">Day {idx + 2} Schedule</div>
                      <div className="ce-row-2">
                        <div className="ce-field">
                          <label className="ce-label">Date <span className="ce-req">*</span></label>
                          <CustomDatePicker type="date" value={day.date} onChange={(v) => { const d = [...eventDays]; d[idx].date = v; setEventDays(d); }} required />
                        </div>
                        <div className="ce-field">
                          <label className="ce-label">Time <span className="ce-req">*</span></label>
                          <CustomDatePicker type="time" value={day.time} onChange={(v) => { const d = [...eventDays]; d[idx].time = v; setEventDays(d); }} required />
                        </div>
                      </div>
                      <div className="ce-field" style={{ marginTop: '4px' }}>
                        <label className="ce-label">Location <span className="ce-req">*</span></label>
                        <input type="text" className="ce-input" value={day.location} onChange={(e) => { const d = [...eventDays]; d[idx].location = e.target.value; setEventDays(d); }} required />
                      </div>
                    </div>
                  ))}

                  <div className="ce-btn-row">
                    <button type="button" className="ce-btn ce-btn-bk" onClick={handleBack}><ArrowLeft style={{ width: 15, height: 15 }} /></button>
                    <button type="button" className="ce-btn ce-btn-go" disabled={!canProceedStep3()} onClick={handleNext}>
                      Continue <ArrowRight style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 4: Cover Image ===== */}
              {currentStep === 4 && (
                <div className={`ce-step ${direction === 'prev' ? 'reverse' : ''}`} key="s4">
                  <div className="ce-field">
                    <label className="ce-label">Cover Image <span className="ce-req">*</span></label>
                    <label className={`ce-cover-area ${coverImage ? 'has-img' : ''}`}>
                      {coverImage ? (
                        <>
                          <img src={coverImage} alt="Cover" className="ce-cover-img" />
                          <div className="ce-cover-hover">
                            {uploadingImage ? (
                              <Loader2 style={{ width: 24, height: 24, color: '#fff', animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <>
                                <Camera style={{ width: 22, height: 22, color: '#fff' }} />
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Change Image</span>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {uploadingImage ? (
                            <Loader2 style={{ width: 28, height: 28, color: '#c5a880', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <>
                              <div className="ce-upload-icon-box"><Upload style={{ width: 20, height: 20 }} /></div>
                              <span className="ce-upload-text">Click to upload cover image</span>
                              <span className="ce-upload-hint">JPG, PNG — required</span>
                            </>
                          )}
                        </>
                      )}
                      <input
                        type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = '';
                          setImageName(file.name);
                          setUploadingImage(true);
                          try {
                            const reader = new FileReader();
                            reader.onload = (ev) => setCoverImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await apiClient.post('/media/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            if (res.data?.url) setCoverImage(res.data.url);
                          } catch (err) {
                            console.error('Upload failed', err);
                            toast.error('Failed to upload image');
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="ce-btn-row">
                    <button type="button" className="ce-btn ce-btn-bk" onClick={handleBack}><ArrowLeft style={{ width: 15, height: 15 }} /></button>
                    <button type="button" className="ce-btn ce-btn-go" disabled={!canProceedStep4()} onClick={handleNext}>
                      Continue <ArrowRight style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 5: Watermark & Portfolio ===== */}
              {currentStep === 5 && (
                <div className={`ce-step ${direction === 'prev' ? 'reverse' : ''}`} key="s5">
                  {/* Watermark Toggle */}
                  <div className="ce-toggle-row" onClick={() => setCustomWatermark(!customWatermark)}>
                    <div className="ce-toggle-left">
                      <div className="ce-toggle-badge">W</div>
                      <span className="ce-toggle-txt">Custom Event Watermark</span>
                    </div>
                    <div className="ce-sw" data-on={customWatermark} />
                  </div>

                  {customWatermark && (
                    <div className="ce-wm-panel">
                      <div className="ce-field">
                        <label className="ce-label">Watermark Type</label>
                        <div className="ce-access-chips">
                          <div className={`ce-access-chip ${watermarkType === 'LOGO' ? 'selected' : ''}`} onClick={() => setWatermarkType('LOGO')}>Logo</div>
                          <div className={`ce-access-chip ${watermarkType === 'TEXT' ? 'selected' : ''}`} onClick={() => setWatermarkType('TEXT')}>Text</div>
                        </div>
                      </div>

                      {watermarkType === 'TEXT' ? (
                        <div className="ce-field">
                          <label className="ce-label">Watermark Text</label>
                          <input type="text" className="ce-input" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                        </div>
                      ) : (
                        <div className="ce-field">
                          <label className="ce-label">Watermark Logo</label>
                          <div className="ce-wm-upload">
                            <div className="ce-wm-thumb">
                              {uploadingWatermark ? (
                                <Loader2 style={{ width: 18, height: 18, color: '#c5a880', animation: 'spin 1s linear infinite' }} />
                              ) : watermarkLogoUrl ? (
                                <img src={watermarkLogoUrl} alt="WM" />
                              ) : (
                                <Camera style={{ width: 18, height: 18, color: '#94a3b8' }} />
                              )}
                            </div>
                            <div>
                              <label className="ce-wm-btn">
                                Choose File
                                <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    e.target.value = '';
                                    setWatermarkLogoName(file.name);
                                    setUploadingWatermark(true);
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setWatermarkLogoUrl(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                      const fd = new FormData();
                                      fd.append('file', file);
                                      const res = await apiClient.post('/media/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                      if (res.data?.url) setWatermarkLogoUrl(res.data.url);
                                    } catch (err) {
                                      console.error('Upload failed', err);
                                    } finally {
                                      setUploadingWatermark(false);
                                    }
                                  }}
                                />
                              </label>
                              <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 5 }}>PNG with transparent background</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="ce-row-3" style={{ marginTop: 2 }}>
                        <div className="ce-field">
                          <label className="ce-label">Position</label>
                          <select className="ce-select" value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value)}>
                            <option value="BOTTOM_RIGHT">Bottom Right</option>
                            <option value="BOTTOM_LEFT">Bottom Left</option>
                            <option value="TOP_RIGHT">Top Right</option>
                            <option value="TOP_LEFT">Top Left</option>
                            <option value="CENTER">Center</option>
                          </select>
                        </div>
                        <div className="ce-field">
                          <label className="ce-label">Size ({watermarkWidth}%)</label>
                          <input type="range" min="5" max="50" className="ce-slider" value={watermarkWidth} onChange={e => setWatermarkWidth(Number(e.target.value))} style={{'--val': `${(watermarkWidth / 50) * 100}%`} as any} />
                        </div>
                        <div className="ce-field">
                          <label className="ce-label">Opacity ({watermarkOpacity}%)</label>
                          <input type="range" min="10" max="100" className="ce-slider" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))} style={{'--val': `${watermarkOpacity}%`} as any} />
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="ce-preview-box">
                        <div className="ce-preview-hdr">Live Preview</div>
                        <div className="ce-preview-body">
                          <img src="/wedding.jpg" alt="Preview" />
                          {watermarkType === 'LOGO' && watermarkLogoUrl && (
                            <img
                              src={watermarkLogoUrl}
                              style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                objectFit: 'contain',
                                opacity: watermarkOpacity / 100,
                                width: `${watermarkWidth}%`,
                                ...(() => {
                                  switch (watermarkPosition) {
                                    case 'TOP_LEFT': return { top: '3%', left: '3%' };
                                    case 'TOP_RIGHT': return { top: '3%', right: '3%' };
                                    case 'BOTTOM_LEFT': return { bottom: '3%', left: '3%' };
                                    case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                                    case 'BOTTOM_RIGHT': default: return { bottom: '3%', right: '3%' };
                                  }
                                })()
                              }}
                              alt="watermark"
                            />
                          )}
                          {watermarkType === 'TEXT' && watermarkText && (
                            <div
                              style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                color: '#fff',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                opacity: watermarkOpacity / 100,
                                fontSize: `${Math.max(10, watermarkWidth * 0.4)}px`,
                                ...(() => {
                                  switch (watermarkPosition) {
                                    case 'TOP_LEFT': return { top: '3%', left: '3%' };
                                    case 'TOP_RIGHT': return { top: '3%', right: '3%' };
                                    case 'BOTTOM_LEFT': return { bottom: '3%', left: '3%' };
                                    case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                                    case 'BOTTOM_RIGHT': default: return { bottom: '3%', right: '3%' };
                                  }
                                })()
                              }}
                            >
                              {watermarkText}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Portfolio Toggle */}
                  <div className="ce-toggle-row" onClick={() => setAddToPortfolio(!addToPortfolio)}>
                    <div className="ce-toggle-left">
                      <div className="ce-toggle-badge">P</div>
                      <span className="ce-toggle-txt">Add to Portfolio</span>
                    </div>
                    <div className="ce-sw" data-on={addToPortfolio} />
                  </div>

                  {/* Submit */}
                  <div className="ce-btn-row">
                    <button type="button" className="ce-btn ce-btn-bk" onClick={handleBack}><ArrowLeft style={{ width: 15, height: 15 }} /></button>
                    <button type="submit" disabled={loading} className="ce-btn ce-btn-go">
                      {loading ? (
                        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <>Create Event <ArrowRight style={{ width: 15, height: 15 }} /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
