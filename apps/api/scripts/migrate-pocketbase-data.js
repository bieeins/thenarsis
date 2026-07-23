/**
 * Imports PocketBase collection exports (JSON) into MySQL.
 *
 * Usage:
 *   PB_EXPORT_DIR=./pb-export node scripts/migrate-pocketbase-data.js
 *   npm run migrate:pocketbase -- --dry-run
 *
 * Expects one JSON file per collection in PB_EXPORT_DIR, named
 * `<collection>.json`, each containing an array of PocketBase records
 * (the format produced by exporting each collection's records as JSON
 * from the PocketBase Admin UI, or `pb.collection(name).getFullList()`
 * dumped to disk).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { db } from '../src/config/database.js';
import { env } from '../src/config/env.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BCRYPT_ROUNDS = 12;

const report = {};

function recordResult(collection) {
  if (!report[collection]) {
    report[collection] = { read: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
  }
  return report[collection];
}

function readExport(collection) {
  const file = path.join(env.pbExportDir, `${collection}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : (data.items || []);
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function upsert(table, id, data) {
  const existing = await db(table).where({ id }).first();
  if (existing) {
    if (!DRY_RUN) await db(table).where({ id }).update(data);
    return 'updated';
  }
  if (!DRY_RUN) await db(table).insert({ id, ...data });
  return 'inserted';
}

async function migrateUsers() {
  const stats = recordResult('users');
  const records = readExport('users');
  stats.read = records.length;

  for (const rec of records) {
    try {
      // PocketBase never exports the raw password. Migrated accounts get a
      // random temporary password; the owner must reset it via
      // POST /api/auth/change-password or by re-inviting the user.
      const tempPassword = crypto.randomBytes(18).toString('base64url');
      const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

      await upsert('users', rec.id, {
        email: (rec.email || '').toLowerCase(),
        password_hash: passwordHash,
        name: rec.name || rec.email,
        phone: rec.phone || null,
        role: rec.role || 'crew',
        avatar: rec.avatar || null,
        verified: Boolean(rec.verified),
        created_at: toDateOrNull(rec.created) || new Date(),
        updated_at: toDateOrNull(rec.updated) || new Date(),
      });
      stats.imported += 1;
    } catch (err) {
      stats.failed += 1;
      stats.errors.push({ id: rec.id, message: err.message });
    }
  }
}

async function migrateSimple(collection, table, mapFields) {
  const stats = recordResult(collection);
  const records = readExport(collection);
  stats.read = records.length;

  for (const rec of records) {
    try {
      const data = await mapFields(rec);
      if (data === null) {
        stats.skipped += 1;
        continue;
      }
      await upsert(table, rec.id, data);
      stats.imported += 1;
    } catch (err) {
      stats.failed += 1;
      stats.errors.push({ id: rec.id, message: err.message });
    }
  }
}

async function main() {
  if (!env.pbExportDir) {
    console.error('PB_EXPORT_DIR is not set. Point it to a directory containing per-collection JSON exports.');
    process.exit(1);
  }
  if (!fs.existsSync(env.pbExportDir)) {
    console.error(`PB_EXPORT_DIR "${env.pbExportDir}" does not exist.`);
    process.exit(1);
  }

  console.log(`Importing PocketBase export from ${env.pbExportDir}${DRY_RUN ? ' (dry-run, no writes)' : ''}`);

  // Import order follows FK dependency order.
  await migrateUsers();

  await migrateSimple('products', 'products', (r) => ({
    package_name: r.package_name,
    description: r.description || null,
    base_price: r.base_price,
    category: r.category,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('orders', 'orders', (r) => ({
    customer_name: r.customer_name,
    phone_number: r.phone_number,
    event_name: r.event_name,
    event_date: toDateOrNull(r.event_date),
    event_location: r.event_location,
    product_id: r.product_id,
    assigned_designer_id: r.assigned_designer_id || null,
    status: r.status,
    invoice_number: r.invoice_number || null,
    description: r.description || null,
    designer_notes: r.designer_notes || null,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('order_items', 'order_items', (r) => ({
    order_id: r.order_id,
    product_id: r.product_id,
    base_price: r.base_price,
    adjusted_price: r.adjusted_price || null,
    quantity: r.quantity || 1,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('expenses', 'expenses', (r) => ({
    transaction_date: toDateOrNull(r.transaction_date),
    category: r.category,
    amount: r.amount,
    description: r.description || null,
    uploaded_by_id: r.uploaded_by_id,
    receipt_file: r.receipt_file || null,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('invoices', 'invoices', (r) => ({
    order_id: r.order_id,
    invoice_number: r.invoice_number,
    total_amount: r.total_amount,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('design_work', 'design_work', (r) => ({
    order_id: r.order_id,
    designer_id: r.designer_id,
    design_notes: r.design_notes || null,
    status: r.status,
    design_fee: r.design_fee || null,
    design_file_link: r.design_file_link || null,
    assigned_date: toDateOrNull(r.assigned_date),
    assigned_by: r.assigned_by || null,
    fee_submitted_date: toDateOrNull(r.fee_submitted_date),
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('crew_assignments', 'crew_assignments', (r) => ({
    order_id: r.order_id,
    crew_id: r.crew_id,
    fee: r.fee || null,
    status: r.status,
    paid_amount: r.paid_amount || null,
    pending_amount: r.pending_amount || null,
    attendance_status: r.attendance_status || null,
    attendance_date: toDateOrNull(r.attendance_date),
    attendance_reason: r.attendance_reason || null,
    assigned_date: toDateOrNull(r.assigned_date),
    assigned_by: r.assigned_by || null,
    attendance_amount: r.attendance_amount || null,
    crew_notes: r.crew_notes || null,
    check_in_time: toDateOrNull(r.check_in_time),
    check_out_time: toDateOrNull(r.check_out_time),
    attendance_confirmation: Boolean(r.attendance_confirmation),
    notes_timestamp: toDateOrNull(r.notes_timestamp),
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('payments', 'payments', (r) => ({
    invoice_id: r.invoice_id,
    amount: r.amount,
    payment_date: toDateOrNull(r.payment_date),
    payment_method: r.payment_method,
    notes: r.notes || null,
    payment_status: r.payment_status,
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('notifications', 'notifications', (r) => ({
    user_id: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    related_order_id: r.related_order_id || null,
    is_read: Boolean(r.is_read),
    created_date: toDateOrNull(r.created_date) || new Date(),
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('design_income', 'design_income', (r) => ({
    order_id: r.order_id,
    designer_id: r.designer_id,
    designer_name: r.designer_name,
    fee_amount: r.fee_amount,
    status: r.status,
    created_date: toDateOrNull(r.created_date) || new Date(),
    updated_date: toDateOrNull(r.updated_date) || new Date(),
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  await migrateSimple('notes', 'notes', (r) => ({
    order_id: r.order_id,
    user_id: r.user_id,
    user_role: r.user_role,
    user_name: r.user_name,
    note_content: r.note_content,
    created_date: toDateOrNull(r.created_date) || new Date(),
    updated_date: toDateOrNull(r.updated_date) || new Date(),
    created_at: toDateOrNull(r.created) || new Date(),
    updated_at: toDateOrNull(r.updated) || new Date(),
  }));

  console.log('\n=== Migration report ===');
  for (const [collection, stats] of Object.entries(report)) {
    console.log(`\n${collection}: read=${stats.read} imported=${stats.imported} skipped=${stats.skipped} failed=${stats.failed}`);
    for (const err of stats.errors) {
      console.log(`  - [${err.id}] ${err.message}`);
    }
  }

  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
