import axios from 'axios';

// ============================================================
// Axios Instance Configuration
// ============================================================
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================
// Token Storage Helpers
// ============================================================
export const tokenStorage = {
  get: () => localStorage.getItem('token'),
  set: (token) => localStorage.setItem('token', token),
  remove: () => localStorage.removeItem('token'),
};

// ============================================================
// Request Interceptor
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Response Interceptor
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.remove();
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Error Message Helper
// ============================================================
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors?.length) return error.response.data.errors[0];
  if (error.message === 'Network Error') return 'Network error. Please check your connection.';
  if (error.code === 'ECONNABORTED') return 'Request timeout. Please try again.';
  return error.message || 'Something went wrong. Please try again.';
};

// ============================================================
// API Endpoint Helpers
// ============================================================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getInvoices: (id) => api.get(`/clients/${id}/invoices`),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getLowStock: (threshold) => api.get('/products/low-stock', { params: { threshold } }),
};

export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  issue: (id) => api.post(`/invoices/${id}/issue`),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
};

export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getGSTR1: (params) => api.get('/reports/gstr1', { params }),
  getGSTR3B: (params) => api.get('/reports/gstr3b', { params }),
  getSalesSummary: (params) => api.get('/reports/sales-summary', { params }),
  getTaxLiability: (params) => api.get('/reports/tax-liability', { params }),
  getClientWiseSales: (params) => api.get('/reports/client-wise', { params }),
};

export const healthCheck = () => api.get('/health');

export default api;