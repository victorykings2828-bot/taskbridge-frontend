import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const HEALTH_URL = API_BASE.replace(/\/api\/?$/, '') + '/health';

// RFC 5322 compliant email regex
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

const LoginPage = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverState, setServerState] = useState('checking');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_failed') toast.error('Google sign-in failed. Make sure your email is registered.');
  }, [searchParams]);

  // Ping health endpoint on mount to pre-warm Render's free-tier server.
  // If no response within 2.5s, show a "starting up" notice so the user
  // knows why sign-in may be briefly slow.
  useEffect(() => {
    const controller = new AbortController();
    const wakeTimer = setTimeout(() => setServerState('waking'), 2500);

    fetch(HEALTH_URL, { signal: controller.signal })
      .then(res => {
        clearTimeout(wakeTimer);
        setServerState(res.ok ? 'ready' : 'ready');
      })
      .catch(() => {
        clearTimeout(wakeTimer);
        setServerState('ready');
      });

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
    const e = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
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
      if (data.requirePasswordChange) {
        toast('Please change your temporary password to continue', { icon: '🔐' });
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
      if (status === 429) {
        toast.error(msg);
      } else if (status === 403) {
        toast.error(msg);
      } else {
        setErrors({ password: 'Incorrect email or password' });
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
          <h1 className="text-xl font-bold text-navy mb-1">Sign in to your workspace</h1>
          <p className="text-navy-500 text-sm mb-6">Enter your credentials to continue</p>

          {/* Google */}
          <button type="button" onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-navy-200 rounded-xl py-3 px-4 text-sm font-medium text-navy-700 hover:bg-surface-2 hover:border-navy-300 transition-all mb-5">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.147-3.2-.418-4.698H24.48v8.879h12.984c-.56 3.016-2.26 5.571-4.813 7.284v6.054h7.79c4.558-4.2 7.09-10.388 7.09-17.52z" fill="#4285F4"/>
              <path d="M24.48 48c6.516 0 11.982-2.16 15.976-5.85l-7.79-6.054c-2.16 1.449-4.92 2.304-8.186 2.304-6.3 0-11.638-4.254-13.548-9.976H2.932v6.248C6.908 42.672 15.088 48 24.48 48z" fill="#34A853"/>
              <path d="M10.932 28.424A14.4 14.4 0 0 1 10.2 24c0-1.54.262-3.036.732-4.424v-6.248H2.932A23.94 23.94 0 0 0 .48 24c0 3.864.924 7.524 2.452 10.672l8-6.248z" fill="#FBBC05"/>
              <path d="M24.48 9.6c3.552 0 6.738 1.22 9.246 3.624l6.934-6.934C36.454 2.376 30.996 0 24.48 0 15.088 0 6.908 5.328 2.932 13.328l8 6.248C12.842 13.854 18.18 9.6 24.48 9.6z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-navy-200" />
            <span className="text-xs text-navy-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-navy-200" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email address</label>
              <div className="relative">
                <input type="email" autoComplete="email" inputMode="email" spellCheck="false" autoCapitalize="none"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); if (touched.email) setErrors({ ...errors, email: validateEmail(e.target.value) }); }}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@company.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${
                    errors.email && touched.email ? 'border-danger bg-danger/5 focus:ring-danger/20 focus:border-danger' : 'border-navy-200 bg-bg focus:bg-white focus:ring-brand/20 focus:border-brand'
                  }`}
                />
                {touched.email && !errors.email && form.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</div>
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.email}</p>
              )}
            </div>

              <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-navy-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand hover:text-brand-dark transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); if (touched.password) setErrors({ ...errors, password: '' }); }}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${
                    errors.password && touched.password ? 'border-danger bg-danger/5 focus:ring-danger/20 focus:border-danger' : 'border-navy-200 bg-bg focus:bg-white focus:ring-brand/20 focus:border-brand'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-navy-500 hover:text-navy-700 transition-colors px-1">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm hover:shadow-md mt-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                : 'Sign in'}
            </button>
          </form>
          {serverState === 'waking' && (
            <div className="mt-4 flex items-center gap-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Server is starting up (free tier) — fill in your details while you wait ~30s</span>
            </div>
          )}
        </div>

        <div className="mt-4 text-center space-y-2">
          <p className="text-navy-500 text-sm">
            New to TaskBridge?{' '}
            <Link to="/register" className="text-brand font-semibold hover:text-brand-dark">Create a workspace</Link>
          </p>
          <p className="text-navy-400 text-xs">
            Employee?{' '}
            <Link to="/join" className="text-brand hover:text-brand-dark">Join with company code</Link>
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="mt-4 bg-navy/5 border border-navy-200 rounded-xl p-4 text-xs text-navy-600">
            <p className="font-semibold text-navy mb-1">🧪 Dev credentials</p>
            <p>Super Admin: superadmin@company.com / SuperAdmin@123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
