'use client';
import React from 'react';

export default function PortfoliosPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
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

        <div className="portfolio-grid">
          {/* Dummy Portfolio Cards */}
          <div className="portfolio-card">
            <div className="portfolio-image">Image Placeholder</div>
            <div className="portfolio-info">
              <h3 className="portfolio-title">Destination Weddings</h3>
              <p className="portfolio-category">45 Galleries</p>
            </div>
          </div>

          <div className="portfolio-card">
            <div className="portfolio-image">Image Placeholder</div>
            <div className="portfolio-info">
              <h3 className="portfolio-title">Pre-Wedding Shoots</h3>
              <p className="portfolio-category">28 Galleries</p>
            </div>
          </div>

          <div className="portfolio-card">
            <div className="portfolio-image">Image Placeholder</div>
            <div className="portfolio-info">
              <h3 className="portfolio-title">Corporate Events</h3>
              <p className="portfolio-category">12 Galleries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
