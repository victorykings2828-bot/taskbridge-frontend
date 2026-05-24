import React from 'react';

const StatCard = ({ label, value, icon, colorClass = 'text-brand', bgClass = 'bg-brand-50', sublabel }) => (
  <div className="bg-surface rounded-2xl p-5 shadow-card border border-navy-200 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-navy-500 mb-1.5">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value ?? '—'}</p>
        {sublabel && <p className="text-xs text-navy-400 mt-1">{sublabel}</p>}
      </div>
      {icon && (
        <div className={`w-11 h-11 ${bgClass} ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
