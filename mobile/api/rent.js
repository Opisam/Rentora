import client from './client';

export const generateRent = () =>
  client.post('/rent/generate').then((r) => r.data);

export const getMyRentPayments = () =>
  client.get('/rent/mine').then((r) => r.data);

export const getLandlordRentPayments = () =>
  client.get('/rent').then((r) => r.data);

export const markRentPaid = (id) =>
  client.patch(`/rent/${id}/pay`).then((r) => r.data);
