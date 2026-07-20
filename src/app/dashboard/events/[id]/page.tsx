'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Camera, Trash2, Loader2, Check, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../../../components/CustomDatePicker';

export default function EventUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGalleryLink, setShowGalleryLink] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();

  const folderInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const fetchEventDetails = async () => {
    try {
      const res = await apiClient.get(`/event/code/${eventId}`);
      if (res.data && res.data.event) {
        setEvent(res.data.event);
        try {
           const mediaRes = await apiClient.get(`/media/event/${res.data.event._id}`);
           if (mediaRes.data && mediaRes.data.media) setMediaItems(mediaRes.data.media);
        } catch (me) {
           console.error("Failed to fetch media", me);
        }
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !event) return;
    
    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: files.length });
    
    try {
      const chunkSize = 1;
      let uploadedCount = 0;
      let successful = 0;
      let failed = 0;
      
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = Array.from(files).slice(i, i + chunkSize);
        const formData = new FormData();
        
        chunk.forEach(file => {
          formData.append('files', file);
          formData.append('folderPaths', file.webkitRelativePath || '');
        });
        
        try {
          await apiClient.post(`/media/event/${event._id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          successful += chunk.length;
        } catch (err) {
          failed += chunk.length;
        }
        
        uploadedCount += chunk.length;
        setUploadProgress({ current: uploadedCount, total: files.length });
      }
      
      if (failed > 0) {
        toast.error(`Uploaded ${successful}, failed ${failed}`);
      } else {
        toast.success(`Successfully uploaded ${files.length} files!`);
      }
      fetchEventDetails();
    } catch (err: any) {
       console.error('Upload error:', err);
       if (err.response?.status === 413) {
         toast.error('Files too large. Please select fewer files.');
       } else {
         toast.error(err?.response?.data?.error || 'Upload failed. Please check console for details.');
       }
    } finally {
       setUploadingMedia(false);
       if (e.target) e.target.value = '';
    }
  };

  // Auto-refresh if any media is PENDING
  useEffect(() => {
    const hasPending = mediaItems.some(item => item.processedStatus === 'PENDING' || item.processedStatus === 'PROCESSING');
    if (!hasPending || !event?._id) return;

    const interval = setInterval(() => {
      apiClient.get(`/media/event/${event._id}`).then(res => {
        if (res.data && res.data.media) {
          setMediaItems(res.data.media);
        }
      }).catch(err => console.error('Polling error', err));
    }, 3000);

    return () => clearInterval(interval);
  }, [mediaItems, event?._id]);

  const getPreviewPosition = (pos: string) => {
    switch (pos) {
      case 'TOP_LEFT': return { top: '4%', left: '4%' };
      case 'TOP_RIGHT': return { top: '4%', right: '4%' };
      case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
      case 'CENTER': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
    }
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleWatermarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await apiClient.post('/dashboard/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.url) {
        setFormData(prev => ({...prev, watermarkLogoUrl: res.data.url}));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
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
    password: '',
    customWatermark: false,
    addToPortfolio: false,
    coverImageUrl: '',
    watermarkType: 'LOGO',
    watermarkText: '',
    watermarkLogoUrl: '',
    watermarkPosition: 'BOTTOM_RIGHT',
    watermarkWidth: 20,
    watermarkOpacity: 50
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
        password: '',
        customWatermark: !!event.watermark?.isActive,
        addToPortfolio: !!event.addToPortfolio,
        coverImageUrl: event.coverImageUrl || '',
        watermarkType: event.watermark?.type || 'LOGO',
        watermarkText: event.watermark?.text || '',
        watermarkLogoUrl: event.watermark?.logoUrl || '',
        watermarkPosition: event.watermark?.position || 'BOTTOM_RIGHT',
        watermarkWidth: event.watermark?.width || 20,
        watermarkOpacity: (event.watermark?.opacity !== undefined ? event.watermark.opacity * 100 : 50)
      });
    }
  }, [event]);

  useEffect(() => {
    fetchEventDetails();
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
        <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer mt-4">
          <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer">
              <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
              <span>Back to Events</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 ml-4 border-l-2 border-slate-200 pl-4">{event.name}</h1>
          </div>

          <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <Upload className="h-10 w-10 text-[#c5a880] mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Media</h2>
              <p className="text-sm text-slate-500">Select a category below or drag and drop files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <input type="file" {...{ webkitdirectory: "true", directory: "true" }} multiple ref={folderInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'FOLDER')} />
              <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'PHOTO')} />
              <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'VIDEO')} />

              <div 
                onClick={() => folderInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <FolderUp className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Entire Folder</span>
              </div>
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Photos</span>
              </div>
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <Video className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Videos</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-900">Media Files ({mediaItems.length})</h3>
               <button 
                 onClick={fetchEventDetails}
                 className="text-xs font-bold text-slate-500 hover:text-[#c5a880] transition-colors"
               >
                 Refresh
               </button>
            </div>
            
            {uploadingMedia && (
               <div className="mb-6 bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                     <span>Uploading files to secure cloud storage...</span>
                     <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                     <div className="bg-[#c5a880] h-2 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
                  </div>
               </div>
            )}

            {mediaItems.length === 0 ? (
               <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-500 text-sm">
                 No media files uploaded yet. Select files to start.
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
                 {mediaItems.map((item, idx) => (
                   <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      {item.type === 'VIDEO' ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                            <Video className="h-8 w-8 text-white/50 mb-2" />
                            <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Video</span>
                         </div>
                      ) : (
                         <img src={item.compressedUrl || item.r2Url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                         <span className="text-[10px] font-bold text-slate-900 px-2 py-1 bg-black/50 rounded uppercase tracking-wider">{item.processedStatus}</span>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
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

            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSaving(true);
                
                const payload = {
                  ...formData,
                  watermark: {
                    ...(event?.watermark || {}),
                    isActive: formData.customWatermark,
                    type: formData.watermarkType,
                    text: formData.watermarkText,
                    logoUrl: formData.watermarkLogoUrl,
                    position: formData.watermarkPosition,
                    width: formData.watermarkWidth,
                    opacity: formData.watermarkOpacity / 100
                  }
                };

                const res = await apiClient.put(`/event/${eventId}`, payload);
                if (res.data.event) {
                  setEvent(res.data.event);
                  toast.success('Event updated successfully!');
                  setHasSavedDetails(true);
                }
              } catch (err) {
                toast.error('Error updating event');
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
                  <CustomDatePicker
                    type="date"
                    className="edit-input"
                    value={formData.date}
                    onChange={val => setFormData({...formData, date: val})}
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
                  <div className="w-40 aspect-video rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.coverImageUrl ? (
                      <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    {uploadingCover && (
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
                        setUploadingCover(true);
                        try {
                          const uploadData = new FormData();
                          uploadData.append('file', file);
                          const res = await apiClient.post('/media/upload-asset', uploadData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data && res.data.url) {
                            setFormData(prev => ({ ...prev, coverImageUrl: res.data.url }));
                          }
                        } catch (err) {
                          console.error("Cover upload failed", err);
                          toast.error('Failed to upload cover');
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                    />
                    <div className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg py-3 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                      {uploadingCover ? 'Uploading...' : (formData.coverImageUrl ? 'Change Cover Image' : 'Choose File')}
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

              {formData.accessType === 'PASSWORD' && (
                <div>
                  <label className="edit-label text-rose-500">New Password</label>
                  <input 
                    type="text" 
                    className="edit-input border-rose-200 focus:border-rose-500 bg-rose-50/30" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Leave empty to keep current password, or enter a new one"
                  />
                </div>
              )}

              <div className="flex flex-col border-t border-b border-slate-200 py-4 my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">W</span>
                    <span className="text-xs font-bold text-slate-600 uppercase">Custom Event Watermark</span>
                  </div>
                  <div 
                    className="toggle-switch" 
                    data-active={formData.customWatermark}
                    onClick={() => setFormData({...formData, customWatermark: !formData.customWatermark})}
                  />
                </div>

                {formData.customWatermark && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="edit-label">Watermark Type</label>
                      <select 
                        className="edit-input font-bold tracking-wide"
                        value={formData.watermarkType}
                        onChange={e => setFormData({...formData, watermarkType: e.target.value as any})}
                      >
                        <option value="LOGO">LOGO WATERMARK</option>
                        <option value="TEXT">TEXT WATERMARK</option>
                      </select>
                    </div>

                    {formData.watermarkType === 'TEXT' ? (
                      <div>
                        <label className="edit-label">Watermark Text</label>
                        <input 
                          type="text" 
                          className="edit-input" 
                          
                          value={formData.watermarkText}
                          onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="edit-label">Watermark Logo Image</label>
                        <div className="flex gap-4 items-center mt-1">
                          <div className="w-[60px] h-[60px] rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-[#f8f7f4] text-slate-900">
                             {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (formData.watermarkLogoUrl ? <img src={formData.watermarkLogoUrl} className="max-w-[40px] max-h-[40px] object-contain" /> : <Camera className="h-5 w-5 text-slate-400" />)}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className="w-full text-center border border-slate-200 text-[#b69970] font-bold text-[13px] py-2 rounded-lg bg-white cursor-pointer hover:bg-[#f8f7f4] text-slate-900 transition-colors shadow-sm">
                               Choose File
                               <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkLogoUpload} />
                            </label>
                            <p className="text-[10px] text-slate-600 font-bold mt-2">PNG with transparent background recommended.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <label className="edit-label">Watermark Position</label>
                        <select 
                          className="edit-input font-bold tracking-wide mt-1"
                          value={formData.watermarkPosition}
                          onChange={e => setFormData({...formData, watermarkPosition: e.target.value as any})}
                        >
                          <option value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                          <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                          <option value="TOP_RIGHT">TOP RIGHT</option>
                          <option value="TOP_LEFT">TOP LEFT</option>
                          <option value="CENTER">CENTER</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Size ({formData.watermarkWidth}%)</label>
                        <input 
                          type="range" 
                          min="5" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkWidth}
                          onChange={e => setFormData({...formData, watermarkWidth: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkWidth}%`} as any}
                        />
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Opacity ({formData.watermarkOpacity}%)</label>
                        <input 
                          type="range" 
                          min="10" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkOpacity}
                          onChange={e => setFormData({...formData, watermarkOpacity: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkOpacity}%`} as any}
                        />
                      </div>
                    </div>

                    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                       <div className="bg-[#e8ebf0] text-[#64748b] text-[11px] font-bold px-4 py-2.5">
                          LIVE PREVIEW
                       </div>
                       <div className="relative w-full aspect-[3/2] bg-slate-200 flex items-center justify-center">
                          <img src="/wedding.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Preview Background" />
                          {formData.watermarkType === 'LOGO' && formData.watermarkLogoUrl && (
                             <img 
                               src={formData.watermarkLogoUrl} 
                               className="absolute pointer-events-none object-contain"
                               style={{
                                 opacity: formData.watermarkOpacity / 100,
                                 width: `${formData.watermarkWidth}%`,
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             />
                          )}
                          {formData.watermarkType === 'TEXT' && formData.watermarkText && (
                             <div 
                               className="absolute pointer-events-none text-slate-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-bold whitespace-nowrap"
                               style={{
                                 opacity: formData.watermarkOpacity / 100,
                                 fontSize: `${formData.watermarkWidth * 0.3}px`, 
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             >
                               {formData.watermarkText}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">P</span>
                  <span className="text-xs font-bold text-slate-600 uppercase">Add to Portfolio</span>
                  {saving && <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-2" />}
                </div>
                <div 
                  className={`toggle-switch ${saving ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  data-active={formData.addToPortfolio}
                  onClick={async () => {
                    if (saving) return;
                    const newValue = !formData.addToPortfolio;
                    
                    setFormData({...formData, addToPortfolio: newValue});
                    setSaving(true);
                    
                    try {
                      await apiClient.patch(`/event/${eventId}/portfolio-status`, { 
                        addToPortfolio: newValue 
                      });
                      
                      if (event) {
                        setEvent({...event, addToPortfolio: newValue});
                      }
                    } catch (err) {
                      toast.error("Failed to save portfolio status.");
                      setFormData({...formData, addToPortfolio: !newValue});
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>

              {event && mediaItems.length > 0 && hasSavedDetails && (
                <div className="pt-2 mb-4">
                  <div className="bg-[#f8f5f0] border border-[#e6d5c0] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                     <h4 className="text-sm font-bold text-slate-800 mb-1">Gallery is Ready</h4>
                     <p className="text-xs text-slate-500 mb-4">Share this link with your clients to view {mediaItems.length} media files.</p>
                     {!showGalleryLink ? (
                       <button
                         type="button"
                         onClick={() => setShowGalleryLink(true)}
                         className="w-full bg-slate-900 hover:bg-slate-800 text-slate-900 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                       >
                         <span className="text-base leading-none">🔗</span> Generate Public Gallery Link
                       </button>
                     ) : (
                       <div className="w-full flex items-center bg-white border border-[#e6d5c0] rounded-xl overflow-hidden mt-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}/e/${event.code}`} 
                            className="flex-1 bg-transparent text-[11px] sm:text-xs text-slate-600 px-3 py-3 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/e/${event.code}`);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className="bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1 border-l border-[#e6d5c0]"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {linkCopied ? 'Copied' : 'Copy'}
                          </button>
                       </div>
                     )}
                  </div>
                </div>
              )}

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
                      } catch (error) {
                        console.error('Error deleting event:', error);
                        toast.error('Error deleting event.');
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
