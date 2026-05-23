/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 60-30-10 Rule:
        // 60% = bg (near-white surfaces)
        // 30% = navy (sidebar, headers, text)
        // 10% = brand/accent (CTAs, highlights, active states)

        // 60% — backgrounds & surfaces
        bg:        '#F8FAFC',
        surface:   '#FFFFFF',
        'surface-2': '#F1F5F9',

        // 30% — navy (structural / text)
        navy:      '#0F172A',
        'navy-800':'#1E293B',
        'navy-700':'#334155',
        'navy-600':'#475569',
        'navy-500':'#64748B',
        'navy-400':'#94A3B8',
        'navy-200':'#E2E8F0',
        'navy-100':'#F1F5F9',

        // 10% — brand accent
        brand:     '#0EA5E9',
        'brand-dark': '#0284C7',
        'brand-light': '#38BDF8',
        'brand-50': '#F0F9FF',
        'brand-100':'#E0F2FE',
        primary:   '#0EA5E9',
        'primary-light': '#38BDF8',

        // Semantics
        success:   '#10B981',
        warning:   '#F59E0B',
        danger:    '#EF4444',
        info:      '#6366F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
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
