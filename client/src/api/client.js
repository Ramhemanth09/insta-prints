import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Admin JWT Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('insta_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && localStorage.getItem('insta_admin_token')) {
      // If admin token expired, clear and trigger event
      localStorage.removeItem('insta_admin_token');
      localStorage.removeItem('insta_admin_email');
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // USER PORTAL
  submitRequest: async (formData) => {
    const res = await api.post('/requests/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  trackRequest: async (requestId, mobileNumber) => {
    const res = await api.post('/requests/track', { requestId, mobileNumber });
    return res.data;
  },

  acceptQuotation: async (requestId, mobileNumber) => {
    const res = await api.post('/requests/accept-quotation', { requestId, mobileNumber });
    return res.data;
  },

  submitPaymentRef: async (data) => {
    const res = await api.post('/payments/submit-ref', data);
    return res.data;
  },

  // CHAT
  getMessages: async (requestId, mobileNumber) => {
    const params = mobileNumber ? { mobileNumber } : {};
    const res = await api.get(`/chat/${requestId}`, { params });
    return res.data;
  },

  sendMessage: async (requestId, payload) => {
    const res = await api.post(`/chat/${requestId}/send`, payload);
    return res.data;
  },

  // FILES
  uploadFiles: async (formData) => {
    const res = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getSecureFileUrl: (fileId, requestId, mobileNumber) => {
    const token = localStorage.getItem('insta_admin_token');
    let url = `${API_BASE_URL}/files/secure/${fileId}?`;
    if (token) {
      url += `adminToken=${encodeURIComponent(token)}`;
    } else if (requestId && mobileNumber) {
      url += `requestId=${encodeURIComponent(requestId)}&mobileNumber=${encodeURIComponent(mobileNumber)}`;
    }
    return url;
  },

  // ADMIN PORTAL
  adminLogin: async (email, password) => {
    const res = await api.post('/admin/login', { email, password });
    return res.data;
  },

  getAdminProfile: async () => {
    const res = await api.get('/admin/profile');
    return res.data;
  },

  getSecurityLogs: async () => {
    const res = await api.get('/admin/security-logs');
    return res.data;
  },

  getDashboardMetrics: async () => {
    const res = await api.get('/requests/admin/metrics');
    return res.data;
  },

  getAllRequests: async (filters = {}) => {
    const res = await api.get('/requests/admin/all', { params: filters });
    return res.data;
  },

  getRequestDetails: async (requestId) => {
    const res = await api.get(`/requests/admin/detail/${requestId}`);
    return res.data;
  },

  updateRequestStatus: async (requestId, status, note) => {
    const res = await api.put(`/requests/admin/status/${requestId}`, { status, note });
    return res.data;
  },

  setQuotation: async (requestId, data) => {
    const res = await api.post(`/requests/admin/quotation/${requestId}`, data);
    return res.data;
  },

  recordPayment: async (data) => {
    const res = await api.post('/payments/record', data);
    return res.data;
  }
};

export default api;
