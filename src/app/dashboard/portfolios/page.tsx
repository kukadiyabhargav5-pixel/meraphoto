'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PortfoliosPage() {
  const [portfolioEvents, setPortfolioEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          const filtered = res.data.events.filter((e: any) => e.addToPortfolio === true);
          setPortfolioEvents(filtered.reverse());
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
      {/* Internal CSS isolated for this page */}
      <style dangerouslySetInnerHTML={{__html: `
        .portfolio-container {
          padding: 24px;
          background: #ffffff;
        }
        .portfolio-header {
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .portfolio-subtitle {
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 32px;
        }
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 24px;
        }
        .portfolio-card {
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .portfolio-card:hover {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          border-color: #c5a880;
        }
        .portfolio-image {
          width: 100%;
          height: 160px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          overflow: hidden;
        }
        .portfolio-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .portfolio-info {
          padding: 16px;
        }
        .portfolio-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        .portfolio-category {
          font-size: 12px;
          color: #c5a880;
          font-weight: 700;
          margin-top: 4px;
        }
      `}} />
      
      <div className="portfolio-container font-poppins">
        <h1 className="portfolio-header">Studio Portfolios</h1>
        <p className="portfolio-subtitle">Showcase your best work and categorized galleries to clients.</p>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-[#c5a880] animate-spin" />
          </div>
        ) : portfolioEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-xl">
            No portfolios yet. Go to any Event and toggle "Add to Portfolio" to showcase them here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioEvents.map((event, idx) => (
              <Link key={event._id || idx} href={`/dashboard/events/${event.code || event.eventCode || event._id}`}>
                <div className="relative group overflow-hidden rounded-2xl cursor-pointer aspect-video flex flex-col justify-between p-5 border border-slate-200 hover:border-[#c5a880] transition-all shadow-sm hover:shadow-md">
                  {/* Background Image & Overlay */}
                  <div className="absolute inset-0 z-0">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt={event.name} className="w-full h-full object-contain bg-slate-900 transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/40" />
                  </div>

                  {/* Content (z-10 relative) */}
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-black/40 border border-slate-200 text-[10px] font-bold text-[#c5a880] uppercase tracking-wider backdrop-blur-md">
                      {event.type || 'PORTFOLIO'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider backdrop-blur-md">
                      PUBLISHED
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 leading-tight">{event.name}</h3>
                    
                    <div className="h-[1px] w-full bg-white/20" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
