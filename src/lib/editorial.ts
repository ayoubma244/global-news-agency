/**
 * Editorial Commentary & Multi-Perspective Engine
 * ================================================
 * 1. Editorial Commentary: AI adds a human editorial opinion/analysis
 *    at the end of each article (different from news reporting style).
 * 2. Multi-Perspective: AI fetches 2 different viewpoints on the same topic
 *    (e.g., Western vs Eastern perspective) and presents them side-by-side.
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { db } from '@/lib/db'

export interface EditorialCommentary {
  commentary: string
  tone: 'analytical' | 'critical' | 'supportive' | 'neutral'
  confidence: number
}

export interface Perspective {
  label: string          // "Western Perspective", "Eastern Perspective"
  summary: string        // 2-3 sentence summary of this viewpoint
  keyPoints: string[]    // bullet points
  source?: string
}

export interface MultiPerspectiveResult {
  perspectives: Perspective[]
  commonGround: string   // what both sides agree on
  keyDifferences: string // what they disagree on
}

/**
 * Generate editorial commentary for an article.
 * This adds a "human touch" - an opinion/analysis section.
 */
export async function generateEditorialCommentary(
  title: string,
  body: string,
  category?: string
): Promise<EditorialCommentary> {
  if (!isAIConfigured()) {
    return { commentary: '', tone: 'neutral', confidence: 0 }
  }

  const zai = getZAI()

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a senior news editor with 20+ years of experience. Write a brief editorial commentary (2-3 sentences) that adds ANALYSIS or OPINION to this news article.

Rules:
- This should sound like a HUMAN editor's take, not robotic reporting
- Add context, implications, or a thought-provoking question
- Be balanced but have a clear voice
- Start with "Editor's Take:" or "Analysis:"
- 2-3 sentences maximum

Return ONLY valid JSON:
{
  "commentary": "Editor's Take: ...",
  "tone": "analytical|critical|supportive|neutral",
  "confidence": 0-100
}`,
      },
      {
        role: 'user',
        content: `Write editorial commentary for:

TITLE: ${title}
CATEGORY: ${category || 'general'}
CONTENT: ${body.slice(0, 2000)}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 300,
  })

  const content = response?.choices?.[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    commentary: parsed.commentary || '',
    tone: parsed.tone || 'neutral',
    confidence: parsed.confidence || 50,
  }
}

/**
 * Generate multi-perspective analysis for an article.
 * Fetches different viewpoints on the same topic.
 */
export async function generateMultiPerspective(
  title: string,
  body: string
): Promise<MultiPerspectiveResult | null> {
  if (!isAIConfigured()) return null

  const zai = getZAI()

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a multi-perspective news analyst. For the given article, provide 2 different viewpoints on the same topic.

Typically:
- Perspective 1: Western/International viewpoint
- Perspective 2: Regional/Local viewpoint

For each perspective, provide:
- A label (e.g., "Western Perspective", "Regional Perspective")
- A 2-3 sentence summary
- 3 key points
- What both sides agree on (common ground)
- Key differences

Return ONLY valid JSON:
{
  "perspectives": [
    {
      "label": "Western Perspective",
      "summary": "...",
      "keyPoints": ["point 1", "point 2", "point 3"]
    },
    {
      "label": "Regional Perspective",
      "summary": "...",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ],
  "commonGround": "what both sides agree on",
  "keyDifferences": "what they disagree on"
}`,
      },
      {
        role: 'user',
        content: `Generate multi-perspective analysis for:

TITLE: ${title}
CONTENT: ${body.slice(0, 2000)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
  })

  const content = response?.choices?.[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    perspectives: Array.isArray(parsed.perspectives) ? parsed.perspectives : [],
    commonGround: parsed.commonGround || '',
    keyDifferences: parsed.keyDifferences || '',
  }
}
