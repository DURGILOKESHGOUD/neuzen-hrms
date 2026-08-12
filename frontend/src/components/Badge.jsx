import React from 'react';

const COLOR_MAP = {
  active: 'bg-emerald-100 text-emerald-700',
  present: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  onboarded: 'bg-emerald-100 text-emerald-700',

  pending: 'bg-amber-100 text-amber-700',
  onboarding: 'bg-amber-100 text-amber-700',
  generated: 'bg-amber-100 text-amber-700',
  sent: 'bg-amber-100 text-amber-700',
  'half-day': 'bg-amber-100 text-amber-700',

  rejected: 'bg-red-100 text-red-700',
  absent: 'bg-red-100 text-red-700',
  inactive: 'bg-red-100 text-red-700',
  terminated: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-600',

  'on-leave': 'bg-sky-100 text-sky-700',
  holiday: 'bg-purple-100 text-purple-700',
  draft: 'bg-slate-200 text-slate-600',
};

export default function Badge({ status }) {
  const cls = COLOR_MAP[status] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${cls}`}>{status}</span>;
}
