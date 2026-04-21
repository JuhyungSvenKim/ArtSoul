import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/current-user';

export async function getCoinBalance(userId?: string): Promise<number> {
  const uid = userId || getCurrentUserId();
  if (!uid) return 100;

  try {
    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', uid)
      .single();

    if (error || !data) {
      const { data: newData } = await supabase
        .from('user_coins')
        .upsert({ user_id: uid, balance: 100 }, { onConflict: 'user_id' })
        .select('balance')
        .single();
      return newData?.balance ?? 100;
    }
    return data.balance;
  } catch {
    return 100;
  }
}

export async function deductCoins(userId: string, amount: number): Promise<number> {
  const balance = await getCoinBalance(userId);
  if (balance < amount) {
    throw new Error('코인이 부족합니다');
  }

  const newBalance = balance - amount;

  try {
    await supabase.from('user_coins')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      type: 'use',
      description: `코인 사용 ${amount}개`,
    });

    return newBalance;
  } catch {
    return newBalance;
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
    await supabase.from('fortune_history').insert({
      user_id: params.userId,
      fortune_type: params.fortuneType,
      cost: params.cost,
      saju_prompt: params.sajuPrompt,
      result: params.result,
    });
  } catch {}
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
