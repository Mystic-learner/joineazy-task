import React from 'react';
export const Btn = ({ kind = 'primary', className = '', ...p }) => <button {...p} className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 ${kind === 'primary' ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700' : 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'} ${className}`} />;
export const Input = p => <input {...p} className="min-h-[44px] w-full rounded-lg bg-white px-3.5 text-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600" />;
export const Card = ({ children, className = '' }) => <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-sand-200 sm:p-5 ${className}`}>{children}</div>;
export const Err = ({ msg }) => msg ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p> : null;
export const Avatar = ({ name }) => <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>;
export const Progress = ({ done, total, label }) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return <div><div className="mb-1.5 flex justify-between gap-2 text-sm"><span className="truncate font-medium text-slate-700">{label}</span><span className="shrink-0 text-slate-500">{done}/{total}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-600'}`} style={{ width: pct + '%' }} /></div></div>;
};
export const Ring = ({ done, total }) => {
  const pct = total ? done / total : 0, r = 42, c = 2 * Math.PI * r;
  return <div className="relative h-28 w-28 shrink-0"><svg viewBox="0 0 100 100" className="-rotate-90"><circle cx="50" cy="50" r={r} fill="none" stroke="#e7e5e4" strokeWidth="9" />
    <circle cx="50" cy="50" r={r} fill="none" stroke={pct === 1 ? '#10b981' : '#1f3a68'} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s' }} /></svg>
    <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-2xl font-bold">{Math.round(pct * 100)}%</div><div className="text-xs text-slate-500">{done} of {total}</div></div></div></div>;
};
export const fmt = d => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export function dueText(d) {
  const ms = new Date(d) - Date.now(), a = Math.abs(ms), m = Math.round(a / 6e4), h = Math.round(a / 36e5), dy = Math.round(a / 864e5);
  const s = dy >= 2 ? dy + ' days' : h >= 1 ? h + (h === 1 ? ' hour' : ' hours') : m + ' min';
  return ms < 0 ? `Overdue by ${s}` : `Due in ${s}`;
}
export const rail = { done: 'border-l-emerald-500', late: 'border-l-red-500', pending: 'border-l-amber-400' };
export const Badge = ({ kind, children }) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${{ done: 'bg-emerald-50 text-emerald-700', late: 'bg-red-50 text-red-700', pending: 'bg-amber-50 text-amber-800' }[kind]}`}>{children}</span>;


