const jwt = require('jsonwebtoken');
const secret = () => process.env.JWT_SECRET || 'dev-secret';
const sign = u => jwt.sign({ id: u.id, role: u.role, name: u.name }, secret(), { expiresIn: '7d' });
function auth(role) {
  return (req, res, next) => {
    try {
      req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), secret());
    } catch { return res.status(401).json({ error: 'Not authenticated' }); }
    if (role && req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
module.exports = { sign, auth };
