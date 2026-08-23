import api from './axios';

export const createExpense = (propertyId, data) => api.post(`/expenses/${propertyId}`, data);
export const getExpensesForProperty = (propertyId) => api.get(`/expenses/${propertyId}`);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);