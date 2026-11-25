import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, accentColor = '#173F35' }) {
  return (
    <div className="hitayu-card p-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#78847C]">{title}</p>
        <p className="font-serif text-2xl font-bold text-[#173F35] mt-1.5">{value}</p>
        {subtitle && <p className="text-xs text-[#78847C] mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-[#E8F0E9]/60 rounded-2xl w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="hitayu-card p-10 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#E8F0E9] text-[#173F35] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-[#173F35]">{title}</h3>
      <p className="text-sm text-[#78847C] max-w-md mt-2 mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
