import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime, getInitials, generateAvatarColor } from '../utils/helpers';
import { TableSkeleton } from '../components/common/Skeleton';
import { ClipboardIcon } from '../components/common/icons';

const ACTION_LABELS = {
  USER_LOGIN:          { label: 'User Login',          color: 'bg-blue-50 text-blue-600' },
  USER_CREATED:        { label: 'User Created',         color: 'bg-green-50 text-green-600' },
  USER_UPDATED:        { label: 'User Updated',         color: 'bg-yellow-50 text-yellow-600' },
  PASSWORD_CHANGED:    { label: 'Password Changed',     color: 'bg-purple-50 text-purple-600' },
  TASK_CREATED:        { label: 'Task Created',         color: 'bg-green-50 text-green-600' },
  TASK_STATUS_UPDATED: { label: 'Task Status Updated',  color: 'bg-blue-50 text-blue-600' },
  COMMENT_ADDED:       { label: 'Comment Added',        color: 'bg-navy-100 text-navy-600' },
};

const AuditLogsPage = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState('');

  const fetchLogs = async (p = 1, action = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (action) params.append('action', action);
      const res = await api.get(`/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(page, filter); }, [page, filter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Audit Logs</h1>
        <p className="text-navy-500 mt-1">{total} total events recorded</p>
      </div>

      {/* Filter */}
      <div className="mb-5">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-navy-200 bg-surface text-sm outline-none focus:border-brand text-navy-700"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 text-navy-400 flex items-center justify-center mx-auto mb-4 ring-1 ring-navy-200"><ClipboardIcon size={26} /></div>
            <p className="text-navy-500">No audit logs yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-200 bg-surface-2">
                    <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">Action</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3 hidden md:table-cell">Target</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3 hidden lg:table-cell">IP</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-200/40">
                  {logs.map((log) => {
                    const cfg = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-navy-100 text-navy-600' };
                    const color = generateAvatarColor(log.performedBy?.name || '');
                    return (
                      <tr key={log._id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: color }}>
                              {getInitials(log.performedBy?.name || '?')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy">{log.performedBy?.name || 'Unknown'}</p>
                              <p className="text-xs text-navy-400">{log.performedBy?.role?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-xs text-navy-500 font-mono">{log.targetModel}</p>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-xs text-navy-400 font-mono">{log.ipAddress || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-navy-500">{formatDateTime(log.createdAt)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 30 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-navy-200">
                <p className="text-sm text-navy-500">Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, total)} of {total}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 text-sm border border-navy-200 rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    ← Prev
                  </button>
                  <button disabled={page * 30 >= total} onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 text-sm border border-navy-200 rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
