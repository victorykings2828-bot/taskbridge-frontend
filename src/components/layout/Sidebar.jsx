import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, ROLE_LABELS } from '../../utils/helpers';
import ThemeToggle from '../common/ThemeToggle';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  super_admin: [
    { to: '/dashboard',       label: 'Dashboard',          icon: GridIcon },
    { to: '/admin/managers',  label: 'Managers',           icon: BriefcaseIcon },
    { to: '/admin/employees', label: 'Employees',          icon: UsersIcon },
    { to: '/tasks',           label: 'Tasks',              icon: CheckIcon },
    { to: '/tasks/create',    label: 'Assign Task',        icon: PlusCircleIcon },
    { to: '/accounts',        label: 'Create Accounts',    icon: UsersIcon },
    { to: '/subscription',    label: 'Subscription',       icon: StarIcon },
    { to: '/analytics',       label: 'Analytics',          icon: ChartIcon },
    { to: '/audit-logs',      label: 'Audit Logs',         icon: ClipboardIcon },
    { to: '/notifications',   label: 'Notifications',      icon: BellIcon, badge: true },
  ],
  manager: [
    { to: '/dashboard',    label: 'Dashboard',    icon: GridIcon },
    { to: '/tasks',        label: 'Tasks',        icon: CheckIcon },
    { to: '/tasks/create', label: 'Assign Task',  icon: PlusCircleIcon },
    { to: '/workload',     label: 'Team Workload',icon: ChartIcon },
    { to: '/analytics',   label: 'Analytics',    icon: AnalyticsIcon },
    { to: '/accounts',     label: 'My Team',      icon: UsersIcon },
    { to: '/feedback',     label: 'Feedback',     icon: StarIcon },
    { to: '/notifications',label: 'Notifications',icon: BellIcon, badge: true },
  ],
  employee: [
    { to: '/dashboard',    label: 'Dashboard',    icon: GridIcon },
    { to: '/tasks',        label: 'My Tasks',     icon: CheckIcon },
    { to: '/feedback',     label: 'Feedback',     icon: StarIcon },
    { to: '/notifications',label: 'Notifications',icon: BellIcon, badge: true },
  ],
};

function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function BriefcaseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function PlusCircleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function BellIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ClipboardIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function StarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AnalyticsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21H4.6C4.04 21 3.76 21 3.55 20.89a1 1 0 01-.44-.44C3 20.24 3 19.96 3 19.4V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 14l4-4 3 3 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

const Sidebar = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = NAV_ITEMS[user?.role] || [];
  const initials = getInitials(user?.name || '');
  const roleLabel = ROLE_LABELS[user?.role] || user?.role;

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">TaskBridge</p>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{user?.organizationName || roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                    <Icon />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between pl-3 pr-1">
          <span className="text-slate-500 text-xs font-medium">Appearance</span>
          <ThemeToggle variant="sidebar" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 group transition-all">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate capitalize">{roleLabel}</p>
          </div>
          <button onClick={handleLogout} title="Sign out"
            className="text-slate-500 hover:text-danger transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col bg-slate-900 z-30">
        <Content />
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-white font-bold text-sm">TaskBridge</span>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <span className="bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          <button onClick={() => setMobileOpen(true)} className="text-white p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 h-full shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <Content />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
