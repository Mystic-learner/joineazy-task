# Joineazy – Student, Group & Assignment Management

Role-based app: students form groups and confirm OneDrive submissions; professors post assignments and track progress.

**Stack:** React + Vite + Tailwind · Node/Express · PostgreSQL · JWT · Docker (nginx serves the SPA and proxies `/api`).

## Run (Docker)
```
docker compose up --build      # app at http://localhost:8080
```
Professor sign-up: tick "I'm a professor" and enter the code in `ADMIN_SECRET` (default `prof-secret`, set in docker-compose.yml).

## Run (local dev)
```
cd backend && npm i && DATABASE_URL=postgres://user:pass@localhost:5432/db JWT_SECRET=x npm run dev
cd frontend && npm i && npm run dev     # http://localhost:5173 (proxies /api to :4000)
```
Tables are created automatically on backend start (`backend/src/schema.sql`).

## API (all under `/api`, JWT in `Authorization: Bearer <token>`)
| Method & path | Role | Purpose |
|---|---|---|
| POST /auth/register, /auth/login · GET /auth/me | – | Auth |
| POST /groups · GET /groups/mine | student | Create / view own group |
| POST /groups/members `{identifier}` · DELETE /groups/members/:uid | student | Add by email or ID / remove |
| GET /groups | admin | List groups |
| GET /assignments | both | Student: visible assignments + status; Admin: all + counts |
| POST /assignments · PUT /assignments/:id | admin | Create / edit (`assign_all` or `group_ids`) |
| GET /assignments/:id/status | admin | Group-wise and member-wise status |
| POST /assignments/:id/confirm | student | Confirm group submission |
| GET /assignments/analytics/summary | admin | Totals, per-assignment and per-group completion |

## Schema
```
users(id, name, email*, password_hash, role)
groups(id, name, created_by→users)
group_members(group_id→groups, user_id*→users)       -- user_id UNIQUE: one group per student
assignments(id, title, description, due_date, onedrive_link, assign_all, created_by→users)
assignment_groups(assignment_id→assignments, group_id→groups)   -- used when assign_all=false
submissions(assignment_id, group_id, confirmed_by→users, confirmed_at)  -- PK(assignment_id, group_id)
```
```mermaid
erDiagram
  users ||--o{ group_members : joins
  groups ||--o{ group_members : has
  assignments ||--o{ assignment_groups : targets
  groups ||--o{ assignment_groups : receives
  assignments ||--o{ submissions : has
  groups ||--o{ submissions : makes
  users ||--o{ submissions : confirms
```

## Architecture
Browser (React SPA) → nginx → Express (JWT middleware, role guards, route modules) → PostgreSQL.

## Design decisions
- **Group-level confirmation:** one confirmation per group per assignment, recording who confirmed; admins see it per group and per member.
- **Two-step confirm** in the UI ("Yes, I have submitted" → "Confirm submission"); the API is idempotent.
- **Server-side authorization:** students can only confirm assignments visible to their group.
- bcrypt password hashes, parameterized SQL, professor role gated by a signup code.
- Schema is applied at startup for zero-setup demos (use migrations in production).
- Deployment: Docker Compose locally; public link via Render/Railway (API + Postgres) and Vercel/Netlify (frontend with an `/api` rewrite), or the compose stack on a VPS.
