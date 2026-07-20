'use client';
import React, { useState } from 'react';
import Script from 'next/script';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import { Check, CheckCircle, Loader } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '₹3,500',
    period: '/year',
    desc: 'Store 50,000 photos & store 10 videos',
    highlight: false,
    features: ['Store 50,000 photos', 'Store 10 videos', 'Business Branding', 'Bulk Download', 'Web Mode'],
  },
  {
    name: 'Standard',
    price: '₹7,900',
    period: '/year',
    desc: 'Store 1,50,000 photos & store 100 videos',
    highlight: true,
    features: ['Store 1,50,000 photos', 'Store 100 videos', 'Watermarks', 'Includes all Basic features'],
  },
  {
    name: 'Essential',
    price: '₹15,900',
    period: '/year',
    desc: 'Store 3,00,000 photos & store 200 videos',
    highlight: false,
    features: ['Store 3,00,000 photos', 'Store 200 videos', 'View Client Favourites', 'Switch on/off Downloads', 'Portfolio Website', 'Includes all Standard features'],
  },
  {
    name: 'Premium',
    price: '₹31,900',
    period: '/year',
    desc: 'Store 7,50,000 photos & store 500 videos',
    highlight: false,
    features: ['Store 7,50,000 photos', 'Store 500 videos', 'Digital Album', 'Includes all Essential features'],
  },
];

export default function PlansBillingPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    studio, setStudio,
    sessionUser,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg
  } = context;

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const handleSubscribe = async (planName: string) => {
    try {
      setLoadingPlan(planName);
      setErrorMsg('');

      // 1. Fetch Razorpay config
      const configRes = await apiClient.get('/payment/config');
      const keyId = configRes.data.keyId;

      // 2. Create Billing Session
      const sessionRes = await apiClient.post('/payment/checkout', { plan: planName.toUpperCase() });
      const { subscriptionId } = sessionRes.data;

      // 3. Open Razorpay Modal
      if (subscriptionId.startsWith('sub_mock_id_')) {
        setSuccessMsg(`Successfully subscribed to ${planName} plan (Mock Mode)!`);
        setStudio({ ...studio, subscriptionPlan: planName.toUpperCase(), subscriptionStatus: 'ACTIVE' });
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: keyId,
        order_id: subscriptionId, // actually the orderId from backend
        name: 'Mara Photo',
        description: `Upgrade to ${planName} Plan`,
        handler: async function (response: any) {
          setSuccessMsg(`Successfully subscribed to ${planName} plan!`);
          setStudio({ ...studio, subscriptionPlan: planName.toUpperCase(), subscriptionStatus: 'ACTIVE' });
        },
        prefill: {
          name: sessionUser?.name || 'Studio Owner',
          email: sessionUser?.email || '',
        },
        theme: {
          color: '#c5a880'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg('Payment failed or cancelled.');
      });
      rzp.open();

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to initiate checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSub = async () => {
    if (confirm('Are you sure you want to cancel your subscription? You will be downgraded to the BASIC plan.')) {
      try {
        setLoadingCancel(true);
        const res = await apiClient.post('/payment/cancel');
        setSuccessMsg(res.data.message);
        setStudio({ ...studio, subscriptionPlan: 'BASIC', subscriptionStatus: 'ACTIVE' });
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || 'Failed to cancel subscription');
      } finally {
        setLoadingCancel(false);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 flex flex-col min-h-full">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-200 animate-fade-in">
        
        <div className="text-center mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plans & Subscriptions</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Manage your studio's billing and unlock premium features.</p>
        </div>
        
        {/* Active Plan Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#c5a880]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
            <span className="text-[10px] text-[#c5a880] font-extrabold uppercase tracking-widest bg-[#c5a880]/10 px-3 py-1.5 rounded-lg border border-[#c5a880]/20 shadow-sm">
              Active Plan
            </span>
            <h3 className="text-3xl font-black mt-5 text-slate-900 tracking-tight">{studio.subscriptionPlan || 'BASIC'}</h3>
            <p className="text-xs text-slate-400 font-semibold mt-2 tracking-wide flex items-center justify-center md:justify-start gap-1.5">
              Status: <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {studio.subscriptionStatus || 'ACTIVE'}</span>
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            {(studio.subscriptionPlan && studio.subscriptionPlan !== 'BASIC') && studio.subscriptionStatus !== 'CANCELLED' && studio.subscriptionStatus !== 'INACTIVE' ? (
              <button 
                onClick={handleCancelSub} 
                disabled={loadingCancel}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-3.5 rounded-xl border border-rose-500/20 text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-2"
              >
                {loadingCancel ? <Loader className="w-4 h-4 animate-spin" /> : 'Cancel Subscription'}
              </button>
            ) : (
              <div className="text-xs text-slate-400 font-medium italic">You are currently on the free Basic plan.</div>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {plans.map((p) => {
            const isActive = studio.subscriptionPlan === p.name.toUpperCase();
            
            return (
              <div key={p.name} className={`relative bg-white p-7 rounded-3xl flex flex-col border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isActive ? 'border-[#c5a880] shadow-lg ring-4 ring-[#c5a880]/10 bg-[#c5a880]/[0.02]' : p.highlight ? 'border-slate-800 shadow-md ring-4 ring-slate-900/5' : 'border-slate-200 shadow-sm'}`}>
                
                {isActive && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c5a880] text-[#09090b] text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    YOUR PLAN
                  </div>
                )}
                
                {(!isActive && p.highlight) && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-900 text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex-grow">
                  <h4 className="text-xs font-extrabold text-slate-900 tracking-widest uppercase">{p.name}</h4>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{p.price}</span>
                    <span className="text-xs text-slate-500 font-bold ml-1">{p.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold pb-4 border-b border-slate-100">{p.desc}</p>
                  
                  <ul className="mt-6 space-y-4 mb-8">
                    {p.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1 ${isActive || p.highlight ? 'bg-[#c5a880]/20 text-[#c5a880]' : 'bg-slate-100 text-slate-400'}`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto">
                  {isActive ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#c5a880]/10 text-[#b59a72] border border-[#c5a880]/20 text-[11px] font-extrabold shadow-inner cursor-default">
                      <CheckCircle className="w-4 h-4" /> Current Plan
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe(p.name)} 
                      disabled={loadingPlan === p.name}
                      className={`w-full py-3.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        p.highlight 
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-900 shadow-md' 
                          : 'bg-[#f8f7f4] text-slate-900 hover:bg-[#c5a880] text-slate-600 hover:text-slate-700 border border-slate-200 hover:border-[#c5a880] shadow-sm'
                      }`}
                    >
                      {loadingPlan === p.name ? <Loader className="w-4 h-4 animate-spin" /> : 'Select Plan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
