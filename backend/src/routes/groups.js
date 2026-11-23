const r = require('express').Router();
const { q } = require('../db');
const { auth } = require('../auth');
const myGroup = async uid => (await q('SELECT g.* FROM groups g JOIN group_members m ON m.group_id=g.id WHERE m.user_id=$1', [uid])).rows[0];
const members = async gid => (await q('SELECT u.id,u.name,u.email FROM users u JOIN group_members m ON m.user_id=u.id WHERE m.group_id=$1 ORDER BY u.name', [gid])).rows;
r.get('/mine', auth('student'), async (req, res) => {
  const g = await myGroup(req.user.id);
  res.json(g ? { ...g, members: await members(g.id) } : null);
});
r.post('/', auth('student'), async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Group name is required' });
  if (await myGroup(req.user.id)) return res.status(409).json({ error: 'You are already in a group' });
  const { rows } = await q('INSERT INTO groups(name,created_by) VALUES($1,$2) RETURNING *', [name, req.user.id]);
  await q('INSERT INTO group_members VALUES($1,$2)', [rows[0].id, req.user.id]);
  res.json({ ...rows[0], members: await members(rows[0].id) });
});
r.post('/members', auth('student'), async (req, res) => {
  const g = await myGroup(req.user.id);
  if (!g) return res.status(400).json({ error: 'Create a group first' });
  const k = String(req.body.identifier || '').trim().toLowerCase();
  const { rows } = await q("SELECT id FROM users WHERE role='student' AND (email=$1 OR id::text=$1)", [k]);
  if (!rows[0]) return res.status(404).json({ error: 'No student found with that email or ID' });
  if (await myGroup(rows[0].id)) return res.status(409).json({ error: 'That student is already in a group' });
  await q('INSERT INTO group_members VALUES($1,$2)', [g.id, rows[0].id]);
  res.json({ ...g, members: await members(g.id) });
});
r.delete('/members/:uid', auth('student'), async (req, res) => {
  const g = await myGroup(req.user.id);
  if (!g) return res.status(400).json({ error: 'No group' });
  if (g.created_by !== req.user.id && +req.params.uid !== req.user.id) return res.status(403).json({ error: 'Only the group creator can remove others' });
  await q('DELETE FROM group_members WHERE group_id=$1 AND user_id=$2', [g.id, req.params.uid]);
  res.json({ ok: true });
});
r.get('/', auth('admin'), async (_req, res) => {
  res.json((await q('SELECT g.id,g.name,(SELECT count(*) FROM group_members WHERE group_id=g.id)::int AS size FROM groups g ORDER BY g.name')).rows);
});
module.exports = r;
