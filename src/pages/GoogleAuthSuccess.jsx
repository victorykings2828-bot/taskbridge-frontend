import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken } from '../utils/api';
import toast from 'react-hot-toast';

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

// Decode a JWT payload (no verification — display only). Server verifies on select.
const decodeJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { return null; }
};

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const { fetchMe, applyAuth } = useAuth();
  const navigate = useNavigate();

  const selectToken = searchParams.get('selectToken');
  const [workspaces, setWorkspaces] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Multiple workspaces → show the picker (don't auto-login).
    if (selectToken) {
      const payload = decodeJwt(selectToken);
      if (payload?.workspaces?.length) {
        setWorkspaces(payload.workspaces);
      } else {
        toast.error('Could not read your workspaces. Please sign in again.');
        navigate('/login', { replace: true });
      }
      return;
    }

    // Single workspace → token flow.
    const token = searchParams.get('token');
    const requirePasswordChange = searchParams.get('requirePasswordChange') === 'true';
    if (!token) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }
    setAccessToken(token);
    fetchMe().then(() => {
      if (requirePasswordChange) {
        toast('Please set a new password to continue.', { icon: '🔐' });
        navigate('/change-password', { replace: true });
      } else {
        toast.success('Signed in with Google!');
        navigate('/dashboard', { replace: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (userId) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/select-workspace', { selectionToken: selectToken, userId });
      applyAuth(res.data);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open that workspace. Please sign in again.');
      navigate('/login', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  // Workspace picker
  if (selectToken && workspaces.length > 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Logo />
          <div className="bg-surface border border-navy-200 rounded-2xl p-7 shadow-card-md">
            <h1 className="text-xl font-bold text-navy mb-1">Choose a workspace</h1>
            <p className="text-navy-500 text-sm mb-5">Your Google account belongs to more than one company.</p>
            <div className="space-y-2">
              {workspaces.map((w) => (
                <button key={w.userId} onClick={() => pick(w.userId)} disabled={submitting}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-navy-200 hover:border-brand hover:bg-brand-50 transition-all text-left disabled:opacity-60">
                  <span>
                    <span className="block text-sm font-semibold text-navy">{w.name}</span>
                    <span className="block text-xs text-navy-400 capitalize">{(w.role || '').replace('_', ' ')}</span>
                  </span>
                  <span className="text-brand">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (single-workspace flow)
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-navy-500 text-sm">Completing Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
