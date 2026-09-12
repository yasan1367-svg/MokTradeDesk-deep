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

// ─────────────────────────────────────────────
// Import
// ─────────────────────────────────────────────
export const getAllVersions = () => api.get('/api/strategies/versions/all');

export const importSoft4X = (
  file: File,
  versionId?: number,
  symbol?: string,
  testType?: string,
  propStageId?: number
) => {
  const formData = new FormData();
  formData.append('file', file);
  if (versionId) formData.append('version_id', versionId.toString());
  if (propStageId) formData.append('prop_stage_id', propStageId.toString());
  if (symbol) formData.append('symbol', symbol);
  if (testType) formData.append('test_type', testType);

  return api.post('/api/imports/soft4x', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importMT4 = (
  file: File,
  versionId?: number,
  testType?: string,
  propStageId?: number
) => {
  const formData = new FormData();
  formData.append('file', file);
  if (versionId) formData.append('version_id', versionId.toString());
  if (propStageId) formData.append('prop_stage_id', propStageId.toString());
  if (testType) formData.append('test_type', testType);

  return api.post('/api/imports/mt4', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─────────────────────────────────────────────
// Analytics Detail
// ─────────────────────────────────────────────
export const getVersionTrades = (versionId: number) =>
  api.get(`/api/strategies/versions/${versionId}/trades`);

export const getVersionAnalysis = (versionId: number) =>
  api.get(`/api/analytics/${versionId}`);

// ─────────────────────────────────────────────
// Prop Desk
// ─────────────────────────────────────────────
export const getPropFirms = () => api.get('/api/prop/firms');
export const createPropFirm = (data: { name: string; default_profit_share?: number; website?: string }) =>
  api.post('/api/prop/firms', data);

export const getPropAccounts = () => api.get('/api/prop/accounts');
export const createPropAccount = (data: {
  prop_firm_id: number;
  account_label: string;
  account_number?: string;
  currency?: string;
  initial_balance?: number;
  profit_target?: number;
  max_daily_dd?: number;
  max_total_dd?: number;
  min_trading_days?: number;
}) => api.post('/api/prop/accounts', data);

export const getPropAccountDetail = (accountId: number) =>
  api.get(`/api/prop/accounts/${accountId}`);

export const passStage = (stageId: number, finalBalance?: number) =>
  api.post(`/api/prop/stages/${stageId}/pass`, { final_balance: finalBalance });

export const failStage = (stageId: number, failureReason: string, failureDetails?: string) =>
  api.post(`/api/prop/stages/${stageId}/fail`, {
    failure_reason: failureReason,
    failure_details: failureDetails,
  });

export const withdrawFromStage = (stageId: number, amount: number, note?: string) =>
  api.post(`/api/prop/stages/${stageId}/withdraw`, { amount, note });

export const getStageWithdrawals = (stageId: number) =>
  api.get(`/api/prop/stages/${stageId}/withdrawals`);

export const getStageTrades = (stageId: number) =>
  api.get(`/api/prop/stages/${stageId}/trades`);

export const getAllPropStages = () => api.get('/api/prop/stages/all');

export const checkPassReady = (stageId: number) =>
  api.get(`/api/prop/stages/${stageId}/check-pass`);

export const passStageWithRules = (
  stageId: number,
  finalBalance?: number,
  nextStageRules?: {
    profit_target?: number;
    max_daily_dd?: number;
    max_total_dd?: number;
    min_trading_days?: number;
    initial_balance?: number;
    profit_share_percentage?: number;
  }
) =>
  api.post(`/api/prop/stages/${stageId}/pass`, {
    final_balance: finalBalance,
    next_stage_rules: nextStageRules,
  });

export const updateStageRules = (
  stageId: number,
  data: {
    profit_target?: number;
    max_daily_dd?: number;
    max_total_dd?: number;
    min_trading_days?: number;
    initial_balance?: number;
    profit_share_percentage?: number;
  }
) => api.patch(`/api/prop/stages/${stageId}/rules`, data);

// ─────────────────────────────────────────────
// Strategy Management
// ─────────────────────────────────────────────
export const getStrategyDetail = (strategyId: number) =>
  api.get(`/api/strategies/${strategyId}`);

export const updateStrategy = (strategyId: number, data: { name?: string; description?: string }) =>
  api.patch(`/api/strategies/${strategyId}`, data);

export const deleteStrategy = (strategyId: number) =>
  api.delete(`/api/strategies/${strategyId}`);

export const getStrategyVersions = (strategyId: number) =>
  api.get(`/api/strategies/${strategyId}/versions`);

export const updateVersion = (
  versionId: number,
  data: { version_name?: string; rules_note?: string; status?: string }
) => api.patch(`/api/strategies/versions/${versionId}`, data);

export const deleteVersion = (versionId: number) =>
  api.delete(`/api/strategies/versions/${versionId}`);