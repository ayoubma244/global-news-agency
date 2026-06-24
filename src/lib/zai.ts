/**
 * Z.ai SDK singleton — server-side only.
 * Used by automation pipeline for AI rewriting, fact-check, SEO, and content generation.
 */
import ZAI from 'z-ai-web-dev-sdk'

let _zai: ZAI | null = null

export function getZAI(): ZAI {
  if (!_zai) {
    _zai = new ZAI({
      baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY || '',
    })
  }
  return _zai
}

export function isAIConfigured(): boolean {
  return !!process.env.ZAI_API_KEY
}
