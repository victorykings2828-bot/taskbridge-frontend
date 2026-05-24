import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { BriefcaseIcon, UsersIcon, ChartIcon } from '../components/common/icons';

const fmt = (b) => {
  if (!b) return '0 B';
  if (b < 1024**2) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1024**3) return `${(b/1024**2).toFixed(1)} MB`;
  return `${(b/1024**3).toFixed(2)} GB`;
};

// Load Razorpay script dynamically
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload  = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const PLANS = [
  {
    id: 'free', name: 'Starter', price: null, priceLabel: 'Free', highlighted: false, badge: null,
    description: 'Perfect for one manager with a small team',
    limits: '1 manager · 5 employees',
    features: ['1 Manager account','Up to 5 employees','Task creation & tracking','In-app notifications','Employee & manager dashboards','Email support'],
    notIncluded: ['Task priority levels','Performance analytics','Team workload view','Feedback & ratings','Audit logs'],
  },
  {
    id: 'pro', name: 'Pro', price: 1249, priceLabel: '₹1,249/mo', highlighted: true, badge: 'Most Popular',
    description: 'Everything a growing team needs',
    limits: '5 managers · 20 employees each',
    features: ['Up to 5 Managers','Up to 20 employees per manager','Task priority (High/Med/Low)','Team workload overview','Feedback & 5-star ratings','Performance dashboards','Deadline overdue alerts','Task revision workflow','Employee performance history'],
    notIncluded: ['Audit logs & export','Custom branding'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, priceLabel: 'Custom', highlighted: false, badge: null,
    description: 'A custom plan built around your requirements',
    limits: 'Unlimited managers & employees',
    features: ['Everything in Pro','Unlimited managers','Unlimited employees','Full audit log & export','Cross-team workload balancing','Manager benchmarking','Custom company branding','Priority support'],
    notIncluded: [],
  },
];

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const [org, setOrg]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [paying, setPaying]     = useState('');
  const [tab, setTab]           = useState('overview');
  const [extraGB, setExtraGB]   = useState(5);

  useEffect(() => {
    api.get('/org/me')
      .then((o) => { if (o.data.success) setOrg(o.data.organization); })
      .catch(() => toast.error('Failed to load workspace info'))
      .finally(() => setLoading(false));
  }, []);

  const loadOrg = () => api.get('/org/me').then(r => r.data.success && setOrg(r.data.organization));

  // ── Razorpay checkout ──────────────────────────────────────────────────
  const openRazorpay = async (orderData, onSuccess) => {
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Failed to load payment gateway. Check your internet.'); return; }

    const options = {
      key:         orderData.keyId,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'TaskBridge',
      description: orderData.description,
      order_id:    orderData.orderId,
      prefill:     orderData.prefill,
      theme:       { color: '#0EA5E9' },
      modal: {
        ondismiss: () => { setPaying(''); toast('Payment cancelled', { icon: 'ℹ️' }); }
      },
      handler: async (response) => {
        try {
          const res = await api.post('/payments/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
          if (res.data.success) {
            toast.success(res.data.message);
            onSuccess(res.data);
            await loadOrg();
          }
        } catch (e) {
          toast.error(e.response?.data?.message || 'Payment verification failed');
        } finally {
          setPaying('');
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      toast.error(`Payment failed: ${resp.error.description}`);
      setPaying('');
    });
    rzp.open();
  };

  const handleUpgrade = async (tier) => {
    setPaying(tier);
    try {
      const res = await api.post('/payments/create-order/plan', { tier });
      if (res.data.success) {
        await openRazorpay(res.data, (data) => {
          setOrg(prev => prev ? { ...prev, subscriptionTier: data.tier } : prev);
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start payment');
      setPaying('');
    }
  };

  const handleBuyStorage = async () => {
    setPaying('storage');
    try {
      const res = await api.post('/payments/create-order/storage', { extraGB });
      if (res.data.success) {
        await openRazorpay(res.data, () => {});
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start payment');
      setPaying('');
    }
  };

  const handleClean = async () => {
    if (!window.confirm('Delete file attachments from completed tasks older than 90 days?')) return;
    setCleaning(true);
    try {
      const res = await api.delete('/org/storage/clean');
      if (res.data.success) { toast.success(res.data.message); loadOrg(); }
    } catch (e) { toast.error('Cleanup failed'); }
    finally { setCleaning(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const currentTier = org?.subscriptionTier || 'free';
  const storage     = org?.storage;
  const storageWarn = (storage?.usedPct || 0) > 80;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans',    label: 'Upgrade' },
    { id: 'storage',  label: `Storage${storageWarn ? ' ⚠' : ''}` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Subscription & Workspace</h1>
        <p className="text-navy-500 text-sm mt-1">Manage your plan, team access, and storage</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl border border-navy-200 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.id ? 'bg-surface text-navy shadow-sm border border-navy-200' : 'text-navy-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && org && (
        <div className="space-y-5">
          <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-0.5">Current plan</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-navy capitalize">{currentTier === 'free' ? 'Starter' : currentTier}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${org.subscriptionStatus === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {org.subscriptionStatus}
                  </span>
                </div>
                <p className="text-navy-500 text-sm mt-0.5">{org.name}</p>
                {org.subscriptionExpiresAt && currentTier !== 'free' && (
                  <p className="text-navy-400 text-xs mt-1">Renews: {new Date(org.subscriptionExpiresAt).toLocaleDateString('en-IN')}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-1">Team</p>
                <p className="text-sm text-navy">
                  Add managers & employees in <span className="font-medium">Create Accounts</span>.
                </p>
                <p className="text-navy-400 text-xs mt-1">They sign in with their email and set their own password.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Managers',    used: org.usage?.managers  || 0, limit: org.limits?.managers,            icon: <BriefcaseIcon size={15} /> },
                { label: 'Employees',   used: org.usage?.employees || 0, limit: org.limits?.totalEmployees,      icon: <UsersIcon size={15} /> },
                { label: 'Per manager', used: '—',                        limit: org.limits?.employeesPerManager, icon: <ChartIcon size={15} /> },
              ].map(({ label, used, limit, icon }) => (
                <div key={label} className="bg-bg rounded-xl p-3 border border-navy-200">
                  <div className="flex items-center gap-1.5 mb-1"><span className="text-brand">{icon}</span><p className="text-xs text-navy-500 font-medium">{label}</p></div>
                  <p className="text-sm font-bold text-navy">{used}<span className="text-navy-400 font-normal"> / {limit >= 9999 ? '∞' : limit}</span></p>
                </div>
              ))}
            </div>
          </div>

          {currentTier === 'free' && (
            <div className="bg-brand rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-lg mb-1">Upgrade to Pro — ₹1,249/month</p>
                  <p className="text-white/75 text-sm">5 managers, 20 employees each, performance dashboards, workload view, feedback ratings and more.</p>
                  <p className="text-white/50 text-xs mt-1.5">Pay securely via UPI, cards, or net banking · Cancel anytime</p>
                </div>
                <button onClick={() => handleUpgrade('pro')} disabled={!!paying}
                  className="flex-shrink-0 bg-white text-brand font-bold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-60 text-sm whitespace-nowrap">
                  {paying === 'pro' ? 'Loading...' : 'Upgrade now →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PLANS ── */}
      {tab === 'plans' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const isCurrent  = plan.id === currentTier;
              const isDowngrade= plan.id === 'free' && currentTier !== 'free';
              const isContact  = plan.id === 'enterprise' && !isCurrent; // custom / sales-led
              const isUpgrade  = plan.price && !isCurrent && !isDowngrade && !isContact;
              return (
                <div key={plan.id} className={`relative rounded-2xl p-5 border bg-surface transition-all ${plan.highlighted ? 'border-brand shadow-card-lg' : 'border-navy-200'} ${isCurrent ? 'ring-2 ring-brand' : ''}`}>
                  {isCurrent && <div className="absolute -top-3 left-4"><span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">Current plan</span></div>}
                  {plan.badge && !isCurrent && <div className="absolute -top-3 left-4"><span className="bg-warning text-navy text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span></div>}

                  <div className="mb-3 mt-1">
                    <div className="flex items-end justify-between">
                      <h3 className="font-bold text-navy text-base">{plan.name}</h3>
                      <p className="text-xl font-bold text-navy">{plan.priceLabel}</p>
                    </div>
                    <p className="text-navy-400 text-xs mt-0.5">{plan.limits}</p>
                    <p className="text-navy-500 text-xs mt-1">{plan.description}</p>
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                        <span className="text-success font-bold flex-shrink-0 mt-0.5">✓</span>{f}
                      </li>
                    ))}
                    {plan.notIncluded?.map((f, i) => (
                      <li key={`n${i}`} className="flex items-start gap-2 text-xs text-navy-300">
                        <span className="flex-shrink-0 mt-0.5">–</span>{f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent && <div className="w-full py-2 rounded-xl text-xs font-semibold bg-brand/10 text-brand border border-brand/20 text-center">Current plan ✓</div>}
                  {isDowngrade && <div className="w-full py-2 rounded-xl text-xs bg-navy-100 text-navy-400 text-center cursor-not-allowed">Cannot downgrade</div>}
                  {isUpgrade && (
                    <button onClick={() => handleUpgrade(plan.id)} disabled={!!paying}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
                      {paying === plan.id
                        ? <><span className="block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Opening payment...</>
                        : `Pay ${plan.priceLabel} →`}
                    </button>
                  )}
                  {isContact && (
                    <a href="mailto:taskbridge111@gmail.com?subject=TaskBridge%20Enterprise%20plan%20enquiry"
                      className="block w-full py-2 rounded-xl text-xs font-semibold bg-navy text-white hover:bg-navy-800 transition-all text-center">
                      Contact us for a custom plan
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-surface-2 border border-navy-200 rounded-xl p-4 text-xs text-navy-400 space-y-1">
            <p>💳 Payments powered by <strong className="text-navy-600">Razorpay</strong> — supports UPI, debit/credit cards, and net banking.</p>
            <p>🔒 Your payment details are encrypted and never stored on our servers.</p>
            <p>📧 Payment receipts are sent to your email automatically.</p>
          </div>
        </div>
      )}

      {/* ── STORAGE ── */}
      {tab === 'storage' && (
        <div className="space-y-5">
          <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-navy mb-4">Storage usage</h3>
            <div className="flex items-end justify-between mb-2">
              <p className="text-3xl font-bold text-navy">{storage?.usedFormatted || '0 MB'}<span className="text-navy-400 text-base font-normal"> used</span></p>
              <p className={`text-sm font-medium ${storageWarn ? 'text-danger' : 'text-navy-400'}`}>{storage?.usedPct || 0}% of plan</p>
            </div>
            <div className="h-3 bg-navy-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${(storage?.usedPct||0) > 80 ? 'bg-danger' : (storage?.usedPct||0) > 60 ? 'bg-warning' : 'bg-brand'}`} style={{ width: `${storage?.usedPct||0}%` }} />
            </div>
          </div>

          {currentTier !== 'free' ? (
            <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
              <h3 className="font-semibold text-navy mb-1">Add extra storage</h3>
              <p className="text-navy-500 text-sm mb-4">₹125 per 5 GB / month · pay via UPI or card · added instantly after payment</p>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={extraGB} onChange={e => setExtraGB(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-navy-200 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-bg text-navy">
                  {[5,10,20,50,100].map(g => <option key={g} value={g}>{g} GB — ₹{((g/5)*125)}/mo</option>)}
                </select>
                <button onClick={handleBuyStorage} disabled={!!paying}
                  className="bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2">
                  {paying === 'storage'
                    ? <><span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opening payment...</>
                    : `Pay ₹${((extraGB/5)*125)}/mo for ${extraGB} GB →`}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
              <p className="text-brand font-medium text-sm mb-1">Extra storage requires Pro or Enterprise plan.</p>
              <button onClick={() => setTab('plans')} className="text-brand text-sm underline">View plans →</button>
            </div>
          )}

          <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-navy mb-1">Free up space</h3>
            <p className="text-navy-500 text-sm mb-4">Remove file attachments from completed tasks older than 90 days.</p>
            <button onClick={handleClean} disabled={cleaning}
              className="bg-danger/10 text-danger hover:bg-danger hover:text-white border border-danger/20 font-medium px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center gap-2">
              {cleaning ? <><span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Cleaning...</> : '🗑 Clean archived files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
