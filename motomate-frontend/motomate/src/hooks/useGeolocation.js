import { useState, useEffect, useCallback } from 'react';

/**
 * useGeolocation
 *
 * Captures the browser's GPS position once (or on demand).
 *
 * Returns:
 *   coords   — { latitude, longitude } | null
 *   error    — string | null (human-readable)
 *   loading  — boolean
 *   refresh  — () => void  (re-trigger geolocation)
 *   denied   — boolean (user explicitly denied permission)
 */
const useGeolocation = (options = {}) => {
  const [coords,  setCoords]  = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [denied,  setDenied]  = useState(false);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude:  position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        setDenied(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true);
          setError('Location permission denied. Please allow access or enter your address manually.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information is unavailable. Try again or enter address manually.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        } else {
          setError('Unable to retrieve location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    request();
  }, [request]);

  return { coords, error, loading, refresh: request, denied };
};

export default useGeolocation;
