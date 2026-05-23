import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import { timeAgo } from '../utils/helpers';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS = {
  task_assigned:     '📋',
  task_flagged:      '🚩',
  status_updated:    '🔄',
  task_submitted:    '📤',
  task_approved:     '✅',
  revision_requested:'✏️',
  extension_approved:'📅',
  extension_rejected:'❌',
  new_comment:       '💬',
  feedback_received: '⭐',
  account_created:   '👋',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const displayed = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-navy-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-brand hover:text-brand-dark font-medium border border-brand/30 px-4 py-2 rounded-xl hover:bg-brand-50 transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-card'
                : 'text-navy-600 hover:bg-surface-2'
            }`}
          >
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} /></div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-navy-500 font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-200/40">
            {displayed.map((notif) => (
              <div
                key={notif._id}
                className={`flex items-start gap-4 px-6 py-4 hover:bg-surface-2 transition-colors cursor-pointer ${!notif.isRead ? 'bg-brand-50/60' : ''}`}
                onClick={() => { if (!notif.isRead) markRead(notif._id); }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                  {NOTIFICATION_ICONS[notif.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.isRead ? 'text-navy' : 'text-navy-700'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                      )}
                      <p className="text-xs text-navy-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-navy-500 mt-0.5">{notif.message}</p>
                  {notif.relatedTask && (
                    <Link
                      to={`/tasks/${notif.relatedTask._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-brand hover:underline mt-1 inline-block font-medium"
                    >
                      View task: {notif.relatedTask.title} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
