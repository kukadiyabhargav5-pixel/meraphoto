'use client';

import React from 'react';
import DashboardLayout from '../dashboard/layout';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Re-uses the primary dashboard layout with full sidebar, top bar, and mobile responsive drawer
  // All Super Admin permissions and unlimited bypasses are automatically applied
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
