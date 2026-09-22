import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./datepicker-custom.css";
import { AuthProvider } from "../lib/AuthContext";
import NavigationProgress from "../components/NavigationProgress";
import ToastProvider from "../components/ToastProvider";
import GlobalLoader from "../components/GlobalLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#060609",
};

export const metadata: Metadata = {
  title: "Mara Photo - AI-Powered Event Photo Sharing with Face Recognition",
  description: "Share event photos instantly via AI face recognition & QR code. Guests find their photos in seconds. Perfect for weddings, corporate events & parties.",
  icons: {
    icon: "/studio-gold-icon.png",
    shortcut: "/studio-gold-icon.png",
    apple: "/studio-gold-icon.png",
  },
};

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
      <head>
        <link rel="icon" href="/studio-gold-icon.png" type="image/png" />
        <link rel="shortcut icon" href="/studio-gold-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/studio-gold-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Global initial page loader */}
        <GlobalLoader />
        
        {/* Navigation progress bar for route transitions */}
        <NavigationProgress />
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
