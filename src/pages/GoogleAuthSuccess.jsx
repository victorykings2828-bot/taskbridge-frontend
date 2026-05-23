import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setAccessToken } from '../utils/api';
import toast from 'react-hot-toast';

/**
 * This page handles the redirect from Google OAuth.
 * The backend sends: /auth/google/success?token=xxx&requirePasswordChange=true
 * We store the token and redirect accordingly.
 */
const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const { fetchMe } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const requirePasswordChange = searchParams.get('requirePasswordChange') === 'true';

    if (!token) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    // Store in memory only (not localStorage)
    setAccessToken(token);
    fetchMe().then(() => {
      if (requirePasswordChange) {
        toast('Please set a new password to continue.', { icon: '🔐' });
        navigate('/change-password');
      } else {
        toast.success('Signed in with Google!');
        navigate('/dashboard');
      }
    });
  }, []);

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
