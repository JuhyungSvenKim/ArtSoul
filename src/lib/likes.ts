/**
 * 좋아요 — localStorage 기반
 */

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

export function getLikes(): LikedArtwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLikes(items: LikedArtwork[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isLiked(artworkId: string): boolean {
  return getLikes().some(l => l.id === artworkId);
}

export function toggleLike(artwork: Omit<LikedArtwork, "likedAt">): boolean {
  const likes = getLikes();
  const idx = likes.findIndex(l => l.id === artwork.id);
  if (idx >= 0) {
    likes.splice(idx, 1);
    saveLikes(likes);
    return false; // unliked
  } else {
    likes.unshift({ ...artwork, likedAt: new Date().toISOString() });
    saveLikes(likes);
    return true; // liked
  }
}

export function removeLike(artworkId: string) {
  const likes = getLikes().filter(l => l.id !== artworkId);
  saveLikes(likes);
}
