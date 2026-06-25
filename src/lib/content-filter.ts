/**
 * Content Filter — filters out ads, CTAs, sponsored content, and promotional material.
 * Prevents "donate" buttons, "0% APR" ads, and other non-news content from being published.
 */

export interface FilterResult {
  isAd: boolean
  reason: string
  score: number  // 0 = clean news, 100 = definitely an ad
}

// Patterns that indicate promotional/ad content
const AD_PATTERNS = [
  // Direct promotional phrases
  /donate\s+(now|today|to)/i,
  /0%\s*(intro\s+)?APR/i,
  /\bapr\s+(as\s+low\s+as|starting\s+(at|from))\b/i,
  /click\s+(here|now)\s+to/i,
  /shop\s+(now|today)/i,
  /buy\s+(now|today)/i,
  /order\s+(now|today)/i,
  /subscribe\s+(now|today)/i,
  /sign\s+up\s+(now|today|for)/i,
  /get\s+(started|your\s+free)/i,
  /limited\s+time\s+offer/i,
  /act\s+now/i,
  /save\s+up\s+to\s+\d+/i,
  /earn\s+\$\d+/i,
  /make\s+money/i,
  /work\s+from\s+home/i,
  /free\s+trial/i,
  /money-back\s+guarantee/i,
  /best\s+price/i,
  /lowest\s+price/i,
  /100%\s+(insane|crazy|guaranteed|free)/i,
  /sponsor(ed)?\s+(content|post|article)/i,
  /paid\s+(content|partnership|sponsor)/i,
  /promoted\s+(by|content|post)/i,
  /brought\s+to\s+you\s+by/i,
  /advertisement/i,
  /ad:\s/i,
  /sponsored\s+by/i,

  // CNN-specific promotional content
  /cnn\s+heroes?\s+(donat|shar|spotlight|nominate|vote)/i,
  /cnn\s+underscored/i,
  /cnn\s+business\s+(selector|coupon|deals?)/i,
  /cnn\s+store/i,

  // E-commerce signals
  /price\s*:\s*\$/i,
  /\$\d+\.\d{2}\s*(only|each|per)/i,
  /free\s+shipping/i,
  /add\s+to\s+cart/i,
  /product\s+(review|listing|page)/i,
  /affiliate\s+link/i,
  /referral\s+(link|code)/i,

  // Newsletter/subscription pushes (not news)
  /sign\s+up\s+for\s+(our|the|cnn|bbc)\s+(newsletter|daily|weekly)/i,
  /subscribe\s+to\s+(our|the|cnn|bbc)/i,
  /download\s+(our|the)\s+app/i,
]

// Keywords that when combined suggest ad content
const AD_KEYWORDS = [
  'coupon', 'discount', 'deal', 'sale', 'offer', 'promo', 'bonus',
  'gift', 'reward', 'cashback', 'rebate', 'clearance', 'bargain',
]

// Minimum content length for a real article (words)
const MIN_ARTICLE_WORDS = 50

/**
 * Check if an RSS item is an ad/promotional content.
 */
export function isAdContent(
  title: string,
  summary: string,
  content: string,
  link: string
): FilterResult {
  const fullText = `${title} ${summary} ${content}`.toLowerCase()
  let score = 0
  const reasons: string[] = []

  // Check against ad patterns
  for (const pattern of AD_PATTERNS) {
    if (pattern.test(fullText)) {
      score += 40
      reasons.push(`Matches ad pattern: ${pattern.source.slice(0, 30)}`)
    }
  }

  // Check for ad keywords
  const keywordMatches = AD_KEYWORDS.filter(kw => fullText.includes(kw))
  if (keywordMatches.length >= 2) {
    score += 30
    reasons.push(`Ad keywords: ${keywordMatches.join(', ')}`)
  }

  // Check content length (real articles are long enough)
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount < MIN_ARTICLE_WORDS) {
    score += 30
    reasons.push(`Too short (${wordCount} words, min ${MIN_ARTICLE_WORDS})`)
  }

  // Check link for ad-like URLs
  if (/\/(ads?|sponsored|promo|deals?|coupons?|store|shop)\//i.test(link)) {
    score += 50
    reasons.push('Ad-like URL path')
  }

  // CNN heroes specifically
  if (/cnn\s+heroes?/i.test(title) && /donat|spotlight|nominate|vote/i.test(fullText)) {
    score = 100
    reasons.push('CNN Heroes promotional content')
  }

  // CNN underscored (product reviews/affiliate)
  if (/cnn\s+underscored/i.test(title) || /underscored/i.test(link)) {
    score = 100
    reasons.push('CNN Underscored (affiliate content)')
  }

  // Title that's purely a CTA
  if (/^(donate|shop|buy|subscribe|sign\s+up|get|order|click)\s/i.test(title.trim())) {
    score += 60
    reasons.push('Title is a direct CTA')
  }

  return {
    isAd: score >= 50,
    reason: reasons.join('; ') || 'Clean news content',
    score: Math.min(100, score),
  }
}
