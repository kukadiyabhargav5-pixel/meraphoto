import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function PublicWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* 
        The Header is fixed (h-20), so we need pt-20 on the main wrapper.
        flex-1 makes the main section expand to push the footer to the bottom. 
      */}
      <main className="flex-1 w-full pt-20 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
