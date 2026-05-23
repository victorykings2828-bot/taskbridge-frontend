import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const JoinPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orgPreview, setOrgPreview] = useState(null);

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(val);
    setError('');
    setOrgPreview(null);
  };

  const handleSubmit = async (e) => {
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
      const msg = err.response?.data?.message || 'Invalid code. Please check with your administrator.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-navy-500 mb-4">You need to be signed in to join a company.</p>
          <Link to="/login" className="bg-brand text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">Sign in first</Link>
        </div>
      </div>
    );
  }

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

        <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md text-center">
          <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy mb-1">Join your company</h1>
          <p className="text-navy-500 text-sm mb-6">Enter the 8-character code your admin shared with you</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. AB12CD34"
                maxLength={8}
                className={`w-full px-4 py-4 rounded-xl border text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2 ${
                  error ? 'border-danger bg-danger/5 text-danger focus:ring-danger/20 focus:border-danger'
                        : code.length === 8 ? 'border-success bg-success/5 text-success focus:ring-success/20 focus:border-success'
                        : 'border-navy-200 bg-bg text-navy focus:ring-brand/20 focus:border-brand'
                }`}
                style={{ letterSpacing: '0.4em' }}
              />
              {error && <p className="text-danger text-xs mt-2 flex items-center justify-center gap-1"><span>⚠</span>{error}</p>}
              {code.length > 0 && code.length < 8 && !error && (
                <p className="text-navy-400 text-xs mt-2">{8 - code.length} more characters needed</p>
              )}
            </div>

            <button type="submit" disabled={submitting || code.length !== 8}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</> : 'Join company'}
            </button>
          </form>

          <div className="mt-5 p-4 bg-brand-50 border border-brand-100 rounded-xl text-left">
            <p className="text-xs text-brand font-semibold mb-1">📋 Where's my code?</p>
            <p className="text-xs text-navy-500">Your company admin can find the join code in the Admin Dashboard under Company Settings. Ask them to share it with you.</p>
          </div>
        </div>

        <p className="text-center text-navy-500 text-sm mt-4">
          <Link to="/dashboard" className="text-brand hover:text-brand-dark font-medium">← Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
