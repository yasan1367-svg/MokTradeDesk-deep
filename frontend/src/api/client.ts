import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// Strategies
// ─────────────────────────────────────────────
export const getStrategies = () => api.get('/api/strategies/');
export const createStrategy = (data: { name: string; description?: string }) =>
  api.post('/api/strategies/', data);
export const createVersion = (strategyId: number, data: { version_name: string; rules_note?: string }) =>
  api.post(`/api/strategies/${strategyId}/versions`, data);

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────
export const analyzeVersion = (versionId: number) =>
  api.post(`/api/analytics/analyze/${versionId}`);
export const getAnalysis = (versionId: number) =>
  api.get(`/api/analytics/${versionId}`);
export const compareVersions = (versionIds: number[]) =>
  api.post('/api/analytics/compare', { version_ids: versionIds });
export const getIntervals = (symbol?: string) =>
  api.get('/api/analytics/intervals/', { params: symbol ? { symbol } : {} });