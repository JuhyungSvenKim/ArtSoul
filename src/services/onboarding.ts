import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/current-user';
import type { Gender } from '@/types';

interface CreateUserData {
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender;
}

/**
 * user_profiles에 upsert (생성 or 업데이트)
 * SQL 스키마: user_id TEXT UNIQUE, 기본 컬럼만 사용
 */
export async function createUser(data: CreateUserData) {
  let userId = getCurrentUserId();
  if (!userId) {
    userId = `user_${Date.now()}`;
    try {
      const raw = localStorage.getItem("artsoul-user");
      const existing = raw ? JSON.parse(raw) : {};
      localStorage.setItem("artsoul-user", JSON.stringify({ ...existing, userId }));
    } catch {}
  }

  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    display_name: data.nameKorean,
    birth_date: data.birthDate,
    birth_time: data.birthTime,
    gender: data.gender,
    role: 'user',
  }, { onConflict: 'user_id' });

  if (error) {
    console.warn('[createUser] upsert failed:', error.message);
  }

  return { id: userId };
}

export async function updateUserMbti(userId: string, mbti: string) {
  const { error } = await supabase.from('user_profiles')
    .update({ mbti })
    .eq('user_id', userId);
  if (error) console.warn('[updateUserMbti] failed:', error.message);
}

export async function saveTasteSelections(userId: string, selections: string[]) {
  const { error } = await supabase.from('art_taste_selections').insert({
    user_id: userId,
    selections,
    round: 1,
  });
  if (error) console.warn('[saveTasteSelections] failed:', error.message);
}

export async function completeOnboarding(userId: string) {
  // user_profiles에 완료 플래그 저장 (updated_at으로 갱신만)
  const { error } = await supabase.from('user_profiles')
    .update({ updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) console.warn('[completeOnboarding] failed:', error.message);
}
