/**
 * 사주 프로필 DB 저장/조회
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import type { SajuResult } from "@/lib/saju";

/** 사주 기본 정보를 user_profiles에 저장 */
export async function saveBirthInfo(data: {
  birthDate: string;
  birthTime: string | null;
  gender: string;
}) {
  const userId = getCurrentUserId();
  if (!userId) return;

  await supabase.from("user_profiles").update({
    birth_date: data.birthDate,
    birth_time: data.birthTime,
    gender: data.gender,
  }).eq("user_id", userId);
}

/** 사주 계산 결과를 saju_profiles에 저장 */
export async function saveSajuResult(result: SajuResult, yongsinDetail: any) {
  const userId = getCurrentUserId();
  if (!userId) return;

  const { yeonju, wolju, ilju, siju, sipsung, twelveStages, gyeokguk, sinsal, gongmang, relations, daeun, daeunStartAge } = result;

  await supabase.from("saju_profiles").upsert({
    user_id: userId,
    yeonju, wolju, ilju, siju,
    ohaeng_balance: null, // 별도 계산
    yongsin: yongsinDetail.yongsin,
    yongsin_detail: yongsinDetail,
    gyeokguk: gyeokguk.name,
    gyeokguk_detail: gyeokguk,
    sipsung,
    sinsal,
    gongmang,
    relations,
    daeun,
    daeun_start_age: daeunStartAge,
    twelve_stages: twelveStages,
  }, { onConflict: "user_id" });
}

/** AI 해석 결과를 saju_profiles에 저장 */
export async function saveAIInterpretation(text: string) {
  const userId = getCurrentUserId();
  if (!userId) return;

  await supabase.from("saju_profiles").update({
    ai_interpretation: text,
    ai_interpretation_at: new Date().toISOString(),
  }).eq("user_id", userId);
}

/** 운세를 fortune_records에 저장 */
export async function saveFortuneRecord(data: {
  fortuneType: "today" | "week" | "month" | "year";
  cost: number;
  result: string;
  expiresAt: string;
}) {
  const userId = getCurrentUserId();
  if (!userId) return;

  await supabase.from("fortune_records").insert({
    user_id: userId,
    fortune_type: data.fortuneType,
    cost: data.cost,
    result: data.result,
    expires_at: data.expiresAt,
  });
}

/** DB에서 사주 프로필 로드 */
export async function loadSajuProfile() {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase.from("saju_profiles")
    .select("*").eq("user_id", userId).single();
  return data;
}

/** DB에서 최신 운세 로드 */
export async function loadLatestFortune(fortuneType: string) {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase.from("fortune_records")
    .select("result, expires_at, created_at")
    .eq("user_id", userId)
    .eq("fortune_type", fortuneType)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}
