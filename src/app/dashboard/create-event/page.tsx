'use client';
import React, { useState } from 'react';
import { Plus, Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function CreateEventPage() {
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
  const [customWatermark, setCustomWatermark] = useState(false);
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
              watermark: { isActive: customWatermark, type: 'LOGO', position: 'BOTTOM_RIGHT', width: 20, height: 20, opacity: 0.5 }
            });
            router.push('/dashboard/events');
          } catch (error) {
            console.error('Failed to create event', error);
            alert('Failed to create event. Please try again.');
          } finally {
            setLoading(false);
          }
        }} className="space-y-6">
          <div>
            <label className="form-label">Event Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Sharma Wedding" 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Client Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Aarav Sharma"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Client Mobile</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="9876543210"
                value={clientMobile}
                onChange={(e) => setClientMobile(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Client Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="client@wedding.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
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
                    e.target.value = ''; // Allow selecting same file again

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

          <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-2 mb-2">
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

          <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
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
