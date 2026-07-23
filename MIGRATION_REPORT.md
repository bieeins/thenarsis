# Migration Report: PocketBase → Express.js + MySQL

Status: living document, updated as the migration proceeds.

## 1. Collections found in `apps/pocketbase/pb_migrations`

Final schema (after all 93 migrations applied in order) for each collection, and its MySQL destination table.

| PocketBase collection | MySQL table | Notes |
|---|---|---|
| `users` (auth) | `users` | role enum `owner\|designer\|crew\|design_reviewer`; `name` required, `phone` optional; password now bcrypt hash |
| `products` | `products` | list/view public, mutate owner-only |
| `orders` | `orders` | unique `invoice_number`; FK to `products`, `users` (assigned_designer_id) |
| `order_items` | `order_items` | FK to `orders`, `products` |
| `expenses` | `expenses` | defined in `1782142621_002_created_expenses.js`: `transaction_date` (date, req), `category` (select: supplies/hosting/domain/internet/ads/equipment maintenance/food/other, req), `amount` (number, req, min 0), `description` (editor), `uploaded_by_id` (relation→users, req), `receipt_file` (file, max 20MB); all rules owner-only |
| `invoices` | `invoices` | unique `invoice_number`; view public (for public invoice page), list/mutate owner-only |
| `design_work` | `design_work` | status enum `pending\|in_progress\|revision\|completed`; `design_file` (upload) was removed from PB schema, only `design_file_link` (text URL) survives |
| `crew_assignments` | `crew_assignments` | heavy attendance tracking fields |
| `payments` | `payments` | FK to `invoices` |
| `notifications` | `notifications` | FK to `users`, `orders` |
| `design_income` | `design_income` | FK to `orders`, `users` (designer) |
| `notes` | `notes` | FK to `orders`, `users` |

All PocketBase relations use `cascadeDelete: false` — mapped to `ON DELETE RESTRICT` for required FKs and `ON DELETE SET NULL` for optional FKs, preserving PocketBase's non-cascading behavior.

IDs: PocketBase 15-char ids are preserved as `VARCHAR(36)` primary keys so old records can be imported unchanged; new records get UUIDv4.

## 2. Access rule → RBAC mapping

| Resource | list/view | create | update | delete |
|---|---|---|---|---|
| users | owner only (self can view own) | owner | self or owner | owner |
| products | public (any authenticated) | owner | owner | owner |
| orders | owner, design_reviewer, crew, assigned designer | owner | owner | owner |
| order_items | owner | owner | owner | owner |
| expenses | owner | owner | owner | owner |
| invoices | list: owner; view: public (invoice number lookup) | owner | owner | owner |
| design_work | designer(self)/owner/design_reviewer/crew (list/view); update: designer(self) or owner | owner | designer(self) or owner | owner |
| crew_assignments | crew(self)/owner | owner | crew(self) or owner | owner |
| payments | owner | owner | owner | owner |
| notifications | owner of record (user_id = self) | any authenticated (create) | self | self |
| design_income | owner or designer(self) | designer(self) | owner or designer(self) | owner |
| notes | any authenticated (list/view/create) | any authenticated | author(self) | author(self) |

Implemented via `authenticate` (JWT) + `authorize(...roles)` + per-route ownership checks in controllers/services (e.g. `req.user.id === record.designer_id`).

## 3. Hooks → Express services mapping

| PocketBase hook | Express equivalent |
|---|---|
| `builder-mailer.pb.js` | `services/mailer.service.js` using nodemailer + SMTP env vars |
| `crew-assignments-integrity-check.pb.js` | Enforced natively by MySQL FK constraints; explicit 400 responses from service layer via FK-violation catch |
| `notify-crew-assignment.pb.js` | `services/notification.service.js#notifyCrewAssignment`, called from crew-assignments service after transaction commit |
| `notify-design-complete.pb.js` | `services/notification.service.js#notifyDesignComplete`; **bug fixed**: now compares against current enum value `"completed"` instead of stale `"Done"` |
| `notify-designer-assignment.pb.js` | `services/notification.service.js#notifyDesignerAssignment` |
| `notify-payment-received.pb.js` | `services/notification.service.js#notifyPaymentReceived` |
| `send-team-member-welcome-email.pb.js` | `services/mailer.service.js#sendWelcomeEmail`; **security fix**: no longer emails the raw password — sends a link only, since password is set at registration by the owner/admin flow |
| `custom-migrations-cmd.pb.js` | N/A — PocketBase-specific migration CLI, superseded by Knex `db:migrate`/`db:rollback` |
| `external-dashboard.pb.js` | N/A — PocketBase admin UI hosting concern, not applicable |

All notification/email side effects are dispatched **after** the owning DB transaction commits; email failures are logged via pino but never roll back business data.

## 4. Frontend files changed

All files listed in the audit under `apps/web/src/{contexts,lib,hooks,pages,components}` that imported `pocketbaseClient` were refactored to use `apps/web/src/lib/apiClient.js` and per-domain services in `apps/web/src/services/*.js`. See `git diff` / final file list in the PR for the exhaustive set; `pocketbaseClient.js` was removed entirely and the `pocketbase` npm dependency was removed from `apps/web/package.json`.

## 5. Known gaps / manual decisions required

1. **`expenses` collection**: no PocketBase migration file defines it even though the frontend (`ExpenseInputPage.jsx`, `ExpenseReportPage.jsx`) reads/writes an `expenses` collection with a `receipt_file`. Schema was reconstructed from frontend field usage. If a real PocketBase export exists with a different actual shape, adjust `apps/api/migrations/*_create_expenses.js` before running data migration.
2. **`design_file` upload** on `design_work` was removed from the live PocketBase schema; only `design_file_link` (a plain URL string) is preserved. Frontend components still calling `pb.files.getURL(designWork, ...)` were updated to render `design_file_link` directly instead.
3. **Realtime subscriptions** (`subscribe('*')` used for `design_work`, `orders`, `crew_assignments`, `notifications`) have no PocketBase-realtime equivalent in Express. Replaced with lightweight polling (30s interval) in the affected hooks, since the app has no other SSE/WebSocket infra and low concurrent user counts. If push latency becomes a problem, upgrade to SSE at `/api/events`.
4. **Welcome email with password**: original hook emailed the plaintext password to new team members. This was intentionally changed — the new flow requires the owner to set a password at creation time and the welcome email only contains a login link, not the credential.
5. Real production data migration (Section D, `migrate-pocketbase-data.js`) requires an actual `pb export` JSON dump, which does not exist in this repo (only the live `pb_data` SQLite files under `apps/pocketbase/pb_data`). The script supports importing from `PB_EXPORT_DIR` JSON files; a helper is also documented to export directly from the PocketBase admin UI or `pocketbase superuser` CLI.

## 5b. Available endpoints

```
GET    /api/health

POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/change-password

GET    /api/users            GET/PATCH/DELETE /api/users/:id       POST /api/users
GET    /api/products         GET/PATCH/DELETE /api/products/:id     POST /api/products
GET    /api/orders           GET/PATCH/DELETE /api/orders/:id       POST /api/orders
GET    /api/orders/:id/items
GET    /api/order-items      GET/PATCH/DELETE /api/order-items/:id  POST /api/order-items
GET    /api/expenses         GET/PATCH/DELETE /api/expenses/:id     POST /api/expenses
GET    /api/invoices         GET/PATCH/DELETE /api/invoices/:id     POST /api/invoices
GET    /api/invoices/public/:invoiceNumber   (public, no auth)
GET    /api/design-work      GET/PATCH/DELETE /api/design-work/:id  POST /api/design-work
GET    /api/crew-assignments GET/PATCH/DELETE /api/crew-assignments/:id POST /api/crew-assignments
GET    /api/payments         GET/PATCH/DELETE /api/payments/:id     POST /api/payments
GET    /api/notifications    PATCH /api/notifications/:id/read      POST/DELETE /api/notifications(/:id)
GET    /api/design-income    GET/PATCH/DELETE /api/design-income/:id POST /api/design-income
GET    /api/notes            PATCH/DELETE /api/notes/:id            POST /api/notes
POST   /api/files            GET /api/files/:id/download
```

All routes except `/api/health`, `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`, and `/api/invoices/public/:invoiceNumber` require `Authorization: Bearer <accessToken>`.

## 6. Rollback plan

- `apps/pocketbase` is left untouched on disk (not deleted), so reverting means: restore root `package.json` scripts, restore `apps/web/src` from git history prior to this migration commit, and point Hostinger's frontend Web App env back to `VITE_POCKETBASE_URL`.
- MySQL migrations are additive-only against a new database; dropping the `apps/api` Hostinger Web App and its database fully reverses the backend side with no impact on the existing PocketBase deployment.
