// src/pages/FleetManager/api/fleetApi.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Fix 8: Get manager ID from localStorage — set on login, never fall back to a hardcoded demo ID
const getManagerId = () => {
  const id = localStorage.getItem('fleetManagerId');
  if (!id) {
    throw new Error('Session expired. Please log in again.');
  }
  return id;
};

const authHeaders = () => ({
  'X-Fleet-Manager-Id': getManagerId(),
  'Content-Type': 'application/json',
});

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

// Fix 6: Fetch service centers with ratings + services (matches customer Step3ServiceCenter)
export const fetchServiceCenters = async () => {
  const res = await fetch(`http://localhost:8080/api/services/centers`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to load service centers');
  const data = await res.json();

  const centers = data.map(c => ({
    id: c.id,
    ownerId: c.ownerId,
    name: c.centerName,
    city: c.city,
    centerType: c.centerType,
    vehicleTypes: c.vehicleTypes || [],
    label: `${c.centerName}${c.city ? ' — ' + c.city : ''}`,
    averageRating: 0,
    totalRatings: 0,
    services: [],
  }));

  // Fetch ratings and services in parallel for each center
  await Promise.allSettled(
    centers.map(async (c) => {
      if (!c.ownerId) return;
      try {
        const [ratingsRes, servicesRes] = await Promise.all([
          fetch(`http://localhost:8080/api/ratings/service-center/${c.ownerId}`, { credentials: 'include' }),
          fetch(`http://localhost:8080/api/services/centers/${c.ownerId}/services`, { credentials: 'include' }),
        ]);
        if (ratingsRes.ok) {
          const r = await ratingsRes.json();
          c.averageRating = r.averageRating || 0;
          c.totalRatings  = r.totalRatings  || 0;
        }
        if (servicesRes.ok) {
          c.services = await servicesRes.json();
        }
      } catch (_) { /* silently skip */ }
    })
  );

  return centers;
};

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

/**
 * Rate a service center after a completed fleet booking.
 * body: { serviceCenterId, serviceCenterName, managerName, rating (1-5), feedback? }
 */
export const rateServiceCenter = (serviceId, body) =>
  request('POST', `/fleet/services/${serviceId}/rate`, body);

// ── Reports ──────────────────────────────────────────────────────
export const fetchReport = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/fleet/services/report${q ? '?' + q : ''}`);
};
