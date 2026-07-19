import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import PageLoader from "../components/PageLoader";
import NavigationProgress from "../components/NavigationProgress";

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
        {/* Initial page load splash screen */}
        <PageLoader />
        {/* Navigation progress bar for route transitions */}
        <NavigationProgress />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
