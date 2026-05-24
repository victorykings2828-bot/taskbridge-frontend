import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatDate, getInitials, generateAvatarColor, ROLE_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

const AccountManagement = () => {
  const { user } = useAuth();
  const [users, setUsers]           = useState([]);
  const [managers, setManagers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', department: '', phone: '', managerId: '' });
  const [errors, setErrors]         = useState({});
  const [search, setSearch]         = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  const [targetRole, setTargetRole] = useState(user?.role === 'super_admin' ? 'manager' : 'employee');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'super_admin' ? `/users?role=${targetRole}` : '/users';
      const res = await api.get(url);
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchManagers = async () => {
    if (user?.role !== 'super_admin') return;
    try {
      const res = await api.get('/users?role=manager');
      setManagers(res.data.users?.filter(u => u.isActive) || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchUsers(); }, [targetRole]);
  useEffect(() => { fetchManagers(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showCreatedUser = (name, email) => {
    setCreatedUser({ name, email });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, role: targetRole };
      if (targetRole === 'employee' && form.managerId) {
        payload.managerId = form.managerId;
      }
      const res = await api.post('/users', payload);
      showCreatedUser(res.data.user.name, res.data.user.email);
      setShowModal(false);
      setForm({ name: '', email: '', department: '', phone: '', managerId: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}? Their current password will be cleared and they'll set a new one on next sign-in.`)) return;
    try {
      const res = await api.post(`/users/${u._id}/reset-password`);
      toast.success(res.data.message || `${u.name}'s password was reset. They can set a new one on next sign-in.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {user?.role === 'super_admin'
              ? (targetRole === 'manager' ? 'Manager Accounts' : 'Employee Accounts')
              : 'My Team'}
          </h1>
          <p className="text-navy-500 mt-1">Manage {ROLE_LABELS[targetRole].toLowerCase()} accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'super_admin' && (
            <div className="flex bg-surface-2 rounded-xl p-1">
              <button
                onClick={() => setTargetRole('manager')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${targetRole === 'manager' ? 'bg-surface text-navy shadow-card' : 'text-navy-500 hover:text-navy'}`}
              >Managers</button>
              <button
                onClick={() => setTargetRole('employee')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${targetRole === 'employee' ? 'bg-surface text-navy shadow-card' : 'text-navy-500 hover:text-navy'}`}
              >Employees</button>
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-card"
          >
            <span className="text-lg leading-none">+</span>
            Add {ROLE_LABELS[targetRole]}
          </button>
        </div>
      </div>

      {/* Account-created Banner */}
      {createdUser && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-green-800 font-semibold text-sm mb-1">
                ✅ {ROLE_LABELS[targetRole]} account created for {createdUser.name}!
              </p>
              <p className="text-green-700 text-sm mb-3">
                Ask them to sign in with their email — they'll set their own password on first login.
              </p>
              <div className="bg-surface rounded-xl border border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-navy-500 font-medium w-20">Email</span>
                  <span className="text-sm text-navy font-mono font-semibold flex-1">{createdUser.email}</span>
                  <button onClick={() => { navigator.clipboard.writeText(createdUser.email); toast.success('Copied!'); }}
                    className="text-xs text-brand border border-brand/30 px-2.5 py-1 rounded-lg hover:bg-brand-50">Copy</button>
                </div>
              </div>
              <p className="text-xs text-navy-500 mt-2">An invite email was sent if email delivery is configured.</p>
            </div>
            <button onClick={() => setCreatedUser(null)} className="text-navy-400 hover:text-navy text-2xl leading-none mt-1">×</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${ROLE_LABELS[targetRole].toLowerCase()}s...`}
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-navy-200 bg-surface text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-navy-500 font-medium">
              {search ? 'No results found' : `No ${ROLE_LABELS[targetRole].toLowerCase()}s yet`}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-brand font-medium hover:underline">
                Add the first one →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-200 bg-surface-2">
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-navy-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-200/40">
                {filtered.map((u) => {
                  const color = generateAvatarColor(u.name);
                  return (
                    <tr key={u._id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: color }}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy">{u.name}</p>
                            <p className="text-xs text-navy-400 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <p className="text-sm text-navy-600">{u.email}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-navy-500">{u.department || '—'}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-navy-500">{formatDate(u.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {u.isFirstLogin && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-brand hover:bg-brand-50 border border-brand/30"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                              u.isActive
                                ? 'text-red-600 hover:bg-red-50 border border-red-200'
                                : 'text-green-600 hover:bg-green-50 border border-green-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-navy mb-1">Add {ROLE_LABELS[targetRole]}</h2>
            <p className="text-navy-500 text-sm mb-6">
              A temporary password will be generated — you'll see it on screen after creation.
            </p>
            <form onSubmit={handleCreate} noValidate className="space-y-4">
              {[
                { label: 'Full Name *', field: 'name', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address *', field: 'email', type: 'email', placeholder: 'john@company.com' },
                { label: 'Department', field: 'department', type: 'text', placeholder: 'Engineering' },
                { label: 'Phone', field: 'phone', type: 'tel', placeholder: '+91 9876543210' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => { setForm({ ...form, [field]: e.target.value }); setErrors({ ...errors, [field]: '' }); }}
                    placeholder={placeholder}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all ${
                      errors[field] ? 'border-red-400 bg-red-50' : 'border-navy-200 bg-surface-2 focus:bg-surface'
                    }`}
                  />
                  {errors[field] && <p className="text-red-500 text-xs mt-1">⚠ {errors[field]}</p>}
                </div>
              ))}

              {user?.role === 'super_admin' && targetRole === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Assign to Manager</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface transition-all"
                  >
                    <option value="">— Unassigned (assign later) —</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <p className="text-amber-500 text-xs mt-1">⚠ No managers found. Create a manager first.</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-navy-200 text-sm font-medium text-navy-600 hover:bg-surface-2">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                    : `Create ${ROLE_LABELS[targetRole]}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
