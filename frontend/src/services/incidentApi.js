const API_BASE_URL = 'http://localhost:3000/api/incidents';

/**
 * Fetch all incidents with optional severity/status filters.
 */
export const fetchIncidents = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.severity) queryParams.append('severity', filters.severity);
  if (filters.status) queryParams.append('status', filters.status);

  const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  return result.data || [];
};

/**
 * Create a new incident.
 */
export const createIncident = async (formData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Update an incident's status (and optionally severity).
 */
export const updateIncidentStatus = async (id, newStatus) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

/**
 * Soft-delete an incident by ID.
 */
export const deleteIncident = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
