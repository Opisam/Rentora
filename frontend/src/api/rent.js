import api from './axios';

export const triggerRentGeneration = () => api.post('/rent/generate');
export const getMyRentHistory = () => api.get('/rent/mine');
export const getRentForLandlord = () => api.get('/rent');
export const markRentPaid = (id) => api.patch(`/rent/${id}/pay`);