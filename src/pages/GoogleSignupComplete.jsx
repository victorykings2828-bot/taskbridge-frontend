import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

// Completes a Google signup: the OAuth callback redirects here with a short-lived
// token; the new user just names their workspace, then the account is created.
const GoogleSignupComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applyAuth } = useAuth();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ companyName: '', industry: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Your Google signup session is missing. Please try again.');
      navigate('/register', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim() || form.companyName.trim().length < 2) {
      setError('Company name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/org/register/google', {
        signupToken: token,
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
      });
      if (res.data.success) {
        applyAuth(res.data);
        toast.success(res.data.message || 'Workspace created!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not complete signup. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('session')) {
        setTimeout(() => navigate('/register', { replace: true }), 1500);
      } else if (msg.toLowerCase().includes('exists')) {
        setTimeout(() => navigate('/login', { replace: true }), 1500);
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
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 className="text-xl font-bold text-navy">Almost there!</h1>
            <p className="text-navy-500 text-sm mt-1">Your Google account is verified. Name your workspace to finish.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Company name <span className="text-danger">*</span></label>
              <input type="text" value={form.companyName} autoFocus
                onChange={e => { setForm({ ...form, companyName: e.target.value }); setError(''); }}
                placeholder="Acme Corp"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${error ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg'}`} />
              {error && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Industry <span className="text-navy-400 font-normal">(optional)</span></label>
              <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-bg text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand text-navy-700">
                <option value="">Select industry</option>
                {['Technology','Healthcare','Finance','Education','Retail','Manufacturing','Consulting','Marketing','Other'].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating workspace...</> : 'Create my workspace'}
            </button>
          </form>
        </div>
        <p className="text-center text-navy-500 text-sm mt-4">
          <Link to="/login" className="text-brand font-medium hover:text-brand-dark">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default GoogleSignupComplete;
