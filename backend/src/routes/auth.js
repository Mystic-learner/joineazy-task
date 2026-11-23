const r = require('express').Router();
const bcrypt = require('bcryptjs');
const { q } = require('../db');
const { sign, auth } = require('../auth');
r.post('/register', async (req, res) => {
  const { name, email, password, adminSecret } = req.body || {};
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  if (adminSecret && adminSecret !== (process.env.ADMIN_SECRET || 'prof-secret')) return res.status(403).json({ error: 'Invalid professor code' });
  const role = adminSecret ? 'admin' : 'student';
  try {
    const { rows } = await q('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role',
      [name, email.toLowerCase(), await bcrypt.hash(password, 10), role]);
    res.json({ token: sign(rows[0]), user: rows[0] });
  } catch (e) { res.status(409).json({ error: 'Email already registered' }); }
});
r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await q('SELECT * FROM users WHERE email=$1', [(email || '').toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(u), user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});
r.get('/me', auth(), async (req, res) => {
  const { rows } = await q('SELECT id,name,email,role FROM users WHERE id=$1', [req.user.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'User not found' });
});
module.exports = r;
