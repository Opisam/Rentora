import client from './client';

export const getNotifications = () =>
  client.get('/notifications').then((r) => r.data);

export const markAsRead = (id) =>
  client.patch(`/notifications/${id}/read`).then((r) => r.data);
