// lib/news/rss-fetcher.ts
import Parser from 'rss-parser'

const parser = new Parser()

const FEEDS = [
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'ET Markets', category: 'markets' },
  { url: 'https://economictimes.indiatimes.com/mf/rssfeeds/3816.cms',            source: 'ET MF', category: 'mutual_funds' },
  { url: 'https://www.livemint.com/rss/markets',                                  source: 'LiveMint', category: 'markets' },
  { url: 'https://www.business-standard.com/rss/markets-106.rss',                source: 'Business Standard', category: 'markets' },
]

export interface RawArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  category: string
  published_at: Date
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async feed => {
        const parsed = await parser.parseURL(feed.url)
        return parsed.items.map((item: any) => ({
          id: item.guid || item.link || String(Math.random()),
          title: item.title ?? '',
          summary: item.contentSnippet ?? item.summary ?? '',
          url: item.link ?? '',
          source: feed.source,
          category: feed.category,
          published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
        }))
      })
    )
    return results
      .filter((r): r is PromiseFulfilledResult<RawArticle[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(a => a.url && a.title)
      .sort((a, b) => b.published_at.getTime() - a.published_at.getTime())
  } catch (error) {
    console.error("RSS Fetch Error:", error)
    return []
  }
}
