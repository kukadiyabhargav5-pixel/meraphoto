'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function EventUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const folderInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Reset the input value so the same file/folder can be selected again if needed
    e.target.value = '';
    
    // Simulate UI update or API call
    alert(`Selected ${files.length} items for ${type} upload.`);
  };

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    date: '',
    type: 'WEDDING',
    location: '',
    accessType: 'PUBLIC',
    customWatermark: false,
    addToPortfolio: false
  });

  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        clientName: event.clientName || '',
        clientMobile: event.clientMobile || '',
        clientEmail: event.clientEmail || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        type: event.type || 'WEDDING',
        location: event.location || '',
        accessType: event.accessType || 'PUBLIC',
        customWatermark: !!event.watermark?.isActive,
        addToPortfolio: !!event.addToPortfolio
      });
    }
  }, [event]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await apiClient.get(`/event/code/${eventId}`);
        if (res.data && res.data.event) {
          setEvent(res.data.event);
        }
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex-1 bg-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-900">Event not found</h1>
        <Link href="/dashboard/events" className="text-[#c5a880] hover:underline mt-4 inline-block">
          &larr; Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-4 md:p-8 font-poppins">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left/Center - Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/events" className="text-slate-500 hover:text-slate-900 font-medium text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 ml-4 border-l-2 border-slate-200 pl-4">{event.name}</h1>
          </div>

          {/* Upload Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <Upload className="h-10 w-10 text-[#c5a880] mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Media</h2>
              <p className="text-sm text-slate-500">Select a category below or drag and drop files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Hidden Inputs */}
              <input type="file" {...{ webkitdirectory: "true", directory: "true" }} multiple ref={folderInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'FOLDER')} />
              <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'PHOTO')} />
              <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'VIDEO')} />

              <div 
                onClick={() => folderInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <FolderUp className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-700 text-sm">Entire Folder</span>
              </div>
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-700 text-sm">Photos</span>
              </div>
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <Video className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-700 text-sm">Videos</span>
              </div>
            </div>
          </div>

          {/* Media Files List */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Media Files (0)</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-500 text-sm">
              No media files uploaded yet. Select files to start.
            </div>
          </div>
        </div>

        {/* Right - Event Details Sidebar */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
              <Settings className="h-5 w-5 text-[#c5a880]" />
              <h3 className="text-lg font-bold text-slate-900">Edit Event Details</h3>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              .edit-input {
                width: 100%;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                color: #0f172a;
                padding: 10px 12px;
                border-radius: 8px;
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s;
              }
              .edit-input:focus {
                border-color: #c5a880;
              }
              .edit-label {
                display: block;
                font-size: 10px;
                color: #475569;
                font-weight: 800;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .toggle-switch {
                position: relative;
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

            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSaving(true);
                
                const payload = {
                  ...formData,
                  watermark: {
                    ...(event?.watermark || {}),
                    isActive: formData.customWatermark
                  }
                };

                await apiClient.put(`/event/${eventId}`, payload);
                alert('Event updated successfully!');
                
                // Update local event state to reflect new watermark setting
                setEvent({
                  ...event,
                  watermark: payload.watermark
                });
              } catch (err) {
                alert('Error updating event');
              } finally {
                setSaving(false);
              }
            }}>
              <div>
                <label className="edit-label">Event Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Client Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Client Mobile</label>
                  <input 
                    type="text" 
                    className="edit-input" 
                    value={formData.clientMobile}
                    onChange={e => setFormData({...formData, clientMobile: e.target.value})}
                  />
                </div>
                <div>
                  <label className="edit-label">Client Email</label>
                  <input 
                    type="email" 
                    className="edit-input" 
                    value={formData.clientEmail}
                    onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Event Date</label>
                  <input 
                    type="date" 
                    className="edit-input" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="edit-label">Event Type</label>
                  <select 
                    className="edit-input" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="edit-label">Event Location</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Cover Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg py-3 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                      Choose File
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="edit-label">Access Type</label>
                <select 
                  className="edit-input"
                  value={formData.accessType}
                  onChange={e => setFormData({...formData, accessType: e.target.value})}
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PASSWORD">PASSWORD PROTECTED</option>
                  <option value="OTP">OTP VERIFICATION</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-b border-slate-200 py-4 my-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 font-bold">W</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">Custom Event Watermark</span>
                </div>
                <div 
                  className="toggle-switch" 
                  data-active={formData.customWatermark}
                  onClick={() => setFormData({...formData, customWatermark: !formData.customWatermark})}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 font-bold">P</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">Add to Portfolio</span>
                </div>
                <div 
                  className="toggle-switch" 
                  data-active={formData.addToPortfolio}
                  onClick={() => setFormData({...formData, addToPortfolio: !formData.addToPortfolio})}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 flex justify-center items-center bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Event Details'}
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this event permanently?')) {
                      try {
                        setSaving(true);
                        await apiClient.delete(`/event/${eventId}`);
                        router.push('/dashboard/events');
                      } catch (err) {
                        alert('Error deleting event.');
                        setSaving(false);
                      }
                    }
                  }}
                  className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
