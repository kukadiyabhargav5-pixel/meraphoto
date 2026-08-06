'use client';
import React, { useState } from 'react';
import Script from 'next/script';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import { Check, CheckCircle, Loader, Shield, Zap, Sparkles, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '₹3,500',
    period: '/year',
    desc: 'Store 50,000 photos & store 10 videos',
    highlight: false,
    icon: Shield,
    features: ['Store 50,000 photos', 'Store 10 videos', 'Business Branding', 'Bulk Download', 'Web Mode'],
  },
  {
    name: 'Standard',
    price: '₹7,900',
    period: '/year',
    desc: 'Store 1,50,000 photos & store 100 videos',
    highlight: true,
    icon: Zap,
    features: ['Store 1,50,000 photos', 'Store 100 videos', 'Watermarks', 'Includes all Basic features'],
  },
  {
    name: 'Essential',
    price: '₹15,900',
    period: '/year',
    desc: 'Store 3,00,000 photos & store 200 videos',
    highlight: false,
    icon: Sparkles,
    features: ['Store 3,00,000 photos', 'Store 200 videos', 'View Client Favourites', 'Switch on/off Downloads', 'Portfolio Website', 'Includes all Standard features'],
  },
  {
    name: 'Premium',
    price: '₹31,900',
    period: '/year',
    desc: 'Store 7,50,000 photos & store 500 videos',
    highlight: false,
    icon: Crown,
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

      const configRes = await apiClient.get('/payment/config');
      const keyId = configRes.data.keyId;

      const sessionRes = await apiClient.post('/payment/checkout', { plan: planName.toUpperCase() });
      const { subscriptionId } = sessionRes.data;

      if (subscriptionId.startsWith('sub_mock_id_')) {
        setSuccessMsg(`Successfully subscribed to ${planName} plan (Mock Mode)!`);
        setStudio({ ...studio, subscriptionPlan: planName.toUpperCase(), subscriptionStatus: 'ACTIVE' });
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: keyId,
        order_id: subscriptionId,
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
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col min-h-full relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto z-10 animate-fade-in pb-12">
        
        {/* Header */}
        <div className="text-center mt-6 mb-2">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Premium Plans
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-4 tracking-wide max-w-2xl mx-auto">
            Elevate your photography studio with our professional tier features. Choose the perfect plan to scale your business.
          </p>
        </div>
        
        {/* Active Plan Banner */}
        <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#c5a880]/30 hover:shadow-md transition-all duration-500">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#c5a880]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#c5a880]/10 transition-all duration-700"></div>
          
          <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
            <span className="text-[10px] text-[#c5a880] font-extrabold uppercase tracking-[0.2em] bg-[#c5a880]/10 px-4 py-2 rounded-full border border-[#c5a880]/20">
              Current Subscription
            </span>
            <div className="flex items-center gap-4 mt-6 justify-center md:justify-start">
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{studio.subscriptionPlan || 'BASIC'}</h3>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {studio.subscriptionStatus || 'ACTIVE'}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            {(studio.subscriptionPlan && studio.subscriptionPlan !== 'BASIC') && studio.subscriptionStatus !== 'CANCELLED' && studio.subscriptionStatus !== 'INACTIVE' ? (
              <button 
                onClick={handleCancelSub} 
                disabled={loadingCancel}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-8 py-4 rounded-2xl border border-rose-200 text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer flex items-center gap-2 hover:shadow-sm"
              >
                {loadingCancel ? <Loader className="w-4 h-4 animate-spin" /> : 'Downgrade to Basic'}
              </button>
            ) : (
              <div className="text-xs text-slate-400 font-medium tracking-wide">You are currently on the free plan.</div>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {plans.map((p) => {
            const isActive = studio.subscriptionPlan === p.name.toUpperCase();
            const Icon = p.icon;
            
            return (
              <div key={p.name} className={`relative bg-white p-8 rounded-[2rem] flex flex-col transition-all duration-500 hover:-translate-y-2 group ${
                isActive 
                  ? 'border-2 border-[#c5a880] shadow-[0_15px_30px_rgba(197,168,128,0.15)] bg-gradient-to-b from-[#c5a880]/5 to-transparent' 
                  : p.highlight 
                    ? 'border-2 border-slate-900 shadow-xl' 
                    : 'border border-slate-200 shadow-sm hover:shadow-lg'
              }`}>
                
                {isActive && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c5a880] to-[#e6d0a7] text-white text-[10px] font-black tracking-widest px-6 py-2 rounded-full shadow-md whitespace-nowrap z-10">
                    YOUR PLAN
                  </div>
                )}
                
                {(!isActive && p.highlight) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black tracking-widest px-6 py-2 rounded-full shadow-md whitespace-nowrap z-10">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex-grow relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className={`text-sm font-extrabold tracking-widest uppercase ${isActive ? 'text-[#c5a880]' : 'text-slate-900'}`}>{p.name}</h4>
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-[#c5a880]/10 text-[#c5a880]' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">{p.price}</span>
                    <span className="text-xs text-slate-500 font-bold ml-1">{p.period}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium pb-6 border-b border-slate-100">{p.desc}</p>
                  
                  <ul className="mt-8 space-y-5 mb-10">
                    {p.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                         <div className={`mt-0.5 rounded-full p-1 ${
                          isActive 
                            ? 'bg-[#c5a880]/10 text-[#c5a880]' 
                            : p.highlight 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto relative z-10">
                  {isActive ? (
                    <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30 text-xs font-bold tracking-widest uppercase cursor-default">
                      <CheckCircle className="w-4 h-4" /> Active
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe(p.name)} 
                      disabled={loadingPlan === p.name}
                      className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                        p.highlight 
                          ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg' 
                          : 'bg-slate-50 text-slate-700 hover:bg-[#c5a880] hover:text-white border border-slate-200 hover:border-[#c5a880] shadow-sm hover:shadow-md'
                      }`}
                    >
                      {loadingPlan === p.name ? <Loader className="w-4 h-4 animate-spin text-current" /> : 'Select Plan'}
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
