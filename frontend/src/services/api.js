import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const adminService = {
    login: async (email, password) => api.post(('/auth/loginAdmin'), {email, password}),
    getAll: async () => api.get(('/users')),
    create: async (data) => api.post(('/users'), data),
    updateUser: async (id, isActive) => api.patch((`/users/${id}/status`), {isActive}),
    delete: async (id) => api.delete(`/users/${id}`),
}

export const authService = {
    // TODO: Connect this to POST /auth/login on the backend.
    login: async (username, password) => api.post('/auth/login', { username, password }),

    // TODO: Add this endpoint to the backend or remove this function if it is not needed.
    checkUsername: async (username) => api.post('/auth/check-username', { username }),

    // TODO: Add this endpoint to the backend or remove this function if it is not needed.
    setPassword: async (username, password) => api.post('/auth/set-password', { username, password }),
};

export const productService = {
    // TODO: Connect these product methods to real backend product endpoints.
    getAll: async (params) => api.get('/products', { params }),
    getById: async (id) => api.get(`/products/${id}`),
    create: async (data) => api.post('/products', data),
    update: async (id, data) => api.put(`/products/${id}`, data),
    delete: async (id) => api.delete(`/products/${id}`),
    getLowStock: async () => api.get('/products/low-stock'),
};

export const categoryService = {
    // TODO: Connect these category methods to real backend category endpoints.
    getAll: async () => api.get('/categories'),
    getById: async (id) => api.get(`/categories/${id}`),
    create: async (data) => api.post('/categories', data),
    update: async (id, data) => api.put(`/categories/${id}`, data),
    delete: async (id) => api.delete(`/categories/${id}`),
};

export const salesService = {
    // TODO: Connect these sales methods to real backend sales endpoints.
    getAll: async (params) => api.get('/sales', { params }),
    getById: async (id) => api.get(`/sales/${id}`),
    create: async (data) => api.post('/sales', data),
    getStats: async () => api.get('/sales/stats'),
    delete: async (id) => api.delete(`/sales/${id}`),
};

export const reportService = {
    // TODO: Connect these report methods to real backend report endpoints.
    getSales: async (params) => api.get('/reports/sales', { params }),
    getInventory: async (params) => api.get('/reports/inventory', { params }),
    getProfit: async (params) => api.get('/reports/profit', { params }),
};

export const settingsService = {
    // TODO: Connect these settings methods to real backend settings endpoints.
    getSettings: async () => api.get('/settings'),
    updateStore: async (data) => api.put('/settings/store', data),
    changePassword: async (data) => api.patch('/settings/password', data),
};

export const dashboardService = {
    // TODO: Connect these dashboard methods to real backend dashboard endpoints.
    getSummary: async (params) => api.get('/dashboard/summary', { params }),
    getAnalytics: async (params) => api.get('/dashboard/analytics', { params }),
    getRevenue: async () => api.get('/dashboard/revenue'),
    getProfit: async () => api.get('/dashboard/profit'),
    getSalesTrend: async () => api.get('/dashboard/sales-trend'),
    getCategoryStats: async () => api.get('/dashboard/category-stats'),
};

export const customerService = {
    // TODO: Connect these customer methods to real backend customer endpoints.
    getAll: async (params) => api.get('/customers', { params }),
    getById: async (id) => api.get(`/customers/${id}`),
    create: async (data) => api.post('/customers', data),
    update: async (id, data) => api.put(`/customers/${id}`, data),
    delete: async (id) => api.delete(`/customers/${id}`),
    getPurchases: async (id) => api.get(`/customers/${id}/purchases`),
};

export const supplierService = {
    // TODO: Connect these supplier methods to real backend supplier endpoints.
    getAll: async (params) => api.get('/suppliers', { params }),
    getById: async (id) => api.get(`/suppliers/${id}`),
    create: async (data) => api.post('/suppliers', data),
    update: async (id, data) => api.put(`/suppliers/${id}`, data),
    delete: async (id) => api.delete(`/suppliers/${id}`),
};

export default api;
