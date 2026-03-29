import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getStockQuote } from '@/lib/market-data/nse-client'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()

  const { data: assets, error } = await supabase
    .from('portfolio_assets')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich equity assets with live prices
  const enriched = await Promise.all((assets || []).map(async (asset: any) => {
    if (asset.asset_type === 'equity' && asset.metadata?.symbol) {
      try {
        const quote = await getStockQuote(asset.metadata.symbol)
        const currentPrice = quote.price
        const currentValue = currentPrice * (asset.quantity || 1)
        const investedValue = (asset.purchase_price || 0) * (asset.quantity || 1)
        return {
          ...asset,
          current_price: currentPrice,
          current_value: currentValue,
          day_change_pct: quote.changePct,
          total_return_pct: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
          live_data: { change: quote.change, changePct: quote.changePct, name: quote.name }
        }
      } catch {
        return { ...asset, current_value: asset.current_value || 0 }
      }
    }
    if (asset.asset_type === 'gold') {
      try {
        // GC=F is gold futures in USD, roughly convert
        const goldQuote = await getStockQuote('GC=F')
        const goldPricePerGram = (goldQuote.price * 83.5) / 31.1035 // USD to INR, troy oz to gram
        const currentValue = goldPricePerGram * (asset.quantity || 1)
        return { ...asset, current_price: goldPricePerGram, current_value: currentValue }
      } catch {
        return { ...asset, current_value: asset.current_value || 0 }
      }
    }
    if (asset.asset_type === 'fd' && asset.metadata) {
      const { principal, interest_rate, start_date } = asset.metadata
      if (principal && interest_rate && start_date) {
        const days = (Date.now() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
        const currentValue = principal * Math.pow(1 + interest_rate / 100, days / 365)
        return { ...asset, current_value: currentValue }
      }
    }
    if (asset.asset_type === 'ppf' && asset.metadata) {
      const { balance, last_updated } = asset.metadata
      if (balance && last_updated) {
        const days = (Date.now() - new Date(last_updated).getTime()) / (1000 * 60 * 60 * 24)
        const currentValue = balance * Math.pow(1 + 0.071, days / 365)
        return { ...asset, current_value: currentValue }
      }
    }
    return asset
  }))

  // Calculate net worth
  const netWorth = enriched.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0)
  const totalInvested = enriched.reduce((sum: number, a: any) => {
    if (a.asset_type === 'equity') return sum + ((a.purchase_price || 0) * (a.quantity || 1))
    if (a.asset_type === 'gold') return sum + ((a.purchase_price || 0) * (a.quantity || 1))
    if (a.asset_type === 'fd') return sum + (a.metadata?.principal || 0)
    return sum + (a.current_value || 0)
  }, 0)

  return NextResponse.json({ assets: enriched, netWorth, totalInvested })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { asset_type, asset_name, quantity, purchase_price, purchase_date, metadata } = body

  if (!asset_type || !asset_name) {
    return NextResponse.json({ error: 'asset_type and asset_name are required' }, { status: 400 })
  }

  const supabase = await createServerClient()

  // Get live current value if equity
  let current_value = quantity * (purchase_price || 0)
  if (asset_type === 'equity' && metadata?.symbol) {
    try {
      const quote = await getStockQuote(metadata.symbol)
      current_value = quote.price * quantity
    } catch {}
  }

  const { data, error } = await supabase
    .from('portfolio_assets')
    .insert({
      clerk_user_id: userId,
      asset_type,
      asset_name,
      quantity: quantity || 1,
      purchase_price: purchase_price || 0,
      purchase_date: purchase_date || new Date().toISOString().split('T')[0],
      current_value,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ asset: data })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('portfolio_assets')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, asset_type, asset_name, quantity, purchase_price, purchase_date, metadata } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required for update' }, { status: 400 })
  }

  const supabase = await createServerClient()

  // Recalculate current value if needed
  let current_value = (quantity || 0) * (purchase_price || 0)
  if (asset_type === 'equity' && metadata?.symbol) {
    try {
      const quote = await getStockQuote(metadata.symbol)
      current_value = quote.price * quantity
    } catch {}
  }

  const { data, error } = await supabase
    .from('portfolio_assets')
    .update({
      asset_type,
      asset_name,
      quantity: quantity || 1,
      purchase_price: purchase_price || 0,
      purchase_date: purchase_date || new Date().toISOString().split('T')[0],
      current_value,
      metadata: metadata || {},
    })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ asset: data })
}
