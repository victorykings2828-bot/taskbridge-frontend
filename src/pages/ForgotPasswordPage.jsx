import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

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

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-navy">Forgot your password?</h1>
                <p className="text-navy-500 text-sm mt-1">No problem. Enter your email and we'll send a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Email address</label>
                  <input
                    type="email" autoComplete="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@company.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand ${error ? 'border-danger bg-danger/5' : 'border-navy-200 bg-bg focus:bg-white'}`}
                  />
                  {error && <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</> : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#10B981" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="#10B981" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">Check your email</h2>
              <p className="text-navy-500 text-sm mb-1">If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.</p>
              <p className="text-navy-400 text-xs">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
            </div>
          )}
        </div>

        <p className="text-center text-navy-500 text-sm mt-4">
          <Link to="/login" className="text-brand font-medium hover:text-brand-dark flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
