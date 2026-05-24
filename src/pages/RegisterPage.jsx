import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RegisterPage = () => {
  const { applyAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=company, 2=admin account, 3=verify email
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    companyName: '', industry: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  // RFC 5322 email regex
  const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  const passwordStrength = (p) => {
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const colors = ['', 'bg-danger', 'bg-warning', 'bg-yellow-400', 'bg-success', 'bg-success'];
    return { score, label: map[score], color: colors[score] };
  };

  const strength = passwordStrength(form.adminPassword);

  const validateStep1 = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    else if (form.companyName.trim().length < 2) e.companyName = 'Company name is too short';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.adminName.trim()) e.adminName = 'Your name is required';
    if (!form.adminEmail) e.adminEmail = 'Email is required';
    else if (!EMAIL_RE.test(form.adminEmail)) e.adminEmail = 'Enter a valid email address (e.g. you@company.com)';
    if (!form.adminPassword) e.adminPassword = 'Password is required';
    else if (form.adminPassword.length < 8) e.adminPassword = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.adminPassword)) e.adminPassword = 'Include at least one uppercase letter';
    else if (!/[a-z]/.test(form.adminPassword)) e.adminPassword = 'Include at least one lowercase letter';
    else if (!/\d/.test(form.adminPassword)) e.adminPassword = 'Include at least one number';
    if (form.adminPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Step 2 → request the OTP, then move to the verify screen.
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/org/register/request-otp', {
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Verification code sent!');
        setOtp('');
        setStep(3);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send verification code. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exists')) {
        setErrors({ adminEmail: msg });
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → verify the OTP and create the workspace.
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/org/register/verify', {
        adminEmail: form.adminEmail.trim().toLowerCase(),
        otp: otp.trim(),
      });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(res.data.message || `Welcome to TaskBridge, ${form.adminName.split(' ')[0]}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('start again') || msg.toLowerCase().includes('expired')) {
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/org/register/request-otp', {
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
      });
      toast.success('A new code is on its way.');
    } catch {
      toast.error('Could not resend the code.');
    } finally {
      setResending(false);
    }
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

  const STEP_LABELS = ['Company', 'Your account', 'Verify'];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(n => (
            <React.Fragment key={n}>
              <div className={`flex items-center gap-2 ${n <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${n < step ? 'bg-success text-white' : n === step ? 'bg-brand text-white' : 'bg-navy-200 text-navy-500'}`}>
                  {n < step ? '✓' : n}
                </div>
                <span className={`text-xs font-medium ${n === step ? 'text-navy' : 'text-navy-400'} hidden sm:inline`}>
                  {STEP_LABELS[n - 1]}
                </span>
              </div>
              {n < 3 && <div className={`flex-1 h-px ${step > n ? 'bg-success' : 'bg-navy-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-navy mb-1">Set up your workspace</h1>
              <p className="text-navy-500 text-sm mb-5">Start with Google or tell us about your company</p>

              {/* Google signup */}
              <button type="button" onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
                className="w-full flex items-center justify-center gap-3 border border-navy-200 rounded-xl py-3 px-4 text-sm font-medium text-navy-700 hover:bg-surface-2 hover:border-navy-300 transition-all mb-5">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M47.532 24.552c0-1.636-.147-3.2-.418-4.698H24.48v8.879h12.984c-.56 3.016-2.26 5.571-4.813 7.284v6.054h7.79c4.558-4.2 7.09-10.388 7.09-17.52z" fill="#4285F4"/>
                  <path d="M24.48 48c6.516 0 11.982-2.16 15.976-5.85l-7.79-6.054c-2.16 1.449-4.92 2.304-8.186 2.304-6.3 0-11.638-4.254-13.548-9.976H2.932v6.248C6.908 42.672 15.088 48 24.48 48z" fill="#34A853"/>
                  <path d="M10.932 28.424A14.4 14.4 0 0 1 10.2 24c0-1.54.262-3.036.732-4.424v-6.248H2.932A23.94 23.94 0 0 0 .48 24c0 3.864.924 7.524 2.452 10.672l8-6.248z" fill="#FBBC05"/>
                  <path d="M24.48 9.6c3.552 0 6.738 1.22 9.246 3.624l6.934-6.934C36.454 2.376 30.996 0 24.48 0 15.088 0 6.908 5.328 2.932 13.328l8 6.248C12.842 13.854 18.18 9.6 24.48 9.6z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-navy-200" />
                <span className="text-xs text-navy-400 font-medium">or with email</span>
                <div className="flex-1 h-px bg-navy-200" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Company name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={e => { setForm({ ...form, companyName: e.target.value }); setErrors({ ...errors, companyName: '' }); }}
                    placeholder="Acme Corp"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.companyName ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`}
                  />
                  {errors.companyName && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.companyName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Industry <span className="text-navy-400 font-normal">(optional)</span></label>
                  <select
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-bg text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand text-navy-700"
                  >
                    <option value="">Select industry</option>
                    {['Technology','Healthcare','Finance','Education','Retail','Manufacturing','Consulting','Marketing','Other'].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { if (validateStep1()) setStep(2); }}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(1)} className="text-navy-500 hover:text-navy transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-navy">Create your admin account</h1>
                  <p className="text-navy-500 text-sm">{form.companyName}</p>
                </div>
              </div>

              <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Full name <span className="text-danger">*</span></label>
                  <input type="text" autoComplete="name" value={form.adminName} onChange={e => { setForm({ ...form, adminName: e.target.value }); setErrors({ ...errors, adminName: '' }); }} placeholder="Jane Smith"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.adminName ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.adminName && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.adminName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Work email <span className="text-danger">*</span></label>
                  <input type="email" autoComplete="email" value={form.adminEmail} onChange={e => { setForm({ ...form, adminEmail: e.target.value }); setErrors({ ...errors, adminEmail: '' }); }} placeholder="jane@yourcompany.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.adminEmail ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.adminEmail
                    ? <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.adminEmail}</p>
                    : <p className="text-navy-400 text-xs mt-1.5">We'll email a 6-digit code to confirm this address.</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Password <span className="text-danger">*</span></label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.adminPassword} onChange={e => { setForm({ ...form, adminPassword: e.target.value }); setErrors({ ...errors, adminPassword: '' }); }} placeholder="Min 8 chars, upper, lower, number"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.adminPassword ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 text-xs">{showPass ? 'Hide' : 'Show'}</button>
                  </div>
                  {form.adminPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-navy-200'}`} />)}
                      </div>
                      <p className={`text-xs ${strength.score >= 4 ? 'text-success' : strength.score >= 3 ? 'text-warning' : 'text-danger'}`}>{strength.label}</p>
                    </div>
                  )}
                  {errors.adminPassword && <p className="text-danger text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.adminPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm password <span className="text-danger">*</span></label>
                  <input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }} placeholder="Repeat your password"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.confirmPassword ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`} />
                  {errors.confirmPassword && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending code...</> : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(2)} className="text-navy-500 hover:text-navy transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-navy">Confirm your email</h1>
                  <p className="text-navy-500 text-sm">Code sent to <span className="font-medium text-navy">{form.adminEmail}</span></p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full px-4 py-4 rounded-xl border border-navy-200 bg-bg text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand text-navy"
                  autoFocus
                />
                <button type="submit" disabled={submitting || otp.length !== 6}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</> : 'Verify & create workspace'}
                </button>
              </form>

              <div className="text-center mt-4 text-sm text-navy-500">
                Didn't get it?{' '}
                <button onClick={handleResend} disabled={resending} className="text-brand font-medium hover:text-brand-dark disabled:opacity-60">
                  {resending ? 'Resending...' : 'Resend code'}
                </button>
              </div>
              <p className="text-center text-navy-400 text-xs mt-2">Check your spam folder if you don't see it within a minute.</p>
            </>
          )}
        </div>

        <p className="text-center text-navy-500 text-sm mt-4">
          Already have a workspace?{' '}
          <Link to="/login" className="text-brand font-medium hover:text-brand-dark">Sign in</Link>
        </p>
        <p className="text-center text-navy-400 text-xs mt-2">
          By registering you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
