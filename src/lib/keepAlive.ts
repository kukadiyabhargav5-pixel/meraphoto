/**
 * Anti-Sleep Keep-Alive Engine
 * Keeps Frontend, Backend, and MongoDB Database perpetually awake and responsive.
 * Prevents cold-start delays and sleep timeouts.
 */

const PING_INTERVAL_MS = 3 * 60 * 1000; // Ping every 3 minutes
let keepAliveTimer: any = null;

export async function pingBackendAndDatabase(): Promise<boolean> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://meraphotoes.onrender.com/api';
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.database === 'connected_active';
    }
    return false;
  } catch (err) {
    return false;
  }
}

export function startKeepAlive() {
  if (typeof window === 'undefined') return;
  if (keepAliveTimer) return;

  // Immediate ping on start
  pingBackendAndDatabase();

  // Periodic recurring ping
  keepAliveTimer = setInterval(() => {
    pingBackendAndDatabase();
  }, PING_INTERVAL_MS);
}

export function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}
