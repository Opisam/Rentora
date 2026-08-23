import Notification from '../models/notification.model.js';

export async function notify(userId, message) {
  return Notification.create({ userId, message });
}