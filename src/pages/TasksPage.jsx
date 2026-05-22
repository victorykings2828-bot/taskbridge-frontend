import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatDate, getInitials, generateAvatarColor } from '../utils/helpers';

const STATUS_FILTERS = ['all', 'not_started', 'in_progress', 'under_review', 'completed', 'overdue'];

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('all');
  const [priorityFilter, setPriority] = useState('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: 50 });
        if (statusFilter !== 'all')   params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        const res = await api.get(`/tasks?${params}`);
        setTasks(res.data.tasks || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const label = (s) => s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'employee' ? 'My Tasks' : 'All Tasks'}
          </h1>
          <p className="text-gray-500 mt-1">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'manager' && (
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
          >
            <span className="text-lg leading-none">+</span> Assign Task
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 sm:max-w-xs px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 text-gray-700"
        >
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriority(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 text-gray-700"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500 font-medium">No tasks found</p>
            {user?.role === 'manager' && (
              <Link to="/tasks/create" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
                Assign your first task →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Task</th>
                  {user?.role !== 'employee' && (
                    <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden sm:table-cell">Assignee</th>
                  )}
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden md:table-cell">Deadline</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((task) => {
                  const assignee = task.assignedTo;
                  const color = generateAvatarColor(assignee?.name || '');
                  return (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{task.description?.slice(0, 60)}...</p>
                      </td>
                      {user?.role !== 'employee' && (
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                              {getInitials(assignee?.name || '')}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{assignee?.name}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className={`text-sm ${task.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {formatDate(task.deadline)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
