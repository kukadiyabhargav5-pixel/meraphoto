import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    ) {
      return `http://${host}:5000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── IN-MEMORY API CACHE (Stale-While-Revalidate) ───
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CacheEntry>();

export const getCacheKey = (url: string, params?: any): string => {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${url}::${paramStr}`;
};

export const getCachedData = (url: string, params?: any): any | null => {
  const key = getCacheKey(url, params);
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
};

export const setCachedData = (url: string, params: any, data: any, ttl = 300000): void => {
  const key = getCacheKey(url, params);
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

export const invalidateCache = (urlPattern?: string): void => {
  if (!urlPattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
    }
  }
};

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
      }, 300);
    }
  }
};

// Request interceptor to attach JWT & check cache
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

// Response interceptor to handle token refresh & cache updates
apiClient.interceptors.response.use(
  (response) => {
    decrementActiveRequests();

    // Cache successful GET responses if not explicitly disabled
    if (response.config.method?.toLowerCase() === 'get') {
      const url = response.config.url || '';
      // Don't cache sensitive dynamic endpoints like auth tokens
      if (!url.includes('/auth/refresh-token')) {
        setCachedData(url, response.config.params, response.data, 300000); // 5 min TTL
      }
    }

    // On mutations (POST, PUT, DELETE), invalidate corresponding cache entries
    const method = response.config.method?.toLowerCase();
    if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
      const url = response.config.url || '';
      if (url.includes('/customer')) invalidateCache('/customers');
      if (url.includes('/team')) invalidateCache('/team');
      if (url.includes('/studio')) {
        invalidateCache('/studio');
        invalidateCache('/dashboard/stats');
      }
      if (url.includes('/event')) {
        invalidateCache('/event');
        invalidateCache('/dashboard/stats');
      }
    }

    return response;
  },
  async (error) => {
    decrementActiveRequests();
    const originalRequest = error.config;

    // If we get a 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me') || url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      try {
        const refToken = localStorage.getItem('refreshToken');
        if (!refToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: refToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
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
