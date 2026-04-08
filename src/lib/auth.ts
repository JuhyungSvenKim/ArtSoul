/**
 * 인증 유틸리티
 *
 * - 소셜 로그인: Kakao, Apple, Naver (Supabase Auth)
 * - 어드민 로그인: 자체 JWT
 * - 역할 시스템: user, admin, superadmin
 */

// ── 슈퍼어드민 계정 ────────────────────────────────
// 환경변수로 오버라이드 가능, 기본값은 테스트용
export const SUPERADMIN = {
  id: process.env.ADMIN_ID || 'superadmin',
  password: process.env.ADMIN_PASSWORD || 'ArtDNA2026!',
  email: 'superadmin@artsoul.art',
}

export type UserRole = 'user' | 'admin' | 'superadmin'

export interface UserProfile {
  user_id: string
  display_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  real_name: string | null
  is_verified: boolean
  provider: string | null
  role: UserRole
  coins?: number
}

export type SocialProvider = 'kakao' | 'apple' | 'naver'

// ── 간단 JWT (어드민용) ─────────────────────────────
// Next.js 서버사이드에서만 사용. 프로덕션에서는 jose 등 사용 권장.
const JWT_SECRET = process.env.JWT_SECRET || 'artsoul-admin-secret-2026'

export function createAdminToken(adminId: string, role: UserRole): string {
  const payload = {
    sub: adminId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24시간
  }
  // Base64 인코딩 (간단 JWT, 서명 없음 — 프로덕션에서는 jose 사용)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signature = btoa(JSON.stringify({ secret: JWT_SECRET.slice(0, 8) }))
  return `${header}.${body}.${signature}`
}

export function verifyAdminToken(token: string): { sub: string; role: UserRole } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

// ── 네이버 OAuth (수동 구현) ────────────────────────
// Supabase에서 네이버를 네이티브 지원하지 않으므로 수동 OAuth 플로우
export const NAVER_OAUTH = {
  clientId: process.env.NAVER_CLIENT_ID || '',
  clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  callbackUrl: process.env.NAVER_CALLBACK_URL || '/api/auth/naver/callback',
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
  profileUrl: 'https://openapi.naver.com/v1/nid/me',
}

export function getNaverAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_OAUTH.clientId,
    redirect_uri: NAVER_OAUTH.callbackUrl,
    state,
  })
  return `${NAVER_OAUTH.authUrl}?${params}`
}

// ── PASS 본인인증 설정 ──────────────────────────────
export const PASS_CONFIG = {
  // NICE 본인인증 또는 KCB 본인인증
  // 실제 연동 시 NICE 아이핀/본인인증 모듈 사용
  siteCode: process.env.PASS_SITE_CODE || '',
  sitePw: process.env.PASS_SITE_PW || '',
  callbackUrl: process.env.PASS_CALLBACK_URL || '/api/auth/verify-identity/callback',
  // 모듈 타입: M(휴대폰), I(아이핀), X(공동인증서)
  moduleType: 'M' as const,
}
