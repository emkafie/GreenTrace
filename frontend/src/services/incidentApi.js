const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api/incidents';

/**
 * Helper to get auth headers from localStorage.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

/**
 * Handle 401 responses — auto logout.
 */
const handleUnauthorized = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }
};

/**
 * Fetch all incidents with optional severity/status filters.
 * includeDeleted: boolean — admin-only, include soft-deleted records.
 */
export const fetchIncidents = async (filters = {}, includeDeleted = false, page = 1, limit = 10, search = '') => {
  const queryParams = new URLSearchParams();
  if (filters.severity) queryParams.append('severity', filters.severity);
  if (filters.status) queryParams.append('status', filters.status);
  if (includeDeleted) queryParams.append('include_deleted', 'true');
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  if (search && search.trim()) queryParams.append('search', search.trim());

  const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
    headers: getAuthHeaders(),
  });

  handleUnauthorized(response);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  return {
    data: result.data || [],
    pagination: result.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
  };
};

/**
 * Create a new incident.
 */
export const createIncident = async (formData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(formData),
  });

  handleUnauthorized(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });

  handleUnauthorized(response);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

/**
 * Soft-delete an incident by ID.
 */
export const deleteIncident = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  handleUnauthorized(response);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
