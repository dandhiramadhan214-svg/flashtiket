// ================================================================
// FlashTiket Frontend — API Service Layer
// Connects Vue 3 Pinia stores to Express Backend API (localhost:3001)
// ================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

function getAuthHeader() {
  const token = localStorage.getItem('flashtiket_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request gagal dengan status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // ── Ping & Health ─────────────────────────────────────────────
  ping: () => request('/ping'),
  health: () => request('/admin/health'),

  // ── Auth ──────────────────────────────────────────────────────
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request('/auth/me'),

  // ── Events ────────────────────────────────────────────────────
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? '?' + query : ''}`);
  },
  getEventById: (id) => request(`/events/${id}`),

  // ── Wishlist ──────────────────────────────────────────────────
  getWishlist: () => request('/wishlist'),
  addToWishlist: (eventId) =>
    request(`/wishlist/${eventId}`, { method: 'POST' }),
  removeFromWishlist: (eventId) =>
    request(`/wishlist/${eventId}`, { method: 'DELETE' }),
  clearWishlist: () =>
    request('/wishlist', { method: 'DELETE' }),

  // ── Reviews ───────────────────────────────────────────────────
  getReviews: (eventId) => request(`/reviews/${eventId}`),
  addReview: (eventId, payload) =>
    request(`/reviews/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── War Tiket & Queue ─────────────────────────────────────────
  joinQueue: (eventId) =>
    request('/tickets/join-queue', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),
  getQueueStatus: (eventId) =>
    request(`/tickets/queue-status/${eventId}`),
  reserveTicket: (payload) =>
    request('/tickets/reserve', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirmOrder: (payload) =>
    request('/tickets/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyTickets: () => request('/tickets/my-tickets'),

  // ── Admin ─────────────────────────────────────────────────────
  getAdminStats: () => request('/admin/stats'),
  getAdminOrders: () => request('/admin/orders'),

  // ── Midtrans Payments ─────────────────────────────────────────
  getMidtransClientKey: () => request('/payments/client-key'),
  createSnapToken: (orderId) =>
    request('/payments/create-snap-token', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),
  getPaymentStatus: (orderId) => request(`/payments/status/${orderId}`),
};

export default api;
