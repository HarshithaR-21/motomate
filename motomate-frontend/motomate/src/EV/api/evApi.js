const BASE = 'http://localhost:8080';

const getToken = () => {
  const tokenCookie = document.cookie
    .split('; ')
    .find(r => r.startsWith('jwt=') || r.startsWith('token='));

  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  return localStorage.getItem('token');
};

const headers = (json = true) => {
  const token = getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchApi = (path, options = {}) => fetch(path, { credentials: 'include', ...options });

const handle = async res => {
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── EV Vehicles ───────────────────────────────────────────────────────────────
export const evApi = {
  // Vehicles
  registerVehicle: body => fetchApi(`${BASE}/api/ev/vehicles`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  getMyVehicles:   ()   => fetchApi(`${BASE}/api/ev/vehicles`, { headers: headers() }).then(handle),
  updateBattery:   (id, pct) => fetchApi(`${BASE}/api/ev/vehicles/${id}/battery?percentage=${pct}`, { method: 'PATCH', headers: headers() }).then(handle),
  deleteVehicle:   id  => fetchApi(`${BASE}/api/ev/vehicles/${id}`, { method: 'DELETE', headers: headers() }).then(handle),

  // Workshops
  getWorkshops:    ()          => fetchApi(`${BASE}/api/ev/workshops`, { headers: headers() }).then(handle),
  getNearbyWorkshops: (lat, lng) => fetchApi(`${BASE}/api/ev/workshops/nearby?lat=${lat}&lng=${lng}`, { headers: headers() }).then(handle),
  getWorkshop:     id          => fetchApi(`${BASE}/api/ev/workshops/${id}`, { headers: headers() }).then(handle),

  // Service
  bookService:     body => fetchApi(`${BASE}/api/ev/book-service`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  getServiceHistory: () => fetchApi(`${BASE}/api/ev/service-history`, { headers: headers() }).then(handle),
  getRequest:      id  => fetchApi(`${BASE}/api/ev/service-requests/${id}`, { headers: headers() }).then(handle),
  cancelRequest:   (id, reason) => fetchApi(`${BASE}/api/ev/service-requests/${id}/cancel`, { method: 'POST', headers: headers(), body: JSON.stringify({ reason }) }).then(handle),
  rateService:     (id, body)   => fetchApi(`${BASE}/api/ev/service-requests/${id}/rate`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),

  // Charging
  requestCharging: body => fetchApi(`${BASE}/api/ev/request-charging`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  sos:             body => fetchApi(`${BASE}/api/ev/sos`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  getChargingHistory: () => fetchApi(`${BASE}/api/ev/charging-history`, { headers: headers() }).then(handle),
};

// ── EV Worker ─────────────────────────────────────────────────────────────────
export const evWorkerApi = {
  getJobs:          workerId => fetchApi(`${BASE}/api/ev/worker/jobs?workerId=${workerId}`, { headers: headers() }).then(handle),
  acceptJob:        id       => fetchApi(`${BASE}/api/ev/worker/${id}/accept`,  { method: 'PUT', headers: headers() }).then(handle),
  onTheWay:         id       => fetchApi(`${BASE}/api/ev/worker/${id}/on-the-way`, { method: 'PUT', headers: headers() }).then(handle),
  startService:     id       => fetchApi(`${BASE}/api/ev/worker/${id}/start`,   { method: 'PUT', headers: headers() }).then(handle),
  completeService:  id       => fetchApi(`${BASE}/api/ev/worker/${id}/complete`,{ method: 'PUT', headers: headers() }).then(handle),
  updateLocation:   (workerId, lat, lng) => fetchApi(`${BASE}/api/ev/worker/${workerId}/location`, { method: 'PUT', headers: headers(), body: JSON.stringify({ latitude: lat, longitude: lng }) }).then(handle),
  updateAvailability: (workerId, status) => fetchApi(`${BASE}/api/ev/worker/${workerId}/availability?status=${status}`, { method: 'PUT', headers: headers() }).then(handle),
};

// ── EV Workshop ───────────────────────────────────────────────────────────────
export const evWorkshopApi = {
  getMyWorkshop: ()        => fetchApi(`${BASE}/api/ev/my-workshop`, { headers: headers() }).then(handle),
  getDashboard: workshopId => fetchApi(`${BASE}/api/ev/workshop/${workshopId}/dashboard`, { headers: headers() }).then(handle),
  getRequests:  workshopId => fetchApi(`${BASE}/api/ev/workshop/${workshopId}/requests`,  { headers: headers() }).then(handle),
  getWorkers:   workshopId => fetchApi(`${BASE}/api/ev/workshop/${workshopId}/workers`,   { headers: headers() }).then(handle),
  updateStatus: (requestId, status, reason) => fetchApi(`${BASE}/api/ev/workshop/requests/${requestId}/status`, { method: 'PUT', headers: headers(), body: JSON.stringify({ status, reason }) }).then(handle),
  updateWorkerStatus: (workerId, status) => fetchApi(`${BASE}/api/ev/workshop/workers/${workerId}/status?status=${status}`, { method: 'PUT', headers: headers() }).then(handle),
  assignWorker: (requestId, workerId) => fetchApi(`${BASE}/api/ev/workshop/requests/${requestId}/assign`, { method: 'PUT', headers: headers(), body: JSON.stringify({ workerId }) }).then(handle),
};

// ── Admin EV ──────────────────────────────────────────────────────────────────
export const evAdminApi = {
  getDashboard: ()   => fetchApi(`${BASE}/api/admin/ev/dashboard`,  { headers: headers() }).then(handle),
  getWorkshops: ()   => fetchApi(`${BASE}/api/admin/ev/workshops`,  { headers: headers() }).then(handle),
  getChargingRequests: () => fetchApi(`${BASE}/api/admin/ev/charging/requests`, { headers: headers() }).then(handle),
};