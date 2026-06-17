const currentUser = () => JSON.parse(localStorage.getItem('user') || 'null');

const response = (data) => Promise.resolve({ data });

const emptyReport = {
    sales: {
        summary: { totalSales: 0, totalRevenue: 0, totalProfit: 0, averageOrderValue: 0 },
        paymentMethods: [],
        bestSellers: []
    },
    inventory: {
        summary: { totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
        products: []
    },
    profit: {
        summary: { totalRevenue: 0, totalCost: 0, netProfit: 0, margin: 0 },
        byCategory: [],
        mostProfitable: []
    }
};

const routeData = (url) => {
    if (url === '/dashboard/summary') {
        return {
            revenue: 0,
            salesCount: 0,
            totalProducts: 0,
            lowStockProducts: [],
            recentSales: [],
            unpaidCount: 0,
            totalDue: 0
        };
    }

    if (url === '/dashboard/analytics') {
        return {
            metrics: { totalSales: 0, totalRevenue: 0, avgOrderValue: 0 },
            salesTrend: [],
            topProducts: []
        };
    }

    if (url === '/reports/sales') return emptyReport.sales;
    if (url === '/reports/inventory') return emptyReport.inventory;
    if (url === '/reports/profit') return emptyReport.profit;
    if (url === '/settings') return currentUser() || {};
    if (url === '/notifications/unread-count') return { count: 0 };
    if (url === '/products/low-stock') return [];
    if (url === '/products/data/export') return [];

    if (
        url === '/products' ||
        url === '/categories' ||
        url === '/sales' ||
        url === '/customers' ||
        url === '/suppliers' ||
        url === '/expenses' ||
        url === '/returns' ||
        url === '/notifications'
    ) {
        return [];
    }

    if (url === '/expenses/summary') {
        return { total: 0, count: 0, byCategory: [] };
    }

    if (url.includes('/history') || url.includes('/purchases')) return [];

    return null;
};

const api = {
    get: async (url) => response(routeData(url)),
    post: async (url, data = {}) => {
        if (url === '/auth/login' || url === '/auth/set-password') {
            const user = { id: 1, username: data.username || 'demo', ...currentUser() };
            return response({ token: 'local-frontend-token', user });
        }

        if (url === '/auth/check-username') {
            return response({ exists: true, passwordSet: true });
        }

        if (url === '/sales') {
            return response({
                id: Date.now(),
                receiptNumber: `LOCAL-${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...data
            });
        }

        return response({ id: Date.now(), ...data });
    },
    put: async (_url, data = {}) => response(data),
    patch: async (_url, data = {}) => response(data),
    delete: async () => response({ success: true })
};

export const authService = {
    login: async (username, password) => (await api.post('/auth/login', { username, password })).data,
    checkUsername: async (username) => (await api.post('/auth/check-username', { username })).data,
    setPassword: async (username, password) => (await api.post('/auth/set-password', { username, password })).data,
};

export const productService = {
    getAll: async (params) => (await api.get('/products', { params })).data,
    getById: async (id) => (await api.get(`/products/${id}`)).data,
    create: async (data) => (await api.post('/products', data)).data,
    update: async (id, data) => (await api.put(`/products/${id}`, data)).data,
    delete: async (id) => (await api.delete(`/products/${id}`)).data,
    getLowStock: async () => (await api.get('/products/low-stock')).data
};

export const categoryService = {
    getAll: async () => (await api.get('/categories')).data,
    getById: async (id) => (await api.get(`/categories/${id}`)).data,
    create: async (data) => (await api.post('/categories', data)).data,
    update: async (id, data) => (await api.put(`/categories/${id}`, data)).data,
    delete: async (id) => (await api.delete(`/categories/${id}`)).data,
};

export const salesService = {
    getAll: async (params) => (await api.get('/sales', { params })).data,
    getById: async (id) => (await api.get(`/sales/${id}`)).data,
    create: async (data) => (await api.post('/sales', data)).data,
    getStats: async () => ({ totalSales: 0, totalRevenue: 0 }),
    delete: async (id) => (await api.delete(`/sales/${id}`)).data
};

export const reportService = {
    getSales: async (params) => (await api.get('/reports/sales', { params })).data,
    getInventory: async (params) => (await api.get('/reports/inventory', { params })).data,
    getProfit: async (params) => (await api.get('/reports/profit', { params })).data
};

export const settingsService = {
    getSettings: async () => (await api.get('/settings')).data,
    updateStore: async (data) => {
        const user = currentUser() || {};
        localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
        return data;
    },
    changePassword: async () => ({ success: true })
};

export const dashboardService = {
    getSummary: async (params) => (await api.get('/dashboard/summary', { params })).data,
    getAnalytics: async (params) => (await api.get('/dashboard/analytics', { params })).data,
    getRevenue: async () => ({ revenue: 0 }),
    getProfit: async () => ({ profit: 0 }),
    getSalesTrend: async () => [],
    getCategoryStats: async () => []
};

export const customerService = {
    getAll: async (params) => (await api.get('/customers', { params })).data,
    getById: async (id) => (await api.get(`/customers/${id}`)).data,
    create: async (data) => (await api.post('/customers', data)).data,
    update: async (id, data) => (await api.put(`/customers/${id}`, data)).data,
    delete: async (id) => (await api.delete(`/customers/${id}`)).data,
    getPurchases: async (id) => (await api.get(`/customers/${id}/purchases`)).data
};

export const supplierService = {
    getAll: async (params) => (await api.get('/suppliers', { params })).data,
    getById: async (id) => (await api.get(`/suppliers/${id}`)).data,
    create: async (data) => (await api.post('/suppliers', data)).data,
    update: async (id, data) => (await api.put(`/suppliers/${id}`, data)).data,
    delete: async (id) => (await api.delete(`/suppliers/${id}`)).data
};

export default api;
