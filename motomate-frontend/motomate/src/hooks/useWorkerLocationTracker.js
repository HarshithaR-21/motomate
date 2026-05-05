import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BASE = 'http://localhost:8080/api';
const cfg  = { withCredentials: true };

/**
 * useWorkerLocationTracker
 *
 * Continuously tracks the worker's GPS and pushes it to the backend every
 * `intervalMs` milliseconds (default 7 seconds).
 *
 * Improvements over original:
 *  - Dual-mode GPS: tries high-accuracy first, silently falls back to
 *    network/IP location if the device has no GPS chip (laptops, desktops).
 *  - Increased timeout from 10 s → 30 s for the first GPS fix.
 *  - maximumAge: 10000 — allows a cached position up to 10 s old so the
 *    watcher doesn't stall waiting for a fresh satellite fix every cycle.
 *  - TIMEOUT errors are non-fatal; only PERMISSION_DENIED stops tracking.
 *  - Exposes `accuracy` (metres) so the UI can warn if location is imprecise.
 *
 * @param {string}  workerId
 * @param {object}  options
 *   @param {number} options.intervalMs   Push interval in ms  (default 7000)
 *   @param {bool}   options.autoStart    Start on mount       (default false)
 */
const useWorkerLocationTracker = (workerId, options = {}) => {
  const { intervalMs = 7000, autoStart = false } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [error,      setError]      = useState(null);
  const [lastSent,   setLastSent]   = useState(null);
  const [accuracy,   setAccuracy]   = useState(null); // metres

  const intervalRef           = useRef(null);
  const watchRef              = useRef(null);
  const latestPos             = useRef(null);
  const highAccuracyFailedRef = useRef(false);
  const stoppedRef            = useRef(false); // guard against stop→start race

  // ── Internal watcher builder ─────────────────────────────────────────────

  // Forward-declared so startTracking can reference it before it exists
  const stopTrackingRef = useRef(null);

  const startWatcher = useCallback((enableHighAccuracy) => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    const onSuccess = (pos) => {
      latestPos.current = {
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setAccuracy(Math.round(pos.coords.accuracy));
      setError(null);
    };

    const onError = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setError('Location permission denied. Please allow location access in your browser settings.');
        stopTrackingRef.current?.();
      } else if (enableHighAccuracy && !highAccuracyFailedRef.current) {
        // GPS chip not available / timed out — fall back to network/IP location.
        // This is common on laptops and desktop browsers.
        console.warn('[LocationTracker] High-accuracy GPS failed, falling back to network location.');
        highAccuracyFailedRef.current = true;
        // Small delay to let the browser release the previous watcher cleanly
        setTimeout(() => {
          if (!stoppedRef.current) startWatcher(false);
        }, 500);
      } else {
        // Transient failure (e.g. brief loss of signal) — keep retrying silently
        console.warn('[LocationTracker] GPS soft error:', err.message);
      }
    };

    watchRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy,
        // 30 s for GPS (satellite first fix); 10 s for network location
        timeout: enableHighAccuracy ? 30000 : 10000,
        // Allow a cached position up to 10 s old — prevents stalls when GPS
        // hardware is slow without meaningfully reducing location accuracy.
        maximumAge: 10000,
      }
    );
  }, [workerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start tracking ───────────────────────────────────────────────────────

  const startTracking = useCallback(() => {
    if (!workerId) { setError('No workerId provided.'); return; }
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }

    setError(null);
    setIsTracking(true);
    stoppedRef.current          = false;
    highAccuracyFailedRef.current = false;

    // Try high-accuracy GPS first; falls back automatically if unavailable
    startWatcher(true);

    // Push the latest position to the backend on every interval tick
    intervalRef.current = setInterval(async () => {
      if (!latestPos.current) return;
      try {
        await axios.put(
          `${BASE}/location/worker/${workerId}`,
          {
            latitude:  latestPos.current.latitude,
            longitude: latestPos.current.longitude,
          },
          cfg
        );
        setLastSent(new Date().toISOString());
      } catch (e) {
        // Non-fatal — keep trying on the next tick
        console.warn('[LocationTracker] push failed:', e.message);
      }
    }, intervalMs);
  }, [workerId, intervalMs, startWatcher]);

  // ── Stop tracking ────────────────────────────────────────────────────────

  const stopTracking = useCallback(async () => {
    stoppedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    intervalRef.current = null;
    setIsTracking(false);
    setAccuracy(null);

    // Notify backend so the worker disappears from the active-workers map
    if (workerId) {
      try {
        await axios.put(`${BASE}/location/worker/${workerId}/deactivate`, {}, cfg);
      } catch (_) {}
    }
  }, [workerId]);

  // Wire the ref so startWatcher can call stopTracking before the closure is stable
  useEffect(() => {
    stopTrackingRef.current = stopTracking;
  }, [stopTracking]);

  // ── Auto-start / cleanup ─────────────────────────────────────────────────

  useEffect(() => {
    if (autoStart && workerId) startTracking();
    return () => {
      stoppedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [workerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isTracking, startTracking, stopTracking, error, lastSent, accuracy };
};

export default useWorkerLocationTracker;