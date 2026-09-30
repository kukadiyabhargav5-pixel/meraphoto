'use client';

import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

export interface GoogleUserProfile {
  accessToken: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleAuthButtonProps {
  onSuccess: (profile: GoogleUserProfile) => Promise<void> | void;
  onError?: (error: any) => void;
  text?: string;
  disabled?: boolean;
  className?: string;
}

function InnerGoogleLoginButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  disabled = false,
  className = '',
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPopupAlert, setShowPopupAlert] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setShowPopupAlert(false);
        // Fetch user profile from Google OAuth2 API
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const profile: GoogleUserProfile = {
          accessToken: tokenResponse.access_token,
          email: userRes.data.email,
          name: userRes.data.name || 'User',
          picture: userRes.data.picture,
        };

        await onSuccess(profile);
      } catch (err: any) {
        console.error('Google profile error:', err);
        const msg = err?.response?.data?.error || err?.message || 'Failed to authenticate with Google';
        toast.error(msg);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.warn('Google sign-in error:', errorResponse);
      setLoading(false);
      if (onError) onError(errorResponse);
    },
    onNonOAuthError: (nonOAuthError) => {
      console.warn('Google non-OAuth error:', nonOAuthError);
      setLoading(false);
      if (nonOAuthError.type === 'popup_failed_to_open') {
        setShowPopupAlert(true);
        toast.error('Browser blocked the popup window! Please allow popups for localhost:3000 in your URL bar.', { duration: 7000 });
      } else if (nonOAuthError.type === 'popup_closed') {
        toast('Google sign-in was closed.', { icon: 'ℹ️' });
      }
    },
  });

  return (
    <div className="w-full">
      <button
        type="button"
        id="google-login-btn"
        onClick={() => {
          setShowPopupAlert(false);
          login();
        }}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-700 text-xs sm:text-[13px] font-bold tracking-wide shadow-sm hover:shadow transition-all duration-200 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader className="w-4 h-4 text-[#c5a880] animate-spin" />
        ) : (
          <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting to Google...' : text}</span>
      </button>

      {showPopupAlert && (
        <div className="mt-3 p-3.5 bg-amber-50/95 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-sm text-left">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-amber-950 mb-1">Browser Popup Blocked!</p>
              <p className="text-[11px] text-amber-800 leading-relaxed mb-1.5">
                તમારા બ્રાઉઝરે પોપઅપ વિન્ડો બ્લોક કરી દીધી છે. પોપઅપ ચાલુ કરવા માટે:
              </p>
              <ol className="list-decimal list-inside text-[11px] text-amber-900 space-y-1 font-medium">
                <li>URL બારના જમણા છેડે <strong>🚫 પોપઅપ બ્લોક આઇકોન</strong> (અથવા ડાબે તાળા આઇકોન 🔒) પર ક્લિક કરો.</li>
                <li><strong>&quot;Always allow pop-ups and redirects from http://localhost:3000&quot;</strong> પસંદ કરો.</li>
                <li><strong>Done</strong> પર ક્લિક કરી નીચે &quot;Try Again&quot; દબાવો.</li>
              </ol>
              <button
                type="button"
                onClick={() => {
                  setShowPopupAlert(false);
                  login();
                }}
                className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors inline-block cursor-pointer shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleAuthButton(props: GoogleAuthButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '242648487678-j7d799lhhsvigtgpq2k2ngo2tp7ivn7v.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <InnerGoogleLoginButton {...props} />
    </GoogleOAuthProvider>
  );
}
