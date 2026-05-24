import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StatCard from '../components/common/StatCard';
import { ClipboardIcon, BoltIcon, CheckCircleIcon, AlertIcon } from '../components/common/icons';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/tasks?limit=10'),
      ]);
      setStats(statsRes.data.stats);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (taskId) => {
    setActionLoading(taskId);
    try {
      await api.put(`/tasks/${taskId}/accept`, { action: 'accept' });
      toast.success('Task accepted!');
      fetchData();
    } catch {
      toast.error('Failed to accept task');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === 'not_started');
  const activeTasks  = tasks.filter((t) => ['in_progress', 'overdue'].includes(t.status));
  const reviewTasks  = tasks.filter((t) => t.status === 'under_review');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-navy-500 mt-1">Here's your work summary for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Tasks"   value={stats?.totalTasks}       icon={<ClipboardIcon />}   colorClass="text-navy-700"  bgClass="bg-navy-100" />
            <StatCard label="In Progress"   value={stats?.inProgressTasks}  icon={<BoltIcon />}        colorClass="text-blue-600"  bgClass="bg-blue-50" />
            <StatCard label="Completed"     value={stats?.completedTasks}   icon={<CheckCircleIcon />} colorClass="text-green-600" bgClass="bg-green-50" />
            <StatCard label="Overdue"       value={stats?.overdueTasks}     icon={<AlertIcon />}       colorClass="text-red-600"   bgClass="bg-red-50" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New / Pending Tasks */}
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy">New Tasks</h2>
            <span className="text-xs bg-brand-100 text-brand font-semibold px-2.5 py-1 rounded-full">
              {pendingTasks.length}
            </span>
          </div>

          {loading ? <TableSkeleton rows={3} /> : pendingTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-navy-400 text-sm">🎉 No new tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task._id} className="p-3 rounded-xl border border-navy-200 hover:border-brand transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={`/tasks/${task._id}`} className="text-sm font-medium text-navy hover:text-brand truncate">
                      {task.title}
                    </Link>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-xs text-navy-400 mb-3">Due {formatDate(task.deadline)}</p>
                  <button
                    onClick={() => handleAccept(task._id)}
                    disabled={actionLoading === task._id}
                    className="w-full text-xs font-semibold bg-primary text-white py-1.5 rounded-lg hover:bg-primary-light transition-all disabled:opacity-60"
                  >
                    {actionLoading === task._id ? 'Accepting...' : 'Accept Task'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Tasks */}
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy">Active Tasks</h2>
            <Link to="/tasks" className="text-xs text-brand font-medium hover:underline">View all →</Link>
          </div>

          {loading ? <TableSkeleton rows={3} /> : activeTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-navy-400 text-sm">No active tasks right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="block p-3 rounded-xl border border-navy-200 hover:border-brand transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-navy group-hover:text-brand truncate">{task.title}</p>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-navy-400">Due {formatDate(task.deadline)}</p>
                    <PriorityBadge priority={task.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Under Review */}
      {reviewTasks.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-amber-800 mb-3">🔍 Under Review ({reviewTasks.length})</h2>
          <div className="space-y-2">
            {reviewTasks.map((task) => (
              <Link
                key={task._id}
                to={`/tasks/${task._id}`}
                className="flex items-center justify-between p-3 bg-surface rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <p className="text-sm font-medium text-navy">{task.title}</p>
                <p className="text-xs text-amber-600">Submitted {formatDate(task.submittedAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
