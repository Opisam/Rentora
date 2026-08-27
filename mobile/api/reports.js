import client from './client';

export const getPropertyReports = () =>
  client.get('/reports/properties').then((r) => r.data);

export const getSummary = () =>
  client.get('/reports/summary').then((r) => r.data);
