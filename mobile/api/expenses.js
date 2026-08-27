import client from './client';

export const addExpense = (propertyId, data) =>
  client.post(`/expenses/${propertyId}`, data).then((r) => r.data);

export const getExpenses = (propertyId) =>
  client.get(`/expenses/${propertyId}`).then((r) => r.data);

export const deleteExpense = (id) =>
  client.delete(`/expenses/${id}`).then((r) => r.data);
