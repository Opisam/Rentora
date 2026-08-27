import client from './client';

export const getProperties = () =>
  client.get('/properties').then((r) => r.data);

export const getProperty = (id) =>
  client.get(`/properties/${id}`).then((r) => r.data);

export const createProperty = (data) =>
  client.post('/properties', data).then((r) => r.data);

export const updateProperty = (id, data) =>
  client.put(`/properties/${id}`, data).then((r) => r.data);

export const deleteProperty = (id) =>
  client.delete(`/properties/${id}`).then((r) => r.data);

export const getVacantUnits = () =>
  client.get('/properties/units/vacant').then((r) => r.data);

export const createUnit = (propertyId, data) =>
  client.post(`/properties/${propertyId}/units`, data).then((r) => r.data);

export const updateUnit = (id, data) =>
  client.put(`/properties/units/${id}`, data).then((r) => r.data);

export const deleteUnit = (id) =>
  client.delete(`/properties/units/${id}`).then((r) => r.data);
