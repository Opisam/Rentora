import api from './axios';

export const createLease = (data) => api.post('/leases', data);
export const getMyLeases = () => api.get('/leases/mine');
export const getLeasesForLandlord = () => api.get('/leases');
export const terminateLease = (id) => api.patch(`/leases/${id}/terminate`);