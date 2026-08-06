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

        // Fetch dashboard data concurrently to improve loading speed
        try {
          const [
            custRes,
            teamRes,
            bookRes,
            quoteRes,
            billRes,
            shootRes,
            portfolioRes,
            coverRes
          ] = await Promise.allSettled([
            apiClient.get('/dashboard/customers'),
            apiClient.get('/dashboard/team'),
            apiClient.get('/dashboard/bookings'),
            apiClient.get('/dashboard/quotations'),
            apiClient.get('/dashboard/bills'),
            apiClient.get('/dashboard/shoots'),
            apiClient.get('/dashboard/portfolio'),
            apiClient.get('/dashboard/event-cover')
          ]);

          if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
          if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
          if (bookRes.status === 'fulfilled') setBookings(bookRes.value.data || []);
          if (quoteRes.status === 'fulfilled') setQuotations(quoteRes.value.data || []);
          if (billRes.status === 'fulfilled') setBills(billRes.value.data || []);
          if (shootRes.status === 'fulfilled') setShoots(shootRes.value.data || []);
          if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data?.portfolios) {
            setPortfolios(portfolioRes.value.data.portfolios);
          }
          if (coverRes.status === 'fulfilled' && coverRes.value.data?.covers) {
            setEventCovers(coverRes.value.data.covers);
          }
        } catch (err) {
          console.error('Error fetching dashboard bulk data:', err);
        }
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboard-loaded'));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboard-loaded'));
        }
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
