/**
 * AI Auto-Tagging & Category Suggestion
 * ===================================
 * يحلل محتوى المقال ويقترح:
 * - وسوم (tags) مناسبة
 * - الكاتيجوري الأنسب
 * - كلمات مفتاحية SEO
 * - ملخص للمحتوى
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { db } from '@/lib/db'

export interface AutoTagResult {
  tags: string[]
  suggestedCategoryId?: string
  suggestedCategoryName?: string
  seoKeywords: string[]
  topics: string[]
  entities: Array<{ name: string; type: 'person' | 'organization' | 'location' | 'event' }>
  confidence: number
}

/**
 * تحليل المقال واقتراح الوسوم والكاتيجوري.
 */
export async function autoTagArticle(
  title: string,
  body: string
): Promise<AutoTagResult> {
  if (!isAIConfigured()) {
    // Fallback: extract keywords from title
    return {
      tags: extractSimpleTags(title),
      seoKeywords: extractSimpleTags(title),
      topics: [],
      entities: [],
      confidence: 30,
    }
  }

  const zai = getZAI()

  // Get available categories for suggestion
  const categories = await db.category.findMany({
    where: { level: 1, isActive: true },
    select: { id: true, nameAr: true, nameEn: true, slug: true },
  })

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a news tagging AI. Analyze the article and suggest tags, category, keywords, and entities.

Available categories:
${categories.map(c => `- ${c.nameAr} (${c.nameEn}) [slug: ${c.slug}]`).join('\n')}

Return ONLY valid JSON:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedCategorySlug": "one-of-available-slugs",
  "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "topics": ["topic1", "topic2"],
  "entities": [
    {"name": "entity name", "type": "person|organization|location|event"}
  ],
  "confidence": 0-100
}`,
      },
      {
        role: 'user',
        content: `Analyze this news article:

TITLE: ${title}
CONTENT: ${body.slice(0, 3000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  })

  const content = response?.choices?.[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  // Find category ID from suggested slug
  const suggestedCat = categories.find(c => c.slug === parsed.suggestedCategorySlug)

  return {
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : extractSimpleTags(title),
    suggestedCategoryId: suggestedCat?.id,
    suggestedCategoryName: suggestedCat?.nameAr,
    seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords.slice(0, 8) : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    confidence: parsed.confidence || 50,
  }
}

/**
 * توليد alt text للصور بالـ AI.
 */
export async function generateImageAltText(
  imageUrl: string,
  articleTitle: string
): Promise<string> {
  if (!isAIConfigured()) {
    // Fallback: use article title
    return articleTitle.slice(0, 125)
  }

  const zai = getZAI()

  try {
    const response = await zai.chat.completions.createVision({
      model: 'glm-4v',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Describe this image in 1-2 sentences (max 125 chars). Context: article titled "${articleTitle}". Return only the description, no explanation.` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const description = response?.choices?.[0]?.message?.content?.trim() || articleTitle.slice(0, 125)
    return description.slice(0, 125)
  } catch (e: any) {
    console.error('Image alt text generation failed:', e.message)
    return articleTitle.slice(0, 125)
  }
}

// ===== Helpers =====

function extractSimpleTags(title: string): string[] {
  const stopWords = new Set([
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك',
    'قال', 'أكد', 'أعلن', 'بعد', 'قبل', 'خلال',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
  ])
  return title
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
    .slice(0, 5)
}
