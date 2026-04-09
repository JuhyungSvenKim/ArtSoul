/**
 * 좋아요 — 암호화 로컬 + Supabase 듀얼 라이트
 */
import { getCurrentUserId } from "./current-user";
import { dbWrite, encryptedSet, encryptedGet } from "./encrypted-storage";

export interface LikedArtwork {
  id: string;
  title: string;
  artist: string;
  element: string;
  energy: number;
  style: string;
  likedAt: string;
}

const STORAGE_KEY = "artsoul-likes";

// 동기 읽기 (캐시 — 평문 fallback 포함)
export function getLikes(): LikedArtwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // 암호화 데이터면 빈 배열 (비동기 로드 필요)
    try { return JSON.parse(raw); } catch { return []; }
  } catch { return []; }
}

// 비동기 읽기 (암호화 복호화)
export async function getLikesAsync(): Promise<LikedArtwork[]> {
  const userId = getCurrentUserId();
  if (!userId) return getLikes();
  const data = await encryptedGet<LikedArtwork[]>(STORAGE_KEY, userId);
  return data || [];
}

function saveLikesSync(items: LikedArtwork[]) {
  // 즉시 평문 저장 (동기 읽기용), 이후 암호화로 덮어씀
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const userId = getCurrentUserId();
  if (userId) encryptedSet(STORAGE_KEY, items, userId);
}

export function isLiked(artworkId: string): boolean {
  return getLikes().some(l => l.id === artworkId);
}

export function toggleLike(artwork: Omit<LikedArtwork, "likedAt">): boolean {
  const likes = getLikes();
  const idx = likes.findIndex(l => l.id === artwork.id);
  const userId = getCurrentUserId();

  if (idx >= 0) {
    likes.splice(idx, 1);
    saveLikesSync(likes);
    if (userId) {
      dbWrite("likes", "delete", null, { user_id: userId, artwork_id: artwork.id });
    }
    return false;
  } else {
    likes.unshift({ ...artwork, likedAt: new Date().toISOString() });
    saveLikesSync(likes);
    if (userId) {
      dbWrite("likes", "upsert", {
        user_id: userId,
        artwork_id: artwork.id,
        artwork_data: artwork,
        created_at: new Date().toISOString(),
      }, undefined, "user_id,artwork_id");
    }
    return true;
  }
}
