const r = require('express').Router();
const { q } = require('../db');
const { auth } = require('../auth');
const valid = b => b.title && b.due_date && /^https?:\/\//.test(b.onedrive_link || '');
const bad = { error: 'Title, due date and a valid http(s) OneDrive link are required' };
async function setGroups(id, b) {
  await q('DELETE FROM assignment_groups WHERE assignment_id=$1', [id]);
  if (!b.assign_all) for (const g of b.group_ids || []) await q('INSERT INTO assignment_groups VALUES($1,$2) ON CONFLICT DO NOTHING', [id, g]);
}
const TOTAL = `(CASE WHEN a.assign_all THEN (SELECT count(*) FROM groups) ELSE (SELECT count(*) FROM assignment_groups ag WHERE ag.assignment_id=a.id) END)::int`;
r.get('/', auth(), async (req, res) => {
  if (req.user.role === 'student') {
    const g = (await q('SELECT group_id FROM group_members WHERE user_id=$1', [req.user.id])).rows[0];
    const { rows } = await q(`SELECT a.*, s.confirmed_at, s.confirmed_by FROM assignments a
      LEFT JOIN submissions s ON s.assignment_id=a.id AND s.group_id=$1
      WHERE a.assign_all OR EXISTS(SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id=a.id AND ag.group_id=$1)
      ORDER BY a.due_date`, [g ? g.group_id : 0]);
    return res.json({ hasGroup: !!g, assignments: rows });
  }
  const { rows } = await q(`SELECT a.*,
    (SELECT count(*) FROM submissions s WHERE s.assignment_id=a.id)::int AS confirmed,
    ${TOTAL} AS total_groups,
    COALESCE((SELECT array_agg(group_id) FROM assignment_groups ag WHERE ag.assignment_id=a.id),'{}') AS group_ids
    FROM assignments a ORDER BY a.due_date`);
  res.json({ assignments: rows });
});
r.post('/', auth('admin'), async (req, res) => {
  const b = req.body; if (!valid(b)) return res.status(400).json(bad);
  const all = b.assign_all !== false;
  const { rows } = await q('INSERT INTO assignments(title,description,due_date,onedrive_link,assign_all,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
    [b.title, b.description || '', b.due_date, b.onedrive_link, all, req.user.id]);
  await setGroups(rows[0].id, { ...b, assign_all: all });
  res.json(rows[0]);
});
r.put('/:id', auth('admin'), async (req, res) => {
  const b = req.body; if (!valid(b)) return res.status(400).json(bad);
  const all = b.assign_all !== false;
  const { rows } = await q('UPDATE assignments SET title=$1,description=$2,due_date=$3,onedrive_link=$4,assign_all=$5 WHERE id=$6 RETURNING *',
    [b.title, b.description || '', b.due_date, b.onedrive_link, all, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  await setGroups(rows[0].id, { ...b, assign_all: all });
  res.json(rows[0]);
});
r.get('/analytics/summary', auth('admin'), async (_req, res) => {
  const totals = (await q(`SELECT (SELECT count(*) FROM users WHERE role='student')::int students,(SELECT count(*) FROM groups)::int groups,(SELECT count(*) FROM assignments)::int assignments`)).rows[0];
  const perAssignment = (await q(`SELECT a.id,a.title,(SELECT count(*) FROM submissions s WHERE s.assignment_id=a.id)::int confirmed, ${TOTAL} total FROM assignments a ORDER BY a.due_date`)).rows;
  const byGroup = (await q(`SELECT g.id,g.name,
    (SELECT count(*) FROM submissions s WHERE s.group_id=g.id)::int confirmed,
    (SELECT count(*) FROM assignments a WHERE a.assign_all OR EXISTS(SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id=a.id AND ag.group_id=g.id))::int total
    FROM groups g ORDER BY g.name`)).rows;
  res.json({ totals, perAssignment, byGroup });
});
r.get('/:id/status', auth('admin'), async (req, res) => {
  const a = (await q('SELECT * FROM assignments WHERE id=$1', [req.params.id])).rows[0];
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const { rows } = await q(`SELECT g.id,g.name,s.confirmed_at,cu.name AS confirmed_by,
    (SELECT json_agg(json_build_object('id',u.id,'name',u.name,'email',u.email)) FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=g.id) AS members
    FROM groups g LEFT JOIN submissions s ON s.group_id=g.id AND s.assignment_id=$1 LEFT JOIN users cu ON cu.id=s.confirmed_by
    WHERE $2 OR EXISTS(SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id=$1 AND ag.group_id=g.id) ORDER BY g.name`, [a.id, a.assign_all]);
  res.json({ assignment: a, groups: rows });
});
r.post('/:id/confirm', auth('student'), async (req, res) => {
  const g = (await q('SELECT group_id FROM group_members WHERE user_id=$1', [req.user.id])).rows[0];
  if (!g) return res.status(400).json({ error: 'Join or create a group first' });
  const ok = (await q(`SELECT 1 FROM assignments a WHERE a.id=$1 AND (a.assign_all OR EXISTS(SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id=a.id AND ag.group_id=$2))`, [req.params.id, g.group_id])).rows[0];
  if (!ok) return res.status(404).json({ error: 'Assignment not assigned to your group' });
  await q('INSERT INTO submissions(assignment_id,group_id,confirmed_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [req.params.id, g.group_id, req.user.id]);
  res.json({ ok: true });
});
module.exports = r;
