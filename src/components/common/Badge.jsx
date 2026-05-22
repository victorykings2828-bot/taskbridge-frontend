import React from 'react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/helpers';

export const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};
