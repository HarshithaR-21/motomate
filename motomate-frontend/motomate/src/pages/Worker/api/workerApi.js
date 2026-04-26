import axios from 'axios';

const BASE = 'http://localhost:8080/api';
const cfg = { withCredentials: true };

// ── Auth ──────────────────────────────────────────────────────────────────────
export const fetchMe = () =>
  axios.get(`${BASE}/auth/me`, cfg).then(r => r.data);

// ── Worker profile ────────────────────────────────────────────────────────────
// Uses /by-user/{userId} to resolve UserModel.id → SCOWorker document
export const fetchWorkerByUserId = (userId) =>
  axios.get(`${BASE}/worker/by-user/${userId}`, cfg).then(r => r.data);

// ── Status ────────────────────────────────────────────────────────────────────
export const fetchWorkerStatus = (workerId) =>
  axios.get(`${BASE}/worker/${workerId}/status`, cfg).then(r => r.data);

export const updateWorkerStatus = (workerId, status) =>
  axios.put(`${BASE}/worker/${workerId}/status`, { status }, cfg).then(r => r.data);

// ── Incoming jobs ─────────────────────────────────────────────────────────────
export const fetchIncomingJobs = (workerId) =>
  axios.get(`${BASE}/worker/${workerId}/incoming-jobs`, cfg).then(r => r.data);

export const acceptJob = (workerId, jobId) =>
  axios.post(`${BASE}/worker/${workerId}/job/${jobId}/accept`, {}, cfg).then(r => r.data);

export const rejectJob = (workerId, jobId, reason) =>
  axios.post(`${BASE}/worker/${workerId}/job/${jobId}/reject`, { reason }, cfg).then(r => r.data);

// ── Current job ───────────────────────────────────────────────────────────────
export const fetchCurrentJob = (workerId) =>
  axios.get(`${BASE}/worker/${workerId}/current-job`, cfg)
    .then(r => r.data)
    .catch(err => {
      // 404 = no active job — return null instead of throwing
      if (err.response?.status === 404) return null;
      throw err;
    });

export const updateJobStatus = (workerId, jobId, status) =>
  axios.put(`${BASE}/worker/${workerId}/job/${jobId}/status`, { status }, cfg).then(r => r.data);

// ── History ───────────────────────────────────────────────────────────────────
export const fetchJobHistory = (workerId, params = {}) =>
  axios.get(`${BASE}/worker/${workerId}/job-history`, { ...cfg, params }).then(r => r.data);

export const fetchRatings = (workerId) =>
  axios.get(`${BASE}/worker/${workerId}/ratings`, cfg).then(r => r.data);

// ── Dashboard stats ───────────────────────────────────────────────────────────
export const fetchWorkerStats = (workerId) =>
  axios.get(`${BASE}/worker/${workerId}/stats`, cfg).then(r => r.data);

// ── SSE helpers ───────────────────────────────────────────────────────────────
/**
 * Opens a Server-Sent Events stream for the given userId.
 * Returns the EventSource instance so the caller can close it on cleanup.
 *
 * Usage:
 *   const es = openWorkerSse(userId, {
 *     onAssigned:         (data) => { ... },  // new job assigned
 *     onJobStatusUpdated: (data) => { ... },  // job status changed
 *     onConnected:        ()     => { ... },  // stream confirmed live
 *   });
 *   // cleanup:
 *   return () => es.close();
 */
export const openWorkerSse = (userId, handlers = {}) => {
  const { onAssigned, onJobStatusUpdated, onConnected, onError } = handlers;

  const es = new EventSource(
    `http://localhost:8080/api/notifications/subscribe/${userId}`,
    { withCredentials: true }
  );

  es.addEventListener('connected', (e) => {
    console.log('[SSE-worker] connected');
    onConnected?.();
  });

  es.addEventListener('worker_assigned', (e) => {
    try { onAssigned?.(JSON.parse(e.data)); }
    catch (err) { console.error('[SSE-worker] parse error', err); }
  });

  es.addEventListener('job_status_updated', (e) => {
    try { onJobStatusUpdated?.(JSON.parse(e.data)); }
    catch (err) { console.error('[SSE-worker] parse error', err); }
  });

  es.onerror = (err) => {
    console.warn('[SSE-worker] stream error', err);
    onError?.(err);
    // EventSource reconnects automatically; no manual retry needed
  };

  return es;
};

/**
 * Opens a Server-Sent Events stream for a customer userId.
 * Returns the EventSource instance.
 */
export const openCustomerSse = (userId, handlers = {}) => {
  const { onWorkerAssigned, onConnected, onError } = handlers;

  const es = new EventSource(
    `http://localhost:8080/api/notifications/subscribe/${userId}`,
    { withCredentials: true }
  );

  es.addEventListener('connected', () => {
    console.log('[SSE-customer] connected');
    onConnected?.();
  });

  es.addEventListener('worker_assigned_to_customer', (e) => {
    try { onWorkerAssigned?.(JSON.parse(e.data)); }
    catch (err) { console.error('[SSE-customer] parse error', err); }
  });

  es.onerror = (err) => {
    console.warn('[SSE-customer] stream error', err);
    onError?.(err);
  };

  return es;
};
