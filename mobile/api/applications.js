import client from './client';

export const applyToUnit = (unitId, message) =>
  client.post(`/applications/units/${unitId}/apply`, { message }).then((r) => r.data);

export const getMyApplications = () =>
  client.get('/applications/mine').then((r) => r.data);

export const getLandlordApplications = () =>
  client.get('/applications').then((r) => r.data);

export const updateApplicationStatus = (id, status) =>
  client.patch(`/applications/${id}/status`, { status }).then((r) => r.data);
