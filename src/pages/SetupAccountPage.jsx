import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

const SetupAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { applyAuth } = useAuth();

  // Email is pre-filled from the login redirect (state) or a query param.
  const prefilledEmail = location.state?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const strength = passwordStrength(form.password);
  const emailLocked = Boolean(prefilledEmail);

  useEffect(() => { if (prefilledEmail) setEmail(prefilledEmail); }, [prefilledEmail]);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
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
      const res = await api.post('/auth/setup-account', {
        email: email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(res.data.message || 'Account set up successfully!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to set up account';
      toast.error(msg);
      if (msg.toLowerCase().includes('invited') || msg.toLowerCase().includes('not')) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes('already')) {
        // Already set up — send them to login
        setTimeout(() => navigate('/login'), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-navy">Set up your account</h1>
            <p className="text-navy-500 text-sm mt-1">Create a password to finish setting up your TaskBridge account.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email <span className="text-danger">*</span></label>
              <input type="email" autoComplete="email" value={email} readOnly={emailLocked}
                onChange={e => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.email ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'} ${emailLocked ? 'text-navy-500 cursor-not-allowed' : ''}`} />
              {errors.email && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Create password <span className="text-danger">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
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
              <input type="password" autoComplete="new-password" value={form.confirm}
                onChange={e => { setForm({ ...form, confirm: e.target.value }); setErrors({ ...errors, confirm: '' }); }}
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.confirm ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
              {errors.confirm && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Setting up...</> : 'Set password & continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-500 text-sm mt-4">
          Already set up? <Link to="/login" className="text-brand font-semibold hover:text-brand-dark">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SetupAccountPage;
