import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RegisterPage = () => {
  const { applyAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=company, 2=admin account
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/org/register', {
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
      });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(`Welcome to TaskBridge, ${form.adminName.split(' ')[0]}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors({ adminEmail: msg });
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(n => (
            <React.Fragment key={n}>
              <div className={`flex items-center gap-2 ${n === step ? 'opacity-100' : n < step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${n < step ? 'bg-success text-white' : n === step ? 'bg-brand text-white' : 'bg-navy-200 text-navy-500'}`}>
                  {n < step ? '✓' : n}
                </div>
                <span className={`text-xs font-medium ${n === step ? 'text-navy' : 'text-navy-400'}`}>
                  {n === 1 ? 'Company' : 'Your account'}
                </span>
              </div>
              {n < 2 && <div className={`flex-1 h-px ${step > 1 ? 'bg-success' : 'bg-navy-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          {step === 1 ? (
            <>
              <h1 className="text-xl font-bold text-navy mb-1">Set up your workspace</h1>
              <p className="text-navy-500 text-sm mb-6">Tell us about your company</p>
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
          ) : (
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

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  {errors.adminEmail && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.adminEmail}</p>}
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
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating workspace...</> : 'Create my workspace'}
                </button>
              </form>
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
