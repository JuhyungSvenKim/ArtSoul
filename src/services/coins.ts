import { supabase } from '@/lib/supabase';

export async function getCoinBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('coins')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.coins ?? 0;
}

export async function deductCoins(userId: string, amount: number): Promise<number> {
  // 현재 잔액 확인
  const balance = await getCoinBalance(userId);
  if (balance < amount) {
    throw new Error('코인이 부족합니다');
  }

  const newBalance = balance - amount;
  const { error } = await supabase
    .from('users')
    .update({ coins: newBalance })
    .eq('id', userId);

  if (error) throw error;
  return newBalance;
}

export async function saveFortune(params: {
  userId: string;
  fortuneType: 'today' | 'week' | 'month' | 'year';
  cost: number;
  sajuPrompt: string;
  result: string;
}) {
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
}

export async function getLatestFortune(userId: string, fortuneType: string) {
  const { data, error } = await supabase
    .from('fortune_history')
    .select('*')
    .eq('user_id', userId)
    .eq('fortune_type', fortuneType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
