'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const DashboardContext = createContext<any>(null);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, studio: authStudio } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bills, setBills] = useState([]);
  const [studio, setStudio] = useState<any>(authStudio || { 
    name: 'Mara Photo', 
    subscriptionPlan: 'Professional', 
    branding: { color: '#c5a880', watermarkEnabled: false } 
  });
  const [sessionUser, setSessionUser] = useState<any>(user || { name: 'Admin', role: 'STUDIO_OWNER' });
  const [tickets, setTickets] = useState([]);
  const [shoots, setShoots] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [eventCovers, setEventCovers] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep user in sync with auth context
  useEffect(() => {
    if (user) {
      setSessionUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (authStudio) {
      setStudio(authStudio);
    }
  }, [authStudio]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Studio Details
        try {
          const studioRes = await apiClient.get('/studio/me');
          if (studioRes.data && studioRes.data.studio) {
            setStudio(studioRes.data.studio);
          }
        } catch (studioErr) {
          // Use auth studio as fallback
          if (authStudio) setStudio(authStudio);
        }

        // Fetch dashboard data
        try {
          const custRes = await apiClient.get('/dashboard/customers');
          setCustomers(custRes.data || []);
        } catch {}
        try {
          const teamRes = await apiClient.get('/dashboard/team');
          setTeam(teamRes.data || []);
        } catch {}
        try {
          const bookRes = await apiClient.get('/dashboard/bookings');
          setBookings(bookRes.data || []);
        } catch {}
        try {
          const quoteRes = await apiClient.get('/dashboard/quotations');
          setQuotations(quoteRes.data || []);
        } catch {}
        try {
          const billRes = await apiClient.get('/dashboard/bills');
          setBills(billRes.data || []);
        } catch {}
        try {
          const shootRes = await apiClient.get('/dashboard/shoots');
          setShoots(shootRes.data || []);
        } catch {}

        // Fetch portfolios
        try {
          const portfolioRes = await apiClient.get('/dashboard/portfolio');
          if (portfolioRes.data && portfolioRes.data.portfolios) {
            setPortfolios(portfolioRes.data.portfolios);
          }
        } catch {}

        // Fetch event covers
        try {
          const coverRes = await apiClient.get('/dashboard/event-cover');
          if (coverRes.data && coverRes.data.covers) {
            setEventCovers(coverRes.data.covers);
          }
        } catch {}
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
      portfolios, setPortfolios,
      eventCovers, setEventCovers,
      successMsg, setSuccessMsg,
      errorMsg, setErrorMsg
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
