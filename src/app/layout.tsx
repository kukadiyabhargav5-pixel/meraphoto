import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import PageLoader from "../components/PageLoader";
import NavigationProgress from "../components/NavigationProgress";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mara Photo - AI-Powered Event Photo Sharing with Face Recognition",
  description: "Share event photos instantly via AI face recognition & QR code. Guests find their photos in seconds. Perfect for weddings, corporate events & parties.",
};

const GOOGLE_CLIENT_ID = "242648487678-lqi4ct58iu62eggm699o01sid1lelj1h.apps.googleusercontent.com";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#09090b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#09090b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#09090b',
              },
            },
          }} 
        />
        {/* Initial page load splash screen */}
        <PageLoader />
        {/* Navigation progress bar for route transitions */}
        <NavigationProgress />
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
