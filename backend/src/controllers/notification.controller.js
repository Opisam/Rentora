import Notification from '../models/notification.model.js';

export async function getMyNotifications(req, res) {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json(notifications);
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (notification.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await notification.update({ isRead: true });
  res.json(notification);
}