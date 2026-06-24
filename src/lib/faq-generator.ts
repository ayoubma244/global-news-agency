/**
 * AI-Generated FAQ Section
 * ==========================
 * يولّد أسئلة شائعة + إجابات لكل مقال تلقائياً.
 *
 * SEO Benefits:
 * - FAQ Schema markup (rich results in Google)
 * - Long-tail keyword targeting
 * - Featured snippet opportunities
 * - Voice search optimization
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { db } from '@/lib/db'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQResult {
  faqs: FAQItem[]
  model: string
  confidence: number
}

/**
 * توليد أسئلة شائعة من مقال.
 */
export async function generateFAQ(
  articleId: string,
  title: string,
  body: string,
  category?: string
): Promise<FAQResult> {
  if (!isAIConfigured()) {
    return { faqs: [], model: 'fallback', confidence: 0 }
  }

  const zai = getZAI()

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a news FAQ generator. Create 5 frequently asked questions about this news article.

Rules:
- Questions should be what readers would ASK about this topic
- Answers should be concise (2-3 sentences max)
- Use simple, clear Arabic
- Questions should target long-tail search queries
- Include who, what, when, where, why, how questions

Return ONLY valid JSON:
{
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "confidence": 0-100
}`,
      },
      {
        role: 'user',
        content: `Generate FAQs for this news article:

TITLE: ${title}
CATEGORY: ${category || 'general'}
CONTENT: ${body.slice(0, 3000)}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1000,
  })

  const content = response?.choices?.[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  const result: FAQResult = {
    faqs: Array.isArray(parsed.faqs) ? parsed.faqs.slice(0, 6) : [],
    model: 'glm-4-flash',
    confidence: parsed.confidence || 70,
  }

  // Save to DB (in factCheckNotes or separate field - we'll use a Setting-like approach)
  // For now, save in the article's factCheckNotes alongside other metadata
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { factCheckNotes: true },
  })

  if (article?.factCheckNotes) {
    try {
      const existing = JSON.parse(article.factCheckNotes)
      existing.faqs = result.faqs
      existing.faqsGeneratedAt = new Date().toISOString()
      await db.article.update({
        where: { id: articleId },
        data: { factCheckNotes: JSON.stringify(existing) },
      })
    } catch {}
  }

  return result
}

/**
 * توليد FAQ Schema markup (JSON-LD).
 */
export function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * توليد Speakable Schema (للـ voice search).
 */
export function generateSpeakableSchema(title: string, lead: string, url: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SpeakableSpecification',
    cssSelector: ['.speakable-title', '.speakable-lead'],
    path: {
      '@type': 'SpeakableSpecification',
      url,
      cssSelector: ['.speakable-title', '.speakable-lead'],
    },
  }
}
