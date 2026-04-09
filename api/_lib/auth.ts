/**
 * 인증 유틸리티 (Vercel serverless 함수용)
 */

export const SUPERADMIN = {
  id: process.env.ADMIN_ID || 'superadmin',
  password: process.env.ADMIN_PASSWORD || 'ArtDNA2026!',
  email: 'superadmin@artsoul.art',
}

export type UserRole = 'user' | 'admin' | 'superadmin'

const JWT_SECRET = process.env.JWT_SECRET || 'artsoul-admin-secret-2026'

export function createAdminToken(adminId: string, role: UserRole): string {
  const payload = {
    sub: adminId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = Buffer.from(JSON.stringify({ secret: JWT_SECRET.slice(0, 8) })).toString('base64')
  return `${header}.${body}.${signature}`
}

export function verifyAdminToken(token: string): { sub: string; role: UserRole } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

export const NAVER_OAUTH = {
  clientId: process.env.NAVER_CLIENT_ID || '',
  clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  callbackUrl: process.env.NAVER_CALLBACK_URL || '/api/auth/naver/callback',
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
  profileUrl: 'https://openapi.naver.com/v1/nid/me',
}

export const PASS_CONFIG = {
  siteCode: process.env.PASS_SITE_CODE || '',
  sitePw: process.env.PASS_SITE_PW || '',
  callbackUrl: process.env.PASS_CALLBACK_URL || '/api/auth/verify-identity/callback',
  moduleType: 'M' as const,
}
