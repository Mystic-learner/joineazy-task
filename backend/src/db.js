const { Pool } = require('pg');
const fs = require('fs'), path = require('path');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function init() {
  for (let i = 0; i < 20; i++) {
    try { await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')); return; }
    catch (e) { console.log('waiting for db...'); await new Promise(r => setTimeout(r, 1500)); }
  }
  throw new Error('DB unavailable');
}
module.exports = { pool, q: (t, p) => pool.query(t, p), init };
