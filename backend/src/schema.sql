CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('student','admin')));
CREATE TABLE IF NOT EXISTS groups(
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, created_by INT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS group_members(
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS assignments(
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL, onedrive_link TEXT NOT NULL,
  assign_all BOOLEAN NOT NULL DEFAULT TRUE, created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS assignment_groups(
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY(assignment_id,group_id));
CREATE TABLE IF NOT EXISTS submissions(
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  confirmed_by INT REFERENCES users(id), confirmed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(assignment_id,group_id));
