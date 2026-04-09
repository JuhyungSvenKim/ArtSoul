import { supabase } from '@/lib/supabase';

export async function getCoinBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();
    if (error) return 10; // 기본 10코인
    return data?.coins ?? 10;
  } catch {
    return 10;
  }
}

export async function deductCoins(userId: string, amount: number): Promise<number> {
  const balance = await getCoinBalance(userId);
  if (balance < amount) {
    throw new Error('코인이 부족합니다');
  }

  try {
    const newBalance = balance - amount;
    const { error } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', userId);
    if (error) throw error;
    return newBalance;
  } catch {
    return balance - amount;
  }
}

export async function saveFortune(params: {
  userId: string;
  fortuneType: 'today' | 'week' | 'month' | 'year';
  cost: number;
  sajuPrompt: string;
  result: string;
}) {
  try {
    const { error } = await supabase
      .from('fortune_history')
      .insert({
        user_id: params.userId,
        fortune_type: params.fortuneType,
        cost: params.cost,
        saju_prompt: params.sajuPrompt,
        result: params.result,
      });
    if (error) throw error;
  } catch {
    // DB 미연결 시 무시
  }
}

export async function getLatestFortune(userId: string, fortuneType: string) {
  try {
    const { data, error } = await supabase
      .from('fortune_history')
      .select('*')
      .eq('user_id', userId)
      .eq('fortune_type', fortuneType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') return null;
    return data;
  } catch {
    return null;
  }
}
