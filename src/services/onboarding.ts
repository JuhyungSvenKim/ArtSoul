import { supabase } from '@/lib/supabase';
import type { Gender } from '@/types';

interface CreateUserData {
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender;
}

export async function createUser(data: CreateUserData) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        nickname: data.nameKorean,
        birth_date: data.birthDate,
        birth_time: data.birthTime,
        name_korean: data.nameKorean,
        name_hanja: data.nameHanja,
        gender: data.gender,
        onboarding_step: 'mbti',
      })
      .select()
      .single();

    if (error) throw error;
    return user;
  } catch {
    // DB 미연결 시 임시 유저 ID 반환
    return { id: `local_${Date.now()}` };
  }
}

export async function updateUserMbti(userId: string, mbti: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ mbti, onboarding_step: 'taste' })
      .eq('id', userId);
    if (error) throw error;
  } catch {
    // DB 미연결 시 무시
  }
}

export async function saveTasteSelections(userId: string, selections: string[]) {
  try {
    const rows = selections.map((artworkId, index) => ({
      user_id: userId,
      round: index + 1,
      selected_artwork_id: artworkId,
      selected_ohaeng_tags: [],
    }));

    const { error } = await supabase
      .from('art_taste_selections')
      .insert(rows);
    if (error) throw error;

    await supabase
      .from('users')
      .update({ onboarding_step: 'dna_card' })
      .eq('id', userId);
  } catch {
    // DB 미연결 시 무시
  }
}

export async function completeOnboarding(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ onboarding_step: 'complete' })
      .eq('id', userId);
    if (error) throw error;
  } catch {
    // DB 미연결 시 무시
  }
}
