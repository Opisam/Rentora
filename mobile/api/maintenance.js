import client from './client';

export const createMaintenanceRequest = (data) =>
  client.post('/maintenance', data).then((r) => r.data);

export const getMyMaintenanceRequests = () =>
  client.get('/maintenance/mine').then((r) => r.data);

export const getLandlordMaintenanceRequests = () =>
  client.get('/maintenance').then((r) => r.data);

export const updateMaintenanceStatus = (id, status) =>
  client.patch(`/maintenance/${id}/status`, { status }).then((r) => r.data);
