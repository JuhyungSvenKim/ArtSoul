/**
 * 작가 서비스 — artists 테이블 연동
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";

export interface ArtistProfile {
  id: number;
  user_id: string;
  artist_name: string;
  bio: string | null;
  portfolio_url: string | null;
  business_number: string | null;
  status: "pending" | "approved" | "rejected";
  artwork_count: number;
  total_sales: number;
}

/** 작가 신청 */
export async function applyAsArtist(data: {
  artistName: string;
  bio: string;
  portfolioUrl: string;
  businessNumber?: string;
}): Promise<boolean> {
  const userId = getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase.from("artists").upsert({
    user_id: userId,
    artist_name: data.artistName,
    bio: data.bio,
    portfolio_url: data.portfolioUrl,
    business_number: data.businessNumber || null,
    status: "pending",
    applied_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return !error;
}

/** 내 작가 프로필 조회 */
export async function getMyArtistProfile(): Promise<ArtistProfile | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase.from("artists")
    .select("*").eq("user_id", userId).single();

  return data as ArtistProfile | null;
}

/** 작가 상태 조회 (간단) */
export async function getArtistStatus(): Promise<"none" | "pending" | "approved" | "rejected"> {
  const profile = await getMyArtistProfile();
  if (!profile) return "none";
  return profile.status;
}

/** 어드민: 작가 목록 조회 */
export async function getArtistApplications() {
  const { data } = await supabase.from("artists")
    .select("*, user_profiles:user_id(display_name, email)")
    .order("applied_at", { ascending: false });
  return data || [];
}

/** 어드민: 작가 승인 */
export async function approveArtist(userId: string) {
  await supabase.from("artists").update({
    status: "approved",
    approved_at: new Date().toISOString(),
  }).eq("user_id", userId);
}

/** 어드민: 작가 거절 */
export async function rejectArtist(userId: string, reason?: string) {
  await supabase.from("artists").update({
    status: "rejected",
    rejected_reason: reason || null,
  }).eq("user_id", userId);
}
