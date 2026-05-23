const API_BASE_URL = 'http://localhost:3000/api/settings';

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
 * Get urgent keywords — GET /api/settings/keywords (Admin only)
 */
export const getKeywords = async () => {
  const response = await fetch(`${API_BASE_URL}/keywords`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.keywords; // string[]
};

/**
 * Update urgent keywords — PUT /api/settings/keywords (Admin only)
 */
export const updateKeywords = async (keywords) => {
  const response = await fetch(`${API_BASE_URL}/keywords`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ keywords }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return response.json();
};
