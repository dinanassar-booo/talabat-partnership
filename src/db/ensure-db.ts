import { getDb } from './index'

export async function ensureDb() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      trade_number TEXT NOT NULL UNIQUE,
      country TEXT NOT NULL DEFAULT 'UAE',
      industry TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      admin_email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'onboarding',
      tc_accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL REFERENCES partners(id),
      emp_id_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      removed_at TIMESTAMPTZ,
      UNIQUE(partner_id, emp_id_hash)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS benefit_types (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      braze_canvas_id TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL REFERENCES partners(id),
      benefit_type_id TEXT NOT NULL REFERENCES benefit_types(id),
      name TEXT NOT NULL,
      credit_value NUMERIC NOT NULL,
      cycle_type TEXT NOT NULL,
      headcount INTEGER NOT NULL,
      budget_total NUMERIC NOT NULL,
      budget_used NUMERIC NOT NULL DEFAULT 0,
      braze_canvas_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS budget_accounts (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL UNIQUE REFERENCES partners(id),
      balance NUMERIC NOT NULL DEFAULT 0,
      total_top_up NUMERIC NOT NULL DEFAULT 0,
      total_spent NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS benefit_codes (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL REFERENCES partners(id),
      campaign_id TEXT NOT NULL REFERENCES campaigns(id),
      code TEXT NOT NULL UNIQUE,
      employee_email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      assigned_at TIMESTAMPTZ,
      redeemed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS upload_batches (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL REFERENCES partners(id),
      filename TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      added INTEGER NOT NULL DEFAULT 0,
      removed INTEGER NOT NULL DEFAULT 0,
      errors INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
// Add new columns to existing tables (safe — IF NOT EXISTS)
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT`
  await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'FLAT'`
  await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_order_value NUMERIC NOT NULL DEFAULT 30`
  await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 7`
  await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS next_send_at TIMESTAMPTZ`

  // Update voucher wallet canvas ID
  await sql`UPDATE benefit_types SET braze_canvas_id = '91e0ba33-7878-45a9-aa62-bcc9b1437a44' WHERE slug = 'voucher_wallet'`
  
  // Seed benefit types
  const seeds = [
    { id: 'bt_voucher', slug: 'voucher_wallet', name: 'Voucher wallet', description: 'Recurring credit loaded automatically each cycle. Employees spend across all talabat categories.', brazeCanvasId: 'CANVAS_VOUCHER_WALLET_MASTER' },
    { id: 'bt_code', slug: 'single_use_code', name: 'Single-use code', description: 'One-time voucher code redeemable at checkout. Great for one-off rewards.', brazeCanvasId: 'CANVAS_SINGLE_USE_MASTER' },
    { id: 'bt_tpro', slug: 'tpro', name: 'Talabat Pro', description: 'Subsidised Pro subscription giving employees free delivery and exclusive offers.', brazeCanvasId: 'CANVAS_TPRO_MASTER' },
    { id: 'bt_dine', slug: 'dine_out', name: 'Dine out', description: 'Restaurant credit usable for in-venue dining through talabat dine-out.', brazeCanvasId: 'CANVAS_DINE_OUT_MASTER' },
  ]
  for (const b of seeds) {
    await sql`
      INSERT INTO benefit_types (id, slug, name, description, braze_canvas_id)
      VALUES (${b.id}, ${b.slug}, ${b.name}, ${b.description}, ${b.brazeCanvasId})
      ON CONFLICT (slug) DO NOTHING
    `
  }
}
