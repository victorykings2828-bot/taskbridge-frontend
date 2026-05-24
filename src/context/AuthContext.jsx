import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { setAccessToken, clearAccessToken, getAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                               = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const fetchingRef = useRef(false); // prevent duplicate concurrent fetchMe calls

  // On mount — try to restore session via refresh token (HTTP-only cookie).
  // Skip entirely if we're on the /login page — there's no session to restore,
  // and firing /auth/refresh unnecessarily burns rate-limit quota.
  const fetchMe = useCallback(async () => {
    if (fetchingRef.current) return; // already in-flight
    fetchingRef.current = true;
    try {
      // If no token in memory, silently try to refresh from HTTP-only cookie
      if (!getAccessToken()) {
        const refreshRes = await api.post('/auth/refresh');
        setAccessToken(refreshRes.data.accessToken);
      }
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setRequirePasswordChange(res.data.user.isFirstLogin);
    } catch {
      // Refresh failed — not logged in
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Don't fire /auth/refresh on public pages — no session exists yet.
    const publicPaths = ['/', '/login', '/register', '/setup-account', '/forgot-password', '/terms', '/privacy', '/refund', '/contact'];
    const path = window.location.pathname;
    const isPublicPage = publicPaths.includes(path) || path.startsWith('/reset-password') || path.startsWith('/register/google') || path.startsWith('/auth/google');
    if (isPublicPage) {
      setLoading(false);
      return;
    }
    fetchMe();
  }, [fetchMe]);

  const applyAuth = useCallback((data) => {
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.user) setUser(data.user);
    setRequirePasswordChange(Boolean(data.requirePasswordChange || data.user?.isFirstLogin));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    applyAuth(res.data);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAccessToken();
    setUser(null);
    setRequirePasswordChange(false);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    // Delay clearing auth state slightly so the calling component's navigate('/login')
    // runs before ProtectedRoute sees user=null and tries to redirect itself.
    setTimeout(() => {
      clearAccessToken();
      setUser(null);
      setRequirePasswordChange(false);
    }, 100);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, requirePasswordChange,
      login, logout, changePassword, fetchMe, applyAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
