import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  socialLogin: (data) => api.post('/auth/social-login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`)
};

// Accounts API
export const accountsAPI = {
  getAccounts: () => api.get('/accounts'),
  getAccount: (id) => api.get(`/accounts/${id}`),
  createAccount: (accountData) => api.post('/accounts', accountData),
  updateAccount: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  syncAccount: (id) => api.post(`/accounts/${id}/sync`)
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  getCategories: () => api.get('/transactions/categories'),
  importTransactions: (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return api.post('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Budgets API
export const budgetsAPI = {
  getBudgets: () => api.get('/budgets'),
  getBudget: (id) => api.get(`/budgets/${id}`),
  createBudget: (budgetData) => api.post('/budgets', budgetData),
  updateBudget: (id, budgetData) => api.put(`/budgets/${id}`, budgetData),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
  resetBudget: (id) => api.post(`/budgets/${id}/reset`)
};

// Goals API
export const goalsAPI = {
  getGoals: (filters) => api.get('/goals', { params: filters }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.put(`/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  contributeToGoal: (id, contributionData) => api.post(`/goals/${id}/contribute`, contributionData),
  getGoalHistory: (id) => api.get(`/goals/${id}/history`)
};

// Reports API
export const reportsAPI = {
  getReports: (filters) => api.get('/reports', { params: filters }),
  getReport: (id) => api.get(`/reports/${id}`),
  createReport: (reportData) => api.post('/reports', reportData),
  updateReport: (id, reportData) => api.put(`/reports/${id}`, reportData),
  deleteReport: (id) => api.delete(`/reports/${id}`),
  generateIncomeExpenseReport: (params) => api.get('/reports/income-expense', { params }),
  generateNetWorthReport: (params) => api.get('/reports/net-worth', { params }),
  generateCategorySpendingReport: (params) => api.get('/reports/category-spending', { params }),
  generateFinancialHealthReport: () => api.get('/reports/financial-health'),
  exportReport: (id, format) => api.get(`/reports/${id}/export`, { 
    params: { format },
    responseType: 'blob'
  })
};

// TrueLayer API
export const trueLayerAPI = {
  getAuthUrl: () => api.get('/truelayer/auth-url'),
  exchangeToken: (code) => api.post('/truelayer/exchange-token', { code }),
  getConnections: () => api.get('/truelayer/connections'),
  deleteConnection: (id) => api.delete(`/truelayer/connections/${id}`),
  syncConnection: (id) => api.post(`/truelayer/connections/${id}/sync`)
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

export default api;
