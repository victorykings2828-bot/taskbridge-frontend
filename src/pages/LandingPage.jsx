import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ThemeToggle from '../components/common/ThemeToggle';
import { TargetIcon, ChartIcon, BellIcon, ClipboardIcon, StarIcon, LockIcon } from '../components/common/icons';

// A pricing card with a collapsible feature list. Collapsed it shows the top
// features; expanded it reveals the rest plus a "Not included" list so visitors
// can see exactly what each plan is missing.
const PlanCard = ({ plan }) => {
  const [open, setOpen] = useState(false);
  const VISIBLE = 4;
  const hi = plan.highlighted;
  const excluded = plan.excluded || [];
  const shown = open ? plan.features : plan.features.slice(0, VISIBLE);
  const hasMore = plan.features.length > VISIBLE || excluded.length > 0;

  return (
    <div className={`relative rounded-2xl p-6 border transition-all ${hi ? 'bg-brand border-brand shadow-lg shadow-brand/15 md:scale-105' : 'bg-surface border-navy-200 hover:border-brand/30 hover:shadow-card-md'}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-warning text-navy-800 text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
        </div>
      )}
      <div className="mb-4">
        <h3 className={`font-bold text-lg mb-1 ${hi ? 'text-white' : 'text-navy'}`}>{plan.name}</h3>
        <p className={`text-sm ${hi ? 'text-white/70' : 'text-navy-500'}`}>{plan.description}</p>
      </div>

      <ul className="space-y-2 mb-3">
        {shown.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${hi ? 'text-white/90' : 'text-navy-600'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
              <path d="M20 6L9 17l-5-5" stroke={hi ? '#fff' : '#10B981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {f}
          </li>
        ))}

        {open && excluded.length > 0 && (
          <>
            <li className={`pt-2 text-xs font-semibold uppercase tracking-wide ${hi ? 'text-white/50' : 'text-navy-400'}`}>Not included</li>
            {excluded.map((f, i) => (
              <li key={`x${i}`} className={`flex items-start gap-2 text-sm ${hi ? 'text-white/40 line-through' : 'text-navy-300 line-through'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                  <path d="M18 6L6 18M6 6l12 12" stroke={hi ? 'rgba(255,255,255,0.5)' : '#CBD5E1'} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                {f}
              </li>
            ))}
          </>
        )}
      </ul>

      {hasMore && (
        <button onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 text-xs font-semibold mb-5 transition-colors ${hi ? 'text-white/90 hover:text-white' : 'text-brand hover:text-brand-dark'}`}>
          {open ? 'Show less' : `Show all features${excluded.length ? ' & what’s missing' : ''}`}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {plan.ctaLink.startsWith('mailto') ? (
        <a href={plan.ctaLink}
          className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${hi ? 'bg-white text-brand hover:bg-brand-50' : 'bg-brand text-white hover:bg-brand-dark'}`}>
          {plan.cta}
        </a>
      ) : (
        <Link to={plan.ctaLink}
          className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${hi ? 'bg-white text-brand hover:bg-brand-50' : 'bg-brand text-white hover:bg-brand-dark'}`}>
          {plan.cta}
        </Link>
      )}
    </div>
  );
};

const LandingPage = () => {
  const [plans, setPlans] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('/org/plans')
      .then(r => { if (r.data.success) setPlans(r.data.plans); })
      .catch(() => {});
  }, []);

  const features = [
    { icon: <TargetIcon size={22} />,     title: 'Smart Task Assignment', desc: 'Assign tasks to the right people with priority levels, deadlines, and file attachments — all in one place.' },
    { icon: <ChartIcon size={22} />,      title: 'Real-time Progress', desc: 'Track every task from Not Started to Completed. Get overdue alerts before deadlines become problems.' },
    { icon: <BellIcon size={22} />,       title: 'Instant Notifications', desc: 'Everyone stays in the loop automatically. Assignments, reviews, feedback — notified the moment it happens.' },
    { icon: <ClipboardIcon size={22} />,  title: 'Full Audit Trail', desc: 'Every action logged. Know exactly who did what and when. Complete accountability for your team.' },
    { icon: <StarIcon size={22} />,       title: 'Feedback & Ratings', desc: 'Managers and employees rate completed tasks. Build a culture of continuous improvement.' },
    { icon: <LockIcon size={22} />,       title: 'Role-based Access', desc: 'Super Admin, Manager, and Employee roles keep the right people in the right places.' },
  ];

  const steps = [
    { n: '01', title: 'Register your company', desc: 'Create your TaskBridge workspace in under 2 minutes. Just your company name and email.' },
    { n: '02', title: 'Invite your team', desc: 'Add managers and employees by email — they sign in and set their own password.' },
    { n: '03', title: 'Start assigning work', desc: 'Create tasks, set deadlines, track progress. Your whole team, coordinated.' },
  ];

  // Fallback plans if API fetch fails
  const displayPlans = plans.length > 0 ? plans.map(p => ({
    id: p.id,
    name: p.name,
    badge: p.badge,
    highlighted: p.highlighted,
    description: p.description,
    features: p.features?.filter(f => f.included).map(f => f.text) || [],
    excluded: p.features?.filter(f => !f.included).map(f => f.text) || [],
    cta: p.id === 'enterprise' ? 'Contact us for a custom plan' : 'Get started free',
    ctaLink: p.id === 'enterprise' ? 'mailto:taskbridge111@gmail.com' : '/register',
  })) : [
    {
      id: 'free', name: 'Starter', badge: null, highlighted: false,
      description: 'Perfect for a solo manager with a small team',
      features: ['1 Manager account', 'Up to 5 employees', 'Task creation & tracking', 'In-app notifications', 'Employee & manager dashboards', 'Email support'],
      excluded: ['Task priority levels', 'Performance analytics', 'Team workload view', 'Feedback & 5-star ratings', 'Audit logs & compliance', 'File attachments & deliverables'],
      cta: 'Get started free', ctaLink: '/register',
    },
    {
      id: 'pro', name: 'Pro', badge: 'Most Popular', highlighted: true,
      description: 'Everything a growing team needs, simple and affordable',
      features: ['Up to 5 Managers', 'Up to 20 employees per manager', 'Task priority levels', 'Team workload overview', 'Feedback & 5-star ratings', 'Performance dashboards', 'Deadline overdue alerts', 'Task revision workflow'],
      excluded: ['Audit logs & export', 'Custom company branding', 'Manager benchmarking'],
      cta: 'Get started free', ctaLink: '/register',
    },
    {
      id: 'enterprise', name: 'Enterprise', badge: null, highlighted: false,
      description: 'A custom plan built around your requirements',
      features: ['Unlimited managers', 'Unlimited employees', 'Everything in Pro', 'Full audit log & export', 'Cross-team workload balancing', 'Manager benchmarking', 'Custom company branding', 'Priority support'],
      excluded: [],
      cta: 'Contact us for a custom plan', ctaLink: 'mailto:taskbridge111@gmail.com',
    },
  ];

  return (
    <div className="min-h-screen bg-bg font-sans">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-surface/95 backdrop-blur border-b border-navy-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={`font-bold text-lg ${scrolled ? 'text-navy' : 'text-white'}`}>TaskBridge</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className={`text-sm font-medium transition-colors ${scrolled ? 'text-navy-600 hover:text-navy' : 'text-white/80 hover:text-white'}`}>Features</a>
            <a href="#pricing" className={`text-sm font-medium transition-colors ${scrolled ? 'text-navy-600 hover:text-navy' : 'text-white/80 hover:text-white'}`}>Pricing</a>
            <a href="#how-it-works" className={`text-sm font-medium transition-colors ${scrolled ? 'text-navy-600 hover:text-navy' : 'text-white/80 hover:text-white'}`}>How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="ghost" className={scrolled ? '' : 'bg-white/10 border-white/20 text-white hover:text-white hover:bg-white/20'} />
            <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? 'text-navy-600 hover:text-navy' : 'text-white/80 hover:text-white'}`}>Sign in</Link>
            <Link to="/register" className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-slate-900 min-h-[92vh] flex items-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Accent blobs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span className="text-brand text-xs font-semibold tracking-wide">Trusted by growing teams</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Task management <br />
              <span className="text-brand">that bridges</span> <br />
              your whole team
            </h1>
            <p className="text-navy-400 text-lg leading-relaxed mb-8 max-w-lg">
              TaskBridge connects managers and employees in one clean workspace. Assign work, track progress, gather feedback — all with full accountability.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-brand/25">
                Start for free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 border border-navy-700 hover:border-navy-600 text-navy-400 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-all">
                Sign in to your workspace
              </Link>
            </div>
            <p className="text-navy-500 text-xs mt-4">No credit card required · Free plan available · Setup in 2 minutes</p>
          </div>

          {/* Hero card preview */}
          <div className="hidden lg:block relative">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">Team Overview</span>
                <span className="text-brand text-xs font-medium bg-brand/10 px-2 py-0.5 rounded-full">Live</span>
              </div>
              {[
                { name: 'Design landing page', user: 'Priya S.', status: 'In Progress', color: 'bg-brand/20 text-brand' },
                { name: 'Backend API review', user: 'Marcus T.', status: 'Under Review', color: 'bg-warning/20 text-warning' },
                { name: 'Database migration', user: 'Anita R.', status: 'Completed', color: 'bg-success/20 text-success' },
                { name: 'Write test cases', user: 'Dev K.', status: 'Not Started', color: 'bg-slate-700/50 text-slate-300' },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-navy-500 text-xs mt-0.5">{t.user}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand text-sm font-semibold tracking-widest uppercase">Features</span>
            <h2 className="text-3xl font-bold text-navy mt-2">Everything your team needs</h2>
            <p className="text-navy-500 mt-3 max-w-md mx-auto">A complete toolkit for task management, team coordination, and performance tracking.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-surface border border-navy-200 rounded-2xl p-6 hover:shadow-card-md hover:border-brand/30 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors">{f.icon}</div>
                <h3 className="font-semibold text-navy mb-2 group-hover:text-brand transition-colors">{f.title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand text-sm font-semibold tracking-widest uppercase">How it works</span>
            <h2 className="text-3xl font-bold text-white mt-2">Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px border-t border-dashed border-navy-700" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 border border-brand/20 mb-4">
                  <span className="text-brand font-bold text-lg">{s.n}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-navy-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand text-sm font-semibold tracking-widest uppercase">Plans</span>
            <h2 className="text-3xl font-bold text-navy mt-2">The right plan for your team size</h2>
            <p className="text-navy-500 mt-3">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {displayPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-slate-900 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to bridge your team?</h2>
          <p className="text-navy-400 mb-8">Join hundreds of teams already using TaskBridge to coordinate their work.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand/25 text-lg">
            Create your free workspace
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-navy-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-white font-bold">TaskBridge</span>
          </div>
          <p className="text-navy-500 text-sm">© {new Date().getFullYear()} TaskBridge. All rights reserved.</p>
          <div className="flex items-center flex-wrap gap-4">
            <Link to="/privacy" className="text-navy-500 hover:text-navy-400 text-sm">Privacy</Link>
            <Link to="/terms" className="text-navy-500 hover:text-navy-400 text-sm">Terms</Link>
            <Link to="/refund" className="text-navy-500 hover:text-navy-400 text-sm">Refund</Link>
            <Link to="/contact" className="text-navy-500 hover:text-navy-400 text-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
