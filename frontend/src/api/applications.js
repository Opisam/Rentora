import api from './axios';

export const applyToUnit = (unitId, message) => api.post(`/applications/units/${unitId}/apply`, { message });
export const getMyApplications = () => api.get('/applications/mine');
export const getApplicationsForLandlord = () => api.get('/applications');
export const updateApplicationStatus = (id, status) => api.patch(`/applications/${id}/status`, { status });
