/**
 * Called at app startup to ensure the DB exists and is seeded.
 * Safe to call multiple times — all operations are idempotent.
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { benefitTypes } from './schema'
import { eq } from 'drizzle-orm'

export async function ensureDb() {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  const client = createClient({ url })
  const db = drizzle(client)

  // Create tables if they don't exist
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY, company_name TEXT NOT NULL, trade_number TEXT NOT NULL UNIQUE,
      country TEXT NOT NULL DEFAULT 'UAE', industry TEXT NOT NULL, admin_name TEXT NOT NULL,
      admin_email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'onboarding', tc_accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY, partner_id TEXT NOT NULL REFERENCES partners(id),
      emp_id_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
      enrolled_at TEXT NOT NULL DEFAULT (datetime('now')), removed_at TEXT,
      UNIQUE(partner_id, emp_id_hash)
    );
    CREATE TABLE IF NOT EXISTS benefit_types (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      description TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, braze_canvas_id TEXT
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY, partner_id TEXT NOT NULL REFERENCES partners(id),
      benefit_type_id TEXT NOT NULL REFERENCES benefit_types(id), name TEXT NOT NULL,
      credit_value REAL NOT NULL, cycle_type TEXT NOT NULL, headcount INTEGER NOT NULL,
      budget_total REAL NOT NULL, budget_used REAL NOT NULL DEFAULT 0, braze_canvas_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending', starts_at TEXT, ends_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id),
      campaign_id TEXT NOT NULL REFERENCES campaigns(id),
      enrolled_at TEXT NOT NULL DEFAULT (datetime('now')), status TEXT NOT NULL DEFAULT 'active',
      UNIQUE(employee_id, campaign_id)
    );
    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id),
      emp_id_hash TEXT NOT NULL, amount REAL NOT NULL,
      redeemed_at TEXT NOT NULL DEFAULT (datetime('now')), cycle_ref TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budget_accounts (
      id TEXT PRIMARY KEY, partner_id TEXT NOT NULL UNIQUE REFERENCES partners(id),
      balance REAL NOT NULL DEFAULT 0, total_top_up REAL NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS upload_batches (
      id TEXT PRIMARY KEY, partner_id TEXT NOT NULL REFERENCES partners(id),
      filename TEXT NOT NULL, total_rows INTEGER NOT NULL, added INTEGER NOT NULL DEFAULT 0,
      removed INTEGER NOT NULL DEFAULT 0, errors INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing', created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Seed benefit types (idempotent)
  const seeds = [
    { id: 'bt_voucher', slug: 'voucher_wallet', name: 'Voucher wallet', description: 'Recurring credit loaded automatically each cycle. Employees spend across all talabat categories.', brazeCanvasId: 'CANVAS_VOUCHER_WALLET_MASTER' },
    { id: 'bt_code', slug: 'single_use_code', name: 'Single-use code', description: 'One-time voucher code redeemable at checkout. Great for one-off rewards.', brazeCanvasId: 'CANVAS_SINGLE_USE_MASTER' },
    { id: 'bt_tpro', slug: 'tpro', name: 'Talabat Pro', description: 'Subsidised Pro subscription giving employees free delivery and exclusive offers.', brazeCanvasId: 'CANVAS_TPRO_MASTER' },
    { id: 'bt_dine', slug: 'dine_out', name: 'Dine out', description: 'Restaurant credit usable for in-venue dining through talabat dine-out.', brazeCanvasId: 'CANVAS_DINE_OUT_MASTER' },
  ]
  for (const b of seeds) {
    const exists = await db.select().from(benefitTypes).where(eq(benefitTypes.slug, b.slug)).get()
    if (!exists) await db.insert(benefitTypes).values(b)
  }
}
