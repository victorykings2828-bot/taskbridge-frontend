import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const passwordStrength = (p) => {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return {
    score: s,
    label: ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][s],
    color: ['', 'bg-danger', 'bg-warning', 'bg-yellow-400', 'bg-success', 'bg-success'][s],
  };
};

const Logo = () => (
  <div className="flex items-center gap-2.5 justify-center mb-8">
    <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <span className="text-navy font-bold text-xl">TaskBridge</span>
  </div>
);

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone]       = useState(false);
  const strength = passwordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include an uppercase letter';
    else if (!/[a-z]/.test(form.password)) e.password = 'Include a lowercase letter';
    else if (!/\d/.test(form.password)) e.password = 'Include a number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      if (res.data.success) {
        setDone(true);
        toast.success('Password reset! You can now sign in.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.';
      toast.error(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setErrors({ global: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">Password reset!</h2>
              <p className="text-navy-500 text-sm">Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-navy">Set a new password</h1>
                <p className="text-navy-500 text-sm mt-1">Choose a strong password for your account</p>
              </div>

              {errors.global && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl">
                  <p className="text-danger text-sm">{errors.global}</p>
                  <Link to="/forgot-password" className="text-brand text-xs underline mt-1 inline-block">Request a new reset link →</Link>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">New password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} autoComplete="new-password"
                      value={form.password}
                      onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password:''}); }}
                      placeholder="Min 8 chars, upper, lower, number"
                      className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.password ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-navy-500 hover:text-navy-700">
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-1.5">
                      <div className="flex gap-1 mb-1">{[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-navy-200'}`} />)}</div>
                      <p className={`text-xs ${strength.score >= 4 ? 'text-success' : strength.score >= 3 ? 'text-warning' : 'text-danger'}`}>{strength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-danger text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm password</label>
                  <input type="password" autoComplete="new-password"
                    value={form.confirm}
                    onChange={e => { setForm({...form, confirm: e.target.value}); setErrors({...errors, confirm:''}); }}
                    placeholder="Repeat your password"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.confirm ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.confirm && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</> : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-navy-500 text-sm mt-4">
          <Link to="/login" className="text-brand font-medium hover:text-brand-dark">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
