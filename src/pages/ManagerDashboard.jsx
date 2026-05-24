import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StatCard from '../components/common/StatCard';
import { ClipboardIcon, CheckCircleIcon, ClockIcon, AlertIcon, UsersIcon, SearchIcon } from '../components/common/icons';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { formatDate, getInitials, generateAvatarColor } from '../utils/helpers';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/tasks?limit=6'),
        ]);
        setStats(statsRes.data.stats);
        setRecentTasks(tasksRes.data.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-navy-500 mt-1">Here's what's happening with your team</p>
        </div>
        <Link
          to="/tasks/create"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-card hover:shadow-card-md"
        >
          <span className="text-lg leading-none">+</span> Assign Task
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Tasks"     value={stats?.totalTasks}     icon={<ClipboardIcon />}   colorClass="text-navy-700"   bgClass="bg-navy-100" />
            <StatCard label="Completed"       value={stats?.completedTasks} icon={<CheckCircleIcon />} colorClass="text-green-600"  bgClass="bg-green-50" />
            <StatCard label="Pending"         value={stats?.pendingTasks}   icon={<ClockIcon />}       colorClass="text-blue-600"   bgClass="bg-blue-50" />
            <StatCard label="Overdue"         value={stats?.overdueTasks}   icon={<AlertIcon />}       colorClass="text-red-600"    bgClass="bg-red-50" />
          </>
        )}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Team Members"    value={stats?.totalEmployees}   icon={<UsersIcon />}  colorClass="text-info"      bgClass="bg-blue-50" />
            <StatCard label="Under Review"    value={stats?.underReviewTasks} icon={<SearchIcon />} colorClass="text-amber-600" bgClass="bg-amber-50" />
          </>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-navy">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-brand hover:text-brand-dark font-medium">View all →</Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 text-navy-400 flex items-center justify-center mx-auto mb-3">
              <ClipboardIcon size={24} />
            </div>
            <p className="text-navy-500 text-sm">No tasks yet</p>
            <Link to="/tasks/create" className="mt-3 inline-block text-sm text-brand font-medium hover:underline">
              Assign your first task →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const assignee = task.assignedTo;
              const color = generateAvatarColor(assignee?.name || '');
              const initials = getInitials(assignee?.name || '');
              return (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-2 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate group-hover:text-brand">{task.title}</p>
                    <p className="text-xs text-navy-400 truncate">{assignee?.name} · Due {formatDate(task.deadline)}</p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
