import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatDate, getInitials, generateAvatarColor, ROLE_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

const AccountManagement = () => {
  const { user } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', department: '', phone: '' });
  const [errors, setErrors]         = useState({});
  const [search, setSearch]         = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  const targetRole = user?.role === 'super_admin' ? 'manager' : 'employee';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showTempPassword = (name, email, password) => {
    setCreatedUser({ name, email, tempPassword: password });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(
      `Password for ${name}: ${password}`,
      { duration: 30000, icon: '🔑', style: { maxWidth: '500px' } }
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/users', { ...form, role: targetRole });
      showTempPassword(res.data.user.name, res.data.user.email, res.data.tempPassword);
      setShowModal(false);
      setForm({ name: '', email: '', department: '', phone: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}? They will need to change it on next login.`)) return;
    try {
      const res = await api.post(`/users/${u._id}/reset-password`);
      showTempPassword(u.name, u.email, res.data.tempPassword);
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'super_admin' ? 'Manager Accounts' : 'My Team'}
          </h1>
          <p className="text-gray-500 mt-1">Manage {ROLE_LABELS[targetRole].toLowerCase()} accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          <span className="text-lg leading-none">+</span>
          Add {ROLE_LABELS[targetRole]}
        </button>
      </div>

      {/* Temp Password Banner */}
      {createdUser && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-green-800 font-semibold text-sm mb-1">
                ✅ {ROLE_LABELS[targetRole]} account created!
              </p>
              <p className="text-green-700 text-sm mb-3">
                Share these credentials with <strong>{createdUser.name}</strong>:
              </p>
              <div className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium w-20">Email</span>
                  <span className="text-sm text-gray-900 font-mono font-semibold flex-1">{createdUser.email}</span>
                  <button onClick={() => { navigator.clipboard.writeText(createdUser.email); toast.success('Copied!'); }}
                    className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50">Copy</button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium w-20">Password</span>
                  <span className="text-sm text-gray-900 font-mono font-semibold flex-1 tracking-wide">{createdUser.tempPassword}</span>
                  <button onClick={() => { navigator.clipboard.writeText(createdUser.tempPassword); toast.success('Copied!'); }}
                    className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50">Copy</button>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-2 font-medium">⚠ They must change this password on first login.</p>
            </div>
            <button onClick={() => setCreatedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
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
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-500 font-medium">
              {search ? 'No results found' : `No ${ROLE_LABELS[targetRole].toLowerCase()}s yet`}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                Add the first one →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const color = generateAvatarColor(u.name);
                  return (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: color }}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-gray-500">{u.department || '—'}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-gray-500">{formatDate(u.createdAt)}</p>
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
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-blue-600 hover:bg-blue-50 border border-blue-200"
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Add {ROLE_LABELS[targetRole]}</h2>
            <p className="text-gray-500 text-sm mb-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => { setForm({ ...form, [field]: e.target.value }); setErrors({ ...errors, [field]: '' }); }}
                    placeholder={placeholder}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                    }`}
                  />
                  {errors[field] && <p className="text-red-500 text-xs mt-1">⚠ {errors[field]}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
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
