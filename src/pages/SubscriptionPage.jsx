import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

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
    limits: '5 managers · 100 employees each',
    features: ['Up to 5 Managers','Up to 100 employees per manager','Task priority (High/Med/Low)','Team workload overview','Feedback & 5-star ratings','Performance dashboards','Deadline overdue alerts','Task revision workflow','Employee performance history'],
    notIncluded: ['Audit logs & export','Custom branding'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 6499, priceLabel: '₹6,499/mo', highlighted: false, badge: null,
    description: 'Unlimited scale, complete visibility',
    limits: 'Unlimited managers & employees',
    features: ['Everything in Pro','Unlimited managers','Unlimited employees','Full audit log & export','Cross-team workload balancing','Manager benchmarking','Custom company branding','Priority support'],
    notIncluded: [],
  },
];

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const [org, setOrg]           = useState(null);
  const [invites, setInvites]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [paying, setPaying]     = useState('');
  const [tab, setTab]           = useState('overview');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'employee' });
  const [extraGB, setExtraGB]   = useState(5);

  useEffect(() => {
    Promise.all([api.get('/org/me'), api.get('/org/invites')])
      .then(([o, i]) => {
        if (o.data.success) setOrg(o.data.organization);
        if (i.data.success) setInvites(i.data.invites);
      })
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

  const handleRotate = async () => {
    if (!window.confirm('Rotate the join code? Current one stops working immediately.')) return;
    setRotating(true);
    try {
      const res = await api.post('/org/joincode/rotate');
      if (res.data.success) { toast.success('Join code regenerated'); setOrg(p => ({ ...p, joinCode: res.data.joinCode })); }
    } catch (e) { toast.error('Failed'); }
    finally { setRotating(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/org/invite', inviteForm);
      if (res.data.success) {
        toast.success(`Invite created for ${inviteForm.email}`);
        setInvites(p => [res.data.invite, ...p]);
        navigator.clipboard?.writeText(res.data.shareText);
        toast('Invite message copied to clipboard!', { icon: '📋' });
        setInviteForm({ email: '', role: 'employee' });
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create invite'); }
  };

  const handleRevoke = async (id) => {
    try {
      await api.delete(`/org/invites/${id}`);
      setInvites(p => p.map(i => (i._id || i.id) === id ? { ...i, status: 'revoked' } : i));
      toast.success('Invite revoked');
    } catch (e) { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const currentTier = org?.subscriptionTier || 'free';
  const storage     = org?.storage;
  const storageWarn = (storage?.usedPct || 0) > 80;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans',    label: 'Upgrade' },
    { id: 'invites',  label: 'Invites' },
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.id ? 'bg-white text-navy shadow-sm border border-navy-200' : 'text-navy-500 hover:text-navy'}`}>
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
                <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-1">Join code</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-mono font-bold text-navy text-xl tracking-[0.3em] bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg">{org.joinCode}</span>
                  <button onClick={() => { navigator.clipboard.writeText(org.joinCode); toast.success('Join code copied!'); }} title="Copy code"
                    className="p-2 text-navy-400 hover:text-brand border border-navy-200 rounded-lg transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg>
                  </button>
                  <button onClick={handleRotate} disabled={rotating} title="Regenerate"
                    className="p-2 text-navy-400 hover:text-danger border border-navy-200 rounded-lg transition-all">
                    {rotating
                      ? <span className="block w-4 h-4 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    }
                  </button>
                </div>
                <p className="text-navy-400 text-xs mt-1">Rotates after each use</p>
                <button onClick={() => {
                  const joinUrl = `${window.location.origin}/join`;
                  navigator.clipboard.writeText(`Join our workspace on TaskBridge!\nJoin link: ${joinUrl}\nCode: ${org.joinCode}`);
                  toast.success('Join details copied! Share with your team.');
                }} className="mt-2 text-xs text-brand font-medium hover:text-brand-dark flex items-center gap-1 ml-auto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Copy join link to share
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Managers',    used: org.usage?.managers  || 0, limit: org.limits?.managers,            icon: '👔' },
                { label: 'Employees',   used: org.usage?.employees || 0, limit: org.limits?.totalEmployees,      icon: '👥' },
                { label: 'Per manager', used: '—',                        limit: org.limits?.employeesPerManager, icon: '📊' },
              ].map(({ label, used, limit, icon }) => (
                <div key={label} className="bg-bg rounded-xl p-3 border border-navy-200">
                  <div className="flex items-center gap-1.5 mb-1"><span>{icon}</span><p className="text-xs text-navy-500 font-medium">{label}</p></div>
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
                  <p className="text-white/75 text-sm">5 managers, 100 employees each, performance dashboards, workload view, feedback ratings and more.</p>
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
              const isUpgrade  = plan.price && !isCurrent && !isDowngrade;
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

      {/* ── INVITES ── */}
      {tab === 'invites' && (
        <div className="space-y-5">
          <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-navy mb-1">Send invite</h3>
            <p className="text-navy-500 text-xs mb-4">One-time code. Expires in 48 hours.</p>
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
              <input type="email" placeholder="employee@company.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} required
                className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-navy-200 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-bg" />
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                className="px-4 py-2.5 rounded-xl border border-navy-200 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-bg text-navy">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
              <button type="submit" className="bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">Send</button>
            </form>
          </div>

          <div className="bg-surface border border-navy-200 rounded-2xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-navy-200"><h3 className="font-semibold text-navy">Invite history</h3></div>
            {invites.length === 0
              ? <p className="px-6 py-10 text-navy-400 text-sm text-center">No invites sent yet</p>
              : <div className="divide-y divide-navy-100">
                  {invites.map(inv => (
                    <div key={inv._id || inv.id} className="flex items-center justify-between px-6 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-navy font-medium truncate">{inv.email}</p>
                        <p className="text-xs text-navy-400 capitalize">{inv.role} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${inv.status === 'accepted' ? 'bg-success/10 text-success' : inv.status === 'pending' ? 'bg-brand/10 text-brand' : 'bg-navy-100 text-navy-400'}`}>{inv.status}</span>
                        {inv.status === 'pending' && <button onClick={() => handleRevoke(inv._id || inv.id)} className="text-xs text-danger hover:underline">Revoke</button>}
                      </div>
                    </div>
                  ))}
                </div>
            }
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
