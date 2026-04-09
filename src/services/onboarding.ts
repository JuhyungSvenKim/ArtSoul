import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/current-user';
import { dbWrite } from '@/lib/encrypted-storage';
import type { Gender } from '@/types';

interface CreateUserData {
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender;
}

export async function createUser(data: CreateUserData) {
  const existingId = getCurrentUserId();

  if (existingId) {
    // 기존 회원가입 유저 → user_profiles 업데이트
    await dbWrite("user_profiles", "update", {
      birth_date: data.birthDate,
      birth_time: data.birthTime,
      name_korean: data.nameKorean,
      name_hanja: data.nameHanja,
      gender: data.gender,
      nickname: data.nameKorean,
    }, { id: existingId });
    return { id: existingId };
  }

  // 새 유저 생성
  try {
    const userId = `user_${Date.now()}`;
    const { error } = await supabase.from('user_profiles').insert({
      id: userId,
      nickname: data.nameKorean,
      name_korean: data.nameKorean,
      name_hanja: data.nameHanja,
      birth_date: data.birthDate,
      birth_time: data.birthTime,
      gender: data.gender,
      role: 'consumer',
      is_pass_verified: false,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { id: userId };
  } catch {
    return { id: `local_${Date.now()}` };
  }
}

export async function updateUserMbti(userId: string, mbti: string) {
  await dbWrite("user_profiles", "update", { mbti }, { id: userId });
}

export async function saveTasteSelections(userId: string, selections: string[]) {
  await dbWrite("user_profiles", "update", { taste_selections: selections }, { id: userId });
}

export async function completeOnboarding(userId: string) {
  await dbWrite("user_profiles", "update", { onboarding_complete: true }, { id: userId });
}
