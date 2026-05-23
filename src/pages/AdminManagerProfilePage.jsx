import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, generateAvatarColor, formatDate, timeAgo } from '../utils/helpers';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';

const AdminManagerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('tasks');

  useEffect(() => {
    api.get(`/admin/managers/${id}/profile`)
      .then(r => setData(r.data))
      .catch(() => { toast.error('Manager not found'); navigate('/admin/managers'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="animate-pulse max-w-4xl space-y-4">
      <div className="h-32 bg-navy-200 rounded-2xl" />
      <div className="h-64 bg-navy-200 rounded-2xl" />
    </div>
  );

  if (!data) return null;
  const { manager, employees = [], taskStats: rawTaskStats, stats, recentTasks = [] } = data;
  const taskStats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    underReviewTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    ...(rawTaskStats || stats || {}),
  };
  const color = generateAvatarColor(manager.name);

  return (
    <div className="animate-fade-in max-w-4xl">
      <button onClick={() => navigate('/admin/managers')}
        className="text-sm text-navy-400 hover:text-navy mb-5 flex items-center gap-1">
        ← Back to managers
      </button>

      {/* Profile header */}
      <div className="bg-surface rounded-2xl border border-navy-200 shadow-card p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: color }}>
            {getInitials(manager.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-navy">{manager.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${manager.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {manager.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs bg-brand-50 text-brand px-2.5 py-1 rounded-full font-medium">Manager</span>
            </div>
            <p className="text-navy-500 text-sm">{manager.email}</p>
            {manager.department && <p className="text-navy-400 text-xs mt-1">Department: {manager.department}</p>}
            <p className="text-navy-400 text-xs mt-1">
              Joined {formatDate(manager.createdAt)}
              {manager.lastLogin && ` · Last active ${timeAgo(manager.lastLogin)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total',       value: taskStats.totalTasks,          color: 'text-navy-700',    bg: 'bg-surface-2' },
          { label: 'Completed',   value: taskStats.completedTasks,      color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'In Progress', value: taskStats.inProgressTasks,     color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'In Review',   value: taskStats.underReviewTasks,    color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Overdue',     value: taskStats.overdueTasks,        color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'Done Rate',   value: `${taskStats.completionRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color: c, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 text-center border border-white`}>
            <p className={`text-xl font-bold ${c}`}>{value}</p>
            <p className="text-xs text-navy-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'tasks', label: `Recent Tasks (${recentTasks.length})` },
          { key: 'team',  label: `Team Members (${employees.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-primary text-white shadow-card' : 'text-navy-600 hover:bg-surface-2'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {tab === 'tasks' && (
        <div className="bg-surface rounded-2xl border border-navy-200 shadow-card overflow-hidden">
          {recentTasks.length === 0 ? (
            <div className="text-center py-12"><p className="text-navy-400 text-sm">No tasks assigned yet</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-200 bg-surface-2">
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Task</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden sm:table-cell">Assigned To</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden md:table-cell">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-200/40">
                {recentTasks.map(task => (
                  <tr key={task._id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-navy truncate max-w-xs">{task.title}</p>
                      <p className="text-xs text-navy-400">{timeAgo(task.updatedAt)}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <p className="text-sm text-navy-600">{task.assignedTo?.name}</p>
                    </td>
                    <td className="px-5 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className={`text-sm ${task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-navy-500'}`}>
                        {formatDate(task.deadline)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Team list */}
      {tab === 'team' && (
        <div className="bg-surface rounded-2xl border border-navy-200 shadow-card overflow-hidden">
          {employees.length === 0 ? (
            <div className="text-center py-12"><p className="text-navy-400 text-sm">No employees in this team yet</p></div>
          ) : (
            <div className="divide-y divide-navy-200/40">
              {employees.map(emp => {
                const ec = generateAvatarColor(emp.name);
                return (
                  <div key={emp._id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: ec }}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy">{emp.name}</p>
                      <p className="text-xs text-navy-400">{emp.email}</p>
                    </div>
                    {emp.department && (
                      <span className="text-xs bg-navy-100 text-navy-600 px-2.5 py-1 rounded-full hidden sm:inline">
                        {emp.department}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${emp.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => navigate(`/admin/employees/${emp._id}`)}
                      className="text-xs text-brand border border-brand/30 hover:bg-brand-50 px-3 py-1.5 rounded-lg font-medium transition-all">
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManagerProfilePage;
