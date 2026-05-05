import axios from 'axios';

const BASE = 'http://localhost:8080/api';
const cfg = { withCredentials: true };

// ── Auth ──────────────────────────────────────────────────────────────────────
export const fetchMe = () =>
  axios.get(`${BASE}/auth/me`, cfg).then(r => r.data);

// ── Worker profile ────────────────────────────────────────────────────────────
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

// ── Location APIs (NEW) ───────────────────────────────────────────────────────

/**
 * Push worker's current GPS to the backend.
 * Called by useWorkerLocationTracker every 7 seconds.
 */
export const pushWorkerLocation = (workerId, latitude, longitude) =>
  axios.put(`${BASE}/location/worker/${workerId}`, { latitude, longitude }, cfg)
    .then(r => r.data);

/**
 * Deactivate worker's location sharing (job completed / went off duty).
 */
export const deactivateWorkerLocation = (workerId) =>
  axios.put(`${BASE}/location/worker/${workerId}/deactivate`, {}, cfg).then(r => r.data);

/**
 * Customer: get the current location of the worker assigned to their booking.
 * Use as a fallback if SSE is unavailable.
 */
export const fetchWorkerLocationForBooking = (bookingId) =>
  axios.get(`${BASE}/location/booking/${bookingId}/worker`, cfg)
    .then(r => r.data)
    .catch(err => {
      if (err.response?.status === 404) return null;
      throw err;
    });

/**
 * Store customer GPS coordinates on an existing booking.
 * Called after geolocation resolves when Doorstep is selected.
 */
export const storeCustomerLocation = (bookingId, latitude, longitude) =>
  axios.put(`${BASE}/location/booking/${bookingId}/customer`, { latitude, longitude }, cfg)
    .then(r => r.data);

// ── SSE helpers ───────────────────────────────────────────────────────────────

/**
 * Opens a Server-Sent Events stream for a worker.
 * Returns the EventSource so the caller can close it on cleanup.
 *
 * Handles:
 *  - connected               stream confirmed live
 *  - worker_assigned         new job assigned
 *  - job_status_updated      job status changed
 *
 * Usage:
 *   const es = openWorkerSse(userId, {
 *     onAssigned:         (data) => { ... },
 *     onJobStatusUpdated: (data) => { ... },
 *     onConnected:        ()     => { ... },
 *   });
 *   return () => es.close();
 */
export const openWorkerSse = (userId, handlers = {}) => {
  const { onAssigned, onJobStatusUpdated, onConnected, onError } = handlers;

  const es = new EventSource(
    `http://localhost:8080/api/notifications/subscribe/${userId}`,
    { withCredentials: true }
  );

  es.addEventListener('connected', () => {
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
  };

  return es;
};

/**
 * Opens a Server-Sent Events stream for a customer.
 * Returns the EventSource.
 *
 * Handles:
 *  - connected                    stream confirmed live
 *  - worker_assigned_to_customer  worker was assigned
 *  - worker_location_update       live GPS update from the worker  ← NEW
 *
 * Usage:
 *   const es = openCustomerSse(userId, {
 *     onWorkerAssigned:      (data) => { ... },
 *     onWorkerLocationUpdate:(data) => { setWorkerLocation({ latitude: data.latitude, longitude: data.longitude }) },
 *     onConnected:           ()     => { ... },
 *   });
 *   return () => es.close();
 */
export const openCustomerSse = (userId, handlers = {}) => {
  const { onWorkerAssigned, onWorkerLocationUpdate, onConnected, onError } = handlers;

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

  // ── NEW: live worker location ─────────────────────────────────────────────
  es.addEventListener('worker_location_update', (e) => {
    try { onWorkerLocationUpdate?.(JSON.parse(e.data)); }
    catch (err) { console.error('[SSE-customer] location parse error', err); }
  });

  es.onerror = (err) => {
    console.warn('[SSE-customer] stream error', err);
    onError?.(err);
  };

  return es;
};
