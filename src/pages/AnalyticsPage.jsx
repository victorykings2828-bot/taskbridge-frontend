import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ClipboardIcon, CheckCircleIcon, AlertIcon, StarIcon, BriefcaseIcon, UsersIcon, DatabaseIcon } from '../components/common/icons';

const ICON_COLOR = { brand: 'text-brand', success: 'text-success', danger: 'text-danger', warning: 'text-warning', info: 'text-info' };

const STATUS_COLORS = {
  'not_started': '#94A3B8',
  'in_progress':  '#0EA5E9',
  'under_review': '#F59E0B',
  'completed':    '#10B981',
  'flagged':      '#EF4444',
};
const STATUS_LABELS = {
  'not_started': 'Not Started',
  'in_progress':  'In Progress',
  'under_review': 'Under Review',
  'completed':    'Completed',
  'flagged':      'Flagged',
};

const StatCard = ({ icon, label, value, sub, color = 'brand' }) => (
  <div className="bg-surface border border-navy-200 rounded-2xl p-5 shadow-card hover:shadow-card-md transition-all">
    <div className={`w-10 h-10 rounded-xl bg-${color}/10 ${ICON_COLOR[color] || 'text-brand'} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-navy">{value ?? '—'}</p>
    <p className="text-navy-600 text-sm font-medium mt-0.5">{label}</p>
    {sub && <p className="text-navy-400 text-xs mt-0.5">{sub}</p>}
  </div>
);

const BarChart = ({ data, maxVal, color = '#0EA5E9', label = 'count' }) => (
  <div className="flex items-end gap-2 h-28">
    {data.map((d, i) => {
      const h = maxVal > 0 ? Math.max(4, Math.round((d.count / maxVal) * 100)) : 4;
      return (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center">
            <div title={`${d.label}: ${d.count}`}
              style={{ height: `${h}%`, minHeight: '4px', backgroundColor: color, borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}
              className="w-full cursor-pointer opacity-80 hover:opacity-100 group-hover:opacity-100"
            />
            <span className="absolute -top-5 text-xs text-navy-500 hidden group-hover:block bg-surface border border-navy-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
              {d.count}
            </span>
          </div>
          <p className="text-xs text-navy-400 truncate w-full text-center">{d.label}</p>
        </div>
      );
    })}
  </div>
);

const DonutSegment = ({ pct, color, offset }) => {
  const r = 15.9155;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="4"
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeDashoffset={-offset * circ / 100}
      style={{ transition: 'stroke-dasharray 0.5s ease' }} />
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30d');

  useEffect(() => {
    api.get('/analytics/org')
      .then(r => { if (r.data.success) setData(r.data.analytics); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <p className="text-navy-500 text-center mt-20">No analytics data available.</p>;

  const { overview, tasksByStatus, tasksByPriority, monthlyTrend, employeePerformance, managerPerformance, storage, organization } = data;

  // Donut chart data from tasksByStatus
  const statusEntries = Object.entries(tasksByStatus || {}).filter(([, v]) => v > 0);
  const statusTotal   = statusEntries.reduce((s, [, v]) => s + v, 0);
  let donutOffset = 0;
  const donutSegments = statusEntries.map(([key, count]) => {
    const pct = statusTotal > 0 ? (count / statusTotal) * 100 : 0;
    const seg = { key, pct, count, color: STATUS_COLORS[key] || '#94A3B8', offset: donutOffset };
    donutOffset += pct;
    return seg;
  });

  const maxMonthly = Math.max(...(monthlyTrend || []).map(d => d.count), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="text-navy-500 text-sm mt-0.5">{organization?.name} · <span className="capitalize">{organization?.tier}</span> plan</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-2 border border-navy-200 rounded-xl p-1">
          {[['7d','7 days'],['30d','30 days'],['all','All time']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === v ? 'bg-surface text-navy shadow-sm border border-navy-200' : 'text-navy-500 hover:text-navy'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardIcon />}   label="Total tasks"       value={overview.totalTasks}      />
        <StatCard icon={<CheckCircleIcon />} label="Completed (30d)"   value={overview.completedLast30} sub={`${overview.completionRate}% completion rate`} color="success" />
        <StatCard icon={<AlertIcon />}       label="Overdue tasks"     value={overview.overdueCount}    color="danger" />
        <StatCard icon={<StarIcon />}        label="Avg feedback"      value={overview.avgRating ? `${overview.avgRating}/5` : 'No ratings'} sub={overview.totalRatings ? `${overview.totalRatings} ratings` : ''} color="warning" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<BriefcaseIcon />} label="Managers"          value={overview.totalManagers}   />
        <StatCard icon={<UsersIcon />}     label="Employees"         value={overview.totalEmployees}  />
        <StatCard icon={<DatabaseIcon />}  label="Storage used"      value={storage?.usedFormatted}   sub={`${storage?.usedPct}% of plan`} color="info" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Monthly task completions */}
        <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-navy mb-1">Task completions</h3>
          <p className="text-navy-400 text-xs mb-5">Completed tasks per month (last 6 months)</p>
          {monthlyTrend && monthlyTrend.length > 0 ? (
            <BarChart data={monthlyTrend} maxVal={maxMonthly} color="#0EA5E9" />
          ) : (
            <p className="text-navy-400 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Task status donut */}
        <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-navy mb-1">Tasks by status</h3>
          <p className="text-navy-400 text-xs mb-5">Current distribution across all statuses</p>
          {statusTotal > 0 ? (
            <div className="flex items-center gap-6">
              {/* SVG donut */}
              <div className="flex-shrink-0 w-24 h-24 relative">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                  <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  {donutSegments.map(seg => (
                    <DonutSegment key={seg.key} pct={seg.pct} color={seg.color} offset={seg.offset} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-navy">{statusTotal}</span>
                </div>
              </div>
              {/* Legend */}
              <ul className="space-y-1.5 flex-1">
                {donutSegments.map(seg => (
                  <li key={seg.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-xs text-navy-600">{STATUS_LABELS[seg.key] || seg.key}</span>
                    </div>
                    <span className="text-xs font-semibold text-navy">{seg.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-navy-400 text-sm text-center py-8">No tasks yet</p>
          )}
        </div>
      </div>

      {/* Priority breakdown */}
      {tasksByPriority && Object.keys(tasksByPriority).length > 0 && (
        <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-navy mb-4">Tasks by priority</h3>
          <div className="flex gap-4 flex-wrap">
            {[['high','High','#EF4444'],['medium','Medium','#F59E0B'],['low','Low','#10B981'],['none','No priority','#94A3B8']].map(([key, label, color]) => {
              const count = tasksByPriority[key] || 0;
              const pct   = statusTotal > 0 ? Math.round((count / statusTotal) * 100) : 0;
              return (
                <div key={key} className="flex-1 min-w-32 bg-bg rounded-xl p-4 border border-navy-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-xs text-navy-500 font-medium">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-navy">{count}</p>
                  <div className="h-1.5 bg-navy-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <p className="text-xs text-navy-400 mt-1">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee performance table */}
      {employeePerformance && employeePerformance.length > 0 && (
        <div className="bg-surface border border-navy-200 rounded-2xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-navy-200">
            <h3 className="font-semibold text-navy">Employee performance</h3>
            <p className="text-navy-400 text-xs mt-0.5">Ranked by completed tasks</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wide">Employee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Assigned</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Overdue</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {employeePerformance.map((emp, i) => (
                  <tr key={emp._id || i} className="hover:bg-bg transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-navy">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-navy-600">{emp.total}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-success">{emp.completed}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-danger">{emp.overdue || 0}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-navy-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${emp.rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-navy w-8 text-right">{emp.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manager performance (super_admin only) */}
      {user?.role === 'super_admin' && managerPerformance && managerPerformance.length > 0 && (
        <div className="bg-surface border border-navy-200 rounded-2xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-navy-200">
            <h3 className="font-semibold text-navy">Manager performance</h3>
            <p className="text-navy-400 text-xs mt-0.5">Task completion rate across managers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wide">Manager</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Assigned</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Overdue</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wide">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {managerPerformance.map((mgr, i) => (
                  <tr key={mgr._id || i} className="hover:bg-bg transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                          {mgr.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-navy">{mgr.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-navy-600">{mgr.totalAssigned}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-success">{mgr.completed}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-danger">{mgr.overdue || 0}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-navy-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${mgr.rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-navy w-8 text-right">{mgr.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storage bar */}
      {storage && (
        <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-navy mb-3">Storage</h3>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">{storage.usedFormatted} used of {storage.limitFormatted}</p>
            <p className={`text-sm font-semibold ${storage.usedPct > 80 ? 'text-danger' : 'text-navy-500'}`}>{storage.usedPct}%</p>
          </div>
          <div className="h-2.5 bg-navy-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${storage.usedPct > 80 ? 'bg-danger' : storage.usedPct > 60 ? 'bg-warning' : 'bg-brand'}`} style={{ width: `${storage.usedPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
