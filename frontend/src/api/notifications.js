import api from './axios';

export const getMyNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);