import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StatCard from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { formatDate, timeAgo } from '../utils/helpers';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-navy-500 mt-1">System-wide overview — you can see everything</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/managers"
            className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all">
            👔 View Managers
          </Link>
          <Link to="/admin/employees"
            className="px-4 py-2.5 bg-surface border border-navy-200 text-navy-700 text-sm font-semibold rounded-xl hover:bg-surface-2 transition-all">
            👤 View Employees
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? [1,2,3,4].map(i => <CardSkeleton key={i} />) : (<>
          <StatCard label="Total Managers"  value={stats?.totalManagers}  icon="👔" colorClass="text-blue-700"   bgClass="bg-blue-50" />
          <StatCard label="Total Employees" value={stats?.totalEmployees} icon="👤" colorClass="text-green-700"  bgClass="bg-green-50" />
          <StatCard label="Total Tasks"     value={stats?.totalTasks}     icon="📋" colorClass="text-purple-700" bgClass="bg-purple-50" />
          <StatCard label="Completion Rate" value={stats?.completionRate != null ? `${stats.completionRate}%` : '—'} icon="📈" colorClass="text-emerald-700" bgClass="bg-emerald-50" />
        </>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [1,2,3,4].map(i => <CardSkeleton key={i} />) : (<>
          <StatCard label="In Progress"   value={stats?.inProgressTasks}   icon="⚡" colorClass="text-blue-600"  bgClass="bg-blue-50" />
          <StatCard label="Completed"     value={stats?.completedTasks}    icon="✅" colorClass="text-green-600" bgClass="bg-green-50" />
          <StatCard label="Under Review"  value={stats?.underReviewTasks}  icon="🔍" colorClass="text-amber-600" bgClass="bg-amber-50" />
          <StatCard label="Overdue"       value={stats?.overdueTasks}      icon="🚨" colorClass="text-red-600"   bgClass="bg-red-50" />
        </>)}
      </div>

      {/* Task Status Visual Bar */}
      {!loading && stats?.totalTasks > 0 && (
        <div className="bg-surface rounded-2xl border border-navy-200 shadow-card p-6 mb-6">
          <h2 className="text-base font-semibold text-navy mb-4">System Task Distribution</h2>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-3">
            {[
              { count: stats.completedTasks,   color: 'bg-green-400',  label: 'Completed' },
              { count: stats.inProgressTasks,  color: 'bg-blue-400',   label: 'In Progress' },
              { count: stats.underReviewTasks, color: 'bg-amber-400',  label: 'Under Review' },
              { count: stats.overdueTasks,     color: 'bg-red-400',    label: 'Overdue' },
              { count: stats.notStartedTasks,  color: 'bg-navy-200',   label: 'Not Started' },
            ].map(({ count, color, label }) => {
              const pct = Math.round((count / stats.totalTasks) * 100);
              return pct > 0 ? (
                <div key={label} title={`${label}: ${count} (${pct}%)`}
                  className={`${color} transition-all`} style={{ width: `${pct}%` }} />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-navy-500">
            {[
              { label: 'Completed',    count: stats.completedTasks,   dot: 'bg-green-400' },
              { label: 'In Progress',  count: stats.inProgressTasks,  dot: 'bg-blue-400' },
              { label: 'Under Review', count: stats.underReviewTasks, dot: 'bg-amber-400' },
              { label: 'Overdue',      count: stats.overdueTasks,     dot: 'bg-red-400' },
              { label: 'Not Started',  count: stats.notStartedTasks,  dot: 'bg-navy-300' },
            ].map(({ label, count, dot }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {label}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-surface rounded-2xl border border-navy-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-navy">Recent Task Activity</h2>
          <Link to="/admin/employees" className="text-sm text-brand hover:text-brand-dark font-medium">
            View all employees →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-navy-100 rounded-xl animate-pulse" />
          ))}</div>
        ) : !data?.recentTasks?.length ? (
          <div className="text-center py-10">
            <p className="text-navy-400 text-sm">No tasks in the system yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentTasks.map((task) => (
              <div key={task._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{task.title}</p>
                  <p className="text-xs text-navy-400">
                    {task.assignedTo?.name} ← {task.assignedBy?.name} · {timeAgo(task.updatedAt)}
                  </p>
                </div>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                <p className={`text-xs hidden sm:block ${task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-navy-400'}`}>
                  Due {formatDate(task.deadline)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
