import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser: use same-origin '/api' to leverage Next.js rewrite proxy.
    // This completely eliminates CORS errors, cross-port blocks, and IPv4/IPv6 mismatches.
    return '/api';
  }
  // Server-side (Node runtime): use direct localhost/127.0.0.1 or env variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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

    // Handle Network Error with seamless fallback between /api proxy and direct backend port 5000
    if (
      (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') &&
      originalRequest &&
      !originalRequest._retriedFallback
    ) {
      originalRequest._retriedFallback = true;
      if (typeof window !== 'undefined') {
        const host = window.location.hostname || '127.0.0.1';
        const directBase =
          host === 'localhost' || host === '127.0.0.1'
            ? 'http://127.0.0.1:5000/api'
            : `http://${host}:5000/api`;
        const currentBase = originalRequest.baseURL || '/api';
        const targetBase = currentBase === '/api' ? directBase : '/api';

        console.warn(
          `[API] Network error on ${currentBase}${originalRequest.url || ''}. Retrying with fallback: ${targetBase}...`
        );
        originalRequest.baseURL = targetBase;
        return axios(originalRequest);
      }
    }

    // If we get a 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const url = originalRequest.url || '';
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/me') ||
        url.includes('/auth/refresh-token')
      ) {
        return Promise.reject(error);
      }

      try {
        const refToken = localStorage.getItem('refreshToken');
        if (!refToken) {
          throw new Error('No refresh token available');
        }

        const refreshUrl =
          typeof window !== 'undefined'
            ? '/api/auth/refresh-token'
            : `${API_BASE_URL}/auth/refresh-token`;

        const res = await axios.post(refreshUrl, {
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
