import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateOrderId, DEFAULT_PACKAGES } from '../_lib/payments'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId, packageId } = req.body

    if (!userId || !packageId) {
      return res.status(400).json({ success: false, error: 'userId, packageId 필수' })
    }

    const supabase = getSupabase()

    let pkg: typeof DEFAULT_PACKAGES[0] | null = null
    const { data: dbPkg } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (dbPkg) {
      pkg = dbPkg
    } else {
      pkg = DEFAULT_PACKAGES.find(p => p.id === packageId) || null
    }

    if (!pkg) {
      return res.status(404).json({ success: false, error: '유효하지 않은 패키지입니다' })
    }

    const orderId = generateOrderId()
    const orderName = `ART.D.N.A. 코인 ${pkg.coins}개${pkg.bonus_coins > 0 ? ` (+${pkg.bonus_coins} 보너스)` : ''}`

    await supabase.from('payment_records').insert({
      user_id: userId,
      order_id: orderId,
      package_id: pkg.id,
      amount: pkg.price,
      coins_purchased: pkg.coins,
      bonus_coins: pkg.bonus_coins,
      status: 'pending',
    })

    return res.status(200).json({
      success: true,
      orderId,
      amount: pkg.price,
      orderName,
      package: {
        name: pkg.name,
        coins: pkg.coins,
        bonus_coins: pkg.bonus_coins,
        price: pkg.price,
      },
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
