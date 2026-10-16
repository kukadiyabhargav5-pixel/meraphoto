'use client';

import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';

export interface GoogleUserProfile {
  accessToken?: string;
  credential?: string;
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

function parseJwt(token: string): { email?: string; name?: string; picture?: string; sub?: string } {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to parse Google JWT payload:', e);
    return {};
  }
}

function InnerGoogleLoginButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  disabled = false,
  className = '',
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const isSignUp = text.toLowerCase().includes('sign up');

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('No credential received from Google.');
      return;
    }

    setLoading(true);
    try {
      const payload = parseJwt(credentialResponse.credential);
      const profile: GoogleUserProfile = {
        credential: credentialResponse.credential,
        email: payload.email || '',
        name: payload.name || 'User',
        picture: payload.picture,
      };

      await onSuccess(profile);
    } catch (err: any) {
      console.error('Google profile processing error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to authenticate with Google');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full flex justify-center items-center ${disabled || loading ? 'opacity-60 pointer-events-none' : ''} ${className}`}>
      {/* 
        Official Google Sign-In Button (Google Identity Services)
        100% immune to browser popup blockers! Uses Google's official FedCM API.
      */}
      <div className="w-full flex justify-center [&>div]:!w-full [&>div>iframe]:!w-full [&>div>iframe]:!mx-auto">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.warn('Google Sign-In was cancelled or failed.');
            toast.error('Google Sign-In was cancelled or failed.');
            if (onError) onError(new Error('Google Sign-In failed'));
          }}
          theme="outline"
          size="large"
          text={isSignUp ? 'signup_with' : 'continue_with'}
          shape="rectangular"
          width="100%"
          logo_alignment="center"
        />
      </div>
    </div>
  );
}

export default function GoogleAuthButton(props: GoogleAuthButtonProps) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '242648487678-j7d799lhhsvigtgpq2k2ngo2tp7ivn7v.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <InnerGoogleLoginButton {...props} />
    </GoogleOAuthProvider>
  );
}

