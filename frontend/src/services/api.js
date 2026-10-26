const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Storage Helpers
 */
export const getToken = () => localStorage.getItem('smart_parking_token');
export const setToken = (token) => localStorage.setItem('smart_parking_token', token);
export const removeToken = () => localStorage.removeItem('smart_parking_token');

export const getUser = () => {
  const userStr = localStorage.getItem('smart_parking_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
export const setUser = (user) => localStorage.setItem('smart_parking_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('smart_parking_user');

/**
 * Common fetch wrapper with automatic JWT headers
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed. Please check server connection.');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      const helpfulMsg = `Cannot connect to API server at ${API_BASE_URL}. Please ensure the backend is started with "npm run backend".`;
      console.warn(`[API Connection Error: ${endpoint}]`, helpfulMsg);
      throw new Error(helpfulMsg);
    }
    console.warn(`[API Error: ${endpoint}]`, error.message);
    throw error;
  }
}

/**
 * Auth API
 */
export const authAPI = {
  login: async (credentials) => {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return await request('/auth/me');
  },

  updateProfile: async (profileData) => {
    return await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

/**
 * Parking Slots API
 */
export const slotAPI = {
  getAllSlots: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.floor && params.floor !== 'All') searchParams.append('floor', params.floor);
    if (params.vehicleType && params.vehicleType !== 'All') searchParams.append('vehicleType', params.vehicleType);
    if (params.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params.startTime) searchParams.append('startTime', params.startTime);
    if (params.endTime) searchParams.append('endTime', params.endTime);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/slots${query}`);
  },

  getSlotById: async (id) => {
    return await request(`/slots/${id}`);
  },

  createSlot: async (slotData) => {
    return await request('/slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  },

  updateSlot: async (id, slotData) => {
    return await request(`/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(slotData),
    });
  },

  deleteSlot: async (id) => {
    return await request(`/slots/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Bookings API
 */
export const bookingAPI = {
  checkAvailability: async (slotId, startTime, endTime) => {
    const searchParams = new URLSearchParams({
      slotId,
      startTime,
      endTime,
    });
    return await request(`/bookings/check-availability?${searchParams.toString()}`);
  },

  createBooking: async (bookingData) => {
    return await request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  getMyBookings: async () => {
    return await request('/bookings/my-bookings');
  },

  getAllBookings: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.date) searchParams.append('date', params.date);
    if (params.slotNumber) searchParams.append('slotNumber', params.slotNumber);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/bookings${query}`);
  },

  getBookingById: async (id) => {
    return await request(`/bookings/${id}`);
  },

  cancelBooking: async (id) => {
    return await request(`/bookings/${id}/cancel`, {
      method: 'PUT',
    });
  },

  updateBookingStatus: async (id, status) => {
    return await request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getAdminStats: async () => {
    return await request('/bookings/admin/stats');
  },
};
