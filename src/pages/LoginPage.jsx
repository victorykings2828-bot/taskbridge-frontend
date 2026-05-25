import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const HEALTH_URL = API_BASE.replace(/\/api\/?$/, '') + '/health';

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const Logo = () => (
  <div className="flex items-center gap-2.5 justify-center mb-8">
    <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/40">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <span className="text-white font-bold text-2xl tracking-tight drop-shadow">TaskBridge</span>
  </div>
);

// Floating particles rendered once, positions fixed by index
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top:  `${(i * 53 + 7)  % 100}%`,
  size: 1.5 + (i % 3) * 1.5,
  delay: `${(i * 0.4) % 4}s`,
  dur:   `${3 + (i % 4)}s`,
  opacity: 0.15 + (i % 4) * 0.06,
}));

const LoginPage = () => {
  const { user, login, applyAuth, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverState, setServerState] = useState('checking');
  const [workspaceChoice, setWorkspaceChoice] = useState(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_failed') toast.error('Google sign-in failed. Make sure your email is registered.');
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const wakeTimer = setTimeout(() => setServerState('waking'), 2500);
    fetch(HEALTH_URL, { signal: controller.signal })
      .then(res => { clearTimeout(wakeTimer); setServerState(res.ok ? 'ready' : 'ready'); })
      .catch(() => { clearTimeout(wakeTimer); setServerState('ready'); });
    return () => { clearTimeout(wakeTimer); controller.abort(); };
  }, []);

  if (!loading && user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (email.length > 254) return 'Email is too long';
    if (!EMAIL_RE.test(email)) return 'Enter a valid email address (e.g. you@company.com)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    return '';
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'email') setErrors({ ...errors, email: validateEmail(form.email) });
    if (field === 'password') setErrors({ ...errors, password: validatePassword(form.password) });
  };

  const validate = () => {
    const e = { email: validateEmail(form.email), password: validatePassword(form.password) };
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = await login(form.email.trim().toLowerCase(), form.password);
      if (data.setupRequired) {
        toast('Welcome! Set a password to finish setting up your account.', { icon: '🔐' });
        navigate('/setup-account', { replace: true, state: { email: data.email || form.email.trim().toLowerCase() } });
        return;
      }
      if (data.chooseWorkspace) {
        setWorkspaceChoice({ selectionToken: data.selectionToken, workspaces: data.workspaces || [] });
        return;
      }
      if (data.requirePasswordChange) {
        toast('Please set a new password to continue', { icon: '🔐' });
        navigate('/change-password', { replace: true });
      } else {
        const firstName = data.user.name.split(' ')[0];
        toast.success(`Welcome back, ${firstName}!`);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign in failed. Please check your credentials.';
      const status = err.response?.status;
      if (status === 429 || status === 403) toast.error(msg);
      else setErrors({ password: 'Incorrect email or password' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWorkspace = async (userId) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/select-workspace', { selectionToken: workspaceChoice.selectionToken, userId });
      applyAuth(res.data);
      const firstName = res.data.user.name.split(' ')[0];
      toast.success(`Welcome back, ${firstName}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open that workspace. Please sign in again.');
      setWorkspaceChoice(null);
    } finally {
      setSubmitting(false);
    }
  };

  const BG = (
    <>
      {/* keyframe animations injected once */}
      <style>{`
        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-30px) scale(1.08); }
          66%      { transform: translate(-25px,20px) scale(0.95); }
        }
        @keyframes orb-drift-r {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-35px,25px) scale(1.06); }
          66%      { transform: translate(30px,-20px) scale(0.97); }
        }
        @keyframes orb-drift-s {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,30px) scale(1.1); }
        }
        @keyframes particle-pulse {
          0%,100% { opacity: var(--op); transform: scale(1); }
          50%      { opacity: calc(var(--op) * 2.2); transform: scale(1.6); }
        }
        @keyframes grid-fade {
          0%,100% { opacity: 0.035; }
          50%      { opacity: 0.06; }
        }
      `}</style>

      {/* deep dark base */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#020817 0%,#0a1628 50%,#020817 100%)' }} />

      {/* orb 1 — brand cyan/blue */}
      <div className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width:520, height:520, top:'-10%', left:'-8%',
          background:'radial-gradient(circle,rgba(14,165,233,0.28) 0%,transparent 70%)',
          animation:'orb-drift 14s ease-in-out infinite' }} />

      {/* orb 2 — indigo/violet */}
      <div className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width:460, height:460, bottom:'-12%', right:'-6%',
          background:'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)',
          animation:'orb-drift-r 18s ease-in-out infinite' }} />

      {/* orb 3 — teal accent, center */}
      <div className="absolute rounded-full blur-2xl pointer-events-none"
        style={{ width:300, height:300, top:'40%', left:'55%',
          background:'radial-gradient(circle,rgba(34,211,238,0.14) 0%,transparent 70%)',
          animation:'orb-drift-s 10s ease-in-out infinite' }} />

      {/* orb 4 — warm rose, top-right */}
      <div className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width:280, height:280, top:'5%', right:'10%',
          background:'radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)',
          animation:'orb-drift 22s ease-in-out infinite reverse' }} />

      {/* dot-grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'radial-gradient(rgba(148,163,184,0.18) 1px,transparent 1px)',
          backgroundSize:'32px 32px', animation:'grid-fade 8s ease-in-out infinite' }} />

      {/* floating particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            background: i % 3 === 0 ? '#0ea5e9' : i % 3 === 1 ? '#818cf8' : '#22d3ee',
            '--op': p.opacity,
            opacity: p.opacity,
            animation: `particle-pulse ${p.dur} ${p.delay} ease-in-out infinite`,
          }} />
      ))}
    </>
  );

  // Workspace picker
  if (workspaceChoice) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {BG}
        <div className="relative z-10 w-full max-w-md">
          <Logo />
          <div className="rounded-2xl p-7 shadow-2xl border border-white/10"
            style={{ background:'rgba(15,23,42,0.75)', backdropFilter:'blur(20px)' }}>
            <h1 className="text-xl font-bold text-white mb-1">Choose a workspace</h1>
            <p className="text-slate-400 text-sm mb-5">Your account belongs to more than one company. Pick one to continue.</p>
            <div className="space-y-2">
              {workspaceChoice.workspaces.map((w) => (
                <button key={w.userId} onClick={() => handleSelectWorkspace(w.userId)} disabled={submitting}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-brand/50 hover:bg-brand/10 transition-all text-left disabled:opacity-60">
                  <span>
                    <span className="block text-sm font-semibold text-white">{w.name}</span>
                    <span className="block text-xs text-slate-400 capitalize">{(w.role || '').replace('_', ' ')}</span>
                  </span>
                  <span className="text-brand">→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setWorkspaceChoice(null)} className="mt-5 text-sm text-slate-400 hover:text-white transition-colors">← Back to sign in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {BG}

      <div className="relative z-10 w-full max-w-md">
        <Logo />

        {/* Glass card */}
        <div className="rounded-2xl p-7 shadow-2xl border border-white/10"
          style={{ background:'rgba(15,23,42,0.78)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)' }}>

          <h1 className="text-xl font-bold text-white mb-1">Sign in to your workspace</h1>
          <p className="text-slate-400 text-sm mb-6">Enter your credentials to continue</p>

          {/* Google */}
          <button type="button" onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 hover:bg-white/5 hover:border-white/20 transition-all mb-5">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.147-3.2-.418-4.698H24.48v8.879h12.984c-.56 3.016-2.26 5.571-4.813 7.284v6.054h7.79c4.558-4.2 7.09-10.388 7.09-17.52z" fill="#4285F4"/>
              <path d="M24.48 48c6.516 0 11.982-2.16 15.976-5.85l-7.79-6.054c-2.16 1.449-4.92 2.304-8.186 2.304-6.3 0-11.638-4.254-13.548-9.976H2.932v6.248C6.908 42.672 15.088 48 24.48 48z" fill="#34A853"/>
              <path d="M10.932 28.424A14.4 14.4 0 0 1 10.2 24c0-1.54.262-3.036.732-4.424v-6.248H2.932A23.94 23.94 0 0 0 .48 24c0 3.864.924 7.524 2.452 10.672l8-6.248z" fill="#FBBC05"/>
              <path d="M24.48 9.6c3.552 0 6.738 1.22 9.246 3.624l6.934-6.934C36.454 2.376 30.996 0 24.48 0 15.088 0 6.908 5.328 2.932 13.328l8 6.248C12.842 13.854 18.18 9.6 24.48 9.6z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <input type="email" autoComplete="email" inputMode="email" spellCheck="false" autoCapitalize="none"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); if (touched.email) setErrors({ ...errors, email: validateEmail(e.target.value) }); }}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@company.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 text-white placeholder-slate-500 ${
                    errors.email && touched.email
                      ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/20'
                      : 'border-white/10 bg-white/5 focus:bg-white/8 focus:ring-brand/30 focus:border-brand/50'
                  }`}
                />
                {touched.email && !errors.email && form.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</div>
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand hover:text-sky-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); if (touched.password) setErrors({ ...errors, password: '' }); }}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all focus:ring-2 text-white placeholder-slate-500 ${
                    errors.password && touched.password
                      ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/20'
                      : 'border-white/10 bg-white/5 focus:bg-white/8 focus:ring-brand/30 focus:border-brand/50'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors px-1">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-brand hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-brand/30 hover:shadow-brand/50 mt-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                : 'Sign in'}
            </button>
          </form>

          {serverState === 'waking' && (
            <div className="mt-4 flex items-center gap-2.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Server is starting up (free tier) — fill in your details while you wait ~30s</span>
            </div>
          )}
        </div>

        <div className="mt-4 text-center space-y-2">
          <p className="text-slate-400 text-sm">
            New to TaskBridge?{' '}
            <Link to="/register" className="text-brand font-semibold hover:text-sky-300">Create a workspace</Link>
          </p>
          <p className="text-slate-500 text-xs">
            Invited by your company? Just sign in with your email — you'll set your password on first login.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="mt-4 border border-white/10 rounded-xl p-4 text-xs text-slate-400" style={{ background:'rgba(255,255,255,0.03)' }}>
            <p className="font-semibold text-slate-300 mb-1">Dev credentials</p>
            <p>Super Admin: superadmin@company.com / SuperAdmin@123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
