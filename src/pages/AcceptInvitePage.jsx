import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const passwordStrength = (p) => {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return { score: s, label: ['','Very weak','Weak','Fair','Strong','Very strong'][s], color: ['','bg-danger','bg-warning','bg-yellow-400','bg-success','bg-success'][s] };
};

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applyAuth } = useAuth();
  const [form, setForm] = useState({ code: searchParams.get('code') || '', name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const strength = passwordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'Invite code is required';
    if (!form.name.trim()) e.name = 'Your name is required';
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
    setSubmitting(true);
    try {
      const res = await api.post('/org/invite/accept', { code: form.code.trim(), name: form.name.trim(), password: form.password });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(res.data.message);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept invite';
      toast.error(msg);
      if (msg.toLowerCase().includes('code')) setErrors({ code: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-navy font-bold text-xl">TaskBridge</span>
        </div>

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.86 10.7a19.79 19.79 0 01-3.07-8.67A2 2 0 012.77 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.1 6.1l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 className="text-xl font-bold text-navy">Accept your invite</h1>
            <p className="text-navy-500 text-sm mt-1">Create your TaskBridge account using your invite code</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Invite code <span className="text-danger">*</span></label>
              <input type="text" value={form.code} onChange={e => { setForm({...form, code: e.target.value}); setErrors({...errors, code:''}); }}
                placeholder="Paste your invite code"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all font-mono tracking-wide focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.code ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
              {errors.code && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Full name <span className="text-danger">*</span></label>
              <input type="text" autoComplete="name" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name:''}); }}
                placeholder="Your full name"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.name ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
              {errors.name && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Create password <span className="text-danger">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password:''}); }}
                  placeholder="Min 8 chars, upper, lower, number"
                  className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.password ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-navy-500 hover:text-navy-700">{showPass ? 'Hide' : 'Show'}</button>
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
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm password <span className="text-danger">*</span></label>
              <input type="password" autoComplete="new-password" value={form.confirm} onChange={e => { setForm({...form, confirm: e.target.value}); setErrors({...errors, confirm:''}); }}
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.confirm ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
              {errors.confirm && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</> : 'Create account & join'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-500 text-sm mt-4">
          Already have an account? <Link to="/login" className="text-brand font-semibold hover:text-brand-dark">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
