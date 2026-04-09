/**
 * 토스페이먼츠 결제 설정 (Vercel serverless 함수용)
 */

export const TOSS_CONFIG = {
  clientKey: process.env.VITE_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq',
  secretKey: process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R',
  apiUrl: 'https://api.tosspayments.com/v1/payments/confirm',
}

export interface CoinPackage {
  id: number
  name: string
  coins: number
  price: number
  bonus_coins: number
  description: string
  is_active: boolean
}

export const DEFAULT_PACKAGES: CoinPackage[] = [
  { id: 1, name: '스타터', coins: 10, price: 1900, bonus_coins: 0, description: '가볍게 시작', is_active: true },
  { id: 2, name: '베이직', coins: 30, price: 4900, bonus_coins: 3, description: '인기 패키지', is_active: true },
  { id: 3, name: '스탠다드', coins: 60, price: 8900, bonus_coins: 10, description: '가성비 최고', is_active: true },
  { id: 4, name: '프리미엄', coins: 120, price: 15900, bonus_coins: 30, description: '헤비유저 추천', is_active: true },
  { id: 5, name: 'VIP', coins: 300, price: 33900, bonus_coins: 100, description: '최대 혜택', is_active: true },
]

export function generateOrderId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 10)
  return `ARTDNA-${date}-${random}`
}
