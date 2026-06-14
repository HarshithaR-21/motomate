const BASE = 'http://localhost:8080/api/sos';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Submit a new SOS request
export const submitSOS = async (payload) => {
  const res = await fetch(`${BASE}/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    // Return active SOS id if a duplicate exists
    if (res.status === 409 && data.error?.startsWith('ACTIVE_SOS_EXISTS:')) {
      const existingId = data.error.split(':')[1];
      throw Object.assign(new Error('ACTIVE_SOS_EXISTS'), { activeSosId: existingId });
    }
    throw new Error(data.error || 'SOS submit failed');
  }
  return data;
};

// Get SOS by ID (live tracking)
export const getSOSById = async (sosId) => {
  const res = await fetch(`${BASE}/${sosId}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch SOS');
  return res.json();
};

// Customer: SOS history
export const getCustomerSOS = async (customerId) => {
  const res = await fetch(`${BASE}/customer/${customerId}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch SOS history');
  return res.json();
};

// Cancel SOS (customer)
export const cancelSOS = async (sosId, customerId, reason = '') => {
  const res = await fetch(`${BASE}/${sosId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ customerId, reason }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Cancel failed');
  return data;
};

// Worker/system: update status
export const updateSOSStatus = async (sosId, status, workerId) => {
  const res = await fetch(`${BASE}/${sosId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, workerId }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update status');
  return data;
};

// Emergency contacts
export const getEmergencyContacts = async (customerId) => {
  const res = await fetch(`${BASE}/emergency-contacts/${customerId}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch emergency contacts');
  return res.json();
};

export const saveEmergencyContacts = async (customerId, contacts) => {
  const res = await fetch(`${BASE}/emergency-contacts/${customerId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(contacts),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save emergency contacts');
  return data;
};

// Service center: incoming SOS (pending broadcast + accepted/active)
export const getActiveSosForServiceCenter = async (scId) => {
  const res = await fetch(`${BASE}/service-center/${scId}/incoming`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch SOS list');
  return res.json();
};

// Service center: accept a broadcast SOS request
export const acceptSOS = async (sosId, serviceCenterId) => {
  const res = await fetch(`${BASE}/${sosId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ serviceCenterId }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to accept SOS');
  return data;
};

// Service center: reject a broadcast SOS request
export const rejectSOS = async (sosId, serviceCenterId, reason = '') => {
  const res = await fetch(`${BASE}/${sosId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ serviceCenterId, reason }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject SOS');
  return data;
};

// Service center: available workers for manual assignment to an SOS
export const getAvailableWorkersForSOS = async (sosId, serviceCenterId) => {
  const params = new URLSearchParams({ serviceCenterId });
  const res = await fetch(`${BASE}/${sosId}/available-workers?${params}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch available workers');
  return res.json();
};

// Service center: manually assign worker
export const manuallyAssignWorker = async (sosId, workerId) => {
  const res = await fetch(`${BASE}/${sosId}/assign-worker`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workerId }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to assign worker');
  return data;
};

// Worker: active SOS assignments
export const getActiveSosForWorker = async (workerId) => {
  const res = await fetch(`${BASE}/worker/${workerId}/active`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch worker SOS');
  return res.json();
};
