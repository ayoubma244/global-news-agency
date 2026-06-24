/**
 * AI Rewriter — uses Z.ai GLM to rewrite articles in a human-like style.
 *
 * Features:
 * - 5 tone profiles (professional, casual, analytical, breaking, story)
 * - 3 length presets (short, medium, long)
 * - 4 language outputs (ar, en, fr, es)
 * - Plagiarism reduction (paraphrase + restructure)
 * - Human-like writing (varied sentence length, transitions, anecdotes)
 * - SEO optimization built-in
 * - Quality scoring (plagiarism + humanScore)
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
  plagiarismScore: number  // 0-100 (lower = more unique)
  humanScore: number       // 0-100 (higher = more human-like)
  qualityScore: number     // 0-100 (overall)
  model: string
  tokensUsed?: number
}

const TONE_PROFILES: Record<AiTone, { ar: string; en: string }> = {
  professional: {
    ar: 'احترافي إخباري رسمي - أسلوب الوكالات الإخبارية الكبرى (رويترز، فرانس برس). جمل قصيرة ومباشرة في البداية، ثم تفصيل. لغة محايدة بدون رأي.',
    en: 'Professional news agency style (Reuters, AP). Short direct leads, then detail. Neutral tone, no opinion.',
  },
  casual: {
    ar: 'أسلوب ودّي وعفوي - كما لو يكتب صديق يخبر صديقه بخبر. استخدم تعبيرات يومية، روح دعابة خفيفة عند المناسب، وضمير المخاطب أحياناً.',
    en: 'Friendly conversational tone - as if telling a friend. Use everyday expressions, light humor, occasional direct address.',
  },
  analytical: {
    ar: 'تحليلي معمّق - لا تكتفي بنقل الخبر بل حلّل الأسباب والتبعات. اربط بسياق أوسع، اقتبس خبراء (افتراضياً)، قارن بأحداث مشابهة.',
    en: 'In-depth analytical - explain causes, consequences, broader context. Quote hypothetical experts, compare with similar events.',
  },
  breaking: {
    ar: 'أسلوب الأخبار العاجلة - جمل قصيرة جداً ومكثفة. ابدأ بالحدث الأهم فوراً. استخدم كلمات قوية: «عاجل»، «حصري»، «لأول مرة». شعور بالإلحاح.',
    en: 'Breaking news style - very short punchy sentences. Lead with most important fact. Use strong words: breaking, exclusive, first. Sense of urgency.',
  },
  story: {
    ar: 'أسلوب القصّ الصحفي - ابدأ بقصة أو مشهد إنساني يلخّص الخبر. ثم اشرح السياق. استخدم لغة وصفية حيّة، تفاصيل صغيرة تجعل القارئ يعيش الحدث.',
    en: 'Narrative journalism - open with a scene or human story, then explain context. Vivid descriptive language, small details that immerse reader.',
  },
}

const LENGTH_PROFILES: Record<AiLength, { words: number; paragraphs: number }> = {
  short: { words: 250, paragraphs: 3 },
  medium: { words: 500, paragraphs: 5 },
  long: { words: 800, paragraphs: 7 },
}

/**
 * Rewrite an article using Z.ai GLM.
 * Returns Arabic primary content + English translation + SEO metadata + quality scores.
 */
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
  const outputLang = opts.outputLang || 'ar'
  const siteName = opts.siteName || 'وكالة الأنباء العالمية'
  const categoryName = opts.categoryName || ''

  // Fallback if AI not configured
  if (!isAIConfigured()) {
    return fallbackRewrite(source, tone, length, siteName)
  }

  const zai = getZAI()
  const toneProfile = TONE_PROFILES[tone]
  const lengthProfile = LENGTH_PROFILES[length]

  const systemPrompt = `You are a master news editor and writer with 20+ years of experience at top news agencies (Reuters, BBC, Al Jazeera). You write in ${outputLang === 'ar' ? 'Modern Standard Arabic (فصحى)' : outputLang}. 

Your task: rewrite news articles to be 100% original (no copyright issues) while keeping all facts accurate. Make them read like a human wrote them - varied sentence lengths, natural transitions, occasional personal touches.

Critical requirements:
1. COMPLETELY rewrite - never copy phrases from source (avoid plagiarism)
2. Keep ALL facts: names, numbers, dates, places, quotes (rephrase quotes' attribution)
3. Write like a HUMAN: vary sentence length, use natural transitions, avoid robotic patterns
4. Add value: context, analysis, or a fresh angle when possible
5. NEVER mention "according to source" - rewrite as if it's your own reporting
6. Always attribute the original source subtly at the end: «المصدر: ${siteName} نقلاً عن [original source name]»
7. Output valid JSON only - no markdown, no explanation`

  const userPrompt = `REWRITE THIS NEWS ARTICLE:

TITLE: ${source.title}
${source.author ? `AUTHOR: ${source.author}` : ''}
PUBLISHED: ${source.publishedAt}
SOURCE URL: ${source.link}
CATEGORY: ${categoryName}
SUMMARY: ${source.summary}
FULL CONTENT: ${stripHtml(source.content).slice(0, 4000) || source.summary}

REQUIREMENTS:
- Tone: ${toneProfile.ar}
- Length: ~${lengthProfile.words} words, ${lengthProfile.paragraphs} paragraphs
- Output language: ${outputLang === 'ar' ? 'Arabic (MSA)' : outputLang}
- Target site: ${siteName}

CRITICAL PLAGIARISM AVOIDANCE:
- Change sentence structure completely
- Use synonyms and different vocabulary
- Reorder information
- Add transitional phrases
- Vary paragraph openings (don't start two paragraphs the same way)
- Add a unique angle or framing

HUMAN-LIKE WRITING:
- Mix short and long sentences (rhythm variation)
- Use natural connectors (ولكن، في الوقت نفسه، الجدير بالذكر، من ناحية أخرى)
- Include 1-2 rhetorical questions if appropriate
- Add 1 brief contextual anecdote or comparison
- End with a forward-looking sentence (ماذا بعد؟ / توقعات)

Return ONLY valid JSON with this exact structure:
{
  "titleAr": "العنوان بالعربية (50-80 حرف، جذاب، يحتوي كلمات مفتاحية)",
  "titleEn": "English title (50-80 chars)",
  "leadAr": "مقدمة قوية من 2-3 جمل تجذب القارئ",
  "leadEn": "English lead",
  "bodyAr": "المقال الكامل بـ ${lengthProfile.paragraphs} فقرات، افصل بين الفقرات بـ \\n\\n",
  "bodyEn": "English body",
  "excerpt": "ملخص قصير (160 حرف كحد أقصى)",
  "seoTitle": "عنوان SEO (60 حرف كحد أقصى)",
  "seoDescription": "وصف SEO (160 حرف كحد أقصى)",
  "seoKeywords": "كلمة1, كلمة2, كلمة3, كلمة4, كلمة5",
  "tags": ["وسم1", "وسم2", "وسم3"],
  "plagiarismScore": 0-100 (estimation: 0=completely original, 100=identical to source),
  "humanScore": 0-100 (estimation: 100=reads perfectly human)
}`

  try {
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,  // higher = more creative
      max_tokens: 3000,
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
      qualityScore: 0, // computed below
      model: 'glm-4-flash',
      tokensUsed: response?.usage?.total_tokens,
    }

    // Compute overall quality score
    result.qualityScore = Math.round(
      (result.humanScore * 0.6) + ((100 - result.plagiarismScore) * 0.4)
    )

    return result
  } catch (e: any) {
    console.error('AI rewrite failed, using fallback:', e.message)
    return fallbackRewrite(source, tone, length, siteName)
  }
}

/**
 * Fallback: simple rewrite without AI (just structure the source).
 */
function fallbackRewrite(source: RssItem, tone: AiTone, length: AiLength, siteName: string): RewriteResult {
  const cleanContent = stripHtml(source.content).slice(0, 3000) || source.summary || source.title

  // Format content as proper paragraphs
  const paragraphs = cleanContent.split(/\.\s+/).filter(p => p.length > 20).slice(0, 7)
  const formattedBody = paragraphs.length > 0
    ? paragraphs.map(p => p.trim() + '.').join('\n\n')
    : cleanContent

  const bodyAr = `${formattedBody}\n\n---\n\nSource: ${siteName} via ${getDomain(source.link)}`

  return {
    titleAr: source.title,
    titleEn: source.title,
    leadAr: source.summary || source.title,
    leadEn: source.summary || source.title,
    bodyAr,
    bodyEn: formattedBody,
    excerpt: (source.summary || source.title).slice(0, 160),
    seoTitle: source.title.slice(0, 60),
    seoDescription: (source.summary || source.title).slice(0, 160),
    seoKeywords: '',
    tags: [],
    plagiarismScore: 80, // high because no rewrite
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
