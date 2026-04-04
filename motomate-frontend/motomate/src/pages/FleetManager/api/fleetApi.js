// src/pages/FleetManager/api/fleetApi.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Read fleet manager ID from localStorage (set on login)
const getManagerId = () => localStorage.getItem('fleetManagerId') || 'demo-manager-001';
const authHeaders = () => ({ 'X-Fleet-Manager-Id': getManagerId(), 'Content-Type': 'application/json' });

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success && !res.ok) throw new Error(json.message || 'Request failed');
  return json.data ?? json;
}

// ── Vehicles ─────────────────────────────────────────────────────
export const fetchVehicles = () => request('GET', '/fleet/vehicles');
export const addVehicle = (data) => request('POST', '/fleet/vehicles', data);
export const updateVehicle = (id, data) => request('PUT', `/fleet/vehicles/${id}`, data);
export const deleteVehicle = (id) => request('DELETE', `/fleet/vehicles/${id}`);
export const fetchDashboardStats = () => request('GET', '/fleet/vehicles/dashboard/stats');

// ── Services ─────────────────────────────────────────────────────
export const fetchServices = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/fleet/services${q ? '?' + q : ''}`);
};
export const scheduleService = (data) => request('POST', '/fleet/services', data);
export const bulkScheduleService = (data) => request('POST', '/fleet/services/bulk', data);
export const updateServiceStatus = (id, data) => request('PATCH', `/fleet/services/${id}/status`, data);

// ── Reports ──────────────────────────────────────────────────────
export const fetchReport = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/fleet/services/report${q ? '?' + q : ''}`);
};
