import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경변수 없어도 앱이 크래시하지 않도록 처리
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase 환경변수가 설정되지 않았습니다. DB 기능이 제한됩니다.');
  // 더미 클라이언트 (API 호출 시 에러 발생하지만 앱은 로드됨)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
