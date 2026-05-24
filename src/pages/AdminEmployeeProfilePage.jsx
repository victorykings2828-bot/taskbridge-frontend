import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, generateAvatarColor, formatDate, timeAgo } from '../utils/helpers';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { StarIcon } from '../components/common/icons';
import toast from 'react-hot-toast';

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(star => (
      <button key={star} type="button" onClick={() => !readonly && onChange?.(star)}
        className={`text-3xl transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'} ${star <= value ? 'text-amber-400' : 'text-navy-200'}`}>
        ★
      </button>
    ))}
  </div>
);

const AdminEmployeeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('tasks');
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(`/admin/employees/${id}/profile`)
      .then(r => setData(r.data))
      .catch(() => { toast.error('Employee not found'); navigate('/admin/employees'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/feedback', { employeeId: id, rating, comment });
      toast.success('Feedback submitted!');
      setRating(0); setComment('');
      setShowFeedbackForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="animate-pulse max-w-4xl space-y-4">
      <div className="h-40 bg-navy-200 rounded-2xl" />
      <div className="h-24 bg-navy-200 rounded-2xl" />
      <div className="h-64 bg-navy-200 rounded-2xl" />
    </div>
  );

  if (!data) return null;

  const { employee, taskStats: rawTaskStats, stats, tasks = [], feedbacks = [], avgRating } = data;
  const taskStats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    underReviewTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    ...(rawTaskStats || stats || {}),
  };
  const color = generateAvatarColor(employee.name);

  const RATING_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

  return (
    <div className="animate-fade-in max-w-4xl">
      <button onClick={() => navigate('/admin/employees')}
        className="text-sm text-navy-400 hover:text-navy mb-5 flex items-center gap-1">
        ← Back to employees
      </button>

      {/* Profile Header */}
      <div className="bg-surface rounded-2xl border border-navy-200 shadow-card p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: color }}>
            {getInitials(employee.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-navy">{employee.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${employee.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs bg-navy-100 text-navy-600 px-2.5 py-1 rounded-full font-medium">Employee</span>
            </div>
            <p className="text-navy-500 text-sm">{employee.email}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-navy-400">
              {employee.department && <span>📁 {employee.department}</span>}
              {employee.managerId && <span>👔 Manager: {employee.managerId.name}</span>}
              <span>📅 Joined {formatDate(employee.createdAt)}</span>
              {employee.lastLogin && <span>🕐 Last active {timeAgo(employee.lastLogin)}</span>}
            </div>
          </div>

          {/* Avg Rating display */}
          <div className="text-center bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 flex-shrink-0">
            <p className="text-3xl font-bold text-amber-500">{avgRating || '—'}</p>
            <p className="text-amber-400 text-lg">★★★★★</p>
            <p className="text-xs text-navy-500 mt-1">{feedbacks.length} rating{feedbacks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total',       value: taskStats.totalTasks,           color: 'text-navy-700',    bg: 'bg-surface-2' },
          { label: 'Completed',   value: taskStats.completedTasks,       color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'In Progress', value: taskStats.inProgressTasks,      color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'In Review',   value: taskStats.underReviewTasks,     color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Overdue',     value: taskStats.overdueTasks,         color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'Done Rate',   value: `${taskStats.completionRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color: c, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${c}`}>{value}</p>
            <p className="text-xs text-navy-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Give Feedback Button */}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowFeedbackForm(!showFeedbackForm)}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all flex items-center gap-2">
          ⭐ Give Feedback to {employee.name.split(' ')[0]}
        </button>
      </div>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <div className="bg-surface rounded-2xl border border-brand/20 shadow-card p-6 mb-5 animate-fade-in">
          <h2 className="text-base font-semibold text-navy mb-1">Give Performance Feedback</h2>
          <p className="text-navy-500 text-sm mb-5">Rate {employee.name}'s overall performance as observed by you.</p>
          <form onSubmit={handleFeedback} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Rating *</label>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-amber-600 mt-1 font-medium">{RATING_LABELS[rating]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Comment (optional)</label>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your observations on this employee's work..."
                className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:border-brand resize-none focus:bg-surface transition-all" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowFeedbackForm(false)}
                className="flex-1 py-3 rounded-xl border border-navy-200 text-sm font-medium text-navy-600 hover:bg-surface-2">
                Cancel
              </button>
              <button type="submit" disabled={submitting || rating === 0}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Submitting...</>
                  : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'tasks',    label: `Tasks (${tasks.length})` },
          { key: 'feedback', label: `Feedback Received (${feedbacks.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-primary text-white shadow-card' : 'text-navy-600 hover:bg-surface-2'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div className="bg-surface rounded-2xl border border-navy-200 shadow-card overflow-hidden">
          {tasks.length === 0 ? (
            <div className="text-center py-12"><p className="text-navy-400 text-sm">No tasks assigned yet</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-200 bg-surface-2">
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Task</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden sm:table-cell">Assigned By</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-5 py-3 hidden md:table-cell">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-200/40">
                {tasks.map(task => (
                  <tr key={task._id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-navy truncate max-w-xs">{task.title}</p>
                      <p className="text-xs text-navy-400">{timeAgo(task.updatedAt)}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <p className="text-sm text-navy-600">{task.assignedBy?.name}</p>
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

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-navy-200">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 text-navy-400 flex items-center justify-center mx-auto mb-4 ring-1 ring-navy-200"><StarIcon size={26} /></div>
              <p className="text-navy-400 text-sm">No feedback received yet</p>
            </div>
          ) : feedbacks.map(fb => (
            <div key={fb._id} className="bg-surface rounded-xl border border-navy-200 shadow-card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-navy">{fb.givenBy?.name || 'Super Admin'}</p>
                  {fb.task && <p className="text-xs text-brand mt-0.5">📋 {fb.task.title}</p>}
                </div>
                <div className="text-right">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-lg ${s <= fb.rating ? 'text-amber-400' : 'text-navy-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-navy-400">{timeAgo(fb.createdAt)}</p>
                </div>
              </div>
              {fb.comment && <p className="text-sm text-navy-600 italic">"{fb.comment}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmployeeProfilePage;
