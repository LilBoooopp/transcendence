// AI example

// frontend/src/services/api.ts

// 1. Define your backend base URL. (Adjust this if your backend runs on a different port)
const BASE_URL = 'http://localhost:3000';

// 2. Helper function to get the token from wherever you store it after login (e.g., localStorage)
const getAuthToken = () => {
  return localStorage.getItem('token'); 
};

// 3. Centralized fetch wrapper that automatically adds the Authorization header
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // If we get a 401 Unauthorized, we might want to log the user out
    if (response.status === 401) {
      console.error("Unauthorized! Token might be expired.");
      // localStorage.removeItem('token');
      // window.location.href = '/login'; 
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// 4. Export the actual API calls your components will use
export const api = {
  // USER ENDPOINTS
  getUserProfile: (username: string) => 
    fetchWithAuth(`/users/profile/${username}`), // Adjust endpoint to match your backend controller

  // STATS ENDPOINTS
  getUserStats: (username: string) => 
    fetchWithAuth(`/users/stats/${username}`),

  // GAME HISTORY ENDPOINTS
  getGameHistory: (username: string) => 
    fetchWithAuth(`/games/history/${username}`),
};