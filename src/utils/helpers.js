import { format, formatDistanceToNow, isPast } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (deadline, status) => {
  if (!deadline) return false;
  if (['completed', 'cancelled'].includes(status)) return false;
  return isPast(new Date(deadline));
};

export const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500' },
};

export const STATUS_CONFIG = {
  not_started:  { label: 'Not Started',  color: 'text-navy-600',   bg: 'bg-navy-100',   border: 'border-navy-200' },
  in_progress:  { label: 'In Progress',  color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  under_review: { label: 'Under Review', color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  completed:    { label: 'Completed',    color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200' },
  overdue:      { label: 'Overdue',      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200' },
  cancelled:    { label: 'Cancelled',    color: 'text-navy-400',   bg: 'bg-surface-2',  border: 'border-navy-200' },
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  employee: 'Employee',
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const generateAvatarColor = (name = '') => {
  const colors = ['#1E2761','#7B2D8B','#0F766E','#B45309','#BE123C','#1D4ED8','#065F46'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};
