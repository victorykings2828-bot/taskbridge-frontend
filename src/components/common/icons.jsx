import React from 'react';

// Clean, consistent line icons (inherit color via currentColor).
const S = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const TasksIcon       = (p) => <S {...p}><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/></S>;
export const ClipboardIcon   = (p) => <S {...p}><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M9 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-3"/><path d="M9 12h6M9 16h4"/></S>;
export const CheckCircleIcon = (p) => <S {...p}><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></S>;
export const ClockIcon       = (p) => <S {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></S>;
export const AlertIcon       = (p) => <S {...p}><path d="M10.3 3.8L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></S>;
export const UsersIcon       = (p) => <S {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></S>;
export const UserIcon        = (p) => <S {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></S>;
export const BriefcaseIcon   = (p) => <S {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></S>;
export const SearchIcon      = (p) => <S {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></S>;
export const BoltIcon        = (p) => <S {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></S>;
export const TrendingUpIcon  = (p) => <S {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></S>;
export const StarIcon        = (p) => <S {...p}><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 21l1.2-6.5L2.5 9.9l6.6-.9 2.9-6z"/></S>;
export const DatabaseIcon    = (p) => <S {...p}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></S>;
export const ChartIcon       = (p) => <S {...p}><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></S>;
export const TargetIcon      = (p) => <S {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></S>;
export const BellIcon        = (p) => <S {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></S>;
export const LockIcon        = (p) => <S {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></S>;
export const ChatIcon        = (p) => <S {...p}><path d="M21 11.5a8.38 8.38 0 01-9 8.5 8.5 8.5 0 01-3.9-.9L3 21l1.9-5.1A8.5 8.5 0 0112 3a8.38 8.38 0 019 8.5z"/></S>;
export const PaperclipIcon   = (p) => <S {...p}><path d="M21.4 11.05l-8.5 8.5a5 5 0 01-7.07-7.07l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a2 2 0 01-2.83-2.83l7.78-7.78"/></S>;
export const FileIcon        = (p) => <S {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></S>;
export const UploadIcon      = (p) => <S {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></S>;
export const FlagIcon        = (p) => <S {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></S>;
export const EditIcon        = (p) => <S {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></S>;
export const CalendarIcon    = (p) => <S {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></S>;
export const TrashIcon       = (p) => <S {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></S>;
export const XIcon           = (p) => <S {...p}><path d="M18 6L6 18M6 6l12 12"/></S>;
export const PlayIcon        = (p) => <S {...p}><polygon points="6 4 20 12 6 20 6 4"/></S>;
