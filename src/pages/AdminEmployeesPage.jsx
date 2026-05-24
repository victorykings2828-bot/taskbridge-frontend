import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, generateAvatarColor, formatDate } from '../utils/helpers';
import { TableSkeleton } from '../components/common/Skeleton';
import { UserIcon } from '../components/common/icons';

const StarDisplay = ({ rating }) => (
  <span className="text-amber-400 font-semibold text-sm">
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    <span className="text-navy-500 font-normal ml-1 text-xs">{rating}</span>
  </span>
);

const AdminEmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterManager, setFilterManager] = useState('all');

  useEffect(() => {
    api.get('/admin/employees')
      .then(r => setEmployees(r.data.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const managers = [...new Map(
    employees.filter(e => e.managerId).map(e => [e.managerId._id, e.managerId])
  ).values()];

  const filtered = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchManager = filterManager === 'all' || emp.managerId?._id === filterManager;
    return matchSearch && matchManager;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-navy-400 hover:text-navy mb-1 flex items-center gap-1">← Back</button>
          <h1 className="text-2xl font-bold text-navy">All Employees</h1>
          <p className="text-navy-500 mt-1">{employees.length} employee{employees.length !== 1 ? 's' : ''} across all teams</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="flex-1 sm:max-w-xs px-4 py-2.5 rounded-xl border border-navy-200 bg-surface text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        <select value={filterManager} onChange={e => setFilterManager(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-navy-200 bg-surface text-sm outline-none focus:border-brand text-navy-700">
          <option value="all">All Managers</option>
          {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl p-6 border border-navy-200"><TableSkeleton rows={8} /></div>
      ) : (
        <div className="bg-surface rounded-2xl border border-navy-200 shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 text-navy-400 flex items-center justify-center mx-auto mb-4 ring-1 ring-navy-200"><UserIcon size={26} /></div>
              <p className="text-navy-500">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-200 bg-surface-2">
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Employee</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden md:table-cell">Manager</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Tasks</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden sm:table-cell">Done Rate</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden lg:table-cell">Avg Rating</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-200/40">
                  {filtered.map(emp => {
                    const color = generateAvatarColor(emp.name);
                    return (
                      <tr key={emp._id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: color }}>
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy">{emp.name}</p>
                              <p className="text-xs text-navy-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <p className="text-sm text-navy-600">{emp.managerId?.name || '—'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 text-xs">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{emp.stats.inProgressTasks} active</span>
                            {emp.stats.overdueTasks > 0 && (
                              <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">{emp.stats.overdueTasks} overdue</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-navy-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${emp.stats.completionRate}%` }} />
                              </div>
                              <span className="text-xs text-navy-500">{emp.stats.completionRate}%</span>
                            </div>
                            <p className="text-xs text-navy-400 mt-0.5">{emp.stats.completedTasks}/{emp.stats.totalTasks} tasks</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          {emp.stats.avgRating
                            ? <StarDisplay rating={emp.stats.avgRating} />
                            : <span className="text-xs text-navy-400">No ratings yet</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${emp.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <Link to={`/admin/employees/${emp._id}`}
                            className="text-xs font-medium text-brand hover:text-brand-dark border border-brand/30 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-all">
                            View Profile
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
      )}
    </div>
  );
};

export default AdminEmployeesPage;
