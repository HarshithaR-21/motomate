// api.js — Service Center Owner module API calls
const BASE = 'http://localhost:8080/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
});

const handle = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const get    = (path) =>       fetch(`${BASE}${path}`, { credentials: 'include', headers: authHeaders() }).then(handle);
const post   = (path, body) => fetch(`${BASE}${path}`, { method: 'POST',   credentials: 'include', headers: authHeaders(), body: JSON.stringify(body) }).then(handle);
const put    = (path, body) => fetch(`${BASE}${path}`, { method: 'PUT',    credentials: 'include', headers: authHeaders(), body: JSON.stringify(body) }).then(handle);
const patch  = (path, body) => fetch(`${BASE}${path}`, { method: 'PATCH',  credentials: 'include', headers: authHeaders(), body: JSON.stringify(body) }).then(handle);
const del    = (path) =>       fetch(`${BASE}${path}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() }).then(handle);

// Dashboard
export const fetchSCODashboard = (ownerId) => get(`/sco/${ownerId}/dashboard`);

// Profile
export const fetchSCOProfile = (ownerId) => get(`/sco/${ownerId}/profile`);

// Services
export const fetchSCOServices   = (ownerId)                   => get(`/sco/${ownerId}/services`);
export const createSCOService   = (ownerId, data)             => post(`/sco/${ownerId}/services`, data);
export const updateSCOService   = (ownerId, serviceId, data)  => put(`/sco/${ownerId}/services/${serviceId}`, data);
export const deleteSCOService   = (ownerId, serviceId)        => del(`/sco/${ownerId}/services/${serviceId}`);

// Workers
export const fetchSCOWorkers    = (ownerId, filters = {})     => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v))).toString();
  return get(`/sco/${ownerId}/workers${qs ? '?' + qs : ''}`);
};
export const addSCOWorker       = (ownerId, data)             => post(`/sco/${ownerId}/workers`, data);
export const updateSCOWorker    = (ownerId, workerId, data)   => put(`/sco/${ownerId}/workers/${workerId}`, data);
export const toggleAvailability = (ownerId, workerId)         => patch(`/sco/${ownerId}/workers/${workerId}/toggle-availability`);
export const deleteSCOWorker    = (ownerId, workerId)         => del(`/sco/${ownerId}/workers/${workerId}`);

// Requests
export const fetchSCORequests   = (ownerId, status)           => {
  const qs = status ? `?status=${status}` : '';
  return get(`/sco/${ownerId}/requests${qs}`);
};
export const acceptRequest      = (ownerId, reqId)            => patch(`/sco/${ownerId}/requests/${reqId}/accept`);
export const assignWorker       = (ownerId, reqId, workerId)  => patch(`/sco/${ownerId}/requests/${reqId}/assign`, { workerId });
export const completeRequest    = (ownerId, reqId)            => patch(`/sco/${ownerId}/requests/${reqId}/complete`);
export const updateReqStatus    = (ownerId, reqId, status)    => patch(`/sco/${ownerId}/requests/${reqId}/status`, { status });