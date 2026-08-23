import api from './axios';

export const getMyProperties = () => api.get('/properties');
export const createProperty = (data) => api.post('/properties', data);
export const updateProperty = (id, data) => api.put(`/properties/${id}`, data);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);
export const createUnit = (propertyId, data) => api.post(`/properties/${propertyId}/units`, data);
export const getVacantUnits = () => api.get('/properties/units/vacant');