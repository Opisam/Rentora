import { useCallback, useEffect, useState } from 'react';
import { getMyNotifications, markNotificationRead } from '../api/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(() => {
    getMyNotifications().then(res => setNotifications(res.data));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [load]);

  async function handleRead(id) {
    await markNotificationRead(id);
    load();
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="dropdown">
      <button
        className="btn btn-sm position-relative text-white"
        type="button"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
        aria-expanded="false"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <i className="bi bi-bell fs-5" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className="dropdown-menu dropdown-menu-end p-0 shadow"
        style={{ minWidth: '320px', maxWidth: '92vw' }}
      >
        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
          <span className="fw-semibold small">Notifications</span>
          {unreadCount > 0 && <span className="badge bg-primary-subtle text-primary">{unreadCount} new</span>}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state py-4 px-3 mb-0">
            <i className="bi bi-bell-slash" />
            <small>You&apos;re all caught up</small>
          </div>
        ) : (
          <ul className="list-unstyled m-0 overflow-auto" style={{ maxHeight: '340px' }}>
            {notifications.map(n => (
              <li
                key={n.id}
                className={`notif-item px-3 py-2 border-bottom d-flex gap-2 ${n.isRead ? 'opacity-50' : ''}`}
                onClick={() => handleRead(n.id)}
                title={n.isRead ? undefined : 'Click to mark as read'}
              >
                {!n.isRead && (
                  <span className="dot mt-1 flex-shrink-0" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand)' }} />
                )}
                <div className={n.isRead ? 'ms-3' : ''}>
                  <div className="small">{n.message}</div>
                  <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
