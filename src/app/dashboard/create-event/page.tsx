'use client';
import React, { useState } from 'react';
import { Plus, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useDashboard } from '../DashboardContext';

export default function CreateEventPage() {
  const context = useDashboard();
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('WEDDING');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Watermark States
  const [customWatermark, setCustomWatermark] = useState(false);
  const [watermarkType, setWatermarkType] = useState('LOGO');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [watermarkLogoName, setWatermarkLogoName] = useState<string | null>(null);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState('BOTTOM_RIGHT');
  const [watermarkWidth, setWatermarkWidth] = useState(20);
  const [watermarkHeight, setWatermarkHeight] = useState(20);
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);

  const [addToPortfolio, setAddToPortfolio] = useState(false);
  const router = useRouter();
  
  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-4 md:p-8 font-poppins">
      <style dangerouslySetInnerHTML={{__html: `
        .form-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #c5a880;
        }
        .form-label {
          display: block;
          font-size: 11px;
          color: #475569;
          font-weight: 800;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          background-color: #cbd5e1;
          border-radius: 20px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .toggle-switch[data-active="true"] {
          background-color: #c5a880;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background-color: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .toggle-switch[data-active="true"]::after {
          transform: translateX(16px);
        }
      `}} />
      
      <div className="max-w-3xl bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Plus className="text-slate-500 h-6 w-6" />
          <h1 className="text-3xl font-bold text-slate-900">Create New Event Gallery</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-8">Setup a new QR-based photo retrieval gallery for your clients.</p>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!eventName) {
            alert('Event name is required');
            return;
          }
          try {
            setLoading(true);
            await apiClient.post('/event', {
              name: eventName,
              clientName,
              clientMobile,
              clientEmail,
              date: eventDate || new Date().toISOString(),
              type: eventType,
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

            router.push('/dashboard/events');
          } catch (error: any) {
            console.error('Failed to create event', error);
            alert(error.response?.data?.error || 'Failed to create event. Please try again.');
          } finally {
            setLoading(false);
          }
        }} className="space-y-6">
          <div>
            <label className="form-label">Event Name</label>
            <input 
              type="text" 
              className="form-input" 
               
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Client Name</label>
              <input 
                type="text" 
                className="form-input" 
                
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Client Mobile</label>
              <input 
                type="text" 
                className="form-input" 
                
                value={clientMobile}
                onChange={(e) => setClientMobile(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Client Email</label>
            <input 
              type="email" 
              className="form-input" 
              
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Event Date</label>
              <input 
                type="date" 
                className="form-input"
                style={{ colorScheme: 'light' }}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Event Type</label>
              <select 
                className="form-input"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type} className="bg-white text-slate-900">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Cover Image</label>
            <div className="flex items-center gap-4">
              <div className="w-40 aspect-video rounded-xl border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-slate-400" />
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-[#c5a880] animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = ''; 

                    setImageName(file.name);
                    setUploadingImage(true);

                    try {
                      const reader = new FileReader();
                      reader.onload = (e) => setCoverImage(e.target?.result as string);
                      reader.readAsDataURL(file);

                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const res = await apiClient.post('/media/upload-asset', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                        }
                      });
                      
                      if (res.data && res.data.url) {
                        setCoverImage(res.data.url);
                      }
                    } catch (err) {
                      console.error('Failed to upload image', err);
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                <div className={`w-full bg-white border border-slate-200 text-sm font-bold rounded-xl py-4 text-center transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 ${uploadingImage ? 'text-slate-400' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    imageName || 'Choose File'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 font-bold">W</span>
                <span className="text-xs font-bold text-slate-700 uppercase">Custom Event Watermark</span>
              </div>
              <div 
                className="toggle-switch" 
                data-active={customWatermark}
                onClick={() => setCustomWatermark(!customWatermark)}
              />
            </div>
            
            {customWatermark && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <label className="form-label">Watermark Type</label>
                  <select 
                    className="form-input font-bold tracking-wide"
                    value={watermarkType}
                    onChange={(e) => setWatermarkType(e.target.value)}
                  >
                    <option value="LOGO">LOGO WATERMARK</option>
                    <option value="TEXT">TEXT WATERMARK</option>
                  </select>
                </div>

                {watermarkType === 'TEXT' ? (
                  <div>
                    <label className="form-label">Watermark Text</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="form-label">Watermark Logo Image</label>
                    <div className="flex gap-4 items-center mt-1">
                      <div className="w-[60px] h-[60px] rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-slate-50">
                          {uploadingWatermark ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (watermarkLogoUrl ? <img src={watermarkLogoUrl} className="max-w-[40px] max-h-[40px] object-contain" /> : <Camera className="h-5 w-5 text-slate-600" />)}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="w-full text-center border border-slate-200 text-[#b69970] font-bold text-[13px] py-2 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                            Choose File
                            <input 
                              type="file" 
                              accept="image/png,image/jpeg" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.target.value = ''; 
    
                                setWatermarkLogoName(file.name);
                                setUploadingWatermark(true);
    
                                try {
                                  const reader = new FileReader();
                                  reader.onload = (e) => setWatermarkLogoUrl(e.target?.result as string);
                                  reader.readAsDataURL(file);
    
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  const res = await apiClient.post('/media/upload-asset', formData, {
                                    headers: {
                                      'Content-Type': 'multipart/form-data',
                                    }
                                  });
                                  
                                  if (res.data && res.data.url) {
                                    setWatermarkLogoUrl(res.data.url);
                                  }
                                } catch (err) {
                                  console.error('Failed to upload logo', err);
                                } finally {
                                  setUploadingWatermark(false);
                                }
                              }} 
                            />
                        </label>
                        <p className="text-[10px] text-slate-700 font-bold mt-2">PNG with transparent background recommended.</p>
                      </div>
                    </div>
                  </div>
                )}

                <style dangerouslySetInnerHTML={{__html: `
                  .custom-slider {
                    -webkit-appearance: none;
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(to right, #c5a880 var(--val, 50%), #475569 var(--val, 50%));
                    outline: none;
                  }
                  .custom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #c5a880;
                    cursor: pointer;
                  }
                `}} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <label className="form-label">Watermark Position</label>
                    <select 
                      className="form-input font-bold tracking-wide mt-1"
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
                    <label className="form-label">Size ({watermarkWidth}%)</label>
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
                    <label className="form-label">Opacity ({watermarkOpacity}%)</label>
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

                <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-[#e8ebf0] text-[#64748b] text-[11px] font-bold px-4 py-2.5">
                      LIVE PREVIEW
                    </div>
                    <div className="relative w-full aspect-[3/2] bg-slate-200 flex items-center justify-center">
                      <img src="/wedding.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Preview Background" />
                      {watermarkType === 'LOGO' && watermarkLogoUrl && (
                          <img 
                            src={watermarkLogoUrl} 
                            className="absolute pointer-events-none object-contain"
                            style={{
                              opacity: watermarkOpacity / 100,
                              width: `${watermarkWidth}%`,
                              ...(() => {
                                switch (watermarkPosition) {
                                  case 'TOP_LEFT': return { top: '4%', left: '4%' };
                                  case 'TOP_RIGHT': return { top: '4%', right: '4%' };
                                  case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
                                  case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                                  case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
                                }
                              })()
                            }}
                          />
                      )}
                      {watermarkType === 'TEXT' && watermarkText && (
                          <div 
                            className="absolute pointer-events-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-bold whitespace-nowrap"
                            style={{
                              opacity: watermarkOpacity / 100,
                              fontSize: `${watermarkWidth * 0.3}px`, 
                              ...(() => {
                                switch (watermarkPosition) {
                                  case 'TOP_LEFT': return { top: '4%', left: '4%' };
                                  case 'TOP_RIGHT': return { top: '4%', right: '4%' };
                                  case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
                                  case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                                  case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
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
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-6 pb-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 font-bold">P</span>
              <span className="text-xs font-bold text-slate-700 uppercase">Add to Portfolio</span>
            </div>
            <div 
              className="toggle-switch" 
              data-active={addToPortfolio}
              onClick={() => setAddToPortfolio(!addToPortfolio)}
            />
          </div>

          <button type="submit" disabled={loading} className="flex justify-center items-center gap-2 w-full bg-[#c5a880] hover:bg-white text-[#09090b] shadow-md border border-transparent hover:border-[#c5a880] font-bold py-4 rounded-xl text-sm transition-colors mt-8 disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Event Gallery'}
          </button>
        </form>
      </div>
    </div>
  );
}
