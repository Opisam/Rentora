import client from './client';

export const createLease = (data) =>
  client.post('/leases', data).then((r) => r.data);

export const getMyLeases = () =>
  client.get('/leases/mine').then((r) => r.data);

export const getLandlordLeases = () =>
  client.get('/leases').then((r) => r.data);

export const terminateLease = (id) =>
  client.patch(`/leases/${id}/terminate`).then((r) => r.data);
