/**
 * 사주/운세 결과 캐싱 (localStorage 기반, 만료 시간 포함)
 */

interface CachedResult {
  text: string;
  createdAt: string;  // ISO string
  expiresAt: string;  // ISO string
}

const CACHE_PREFIX = 'artsoul_cache_';

function getKey(type: string): string {
  return `${CACHE_PREFIX}${type}`;
}

function now(): Date {
  return new Date();
}

/**
 * 만료 시간 계산
 * - ai_interpretation: 1달
 * - today: 오늘 자정까지
 * - week: 이번 주 일요일 자정까지
 * - month: 이번 달 마지막 날 자정까지
 * - year: 올해 12/31 자정까지
 */
export function getExpiryDate(type: 'ai_interpretation' | 'today' | 'week' | 'month' | 'year'): Date {
  const d = now();

  switch (type) {
    case 'ai_interpretation': {
      const expiry = new Date(d);
      expiry.setMonth(expiry.getMonth() + 1);
      return expiry;
    }
    case 'today': {
      const expiry = new Date(d);
      expiry.setDate(expiry.getDate() + 1);
      expiry.setHours(0, 0, 0, 0);
      return expiry;
    }
    case 'week': {
      const expiry = new Date(d);
      const dayOfWeek = expiry.getDay(); // 0=일, 1=월, ...
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      expiry.setDate(expiry.getDate() + daysUntilSunday);
      expiry.setHours(0, 0, 0, 0);
      return expiry;
    }
    case 'month': {
      const expiry = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
      return expiry;
    }
    case 'year': {
      const expiry = new Date(d.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      return expiry;
    }
  }
}

/**
 * 캐시에 저장
 */
export function saveCache(type: string, text: string, expiresAt: Date): void {
  const entry: CachedResult = {
    text,
    createdAt: now().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  try {
    localStorage.setItem(getKey(type), JSON.stringify(entry));
  } catch {}
}

/**
 * 캐시에서 읽기 (만료 체크 포함)
 * 만료되었으면 null 반환 + 자동 삭제
 */
export function loadCache(type: string): CachedResult | null {
  try {
    const raw = localStorage.getItem(getKey(type));
    if (!raw) return null;

    const entry: CachedResult = JSON.parse(raw);
    const expiry = new Date(entry.expiresAt);

    if (now() >= expiry) {
      localStorage.removeItem(getKey(type));
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

/**
 * 남은 유효기간 텍스트
 */
export function getRemainingText(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now().getTime();

  if (diff <= 0) return '만료됨';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 남음`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}분 남음`;
}
