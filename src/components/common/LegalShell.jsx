import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/refund', label: 'Refund & Cancellation' },
  { to: '/contact', label: 'Contact' },
];

// Styled content primitives so the legal pages read cleanly.
export const H2 = ({ children }) => (
  <h2 className="text-lg font-semibold text-navy mt-6 mb-2">{children}</h2>
);
export const P = ({ children }) => (
  <p className="text-sm text-navy-600 leading-relaxed mb-3">{children}</p>
);
export const UL = ({ children }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-sm text-navy-600 mb-3">{children}</ul>
);

const LegalShell = ({ title, updated, children }) => (
  <div className="min-h-screen bg-bg flex flex-col">
    <header className="border-b border-navy-200 bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-navy font-bold text-lg">TaskBridge</span>
        </Link>
        <Link to="/" className="text-sm text-navy-500 hover:text-navy">← Home</Link>
      </div>
    </header>

    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy">{title}</h1>
      {updated && <p className="text-xs text-navy-400 mt-1 mb-6">Last updated: {updated}</p>}
      <div>{children}</div>
    </main>

    <footer className="border-t border-navy-200 bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {footerLinks.map((l) => (
          <Link key={l.to} to={l.to} className="text-navy-500 hover:text-brand">{l.label}</Link>
        ))}
        <span className="text-navy-300 ml-auto text-xs">© {new Date().getFullYear()} TaskBridge</span>
      </div>
    </footer>
  </div>
);

export default LegalShell;
