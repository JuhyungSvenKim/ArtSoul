import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/current-user';

/**
 * 코인 잔액 조회 — user_coins 테이블 사용
 * (결제 API와 동일한 테이블)
 */
export async function getCoinBalance(userId?: string): Promise<number> {
  const uid = userId || getCurrentUserId();
  if (!uid) return 10;

  try {
    const { data, error } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', uid)
      .single();

    if (error || !data) {
      // 레코드 없으면 생성 (가입 보너스 10코인)
      const { data: newData } = await supabase
        .from('user_coins')
        .upsert({ user_id: uid, coins: 10 }, { onConflict: 'user_id' })
        .select('coins')
        .single();
      return newData?.coins ?? 10;
    }
    return data.coins;
  } catch {
    return 10;
  }
}

/**
 * 코인 차감 — user_coins 테이블 + coin_transactions 기록
 */
export async function deductCoins(userId: string, amount: number): Promise<number> {
  const balance = await getCoinBalance(userId);
  if (balance < amount) {
    throw new Error('코인이 부족합니다');
  }

  const newBalance = balance - amount;

  try {
    // user_coins 업데이트
    await supabase.from('user_coins')
      .update({ coins: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // 거래 기록
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: 'use',
      description: `코인 사용 ${amount}개`,
    });

    return newBalance;
  } catch {
    return newBalance;
  }
}

/**
 * 운세 기록 저장 (레거시 — fortune_history)
 */
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
