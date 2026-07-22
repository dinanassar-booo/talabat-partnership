export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { ensureDb } = await import('./db/ensure-db')
      await ensureDb()
      console.log('DB initialized successfully')
    } catch (e) {
      console.error('DB init error:', e)
    }
  }
}
