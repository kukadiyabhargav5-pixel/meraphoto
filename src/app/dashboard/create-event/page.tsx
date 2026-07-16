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
              coverImageUrl: coverImage
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
              <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center shrink-0 overflow-hidden relative">
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
              <div className="w-full relative">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

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

          <button type="submit" disabled={loading} className="flex justify-center items-center gap-2 w-full bg-[#c5a880] hover:bg-white text-[#09090b] shadow-md border border-transparent hover:border-[#c5a880] font-bold py-4 rounded-xl text-sm transition-colors mt-8 disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Event Gallery'}
          </button>
        </form>
      </div>
    </div>
  );
}
