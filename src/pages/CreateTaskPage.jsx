import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees]   = useState([]);
  const [form, setForm]             = useState({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  useEffect(() => {
    api.get('/users').then((r) => setEmployees(r.data.users || [])).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.deadline)           e.deadline    = 'Deadline is required';
    else if (new Date(form.deadline) <= new Date()) e.deadline = 'Deadline must be in the future';
    if (!form.assignedTo)         e.assignedTo  = 'Please select an employee';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res    = await api.post('/tasks', form);
      const taskId = res.data.task._id;

      // Upload attachment if one was chosen
      if (attachedFile) {
        const fd = new FormData();
        fd.append('file', attachedFile);
        try {
          await api.post(`/tasks/${taskId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          // File upload failure doesn't block task creation
          toast('Task created but file upload failed. You can try again from the task page.', { icon: '⚠️' });
        }
      }

      toast.success('Task assigned successfully!');
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSubmitting(false); }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
    }`;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Assign New Task</h1>
        <p className="text-gray-500 mt-1">Create and assign a task to one of your team members</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input type="text" value={form.title} placeholder="E.g., Prepare Q4 sales report"
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
              className={inputClass('title')} />
            {errors.title && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea rows={4} value={form.description}
              placeholder="Describe the task, expected deliverables, and any requirements..."
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }); }}
              className={`${inputClass('description')} resize-none`} />
            {errors.description && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.description}</p>}
          </div>

          {/* Priority + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-500">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline *</label>
              <input type="date" value={form.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setForm({ ...form, deadline: e.target.value }); setErrors({ ...errors, deadline: '' }); }}
                className={inputClass('deadline')} />
              {errors.deadline && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.deadline}</p>}
            </div>
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to *</label>
            <select value={form.assignedTo}
              onChange={(e) => { setForm({ ...form, assignedTo: e.target.value }); setErrors({ ...errors, assignedTo: '' }); }}
              className={inputClass('assignedTo')}>
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}{emp.department ? ` (${emp.department})` : ''}
                </option>
              ))}
            </select>
            {errors.assignedTo && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.assignedTo}</p>}
            {employees.length === 0 && (
              <p className="text-amber-600 text-xs mt-1.5">⚠ No employees yet. Add team members first from My Team.</p>
            )}
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attach a File (optional)</label>
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all">
              <span className="text-xl">📎</span>
              <span className="text-sm text-gray-500 flex-1">
                {attachedFile ? attachedFile.name : 'Click to attach a file (PDF, Word, Excel, Image — max 10MB)'}
              </span>
              {attachedFile && (
                <button type="button" onClick={(e) => { e.preventDefault(); setAttachedFile(null); }}
                  className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
              )}
              <input type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.zip"
                onChange={(e) => setAttachedFile(e.target.files[0] || null)} />
            </label>
            <p className="text-xs text-gray-400 mt-1">
              {attachedFile
                ? `✅ ${(attachedFile.size / 1024 / 1024).toFixed(2)} MB`
                : 'Supported: PDF, Word, Excel, Images, ZIP'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Assigning...</>
                : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskPage;
