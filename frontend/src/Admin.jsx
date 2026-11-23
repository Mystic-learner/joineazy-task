import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { Btn, Input, Card, Err, Progress, Badge, rail, fmt, dueText } from './ui.jsx';

const blank = { title: '', description: '', due_date: '', onedrive_link: '', assign_all: true, group_ids: [] };
const toLocal = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

function Form({ init, groups, onDone }) {
  const [f, setF] = useState(init ? { ...init, due_date: toLocal(init.due_date) } : blank), [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const toggle = id => setF({ ...f, group_ids: f.group_ids.includes(id) ? f.group_ids.filter(x => x !== id) : [...f.group_ids, id] });
  const save = async e => {
    e.preventDefault(); setErr('');
    try { const b = { ...f, due_date: new Date(f.due_date).toISOString() }; init ? await api('/assignments/' + init.id, 'PUT', b) : await api('/assignments', 'POST', b); onDone(); }
    catch (x) { setErr(x.message); }
  };
  return <Card className="mb-4"><form onSubmit={save} className="space-y-3">
    <h2 className="font-display text-lg font-bold">{init ? 'Edit assignment' : 'New assignment'}</h2>
    <Input placeholder="Title" value={f.title} onChange={set('title')} required />
    <textarea className="w-full rounded-lg px-3.5 py-2.5 text-sm ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-600" rows="2" placeholder="Description" value={f.description} onChange={set('description')} />
    <div className="grid gap-3 sm:grid-cols-2"><Input type="datetime-local" value={f.due_date} onChange={set('due_date')} required /><Input type="url" placeholder="OneDrive link (https://...)" value={f.onedrive_link} onChange={set('onedrive_link')} required /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.assign_all} onChange={e => setF({ ...f, assign_all: e.target.checked })} /> Assign to all groups</label>
    {!f.assign_all && <div className="flex flex-wrap gap-3 text-sm">{groups.length === 0 && <span className="text-slate-600">No groups exist yet.</span>}{groups.map(g => <label key={g.id} className="flex items-center gap-1"><input type="checkbox" checked={f.group_ids.includes(g.id)} onChange={() => toggle(g.id)} />{g.name}</label>)}</div>}
    <Err msg={err} /><div className="flex gap-2"><Btn>{init ? 'Save changes' : 'Create assignment'}</Btn><Btn type="button" kind="ghost" onClick={() => onDone(true)}>Cancel</Btn></div></form></Card>;
}

function Status({ id, onClose }) {
  const [d, setD] = useState(null);
  useEffect(() => { api(`/assignments/${id}/status`).then(setD); }, [id]);
  if (!d) return null;
  return <Card className="mb-4"><div className="mb-2 flex justify-between"><h2 className="font-display text-lg font-bold">Submissions: {d.assignment.title}</h2><button className="text-sm underline" onClick={onClose}>Close</button></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-600"><th className="py-1">Group</th><th>Status</th><th>Members</th></tr></thead><tbody>
      {d.groups.map(g => <tr key={g.id} className="border-b align-top"><td className="py-1.5 font-medium">{g.name}</td>
        <td>{g.confirmed_at ? <span className="text-emerald-700">Confirmed by {g.confirmed_by}<br /><span className="text-xs text-slate-500">{fmt(g.confirmed_at)}</span></span> : <span className="text-amber-800">Not confirmed</span>}</td>
        <td>{(g.members || []).map(m => <div key={m.id}>{m.name} <span className="text-slate-500">{g.confirmed_at ? '(covered by group confirmation)' : '(pending)'}</span></div>)}</td></tr>)}</tbody></table></div></Card>;
}

export default function Admin() {
  const [list, setList] = useState([]), [groups, setGroups] = useState([]), [an, setAn] = useState(null), [form, setForm] = useState(null), [view, setView] = useState(null);
  const load = () => { api('/assignments').then(d => setList(d.assignments)); api('/groups').then(setGroups); api('/assignments/analytics/summary').then(setAn); };
  useEffect(load, []);
  return <>
    {an && <div className="mb-4 grid grid-cols-3 gap-3">{[['Students', an.totals.students], ['Groups', an.totals.groups], ['Assignments', an.totals.assignments]].map(([l, n]) => <div key={l} className="rounded-xl bg-sand-100 p-4 ring-1 ring-sand-200 sm:p-5"><div className="font-display text-3xl font-bold text-brand-700">{n}</div><div className="text-sm text-slate-600">{l}</div></div>)}</div>}
    {an && <div className="mb-4 grid gap-4 md:grid-cols-2">
      <Card><h2 className="mb-3 font-semibold">Completion by assignment</h2><div className="space-y-3">{an.perAssignment.map(a => <Progress key={a.id} done={a.confirmed} total={a.total} label={a.title} />)}{!an.perAssignment.length && <p className="text-sm text-slate-600">No assignments yet.</p>}</div></Card>
      <Card><h2 className="mb-3 font-semibold">Group performance</h2><div className="space-y-3">{an.byGroup.map(g => <Progress key={g.id} done={g.confirmed} total={g.total} label={g.name} />)}{!an.byGroup.length && <p className="text-sm text-slate-600">No groups yet.</p>}</div></Card></div>}
    {form ? <Form init={form === 'new' ? null : form} groups={groups} onDone={cancel => { setForm(null); if (cancel !== true) load(); }} /> : <Btn className="mb-4" onClick={() => setForm('new')}>New assignment</Btn>}
    {view && <Status id={view} onClose={() => setView(null)} />}
    {list.map(a => <Card key={a.id} className={`mb-3 border-l-4 ${rail[a.confirmed >= a.total_groups && a.total_groups > 0 ? 'done' : new Date(a.due_date) < new Date() ? 'late' : 'pending']}`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-display text-lg font-bold">{a.title}</h3>
      <p className="text-sm text-slate-600">{fmt(a.due_date)} ({dueText(a.due_date)}) · {a.assign_all ? 'All groups' : `${a.total_groups} selected groups`} · <a className="font-medium text-brand-700 underline" href={a.onedrive_link} target="_blank" rel="noreferrer">OneDrive link</a></p></div>
      <div className="flex w-full gap-2 sm:w-auto"><Btn kind="ghost" className="flex-1" onClick={() => setView(a.id)}>View submissions</Btn><Btn kind="ghost" className="flex-1" onClick={() => setForm(a)}>Edit</Btn></div></div>
      <div className="mt-3"><Progress done={a.confirmed} total={a.total_groups} label="Groups confirmed" /></div></Card>)}
    {!list.length && !form && <p className="text-sm text-slate-600">Create your first assignment to get started.</p>}</>;
}

