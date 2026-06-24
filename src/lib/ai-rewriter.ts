/**
 * AI Rewriter — uses Z.ai GLM to rewrite articles in a human-like style.
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import type { RssItem } from '@/lib/rss-parser'

export type AiTone = 'professional' | 'casual' | 'analytical' | 'breaking' | 'story'
export type AiLength = 'short' | 'medium' | 'long'
export type OutputLang = 'ar' | 'en' | 'fr' | 'es'

export interface RewriteResult {
  titleAr: string
  titleEn: string
  leadAr: string
  leadEn: string
  bodyAr: string
  bodyEn: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  tags: string[]
  plagiarismScore: number
  humanScore: number
  qualityScore: number
  model: string
  tokensUsed?: number
}

const TONE_PROFILES: Record<AiTone, string> = {
  professional: 'Professional news agency style (Reuters, AP). Short direct leads, then detail. Neutral tone.',
  casual: 'Friendly conversational tone - as if telling a friend. Everyday expressions, light humor.',
  analytical: 'In-depth analytical - explain causes, consequences, broader context. Quote experts, compare with similar events.',
  breaking: 'Breaking news style - very short punchy sentences. Lead with most important fact. Sense of urgency.',
  story: 'Narrative journalism - open with a scene or human story, then explain context. Vivid descriptive language.',
}

const LENGTH_PROFILES: Record<AiLength, { words: number; paragraphs: number }> = {
  short: { words: 300, paragraphs: 4 },
  medium: { words: 600, paragraphs: 6 },
  long: { words: 1000, paragraphs: 8 },
}

export async function rewriteArticle(
  source: RssItem,
  opts: {
    tone?: AiTone
    length?: AiLength
    outputLang?: OutputLang
    siteName?: string
    categoryName?: string
  } = {}
): Promise<RewriteResult> {
  const tone = opts.tone || 'professional'
  const length = opts.length || 'medium'
  const outputLang = opts.outputLang || 'en'
  const siteName = opts.siteName || 'Global News Agency'
  const categoryName = opts.categoryName || ''

  if (!isAIConfigured()) {
    return fallbackRewrite(source, tone, length, siteName)
  }

  const zai = getZAI()
  const toneProfile = TONE_PROFILES[tone]
  const lengthProfile = LENGTH_PROFILES[length]

  const sourceContent = stripHtml(source.content).slice(0, 6000) || source.summary || source.title

  const systemPrompt = `You are a master news editor with 20+ years at Reuters, BBC, and AP. You rewrite news articles to be 100% original while keeping ALL facts accurate.

CRITICAL RULES:
1. COMPLETELY rewrite - never copy phrases from the source
2. Keep ALL facts: names, numbers, dates, places, quotes
3. Write ${lengthProfile.words} words minimum in ${lengthProfile.paragraphs} paragraphs
4. The article MUST be substantial - at least ${lengthProfile.words} words
5. DO NOT mention AI, automation, or that this is rewritten
6. DO NOT add "Source:" or "According to" anywhere in the article
7. Write as if YOU are the journalist reporting this news
8. Use ${outputLang === 'ar' ? 'Modern Standard Arabic' : outputLang}
9. Vary sentence length, use natural transitions
10. Add context and analysis when possible

Return ONLY valid JSON.`

  const userPrompt = `Rewrite this news article. The output MUST be at least ${lengthProfile.words} words.

ORIGINAL TITLE: ${source.title}
CATEGORY: ${categoryName}
SUMMARY: ${source.summary}
FULL CONTENT: ${sourceContent}

TONE: ${toneProfile}
TARGET LENGTH: ${lengthProfile.words} words, ${lengthProfile.paragraphs} paragraphs
LANGUAGE: ${outputLang === 'ar' ? 'Arabic (MSA)' : 'English'}

Write a COMPLETE, FULL-LENGTH article. Do not write a short summary. The body must be ${lengthProfile.words}+ words across ${lengthProfile.paragraphs} paragraphs.

Return ONLY this JSON:
{
  "titleAr": "Title in ${outputLang === 'ar' ? 'Arabic' : 'same language'}",
  "titleEn": "English title",
  "leadAr": "Strong 2-3 sentence lead paragraph",
  "leadEn": "English lead",
  "bodyAr": "FULL ARTICLE - ${lengthProfile.words}+ words, ${lengthProfile.paragraphs} paragraphs separated by \\n\\n",
  "bodyEn": "English body (if different)",
  "excerpt": "Short excerpt (max 160 chars)",
  "seoTitle": "SEO title (max 60 chars)",
  "seoDescription": "SEO description (max 160 chars)",
  "seoKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "tags": ["tag1", "tag2", "tag3"],
  "plagiarismScore": 15,
  "humanScore": 90
}`

  try {
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response?.choices?.[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    const result: RewriteResult = {
      titleAr: parsed.titleAr || source.title,
      titleEn: parsed.titleEn || source.title,
      leadAr: parsed.leadAr || source.summary,
      leadEn: parsed.leadEn || source.summary,
      bodyAr: parsed.bodyAr || source.summary,
      bodyEn: parsed.bodyEn || '',
      excerpt: parsed.excerpt || (parsed.leadAr || source.summary).slice(0, 160),
      seoTitle: (parsed.seoTitle || parsed.titleAr || source.title).slice(0, 60),
      seoDescription: (parsed.seoDescription || parsed.excerpt || source.summary).slice(0, 160),
      seoKeywords: parsed.seoKeywords || '',
      tags: parsed.tags || [],
      plagiarismScore: Math.min(100, Math.max(0, parsed.plagiarismScore || 15)),
      humanScore: Math.min(100, Math.max(0, parsed.humanScore || 90)),
      qualityScore: 0,
      model: 'glm-4-flash',
      tokensUsed: response?.usage?.total_tokens,
    }

    result.qualityScore = Math.round(
      (result.humanScore * 0.6) + ((100 - result.plagiarismScore) * 0.4)
    )

    return result
  } catch (e: any) {
    console.error('AI rewrite failed, using fallback:', e.message)
    return fallbackRewrite(source, tone, length, siteName)
  }
}

function fallbackRewrite(source: RssItem, tone: AiTone, length: AiLength, siteName: string): RewriteResult {
  const cleanContent = stripHtml(source.content).slice(0, 5000) || source.summary || source.title

  const paragraphs = cleanContent.split(/\.\s+/).filter(p => p.length > 30).slice(0, 7)
  const formattedBody = paragraphs.length > 0
    ? paragraphs.map(p => p.trim() + '.').join('\n\n')
    : cleanContent

  return {
    titleAr: source.title,
    titleEn: source.title,
    leadAr: source.summary || source.title,
    leadEn: source.summary || source.title,
    bodyAr: formattedBody,
    bodyEn: formattedBody,
    excerpt: (source.summary || source.title).slice(0, 160),
    seoTitle: source.title.slice(0, 60),
    seoDescription: (source.summary || source.title).slice(0, 160),
    seoKeywords: '',
    tags: [],
    plagiarismScore: 80,
    humanScore: 50,
    qualityScore: 40,
    model: 'fallback',
  }
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
