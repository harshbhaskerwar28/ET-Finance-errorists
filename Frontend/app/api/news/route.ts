import { fetchAllFeeds } from '@/lib/news/rss-fetcher'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const rawArticles = await fetchAllFeeds()
    // Enrich with some mocked sentiment & impact for the UI since we don't want to burn GPT limits
    // Or we just return the raw and let the UI handle it.
    const enriched = rawArticles.map((article, i) => {
      // Create some pseudo-randomness based on the index
      const rand = (i * 13) % 100
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
      if (rand > 70) sentiment = 'positive'
      else if (rand < 30) sentiment = 'negative'

      const text = (article.title + ' ' + article.summary).toLowerCase()
      let category = 'Corporate'
      if (text.includes('nifty') || text.includes('sensex') || text.includes('rbi') || text.includes('gdp') || text.includes('inflation') || text.includes('fed')) {
        category = 'Macro'
      } else if (text.includes('q1') || text.includes('q2') || text.includes('q3') || text.includes('q4') || text.includes('profit') || text.includes('revenue') || text.includes('earnings')) {
        category = 'Earnings'
      } else if (text.includes('fii') || text.includes('dii') || text.includes('foreign') || text.includes('domestic institutional') || text.includes('fund')) {
        category = 'FII/DII'
      } else if (text.includes('sector') || text.includes('auto') || text.includes('it') || text.includes('pharma') || text.includes('bank')) {
        category = 'Sector'
      }

      return {
        id: article.id || article.url,
        title: article.title,
        summary: article.summary.slice(0, 150) + '...',
        url: article.url,
        source: article.source,
        category,
        sentiment,
        impactScore: rand,
        time: article.published_at.getTime() > Date.now() - 24 * 60 * 60 * 1000 
            ? 'Today' : 'Recently',
        affectedStocks: rand > 80 ? ['RELIANCE', 'TCS'] : rand < 20 ? ['INFY'] : [],
      }
    })

    const paginated = enriched.slice(skip, skip + limit)
    const hasMore = skip + limit < enriched.length

    return NextResponse.json({ 
      articles: paginated,
      hasMore,
      total: enriched.length
    })
  } catch (error) {
    return NextResponse.json({ articles: [], hasMore: false })
  }
}
