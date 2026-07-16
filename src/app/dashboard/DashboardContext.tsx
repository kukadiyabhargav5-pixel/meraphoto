'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

const DashboardContext = createContext<any>(null);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bills, setBills] = useState([]);
  const [studio, setStudio] = useState<any>({ 
    name: 'Mara Photo', 
    subscriptionPlan: 'Professional', 
    branding: { color: '#c5a880', watermarkEnabled: false } 
  });
  const [sessionUser, setSessionUser] = useState<any>({ name: 'Admin', role: 'STUDIO_OWNER' });
  const [tickets, setTickets] = useState([]);
  const [shoots, setShoots] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setSessionUser(JSON.parse(storedUser));
        }

        // Fetch Studio Details
        try {
          const studioRes = await apiClient.get('/studio/me');
          if (studioRes.data && studioRes.data.studio) {
            setStudio(studioRes.data.studio);
          } else {
            const storedStudio = localStorage.getItem('studio');
            if (storedStudio) setStudio(JSON.parse(storedStudio));
          }
        } catch (studioErr) {
          const storedStudio = localStorage.getItem('studio');
          if (storedStudio) setStudio(JSON.parse(storedStudio));
        }

        const custRes = await apiClient.get('/dashboard/customers');
        setCustomers(custRes.data || []);
        const teamRes = await apiClient.get('/dashboard/team');
        setTeam(teamRes.data || []);
        const bookRes = await apiClient.get('/dashboard/bookings');
        setBookings(bookRes.data || []);
        const quoteRes = await apiClient.get('/dashboard/quotations');
        setQuotations(quoteRes.data || []);
        const billRes = await apiClient.get('/dashboard/bills');
        setBills(billRes.data || []);
        const shootRes = await apiClient.get('/dashboard/shoots');
        setShoots(shootRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };
    loadData();
  }, []);

  return (
    <DashboardContext.Provider value={{
      customers, setCustomers,
      team, setTeam,
      bookings, setBookings,
      quotations, setQuotations,
      bills, setBills,
      studio, setStudio,
      sessionUser, setSessionUser,
      tickets, setTickets,
      shoots, setShoots,
      successMsg, setSuccessMsg,
      errorMsg, setErrorMsg
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
