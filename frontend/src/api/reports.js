import api from './axios';

export const getPropertyProfitability = () => api.get('/reports/properties');
export const getPortfolioSummary = () => api.get('/reports/summary');