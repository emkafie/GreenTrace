const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api/settings';

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
 * Get all severity keywords — GET /api/settings/keywords (Admin only)
 * Returns: { critical: string[], high: string[], medium: string[] }
 */
export const getKeywords = async () => {
  const response = await fetch(`${API_BASE_URL}/keywords`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return response.json(); // { critical, high, medium }
};

/**
 * Update all severity keywords — PUT /api/settings/keywords (Admin only)
 * @param {{ critical: string[], high: string[], medium: string[] }} keywordGroups
 */
export const updateKeywords = async (keywordGroups) => {
  const response = await fetch(`${API_BASE_URL}/keywords`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(keywordGroups),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return response.json();
};
