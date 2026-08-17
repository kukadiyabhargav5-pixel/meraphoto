'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LayoutDashboard, ArrowRight } from 'lucide-react';
import PublicWrapper from '../../components/PublicWrapper';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';

export default function AdminChoicePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // Redirect to login if not authenticated or not a super admin
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (!loading && isAuthenticated && user?.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf9f6' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e3d8c8', borderTopColor: '#c5a880', borderRadius: '50%' }} />
      </div>
    );
  }

  const handleStudioChoice = () => {
    toast.success('Entering Studio Style (Unlimited Access)');
    router.push('/dashboard');
  };

  const handleAdminChoice = () => {
    toast.success('Entering Admin Panel');
    router.push('/admin');
  };

  return (
    <PublicWrapper>
      <style dangerouslySetInnerHTML={{__html: `
        .choice-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .choice-page::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .choice-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 800px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(227,216,200,0.4);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          padding: 48px 40px;
          text-align: center;
        }
        .choice-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 400;
          color: #09090b;
          margin-bottom: 8px;
        }
        .choice-subtitle {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 40px;
        }
        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .option-card {
          background: #fff;
          border: 1.5px solid #e3d8c8;
          border-radius: 16px;
          padding: 32px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .option-card:hover {
          border-color: #c5a880;
          box-shadow: 0 12px 24px rgba(197,168,128,0.15);
          transform: translateY(-4px);
        }
        .option-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(197,168,128,0.1);
          color: #c5a880;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }
        .option-card:hover .option-icon-wrapper {
          background: #c5a880;
          color: #fff;
        }
        .option-title {
          font-size: 18px;
          font-weight: 700;
          color: #09090b;
          margin-bottom: 8px;
        }
        .option-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 24px;
          flex-grow: 1;
        }
        .option-action {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #c5a880;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .option-action svg {
          transition: transform 0.3s ease;
        }
        .option-card:hover .option-action svg {
          transform: translateX(4px);
        }
        @media (max-width: 640px) {
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      <div className="choice-page font-poppins">
        <div className="choice-card">
          <h1 className="choice-title">Welcome back, Admin</h1>
          <p className="choice-subtitle">How would you like to proceed today?</p>

          <div className="options-grid">
            {/* Studio Dashboard Option */}
            <div className="option-card" onClick={handleStudioChoice}>
              <div className="option-icon-wrapper">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="option-title">Studio Style</h3>
              <p className="option-desc">
                Access the regular user dashboard with your own test studio. As an admin, you have <strong>unlimited free access</strong> to all premium features and ignore all plan restrictions.
              </p>
              <div className="option-action">
                Enter Studio <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Admin Panel Option */}
            <div className="option-card" onClick={handleAdminChoice}>
              <div className="option-icon-wrapper">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="option-title">Admin Side</h3>
              <p className="option-desc">
                Access the super admin panel to manage users, monitor platform analytics, resolve support tickets, and configure global settings.
              </p>
              <div className="option-action">
                Enter Admin <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicWrapper>
  );
}
