import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { Btn, Input, Card, Err, Ring, Avatar, Badge, rail, fmt, dueText } from './ui.jsx';

function Group({ group, reload }) {
  const [v, setV] = useState(''), [err, setErr] = useState('');
  const act = async fn => { setErr(''); try { await fn(); setV(''); reload(); } catch (e) { setErr(e.message); } };
  return <Card className="lg:col-span-2">
    {!group ? <><h2 className="font-display text-lg font-bold">Create your group</h2><p className="mb-3 text-sm text-slate-600">You need a group before you can confirm a submission.</p>
      <div className="flex flex-col gap-2 sm:flex-row"><Input placeholder="Group name" value={v} onChange={e => setV(e.target.value)} /><Btn className="sm:shrink-0" onClick={() => act(() => api('/groups', 'POST', { name: v }))}>Create group</Btn></div></>
    : <><h2 className="font-display text-lg font-bold">{group.name}</h2><p className="mb-2 text-sm text-slate-600">{group.members.length} member{group.members.length > 1 ? 's' : ''}</p>
      <ul className="mb-4 divide-y divide-slate-100">{group.members.map(m => <li key={m.id} className="flex items-center gap-3 py-2"><Avatar name={m.name} />
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{m.name}</div><div className="truncate text-xs text-slate-500">{m.email} · ID {m.id}</div></div>
        <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => act(() => api('/groups/members/' + m.id, 'DELETE'))}>Remove</button></li>)}</ul>
      <div className="flex flex-col gap-2 sm:flex-row"><Input placeholder="Add member by student email or ID" value={v} onChange={e => setV(e.target.value)} /><Btn className="sm:shrink-0" onClick={() => act(() => api('/groups/members', 'POST', { identifier: v }))}>Add member</Btn></div></>}
    <div className="mt-2"><Err msg={err} /></div></Card>;
}

function Row({ a, reload, canConfirm }) {
  const [step, setStep] = useState(0), [err, setErr] = useState('');
  const done = !!a.confirmed_at, late = !done && new Date(a.due_date) < new Date(), k = done ? 'done' : late ? 'late' : 'pending';
  const confirm = async () => { try { await api(`/assignments/${a.id}/confirm`, 'POST'); reload(); } catch (e) { setErr(e.message); } };
  return <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-sand-200 sm:p-5 ${rail[k]}`}>
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-display text-lg font-bold">{a.title}</h3>
      <p className="text-sm text-slate-600">{fmt(a.due_date)} · {done ? 'Submitted' : dueText(a.due_date)}</p></div><Badge kind={k}>{done ? 'Submitted' : late ? 'Overdue' : 'Pending'}</Badge></div>
    {a.description && <p className="mt-2 text-sm text-slate-700">{a.description}</p>}
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <a className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-50 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100" href={a.onedrive_link} target="_blank" rel="noreferrer">Open OneDrive link</a>
      {!done && canConfirm && step === 0 && <Btn kind="ghost" onClick={() => setStep(1)}>Yes, I have submitted</Btn>}
      {!done && step === 1 && <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-3 sm:flex-row sm:items-center"><span className="text-sm">Confirm for your whole group?</span><Btn onClick={confirm}>Confirm submission</Btn><Btn kind="ghost" onClick={() => setStep(0)}>Cancel</Btn></div>}
      {done && <span className="text-sm text-slate-500">Confirmed {fmt(a.confirmed_at)}</span>}</div>
    {!canConfirm && !done && <p className="mt-2 text-xs text-slate-500">Create a group to confirm this submission.</p>}<div className="mt-2"><Err msg={err} /></div></div>;
}

export default function Student() {
  const [group, setGroup] = useState(null), [data, setData] = useState({ assignments: [], hasGroup: false });
  const reload = () => { api('/groups/mine').then(setGroup); api('/assignments').then(setData); };
  useEffect(reload, []);
  const done = data.assignments.filter(a => a.confirmed_at).length;
  return <><div className="mb-8 grid gap-4 lg:grid-cols-3"><Group group={group} reload={reload} />
    <Card className="flex items-center gap-4 lg:flex-col lg:justify-center"><Ring done={done} total={data.assignments.length} />
      <div className="lg:text-center"><div className="font-display font-bold">Group progress</div><div className="text-sm text-slate-600">{done} of {data.assignments.length} assignments submitted</div></div></Card></div>
    <h2 className="mb-3 font-display text-xl font-bold">Assignments</h2>
    {data.assignments.length === 0 && <Card><p className="text-sm text-slate-600">No assignments yet. They'll show up here when your professor posts one.</p></Card>}
    <div className="space-y-3">{data.assignments.map(a => <Row key={a.id} a={a} reload={reload} canConfirm={data.hasGroup} />)}</div></>;
}

