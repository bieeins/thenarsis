# Thenarsis

Event production management platform (orders, design work, crew assignments, invoicing, payments, expenses, notifications).

## Architecture

```
                 ┌─────────────────────────┐
 thenarsis.online │  apps/web (React+Vite)  │
                 └────────────┬────────────┘
                              │ HTTPS, credentials: include
                              ▼
             ┌───────────────────────────────┐
api.thenarsis.online │ apps/api (Express+MySQL) │
             └───────────────┬───────────────┘
                              │ mysql2
                              ▼
                     ┌────────────────┐
                     │  MySQL 8       │
                     └────────────────┘
```

- **apps/web** — React + Vite frontend, deployed as a static site on `thenarsis.online`.
- **apps/api** — Express.js + MySQL REST API, deployed as a Node.js Web App on `api.thenarsis.online`.
- **apps/pocketbase** — the legacy PocketBase backend. **Deprecated.** Kept on disk only as a migration reference (schema/rules/hooks); do not run it in production anymore. See `MIGRATION_REPORT.md` for the full collection → table mapping.

## Folder structure

```
apps/
  web/    React frontend (Vite)
  api/    Express + MySQL backend
    src/
      config/       env + database (knex) setup
      middleware/   auth, RBAC, validation, error handling, upload
      routes/       Express routers per resource
      controllers/  HTTP layer
      services/     business logic, transactions, RBAC checks
      repositories/ knex queries per table
      validators/   zod schemas
      storage/      local file storage (pluggable)
      templates/    email templates
    migrations/     knex schema migrations
    seeds/          knex dev seed data
    scripts/        create-owner, PocketBase data import
    tests/          vitest + supertest
  pocketbase/       legacy PocketBase app (deprecated, reference only)
MIGRATION_REPORT.md  PocketBase → MySQL/Express migration report
```

## Requirements

- Node.js 22.x
- MySQL 8.x (InnoDB, utf8mb4)
- npm 10+

## Local development

```bash
npm install                     # installs both workspaces
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Set up MySQL

```sql
CREATE DATABASE thenarsis CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE thenarsis_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; -- for `npm test`
CREATE USER 'thenarsis_user'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON thenarsis.* TO 'thenarsis_user'@'localhost';
GRANT ALL PRIVILEGES ON thenarsis_test.* TO 'thenarsis_user'@'localhost';
FLUSH PRIVILEGES;
```

Fill in `apps/api/.env` with those credentials.

### Migrate + seed

```bash
npm run db:migrate   # creates all tables
npm run db:seed      # inserts dev users/products/orders (see apps/api/seeds)
```

Seeded accounts (dev only — change/remove for anything resembling production):

| email | password | role |
|---|---|---|
| owner@example.com | SecurePass123! | owner |
| designer@example.com | DesignPass123! | designer |
| crew@example.com | CrewPass123! | crew |
| reviewer@example.com | reviewer123 | design_reviewer |

### Run everything

```bash
npm run dev          # frontend on :5173 (or :3000, see apps/web/vite.config.js), API on :3000... wait see below
```

The API always listens on `PORT` from `apps/api/.env` (default 3000) and the Vite dev server serves the frontend from its own port. Set `apps/web/.env`'s `VITE_API_URL` to point at the API's URL/port.

Run them individually with `npm run dev:web` / `npm run dev:api`.

### Create the first owner account

Instead of relying on the seed data in production, create a real owner account with:

```bash
cd apps/api
npm run user:create-owner -- --email=owner@yourcompany.com --name="Your Name"
```

You'll be prompted for a password interactively (hidden input) — it is never passed as a CLI argument or left in shell history. For non-interactive environments (CI, scripted provisioning), set `OWNER_PASSWORD` as a temporary environment variable instead.

### Run tests

```bash
npm test
```

Tests run against a separate `thenarsis_test` database (via `NODE_ENV=test`, see `apps/api/knexfile.js`) so they never touch dev data. 29 tests cover health, auth (login/refresh/logout/401/403), RBAC, product/order CRUD, transactional order+items creation and rollback, design-work → design-income completion flow, crew-assignment integrity checks and attendance, and payment → notification side effects.

## Environment variables

See `apps/api/.env.example` and `apps/web/.env.example` for the full list. Key ones:

- `apps/api`: `DB_*` (MySQL connection), `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (generate long random values — never commit real secrets), `FRONTEND_URL` (CORS allow-list, exact match, no wildcard), `COOKIE_*`, `SMTP_*`, `STORAGE_*`.
- `apps/web`: `VITE_API_URL` — the API's base URL. Never put secrets in `VITE_*` variables; they are bundled into the public frontend build.

The API validates required environment variables at startup in production (`NODE_ENV=production`) and refuses to start if any are missing.

## Migrating data from PocketBase

1. Export each PocketBase collection's records as JSON (via the Admin UI's "Export collection" action, or a script calling `pb.collection(name).getFullList()` and writing the array to `<collection>.json`). Put all the resulting files in one directory, e.g. `./pb-export/users.json`, `./pb-export/orders.json`, etc.
2. **Back up your MySQL database before importing.**
3. Dry run first:
   ```bash
   cd apps/api
   PB_EXPORT_DIR=../../pb-export npm run migrate:pocketbase -- --dry-run
   ```
4. Review the per-collection report (read/imported/skipped/failed counts + per-record errors), then run for real:
   ```bash
   PB_EXPORT_DIR=../../pb-export npm run migrate:pocketbase
   ```
5. Verify counts: compare the script's "imported" totals against each collection's record count in the PocketBase Admin UI.

**Known limitation:** PocketBase never exports plaintext passwords, so migrated user accounts get a random temporary password. Ask each migrated user to use "forgot password" / have the owner set a new password via `PATCH /api/users/:id` or `POST /api/auth/change-password` after first login. See `MIGRATION_REPORT.md` for the full collection mapping and other manual-decision items.

## Deployment (Hostinger — two Node.js Web Apps)

### 1. Backend — `api.thenarsis.online`

- Create a new **Node.js** Web App in hPanel.
- Root directory: `apps/api`
- Node version: 22.x
- Install command: `npm install`
- Build command: (none needed — plain JS)
- Start command: `npm start` (runs `node src/server.js`, listens on `0.0.0.0:PORT`)
- Set environment variables (production values):
  ```
  NODE_ENV=production
  PORT=3000
  APP_URL=https://api.thenarsis.online
  FRONTEND_URL=https://thenarsis.online
  DB_HOST=... DB_PORT=3306 DB_NAME=... DB_USER=... DB_PASSWORD=...
  JWT_ACCESS_SECRET=<long random value>
  JWT_REFRESH_SECRET=<different long random value>
  COOKIE_SECURE=true
  COOKIE_SAME_SITE=strict
  SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASSWORD=... SMTP_FROM=...
  STORAGE_DRIVER=local
  ```
- Create the MySQL database in hPanel's database manager first, then run migrations from a shell on the Web App (or locally against the production DB host if permitted):
  ```bash
  npm run db:migrate
  ```
  Do **not** run `db:seed` in production — instead create the real owner with `npm run user:create-owner -- --email=...`.
- Point `api.thenarsis.online` at this Web App (custom domain in hPanel).
- Verify: `curl https://api.thenarsis.online/api/health` → `{"success":true,"message":"Thenarsis API is healthy"}`.
- Check the Web App's runtime logs in hPanel for startup errors (missing env vars will cause an immediate, clearly-logged exit).

### 2. Frontend — `thenarsis.online`

- Create a second Web App (or a static site, if Hostinger's plan supports it) for the frontend.
- Root directory: `./` (repo root) or `apps/web`, depending on how the build command is invoked — using the repo root:
  - Build command: `npm run build --prefix apps/web`
  - Output directory: `dist/apps/web` (see `apps/web/package.json`'s `build`/`start` scripts, which pass `--outDir ../../dist/apps/web` to Vite)
- Environment variable: `VITE_API_URL=https://api.thenarsis.online`
- Point `thenarsis.online` at this Web App/site.
- **Redeploy the frontend any time `VITE_API_URL` changes** — Vite bakes env vars into the build at build time, not runtime.

### Backup and restore

- **Backup**: use `mysqldump` (or Hostinger's built-in MySQL backup tool) on a schedule: `mysqldump -u USER -p thenarsis > backup.sql`.
- **Restore**: `mysql -u USER -p thenarsis < backup.sql`, then verify with `npm run db:migrate` (idempotent — a no-op if already up to date) to confirm the schema matches what the app expects.
- Uploaded files under `apps/api/uploads` (or wherever `UPLOAD_DIR` points) should be backed up alongside the database — file metadata rows in the `files` table reference them by `stored_name`.

## Troubleshooting

**CORS errors in the browser console** — the API only allows the exact origin in `FRONTEND_URL` (no wildcard). Confirm it matches the frontend's origin exactly (scheme + host, no trailing slash), and that you redeployed the API after changing it.

**Cookies not being sent / login doesn't persist across refresh** — the refresh-token cookie is `httpOnly`, scoped to path `/api/auth`, and (in production) `Secure` + `SameSite=strict`. `Secure` cookies require HTTPS — this fails silently over plain HTTP. Also confirm the frontend calls the API with `credentials: 'include'` (already wired into `apiClient.js`).

**MySQL connection errors on startup** — check `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` in `apps/api/.env`, and that the MySQL user has privileges on that database. `server.js` checks the connection before binding the port and exits with a logged error if it fails.

**File upload rejected (400)** — check the file's MIME type against `ALLOWED_FILE_TYPES` and its size against `MAX_UPLOAD_SIZE` in `apps/api/.env`.

**Login works but every other request returns 401** — the access token is short-lived (`JWT_ACCESS_EXPIRES_IN`, default 15m) and lives only in memory on the frontend (never localStorage). `apiClient.js` automatically retries once against `/api/auth/refresh` on a 401; if that also fails, the refresh cookie itself has likely expired or been revoked (e.g. after `change-password`) — the user needs to log in again.

## Legacy PocketBase backend

`apps/pocketbase` is kept for reference only — its migrations were the source of truth for the MySQL schema (see `MIGRATION_REPORT.md`) and its hooks were the source of truth for the notification/email logic now implemented in `apps/api/src/services`. Do not point any deployment at it going forward.
