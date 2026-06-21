const TOKEN_KEY = 'townrides_token';
const API_BASE = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Render's free tier puts the server to sleep after 15 minutes idle, so the
// first request after that can take 30-60s to respond. We notify listeners
// (see WakingBanner) once any single request has been pending a few seconds,
// so the UI can explain the wait instead of just looking frozen.
const SLOW_THRESHOLD_MS = 3000;
let slowCount = 0;
let listeners = [];

function setSlow(active) {
  slowCount = Math.max(0, slowCount + (active ? 1 : -1));
  listeners.forEach((listener) => listener(slowCount > 0));
}

export function onSlowRequest(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let becameSlow = false;
  const slowTimer = setTimeout(() => {
    becameSlow = true;
    setSlow(true);
  }, SLOW_THRESHOLD_MS);

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  } finally {
    clearTimeout(slowTimer);
    if (becameSlow) setSlow(false);
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path, body) => request(path, { method: 'DELETE', body }),
  public: {
    post: (path, body) => request(path, { method: 'POST', body, auth: false }),
  },
};
