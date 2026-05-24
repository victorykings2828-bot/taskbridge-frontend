import React, { useEffect, useState } from 'react';

const getInitialTheme = () => {
  try {
    // Dark is the default; only honor an explicit 'light' choice.
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const apply = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem('theme', theme); } catch {}
};

// `variant` controls coloring: 'sidebar' (on dark sidebar), 'ghost' (on light/landing).
const ThemeToggle = ({ variant = 'ghost', className = '' }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => { apply(theme); }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const isDark = theme === 'dark';

  const base = 'inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all';
  const styles = variant === 'sidebar'
    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
    : 'text-navy-500 hover:text-navy border border-navy-200 hover:border-brand/40 bg-surface';

  return (
    <button type="button" onClick={toggle} aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${base} ${styles} ${className}`}>
      {isDark ? (
        // Sun
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ) : (
        // Moon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
