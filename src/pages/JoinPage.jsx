import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const JoinPage = () => {
  const { user, applyAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=code, 2=account details
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(val);
    setError('');
  };

  // If user is already logged in, use the authenticated join flow
  const handleAuthenticatedJoin = async (e) => {
    e.preventDefault();
    if (code.length !== 8) { setError('Enter an 8-character company code'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/org/join', { joinCode: code });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please check with your administrator.');
    } finally { setSubmitting(false); }
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include an uppercase letter';
    else if (!/[a-z]/.test(form.password)) e.password = 'Include a lowercase letter';
    else if (!/\d/.test(form.password)) e.password = 'Include a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Public join: create account + join org in one step
  const handlePublicJoin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/org/join-with-code', {
        joinCode: code,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(res.data.message);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
      if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('expired')) {
        setStep(1);
        setError(msg);
      }
    } finally { setSubmitting(false); }
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

  // If logged-in user, show simple code entry
  if (user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Logo />
          <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md text-center">
            <h1 className="text-xl font-bold text-navy mb-1">Join your company</h1>
            <p className="text-navy-500 text-sm mb-6">Enter the 8-character code your admin shared</p>
            <form onSubmit={handleAuthenticatedJoin} className="space-y-4">
              <input type="text" value={code} onChange={handleCodeChange} placeholder="AB12CD34" maxLength={8}
                className={`w-full px-4 py-4 rounded-xl border text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2 ${
                  error ? 'border-danger bg-danger/5 text-danger' : code.length === 8 ? 'border-success bg-success/5 text-success' : 'border-navy-200 bg-bg text-navy focus:ring-brand/20 focus:border-brand'
                }`} style={{ letterSpacing: '0.4em' }} />
              {error && <p className="text-danger text-xs flex items-center justify-center gap-1"><span>⚠</span>{error}</p>}
              <button type="submit" disabled={submitting || code.length !== 8}
                className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</> : 'Join company'}
              </button>
            </form>
          </div>
          <p className="text-center text-navy-500 text-sm mt-4">
            <Link to="/dashboard" className="text-brand hover:text-brand-dark font-medium">← Back to dashboard</Link>
          </p>
        </div>
      </div>
    );
  }

  // Public flow: step 1 = code, step 2 = create account
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(n => (
            <React.Fragment key={n}>
              <div className={`flex items-center gap-2 ${n <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${n < step ? 'bg-success text-white' : n === step ? 'bg-brand text-white' : 'bg-navy-200 text-navy-500'}`}>
                  {n < step ? '✓' : n}
                </div>
                <span className={`text-xs font-medium ${n === step ? 'text-navy' : 'text-navy-400'}`}>
                  {n === 1 ? 'Company code' : 'Your details'}
                </span>
              </div>
              {n < 2 && <div className={`flex-1 h-px ${step > 1 ? 'bg-success' : 'bg-navy-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          {step === 1 ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-navy mb-1">Join your company</h1>
                <p className="text-navy-500 text-sm">Enter the 8-character code your admin shared with you</p>
              </div>
              <div className="space-y-4">
                <input type="text" value={code} onChange={handleCodeChange} placeholder="AB12CD34" maxLength={8}
                  className={`w-full px-4 py-4 rounded-xl border text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2 ${
                    error ? 'border-danger bg-danger/5 text-danger' : code.length === 8 ? 'border-success bg-success/5 text-success' : 'border-navy-200 bg-bg text-navy focus:ring-brand/20 focus:border-brand'
                  }`} style={{ letterSpacing: '0.4em' }} />
                {error && <p className="text-danger text-xs text-center"><span>⚠ </span>{error}</p>}
                {code.length > 0 && code.length < 8 && !error && (
                  <p className="text-navy-400 text-xs text-center">{8 - code.length} more characters needed</p>
                )}
                <button onClick={() => { if (code.length === 8) setStep(2); else setError('Enter an 8-character code'); }}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="mt-5 p-4 bg-brand-50 border border-brand-100 rounded-xl text-left">
                <p className="text-xs text-brand font-semibold mb-1">📋 Where's my code?</p>
                <p className="text-xs text-navy-500">Your company admin can find the join code in the Subscription & Workspace page. Ask them to share it with you.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(1)} className="text-navy-500 hover:text-navy transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-navy">Create your account</h1>
                  <p className="text-navy-500 text-sm">Code: <span className="font-mono font-bold tracking-wider">{code}</span></p>
                </div>
              </div>
              <form onSubmit={handlePublicJoin} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Full name <span className="text-danger">*</span></label>
                  <input type="text" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }} placeholder="Jane Smith"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.name ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.name && <p className="text-danger text-xs mt-1.5">⚠ {errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Email <span className="text-danger">*</span></label>
                  <input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }} placeholder="jane@company.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.email ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.email && <p className="text-danger text-xs mt-1.5">⚠ {errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Password <span className="text-danger">*</span></label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }} placeholder="Min 8 chars, upper, lower, number"
                      className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.password ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-navy-500">{showPass ? 'Hide' : 'Show'}</button>
                  </div>
                  {errors.password && <p className="text-danger text-xs mt-1.5">⚠ {errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm password <span className="text-danger">*</span></label>
                  <input type="password" value={form.confirmPassword} onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }} placeholder="Repeat your password"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.confirmPassword ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.confirmPassword && <p className="text-danger text-xs mt-1.5">⚠ {errors.confirmPassword}</p>}
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</> : 'Create account & join'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-4 text-center space-y-2">
          <p className="text-navy-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:text-brand-dark">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
