import { sql } from 'drizzle-orm'
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core'

export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  tradeNumber: text('trade_number').notNull().unique(),
  country: text('country').notNull().default('UAE'),
  industry: text('industry').notNull(),
  adminName: text('admin_name').notNull(),
  adminEmail: text('admin_email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  status: text('status').notNull().default('onboarding'),
  tcAcceptedAt: text('tc_accepted_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  empIdHash: text('emp_id_hash').notNull(),
  status: text('status').notNull().default('active'),
  enrolledAt: text('enrolled_at').notNull().default(sql`(datetime('now'))`),
  removedAt: text('removed_at'),
})

export const benefitTypes = sqliteTable('benefit_types', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  brazeCanvasId: text('braze_canvas_id'),
})

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  benefitTypeId: text('benefit_type_id').notNull().references(() => benefitTypes.id),
  name: text('name').notNull(),
  creditValue: real('credit_value').notNull(),
  cycleType: text('cycle_type').notNull(),
  headcount: integer('headcount').notNull(),
  budgetTotal: real('budget_total').notNull(),
  budgetUsed: real('budget_used').notNull().default(0),
  brazeCanvasId: text('braze_canvas_id'),
  status: text('status').notNull().default('pending'),
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id),
  enrolledAt: text('enrolled_at').notNull().default(sql`(datetime('now'))`),
  status: text('status').notNull().default('active'),
})

export const redemptions = sqliteTable('redemptions', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id),
  empIdHash: text('emp_id_hash').notNull(),
  amount: real('amount').notNull(),
  redeemedAt: text('redeemed_at').notNull().default(sql`(datetime('now'))`),
  cycleRef: text('cycle_ref').notNull(),
})

export const budgetAccounts = sqliteTable('budget_accounts', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().unique().references(() => partners.id),
  balance: real('balance').notNull().default(0),
  totalTopUp: real('total_top_up').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const uploadBatches = sqliteTable('upload_batches', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  filename: text('filename').notNull(),
  totalRows: integer('total_rows').notNull(),
  added: integer('added').notNull().default(0),
  removed: integer('removed').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  status: text('status').notNull().default('processing'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})
