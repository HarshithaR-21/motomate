// api.js — All real backend calls for the Admin Dashboard
// Base URL: http://localhost:8080/api

const BASE_URL = 'http://localhost:8080/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const get    = (path)        => fetch(`${BASE_URL}${path}`, { headers: headers() }).then(handleResponse);
const post   = (path, body)  => fetch(`${BASE_URL}${path}`, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(handleResponse);
const patch  = (path, body)  => fetch(`${BASE_URL}${path}`, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(handleResponse);
const del    = (path)        => fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: headers() }).then(handleResponse);

export const buildDocumentUrl = (relativePath) => {
  if (!relativePath) return null;
  const normalizedPath = relativePath.replaceAll('\\', '/');
  return `${BASE_URL}/uploads/${normalizedPath}`;
};

const qs = (params) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  return new URLSearchParams(filtered).toString();
};

const withQuery = (path, params = {}) => {
  const query = qs(params);
  return query ? `${path}?${query}` : path;
};

// ── Auth ─────────────────────────────────────────────────────────
export const adminLogin = (credentials) =>
  fetch(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then(handleResponse);

// ── Dashboard ────────────────────────────────────────────────────
export const fetchDashboardStats = () => get('/admin/dashboard/stats');

// ── Analytics ────────────────────────────────────────────────────
export const fetchAnalytics = () => get('/admin/analytics');

// These are derived from the analytics endpoint in the real backend
export const fetchRevenueChart    = () => get('/admin/analytics');
export const fetchServicesChart   = () => get('/admin/analytics');
export const fetchUserGrowthChart = () => get('/admin/analytics');

// ── Issues ───────────────────────────────────────────────────────
export const fetchIssues = (params = {}) => get(`/admin/issues?${qs(params)}`);
export const fetchIssueById   = (id)             => get(`/admin/issues/${id}`);
export const replyToIssue     = (id, message)    => post(`/admin/issues/${id}/reply`, { message });
export const updateIssueStatus = (id, status)    => patch(`/admin/issues/${id}/status`, { status });
export const createIssue      = (issue)          => post('/admin/issues', issue);

// ── Verifications ────────────────────────────────────────────────
export const fetchServiceCenterRequests = (params = {}) =>
  get(withQuery('/admin/verifications/service-centers', params));
export const fetchFleetManagerRequests = (params = {}) =>
  get(withQuery('/admin/verifications/fleet-managers', params));
export const fetchVerificationDetail = (type, id) =>
  get(`/admin/verifications/${type}/${id}`);
export const approveVerification = (type, id, remarks = '') =>
  patch(`/admin/verifications/${type}/${id}/approve`, { remarks });
export const rejectVerification = (type, id, reason) =>
  patch(`/admin/verifications/${type}/${id}/reject`, { reason });

// ── Users ────────────────────────────────────────────────────────
export const fetchUsers     = (params = {}) => get(`/admin/users?${qs(params)}`);
export const fetchUserById  = (id)          => get(`/admin/users/${id}`);
export const deactivateUser = (id)          => patch(`/admin/users/${id}/deactivate`, {});
export const reactivateUser = (id)          => patch(`/admin/users/${id}/reactivate`, {});
export const deleteUser     = (id)          => del(`/admin/users/${id}`);

// ── Service Centers ───────────────────────────────────────────────
export const fetchServiceCenters    = (params = {}) => get(`/admin/service-centers?${qs(params)}`);
export const fetchServiceCenterById = (id)           => get(`/admin/service-centers/${id}`);

// ── Fleet Managers ────────────────────────────────────────────────
export const fetchFleetManagers    = (params = {}) => get(`/admin/fleet-managers?${qs(params)}`);
export const fetchFleetManagerById = (id)           => get(`/admin/fleet-managers/${id}`);

// ── Workers ───────────────────────────────────────────────────────
export const fetchWorkers   = (params = {}) => get(`/admin/workers?${qs(params)}`);
export const fetchWorkerById = (id)          => get(`/admin/workers/${id}`);

// ── Ongoing Services (bookings) ───────────────────────────────────
export const fetchOngoingServices = (params = {}) => {
  // Map old frontend calls to users endpoint filtered by status
  return get(`/admin/users?${qs({ ...params, role: '' })}`).catch(() => ({ data: [], total: 0 }));
};
export const fetchServiceDetail = (id) => get(`/admin/users/${id}`);

// ── Reports (stubs — extend when backend ready) ───────────────────
export const fetchReports    = () => Promise.resolve({ data: [], total: 0 });
export const generateReport  = () => Promise.resolve({ status: 'processing' });
export const downloadReport  = () => Promise.resolve({ url: '#' });
