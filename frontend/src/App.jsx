import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { Btn, Input, Err, Avatar } from './ui.jsx';
import Student from './Student.jsx';
import Admin from './Admin.jsx';

const points = ['Create a group and add classmates by email or ID', 'Confirm your OneDrive upload in two steps', 'Professors see every group\'s status as it happens'];

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', password: '', adminSecret: '' }), [prof, setProf] = useState(false), [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      const d = await api('/auth/' + mode, 'POST', { ...f, adminSecret: prof && mode === 'register' ? f.adminSecret : undefined });
      localStorage.setItem('token', d.token); onAuth(d.user);
    } catch (x) { setErr(x.message); }
  };
  return <div className="grid min-h-screen place-items-center bg-sand-100 sm:p-6">
    <div className="grid w-full max-w-5xl overflow-hidden bg-sand-50 sm:rounded-2xl sm:shadow-xl md:grid-cols-2">
      <div className="flex flex-col gap-8 bg-brand-900 p-8 text-white md:justify-between md:p-12">
        <div className="font-display text-xl font-bold">Joineazy</div>
        <div><h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">Submit together.<br />Know who's done.</h1>
          <p className="mt-3 max-w-sm text-sand-200">Group assignments, one clear dashboard.</p></div>
        <ul className="hidden space-y-3 text-sm text-sand-100 md:block">{points.map(p => <li key={p} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sand-300" />{p}</li>)}</ul></div>
      <div className="flex items-center p-8 md:p-12"><div className="mx-auto w-full max-w-sm">
        <h2 className="font-display text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="mb-6 mt-1 text-sm text-slate-600">{mode === 'login' ? 'Log in to see your assignments.' : 'It takes less than a minute.'}</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && <Input placeholder="Full name" value={f.name} onChange={set('name')} required />}
          <Input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
          <Input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
          {mode === 'register' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={prof} onChange={e => setProf(e.target.checked)} /> I'm a professor</label>}
          {prof && mode === 'register' && <Input placeholder="Professor code" value={f.adminSecret} onChange={set('adminSecret')} />}
          <Err msg={err} /><Btn className="w-full">{mode === 'login' ? 'Log in' : 'Create account'}</Btn>
        </form>
        <button className="mt-4 text-sm font-medium text-brand-700 hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</button></div></div></div></div>;
}

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => { api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true)); }, []);
  if (!ready) return null;
  if (!user) return <Auth onAuth={setUser} />;
  return <><header className="sticky top-0 z-10 border-b border-sand-200 bg-sand-100/90 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
    <div className="flex min-w-0 items-center gap-3"><span className="font-display text-lg font-bold text-brand-700">Joineazy</span>
      <span className="hidden h-5 w-px bg-sand-300 sm:block" /><Avatar name={user.name} />
      <div className="min-w-0 leading-tight"><div className="truncate text-sm font-semibold">{user.name}</div><div className="text-xs text-slate-500">{user.role === 'admin' ? 'Professor' : `Student · ID ${user.id}`}</div></div></div>
    <Btn kind="ghost" className="shrink-0" onClick={() => { localStorage.removeItem('token'); setUser(null); }}>Log out</Btn></div></header>
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{user.role === 'admin' ? <Admin /> : <Student />}</main></>;
}



