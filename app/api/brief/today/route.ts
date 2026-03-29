import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getStockQuote, getIndexData } from '@/lib/market-data/nse-client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const today = new Date().toISOString().split('T')[0]

  // Check if today's brief already exists
  const { data: existing } = await supabase
    .from('morning_briefs')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('brief_date', today)
    .single()

  if (existing) {
    return NextResponse.json({ brief: existing })
  }

  // Generate new brief
  try {
    // Fetch real market data
    const [indexData, usdInr, crudeFutures] = await Promise.allSettled([
      getIndexData(),
      getStockQuote('USDINR=X'),
      getStockQuote('CL=F'),
    ])

    const indices = indexData.status === 'fulfilled' ? indexData.value : null
    const usdInrData = usdInr.status === 'fulfilled' ? usdInr.value : null
    const crudeData = crudeFutures.status === 'fulfilled' ? crudeFutures.value : null

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    // Get user's equity holdings
    const { data: assets } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('asset_type', 'equity')

    // Fetch live prices for portfolio stocks
    const portfolioMovers: any[] = []
    if (assets && assets.length > 0) {
      const symbols = assets.slice(0, 5).map((a: any) => a.metadata?.symbol).filter(Boolean)
      for (const sym of symbols) {
        try {
          const quote = await getStockQuote(sym + '.NS')
          portfolioMovers.push({ symbol: sym, change_pct: quote.changePct, direction: quote.changePct >= 0 ? 'up' : 'down', price: quote.price })
        } catch {}
      }
    }

    const globalData = {
      nifty: indices ? { price: indices.nifty.price, change: indices.nifty.changePct } : null,
      sensex: indices ? { price: indices.sensex.price, change: indices.sensex.changePct } : null,
      usd_inr: usdInrData ? usdInrData.price : null,
      crude_oil: crudeData ? { price: crudeData.price, change: crudeData.changePct } : null,
    }

    const persona = profile?.persona || 'active_trader'
    const firstName = profile?.first_name || 'there'

    const prompt = `You are a smart financial advisor generating a personalized morning brief for ${firstName}, who is a ${persona.replace(/_/g, ' ')}.

Current market data:
- Nifty 50: ${globalData.nifty ? `${globalData.nifty.price?.toFixed(2)} (${globalData.nifty.change >= 0 ? '+' : ''}${globalData.nifty.change?.toFixed(2)}%)` : 'data unavailable'}
- Sensex: ${globalData.sensex ? `${globalData.sensex.price?.toFixed(2)} (${globalData.sensex.change >= 0 ? '+' : ''}${globalData.sensex.change?.toFixed(2)}%)` : 'data unavailable'}
- USD/INR: ${globalData.usd_inr ? globalData.usd_inr.toFixed(2) : 'data unavailable'}
- Crude Oil: ${globalData.crude_oil ? `$${globalData.crude_oil.price?.toFixed(2)} (${globalData.crude_oil.change >= 0 ? '+' : ''}${globalData.crude_oil.change?.toFixed(2)}%)` : 'data unavailable'}

Portfolio movers today:
${portfolioMovers.map(m => `- ${m.symbol}: ${m.change_pct >= 0 ? '+' : ''}${m.change_pct?.toFixed(2)}% at ₹${m.price?.toFixed(2)}`).join('\n') || 'No portfolio data yet'}

Write a concise, professional morning brief in exactly 80-100 words. DO NOT use any emojis. Use a smart, direct financial advisor tone. End with one specific actionable insight for today. Include the current date (today is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}). DO NOT use bold or bullet points in your output.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
    })

    const content = completion.choices[0]?.message?.content || ''

    const { data: brief, error } = await supabase
      .from('morning_briefs')
      .upsert({
        clerk_user_id: userId,
        brief_date: today,
        content,
        global_data: globalData,
        portfolio_movers: portfolioMovers,
        key_events: [],
      }, { onConflict: 'clerk_user_id,brief_date' })
      .select()
      .single()

    if (error) return NextResponse.json({ brief: { content, global_data: globalData, portfolio_movers: portfolioMovers, brief_date: today } })

    return NextResponse.json({ brief })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
