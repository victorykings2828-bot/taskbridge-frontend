import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, generateAvatarColor, formatDate } from '../utils/helpers';
import { TableSkeleton } from '../components/common/Skeleton';

const AdminManagersPage = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/admin/managers')
      .then(r => setManagers(r.data.managers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = managers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="text-sm text-navy-400 hover:text-navy mb-1 flex items-center gap-1">← Back</button>
          <h1 className="text-2xl font-bold text-navy">All Managers</h1>
          <p className="text-navy-500 mt-1">{managers.length} manager{managers.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <Link to="/accounts" className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all">
          + Add Manager
        </Link>
      </div>

      <div className="mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search managers..."
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-navy-200 bg-surface text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
      </div>

      {loading ? <div className="bg-surface rounded-2xl p-6 border border-navy-200"><TableSkeleton rows={6} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(mgr => {
            const color = generateAvatarColor(mgr.name);
            return (
              <Link key={mgr._id} to={`/admin/managers/${mgr._id}`}
                className="bg-surface rounded-2xl border border-navy-200 shadow-card p-5 hover:shadow-card-md hover:border-brand/40 transition-all group">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}>
                    {getInitials(mgr.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate group-hover:text-brand">{mgr.name}</p>
                    <p className="text-xs text-navy-400 truncate">{mgr.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${mgr.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {mgr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Team',    value: mgr.stats.teamSize,       color: 'text-blue-600' },
                    { label: 'Tasks',   value: mgr.stats.totalTasks,     color: 'text-navy-700' },
                    { label: 'Done',    value: mgr.stats.completedTasks, color: 'text-green-600' },
                    { label: 'Overdue', value: mgr.stats.overdueTasks,   color: 'text-red-500' },
                  ].map(({ label, value, color: c }) => (
                    <div key={label} className="bg-surface-2 rounded-lg py-2">
                      <p className={`text-lg font-bold ${c}`}>{value}</p>
                      <p className="text-xs text-navy-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Completion bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-navy-400 mb-1">
                    <span>Completion rate</span>
                    <span className="font-medium text-navy-600">{mgr.stats.completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-navy-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: `${mgr.stats.completionRate}%` }} />
                  </div>
                </div>

                <p className="text-xs text-navy-400 mt-3">Joined {formatDate(mgr.createdAt)}</p>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 bg-surface rounded-2xl border border-navy-200">
              <p className="text-navy-500">No managers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManagersPage;
