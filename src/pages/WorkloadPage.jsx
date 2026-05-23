import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { getInitials, generateAvatarColor } from '../utils/helpers';
import { TableSkeleton } from '../components/common/Skeleton';

const WorkloadPage = () => {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    api.get('/tasks/workload')
      .then((r) => setWorkload(r.data.workload || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getBar = (value, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Team Workload</h1>
        <p className="text-navy-500 mt-1">See how tasks are distributed across your team</p>
      </div>

      {loading ? (
        <div className="space-y-4"><TableSkeleton rows={5} /></div>
      ) : workload.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-navy-200">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-navy-500">No team members yet. Add employees first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workload.map(({ employee, total, active, completed, overdue, inReview }) => {
            const color = generateAvatarColor(employee.name);
            const completedPct = getBar(completed, total);
            const activePct    = getBar(active, total);
            const overduePct   = getBar(overdue, total);
            return (
              <div key={employee._id} className="bg-surface rounded-2xl border border-navy-200 shadow-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}>
                    {getInitials(employee.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy">{employee.name}</p>
                    <p className="text-sm text-navy-400">{employee.department || employee.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-navy">{total}</p>
                    <p className="text-xs text-navy-400">total tasks</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                  {[
                    { label: 'Active',     value: active,    color: 'text-blue-600',  bg: 'bg-blue-50' },
                    { label: 'Completed',  value: completed, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'In Review',  value: inReview,  color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Overdue',    value: overdue,   color: 'text-red-600',   bg: 'bg-red-50' },
                  ].map(({ label, value, color: c, bg }) => (
                    <div key={label} className={`${bg} rounded-xl py-2`}>
                      <p className={`text-xl font-bold ${c}`}>{value}</p>
                      <p className="text-xs text-navy-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div>
                    <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                      <div className="bg-green-400 transition-all" style={{ width: `${completedPct}%` }} title={`Completed: ${completed}`} />
                      <div className="bg-blue-400 transition-all"  style={{ width: `${activePct}%` }}    title={`Active: ${active}`} />
                      <div className="bg-red-400 transition-all"   style={{ width: `${overduePct}%` }}   title={`Overdue: ${overdue}`} />
                      <div className="bg-navy-200 flex-1" />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-navy-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Completed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Active</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Overdue</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkloadPage;
