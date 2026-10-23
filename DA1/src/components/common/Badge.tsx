import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'bus' | 'metro' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'amber';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  const variantClasses = {
    bus: 'bg-amber-50 text-amber-800 border-amber-200/80',
    metro: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    amber: 'bg-orange-50 text-orange-800 border-orange-200/80',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border tracking-wide uppercase ${sizeClasses} ${variantClasses}`}
    >
      {children}
    </span>
  );
};
