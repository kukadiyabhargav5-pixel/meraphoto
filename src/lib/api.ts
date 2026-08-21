import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.')
);

const API_BASE_URL = isLocalhost
  ? `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:5000/api`
  : (process.env.NEXT_PUBLIC_API_URL || 'https://meraphotoes.onrender.com/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;
let idleTimer: any = null;

const incrementActiveRequests = () => {
  activeRequests++;
  if (typeof window !== 'undefined') {
    if (idleTimer) clearTimeout(idleTimer);
    window.dispatchEvent(new Event('api-active'));
  }
};

const decrementActiveRequests = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    if (typeof window !== 'undefined') {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        window.dispatchEvent(new Event('api-idle'));
      }, 300); // Wait 300ms before declaring idle, in case another request is queued immediately
    }
  }
};

// Request interceptor to attach JWT
apiClient.interceptors.request.use(
  (config) => {
    incrementActiveRequests();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    decrementActiveRequests();
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    decrementActiveRequests();
    return response;
  },
  async (error) => {
    decrementActiveRequests();
    const originalRequest = error.config;

    // If we get a 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Don't try to refresh if this is already an auth endpoint
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me') || url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      try {
        const refToken = localStorage.getItem('refreshToken');
        if (!refToken) {
          throw new Error('No refresh token available');
        }

        // Request a new access token
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: refToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Clear tokens and redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('studio');
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
