const BASE_URL = 'http://localhost:8080/api';

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const get = (path) =>
  fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  }).then(handleResponse);

const patch = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify(body),
  }).then(handleResponse);

const post = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify(body),
  }).then(handleResponse);

// ── Auth ────────────────────────────────────────────────────────
export const adminLogin = (credentials) =>
  post('/admin/login', credentials);

// ── Dashboard Overview ──────────────────────────────────────────
export const fetchDashboardStats = () => get('/admin/dashboard/stats');

// ── Account Verification ────────────────────────────────────────
export const fetchServiceCenterRequests = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/verifications/service-centers?${q}`);
};

export const fetchFleetManagerRequests = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/verifications/fleet-managers?${q}`);
};

export const approveVerification = (type, id) =>
  patch(`/admin/verifications/${type}/${id}/approve`, {});

export const rejectVerification = (type, id, reason) =>
  patch(`/admin/verifications/${type}/${id}/reject`, { reason });

export const fetchVerificationDetail = (type, id) =>
  get(`/admin/verifications/${type}/${id}`);

// ── User Queries ────────────────────────────────────────────────
export const fetchUserQueries = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/queries?${q}`);
};

export const fetchQueryDetail = (id) => get(`/admin/queries/${id}`);

export const replyToQuery = (id, message) =>
  post(`/admin/queries/${id}/reply`, { message });

export const updateQueryStatus = (id, status) =>
  patch(`/admin/queries/${id}/status`, { status });

// ── Ongoing Services ────────────────────────────────────────────
export const fetchOngoingServices = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/services/ongoing?${q}`);
};

export const fetchServiceDetail = (id) => get(`/admin/services/${id}`);

// ── Analytics ───────────────────────────────────────────────────
export const fetchAnalytics = (range = '30d') =>
  get(`/admin/analytics?range=${range}`);

export const fetchRevenueChart = (range = '30d') =>
  get(`/admin/analytics/revenue?range=${range}`);

export const fetchServicesChart = (range = '30d') =>
  get(`/admin/analytics/services?range=${range}`);

export const fetchUserGrowthChart = (range = '30d') =>
  get(`/admin/analytics/user-growth?range=${range}`);

// ── Reports ─────────────────────────────────────────────────────
export const fetchReports = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/reports?${q}`);
};

export const generateReport = (type, dateRange) =>
  post('/admin/reports/generate', { type, dateRange });

export const downloadReport = (id) =>
  get(`/admin/reports/${id}/download`);
