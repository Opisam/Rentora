import api from './axios';

export const createRequest = (data) => api.post('/maintenance', data);
export const getMyRequests = () => api.get('/maintenance/mine');
export const getRequestsForLandlord = () => api.get('/maintenance');
export const updateRequestStatus = (id, status) => api.patch(`/maintenance/${id}/status`, { status });