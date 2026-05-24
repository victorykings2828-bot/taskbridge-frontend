/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // All theme tokens are driven by CSS variables (see index.css) so a
        // single `.dark` class on <html> re-themes the entire app. The token
        // NAMES are unchanged, so no component markup needs to change.

        // 60% — backgrounds & surfaces
        bg:          v('--c-bg'),
        surface:     v('--c-surface'),
        'surface-2': v('--c-surface-2'),

        // 30% — navy scale (text & borders in light; inverts to light in dark)
        navy:       v('--c-navy'),
        'navy-800': v('--c-navy-800'),
        'navy-700': v('--c-navy-700'),
        'navy-600': v('--c-navy-600'),
        'navy-500': v('--c-navy-500'),
        'navy-400': v('--c-navy-400'),
        'navy-200': v('--c-navy-200'),
        'navy-100': v('--c-navy-100'),

        // 10% — brand accent
        brand:          v('--c-brand'),
        'brand-dark':   v('--c-brand-dark'),
        'brand-light':  v('--c-brand-light'),
        'brand-50':     v('--c-brand-50'),
        'brand-100':    v('--c-brand-100'),
        primary:        v('--c-brand'),
        'primary-light':v('--c-brand-light'),

        // Semantics
        success: v('--c-success'),
        warning: v('--c-warning'),
        danger:  v('--c-danger'),
        info:    v('--c-info'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:      'var(--shadow-card)',
        'card-md': 'var(--shadow-card-md)',
        'card-lg': 'var(--shadow-card-lg)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
