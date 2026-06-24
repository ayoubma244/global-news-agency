/**
 * RSS Parser — fetches and parses RSS/Atom feeds.
 * Extracts: title, link, publishedAt, summary, content, images.
 *
 * Supports: RSS 2.0, Atom 1.0, RDF
 */

import { db } from '@/lib/db'

export interface RssItem {
  title: string
  link: string
  publishedAt: string
  summary: string
  content: string
  imageUrl?: string
  images: string[]
  author?: string
  categories: string[]
  guid?: string
}

export interface RssFeed {
  title: string
  description: string
  link: string
  items: RssItem[]
}

/**
 * Fetch and parse an RSS feed.
 */
export async function fetchRssFeed(url: string): Promise<RssFeed> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/2.0; +https://yoursite.com/bot)',
      'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
    },
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const xml = await res.text()
  return parseRssXml(xml, url)
}

/**
 * Parse RSS/Atom XML into structured data.
 */
function parseRssXml(xml: string, feedUrl: string): RssFeed {
  // Decode basic XML entities
  const decode = (s: string): string => {
    if (!s) return ''
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .trim()
  }

  // Detect format
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"')
  const isRdf = xml.includes('<rdf:RDF')

  // Extract channel/feed info
  const channelMatch = xml.match(/<channel>([\s\S]*?)<\/channel>/) || xml.match(/<feed>([\s\S]*?)<\/feed>/)
  const channelXml = channelMatch?.[1] || xml

  const feedTitle = decode(
    xml.match(/<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1] ||
    xml.match(/<feed[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ||
    feedUrl
  )
  const feedDesc = decode(
    xml.match(/<channel>[\s\S]*?<description>([\s\S]*?)<\/description>/)?.[1] ||
    xml.match(/<feed[\s\S]*?<subtitle[^>]*>([\s\S]*?)<\/subtitle>/)?.[1] ||
    ''
  )
  const feedLink = decode(
    xml.match(/<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/)?.[1] ||
    xml.match(/<feed[\s\S]*?<link[^>]*href="([^"]+)"/)?.[1] ||
    feedUrl
  )

  // Extract items
  const itemRegex = isAtom ? /<entry>([\s\S]*?)<\/entry>/g : /<item>([\s\S]*?)<\/item>/g
  const items: RssItem[] = []
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const item = parseItem(itemXml, isAtom, decode)
    if (item.title && item.link) {
      items.push(item)
    }
  }

  return {
    title: feedTitle,
    description: feedDesc,
    link: feedLink,
    items,
  }
}

function parseItem(xml: string, isAtom: boolean, decode: (s: string) => string): RssItem {
  const title = decode(xml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '')

  // Link: in RSS it's <link>, in Atom it's <link href="...">
  let link = ''
  if (isAtom) {
    const links = Array.from(xml.matchAll(/<link[^>]*href="([^"]+)"[^>]*>/g))
    const alternate = links.find(l => l[0].includes('rel="alternate"') || !l[0].includes('rel='))
    link = decode(alternate?.[1] || links[0]?.[1] || '')
  } else {
    link = decode(xml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '')
  }

  // Published date
  const pubDate = decode(
    xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ||
    xml.match(/<published>([\s\S]*?)<\/published>/)?.[1] ||
    xml.match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1] ||
    new Date().toISOString()
  )

  // Author
  const author = decode(
    xml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/)?.[1] ||
    xml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] ||
    xml.match(/<author>([\s\S]*?)<\/author>/)?.[1] ||
    ''
  )

  // Content: prefer content:encoded, then content, then description
  const contentEncoded = decode(xml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] || '')
  const atomContent = decode(xml.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || '')
  const description = decode(xml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')
  const summary = decode(xml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || description)

  const content = contentEncoded || atomContent || description
  const summaryText = summary || stripHtml(content).slice(0, 200)

  // Categories
  const categories: string[] = []
  const catRegex = /<category[^>]*>([\s\S]*?)<\/category>/g
  let catMatch
  while ((catMatch = catRegex.exec(xml)) !== null) {
    categories.push(decode(catMatch[1]))
  }

  // GUID
  const guid = decode(xml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || xml.match(/<id>([\s\S]*?)<\/id>/)?.[1] || '')

  // Extract images from both content AND the item XML itself (media:content, media:thumbnail, enclosure)
  const contentImages = extractImages(content, link)
  const itemImages = extractImages(xml, link)
  const images = Array.from(new Set([...contentImages, ...itemImages]))
  const imageUrl = images[0]

  return {
    title: stripHtml(title),
    link,
    publishedAt: pubDate,
    summary: stripHtml(summaryText),
    content,
    imageUrl,
    images,
    author,
    categories,
    guid,
  }
}

/**
 * Extract image URLs from HTML content.
 */
function extractImages(html: string, baseUrl?: string): string[] {
  const images = new Set<string>()

  // 1. <img src="...">
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl)
    if (url) images.add(url)
  }

  // 2. <enclosure type="image/...">
  const encRegex = /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/gi
  while ((match = encRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl)
    if (url) images.add(url)
  }

  // 3. <media:content url="...">
  const mediaRegex = /<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi
  while ((match = mediaRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl)
    if (url) images.add(url)
  }

  // 4. <media:thumbnail url="...">
  const thumbRegex = /<media:thumbnail[^>]+url=["']([^"']+)["']/gi
  while ((match = thumbRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl)
    if (url) images.add(url)
  }

  // Filter: only valid image extensions or known CDNs
  return Array.from(images).filter(url => {
    if (!url) return false
    if (url.startsWith('data:')) return false
    if (url.length < 10) return false
    return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url) ||
           url.includes('cdn.') || url.includes('img.') || url.includes('images.')
  }).slice(0, 10)
}

function resolveUrl(url: string, baseUrl?: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return 'https:' + url
  if (baseUrl) {
    try {
      return new URL(url, baseUrl).toString()
    } catch {
      return ''
    }
  }
  return ''
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if an article URL was already processed.
 */
export async function isArticleProcessed(url: string): Promise<boolean> {
  const existing = await db.article.findFirst({
    where: { sourceUrl: url },
    select: { id: true },
  })
  return !!existing
}

/**
 * Get RSS items that haven't been processed yet.
 */
export async function getNewRssItems(feed: RssFeed, limit = 10): Promise<RssItem[]> {
  const newItems: RssItem[] = []
  for (const item of feed.items) {
    if (await isArticleProcessed(item.link)) continue
    newItems.push(item)
    if (newItems.length >= limit) break
  }
  return newItems
}
