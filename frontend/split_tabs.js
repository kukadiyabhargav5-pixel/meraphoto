const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let code = fs.readFileSync(dashboardPath, 'utf8');

const tabsToExtract = [
  { id: 'customers', route: 'customers', name: 'CustomersPage', searchStr: "activeTab === 'customers' && (" },
  { id: 'team', route: 'team', name: 'TeamPage', searchStr: "activeTab === 'team' && (" },
  { id: 'bookings', route: 'order-booking', name: 'OrderBookingPage', searchStr: "activeTab === 'bookings' && (" },
  { id: 'quotations', route: 'quotation', name: 'QuotationPage', searchStr: "activeTab === 'quotations' && (" },
  { id: 'bills', route: 'bill', name: 'BillPage', searchStr: "activeTab === 'bills' && (" },
  { id: 'payment-qr', route: 'payment-qr', name: 'PaymentQRPage', searchStr: "activeTab === 'payment-qr' && (" },
  { id: 'calendar', route: 'calendar', name: 'CalendarPage', searchStr: "activeTab === 'calendar' && (" },
  { id: 'profile', route: 'profile', name: 'ProfilePage', searchStr: "activeTab === 'profile' && sessionUser && (" },
  { id: 'branding', route: 'studio-branding', name: 'StudioBrandingPage', searchStr: "activeTab === 'branding' && studio && (" },
  { id: 'plans-billing', route: 'plans-billing', name: 'PlansBillingPage', searchStr: "activeTab === 'billing' && studio && (" },
  { id: 'support', route: 'support-help', name: 'SupportHelpPage', searchStr: "activeTab === 'support' && (" }
];

const imports = `'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';
`;

tabsToExtract.forEach(tab => {
  const searchStr = tab.searchStr;
  const startIndex = code.indexOf(searchStr);
  
  if (startIndex !== -1) {
    const startOfJsx = startIndex + searchStr.length;
    let braceCount = 1;
    let endIndex = -1;
    for (let i = startOfJsx; i < code.length; i++) {
      if (code[i] === '(') braceCount++;
      if (code[i] === ')') braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      let jsxContent = code.substring(startOfJsx, endIndex).trim();
      const pageCode = `${imports}

export default function ${tab.name}() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    customers, setCustomers,
    team, setTeam,
    bookings, setBookings,
    quotations, setQuotations,
    bills, setBills,
    studio, setStudio,
    sessionUser,
    tickets, setTickets,
    // Add other needed states here
  } = context;

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] text-white p-4 md:p-8">
      ${jsxContent}
    </div>
  );
}
`;
      const outDir = path.join(__dirname, 'src/app/dashboard', tab.route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'page.tsx'), pageCode);
      console.log(`Created page for ${tab.route}`);
      
      // Remove from original code
      // We will leave the original code untouched for now to not break it until layout is fully ready.
    }
  } else {
    console.log(`Could not find UI for ${tab.id}`);
  }
});
