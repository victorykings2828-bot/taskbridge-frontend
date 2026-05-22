import React from 'react';

const StatCard = ({ label, value, icon, colorClass = 'text-primary', bgClass = 'bg-blue-50', sublabel }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value ?? '—'}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
      </div>
      {icon && (
        <div className={`w-12 h-12 ${bgClass} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
