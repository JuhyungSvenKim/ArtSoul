/**
 * Supabase 서버 클라이언트 (Vercel serverless 함수용)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function getSupabase(): SupabaseClient {
  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !key) throw new Error('Supabase not configured')
  return createClient(SUPABASE_URL, key)
}

export function getSupabaseAnon(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase not configured')
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }
