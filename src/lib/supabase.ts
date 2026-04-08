/**
 * Supabase 클라이언트 (브라우저 + 서버)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chorbmxylvhofievnpti.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ── 브라우저 클라이언트 (싱글톤) ─────────────────────
let browserClient: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return browserClient
}

// ── 서버 클라이언트 (Service Role) ──────────────────
export function getSupabaseServer(): SupabaseClient {
  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
  if (!key) throw new Error('Supabase key not configured')
  return createClient(SUPABASE_URL, key)
}

// ── 공통 유틸 ───────────────────────────────────────
export { SUPABASE_URL }
