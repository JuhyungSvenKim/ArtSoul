/**
 * AI 아트 이미지 생성 + 캐시 관리
 */

const CACHE_KEY_PREFIX = 'artsoul-art-img-'

/** 캐시에서 이미지 URL 가져오기 */
export function getCachedArtImage(caseCode: string): string | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + caseCode)
    if (cached) return cached
  } catch {}
  return null
}

/** AI 이미지 생성 API 호출 + 캐시 저장 */
export async function generateArtImage(caseCode: string): Promise<string> {
  // 캐시 먼저 확인
  const cached = getCachedArtImage(caseCode)
  if (cached) return cached

  const response = await fetch('/api/generate-art', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseCode }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `이미지 생성 실패 (${response.status})`)
  }

  const data = await response.json()
  if (!data.success || !data.imageUrl) {
    throw new Error('이미지를 생성할 수 없습니다')
  }

  // localStorage에 캐시 (base64 이미지)
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + caseCode, data.imageUrl)
  } catch {
    // storage quota 초과 시 오래된 캐시 삭제
    clearOldArtCache()
    try { localStorage.setItem(CACHE_KEY_PREFIX + caseCode, data.imageUrl) } catch {}
  }

  return data.imageUrl
}

/** 오래된 아트 캐시 정리 (최대 20개 유지) */
function clearOldArtCache() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_KEY_PREFIX)) keys.push(key)
  }
  // 20개 넘으면 앞에서부터 삭제
  if (keys.length > 20) {
    keys.slice(0, keys.length - 20).forEach(k => localStorage.removeItem(k))
  }
}
