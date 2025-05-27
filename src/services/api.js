import axios from 'axios';
import { createQueryString, getCachedData, setCachedData, handleApiError } from '@/utils/dashboardUtils';

const API_BASE_URL = 'https://solasolution.ecomtask.de';

// Axios-Instanz mit Standardkonfiguration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request-Interceptor für Token-Handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response-Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token ist abgelaufen oder ungültig
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Analytics API-Endpunkte
export const analyticsApi = {
  // Dashboard-Übersicht
  getDashboardOverview: async (params) => {
    const cacheKey = `dashboard_overview_${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const queryString = createQueryString(params);
      const response = await api.get(`/analytics_overview?${queryString}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // E-Mail-Analyse
  getEmailAnalytics: async (params) => {
    const cacheKey = `email_analytics_${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const queryString = createQueryString(params);
      const response = await api.get(`/analytics_email?${queryString}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Aufgaben-Analyse
  getTaskAnalytics: async (params) => {
    const cacheKey = `task_analytics_${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const queryString = createQueryString(params);
      const response = await api.get(`/analytics_tasks?${queryString}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Performance-Metriken
  getPerformanceMetrics: async (params) => {
    const cacheKey = `performance_metrics_${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const queryString = createQueryString(params);
      const response = await api.get(`/analytics_performance?${queryString}`);
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Unternehmensverwaltung API-Endpunkte
export const companyApi = {
  getCompanies: async () => {
    try {
      const response = await api.get('/companies');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getCompanyDetails: async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Benutzerverwaltung API-Endpunkte
export const userApi = {
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateUserSettings: async (settings) => {
    try {
      const response = await api.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Export der API-Instanz für direkte Verwendung
export default api; 