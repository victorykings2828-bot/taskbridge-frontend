import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ChangePasswordPage = () => {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) e.newPassword = 'New password is required';
    else if (form.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword))
      e.newPassword = 'Must include uppercase, lowercase, and a number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthConfig = {
    0: { label: '', color: '' },
    1: { label: 'Very Weak', color: 'bg-red-500' },
    2: { label: 'Weak', color: 'bg-orange-500' },
    3: { label: 'Fair', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-blue-500' },
    5: { label: 'Very Strong', color: 'bg-green-500' },
  };

  const strength = getStrength(form.newPassword);
  const strengthCfg = strengthConfig[strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      toast.success('Password changed! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
      if (msg.toLowerCase().includes('current')) setErrors({ currentPassword: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (field) => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const PasswordField = ({ label, field, showKey, placeholder, hint }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPasswords[showKey] ? 'text' : 'password'}
          value={form[field]}
          onChange={(e) => { setForm({ ...form, [field]: e.target.value }); setErrors({ ...errors, [field]: '' }); }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
          }`}
        />
        <button type="button" onClick={() => toggle(showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm px-1">
          {showPasswords[showKey] ? '🙈' : '👁'}
        </button>
      </div>
      {errors[field] && <p className="text-red-500 text-xs mt-1.5">⚠ {errors[field]}</p>}
      {hint && !errors[field] && <p className="text-gray-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4 shadow-lg">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Your Password</h1>
          <p className="text-slate-400 text-sm mt-1">Set a new password to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-700">
              👋 Welcome, <strong>{user?.name}</strong>! For security, please set a new password before accessing the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <PasswordField
              label="Current Password"
              field="currentPassword"
              showKey="current"
              placeholder="Enter your current password"
            />

            <PasswordField
              label="New Password"
              field="newPassword"
              showKey="new"
              placeholder="Create a strong password"
              hint="Min 8 chars with uppercase, lowercase & number"
            />

            {/* Strength indicator */}
            {form.newPassword && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthCfg.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength >= 4 ? 'text-green-600' : strength >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {strengthCfg.label}
                </p>
              </div>
            )}

            <PasswordField
              label="Confirm New Password"
              field="confirmPassword"
              showKey="confirm"
              placeholder="Re-enter your new password"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : 'Set New Password & Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
