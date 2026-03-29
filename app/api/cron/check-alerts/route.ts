import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStockQuote } from '@/lib/market-data/nse-client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: activeAlerts, error } = await supabaseAdmin
    .from('user_alerts')
    .select('*')
    .eq('is_active', true)
    .eq('is_auto_generated', false)
    .not('symbol', 'is', null)

  if (error || !activeAlerts) return NextResponse.json({ checked: 0 })

  // Group by symbol to minimize API calls
  const bySymbol: Record<string, any[]> = {}
  for (const alert of activeAlerts) {
    if (!bySymbol[alert.symbol]) bySymbol[alert.symbol] = []
    bySymbol[alert.symbol].push(alert)
  }

  let triggered = 0

  for (const [symbol, alerts] of Object.entries(bySymbol)) {
    try {
      const quote = await getStockQuote(symbol + '.NS')
      if (!quote.price) continue

      for (const alert of alerts) {
        const condition = alert.condition || {}
        let shouldTrigger = false
        let title = ''
        let body = ''

        if (alert.alert_type === 'price_target') {
          const { target_price, direction } = condition
          if (direction === 'above' && quote.price >= target_price) {
            shouldTrigger = true
            title = `${symbol} crossed ₹${target_price.toLocaleString('en-IN')}`
            body = `Current price: ₹${quote.price.toFixed(2)} (+${quote.changePct.toFixed(2)}% today)`
          } else if (direction === 'below' && quote.price <= target_price) {
            shouldTrigger = true
            title = `${symbol} fell below ₹${target_price.toLocaleString('en-IN')}`
            body = `Current price: ₹${quote.price.toFixed(2)} (${quote.changePct.toFixed(2)}% today)`
          }
        } else if (alert.alert_type === '52w_high') {
          if (quote.week52High && quote.price >= quote.week52High * 0.99) {
            shouldTrigger = true
            title = `${symbol} near 52-week high!`
            body = `At ₹${quote.price.toFixed(2)}, near 52W high of ₹${quote.week52High?.toFixed(2)}`
          }
        } else if (alert.alert_type === '52w_low') {
          if (quote.week52Low && quote.price <= quote.week52Low * 1.01) {
            shouldTrigger = true
            title = `${symbol} near 52-week low`
            body = `At ₹${quote.price.toFixed(2)}, near 52W low of ₹${quote.week52Low?.toFixed(2)}`
          }
        }

        if (shouldTrigger) {
          // Create notification
          await supabaseAdmin.from('notifications').insert({
            clerk_user_id: alert.clerk_user_id,
            alert_id: alert.id,
            title,
            body,
            action_url: `/markets?symbol=${symbol}`,
            is_read: false,
            urgency: 'high',
          })

          // Deactivate one-time alerts
          if (alert.alert_type === 'price_target') {
            await supabaseAdmin.from('user_alerts').update({ is_active: false }).eq('id', alert.id)
          }

          triggered++
        }
      }
    } catch {}
  }

  return NextResponse.json({ checked: Object.keys(bySymbol).length, triggered })
}

// Also allow GET for testing
export async function GET(req: NextRequest) {
  return POST(req)
}
