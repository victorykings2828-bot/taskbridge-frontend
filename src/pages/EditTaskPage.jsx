import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EditTaskPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', deadline: '' });
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState({});

  useEffect(() => {
    api.get(`/tasks/${id}`).then((res) => {
      const t = res.data.task;
      if (t.status !== 'not_started') {
        toast.error('This task can no longer be edited');
        navigate(`/tasks/${id}`);
        return;
      }
      setForm({
        title: t.title,
        description: t.description,
        priority: t.priority,
        deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : '',
      });
    }).catch(() => { toast.error('Task not found'); navigate('/tasks'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.deadline)           e.deadline    = 'Deadline is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.put(`/tasks/${id}`, form);
      toast.success('Task updated!');
      navigate(`/tasks/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="animate-pulse max-w-2xl space-y-4">
      <div className="h-8 bg-navy-200 rounded w-48" />
      <div className="h-64 bg-navy-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-navy-500 hover:text-navy mb-3 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-navy">Edit Task</h1>
        <p className="text-navy-500 mt-1 text-sm">Changes only allowed before the employee accepts</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">Task Title *</label>
            <input type="text" value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all ${errors.title ? 'border-red-400 bg-red-50' : 'border-navy-200 bg-surface-2 focus:bg-surface'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">Description *</label>
            <textarea rows={4} value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none ${errors.description ? 'border-red-400 bg-red-50' : 'border-navy-200 bg-surface-2 focus:bg-surface'}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">⚠ {errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:border-brand">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Deadline *</label>
              <input type="date" value={form.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setForm({ ...form, deadline: e.target.value }); setErrors({ ...errors, deadline: '' }); }}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all ${errors.deadline ? 'border-red-400 bg-red-50' : 'border-navy-200 bg-surface-2 focus:bg-surface'}`}
              />
              {errors.deadline && <p className="text-red-500 text-xs mt-1">⚠ {errors.deadline}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border border-navy-200 text-sm font-medium text-navy-600 hover:bg-surface-2 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskPage;
