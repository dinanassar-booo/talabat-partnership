export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureDb } = await import('./db/ensure-db')
    await ensureDb()
  }
}
