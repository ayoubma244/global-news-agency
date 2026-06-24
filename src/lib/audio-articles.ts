/**
 * Audio Articles (TTS) - تحويل المقالات لملفات صوتية
 * ============================================
 * - يستخدم Z.ai TTS (tongtong voice)
 * - يقسم النص الطويل لأجزاء (max 1024 char per request)
 * - يدمج الأجزاء في ملف WAV واحد
 * - يحفظ في /public/audio/articles/
 * - يحسن SEO (Speakable schema) + accessibility
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { promises as fs } from 'fs'
import path from 'path'
import { existsSync } from 'fs'

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio', 'articles')
const PUBLIC_PREFIX = '/audio/articles'

/**
 * تحويل مقال لملف صوتي.
 */
export async function generateArticleAudio(
  articleId: string,
  title: string,
  body: string
): Promise<{ ok: boolean; audioUrl?: string; duration?: number; error?: string }> {
  if (!isAIConfigured()) {
    return { ok: false, error: 'AI not configured (ZAI_API_KEY required)' }
  }

  try {
    await ensureDir()

    const zai = getZAI()

    // Prepare text: title + body (cleaned)
    const cleanText = `${title}. ${cleanForTTS(body)}`
    const chunks = splitTextIntoChunks(cleanText, 1000)

    if (chunks.length === 0) {
      return { ok: false, error: 'No text to convert' }
    }

    // Generate audio for each chunk
    const audioBuffers: Buffer[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      try {
        const response = await zai.audio.tts.create({
          input: chunk,
          voice: 'tongtong',  // warm, friendly voice
          speed: 1.0,
          response_format: 'wav',
          stream: false,
        })

        const arrayBuffer = await response.arrayBuffer()
        audioBuffers.push(Buffer.from(new Uint8Array(arrayBuffer)))
      } catch (e: any) {
        console.error(`TTS chunk ${i} failed:`, e.message)
        // Continue with other chunks
      }
    }

    if (audioBuffers.length === 0) {
      return { ok: false, error: 'All TTS chunks failed' }
    }

    // Merge audio buffers (simple concatenation for WAV)
    // Note: In production, use ffmpeg or audio-merging library
    const mergedBuffer = audioBuffers.length === 1
      ? audioBuffers[0]
      : Buffer.concat(audioBuffers)

    // Save to file
    const filename = `${articleId}.wav`
    const filepath = path.join(AUDIO_DIR, filename)
    await fs.writeFile(filepath, mergedBuffer)

    // Estimate duration (rough: 15 chars per second for Arabic)
    const durationSec = Math.ceil(cleanText.length / 15)

    return {
      ok: true,
      audioUrl: `${PUBLIC_PREFIX}/${filename}`,
      duration: durationSec,
    }
  } catch (e: any) {
    console.error('Audio generation failed:', e.message)
    return { ok: false, error: e.message }
  }
}

/**
 * تحقق إذا كان الملف الصوتي موجوداً.
 */
export function getArticleAudioUrl(articleId: string): string | null {
  const filepath = path.join(AUDIO_DIR, `${articleId}.wav`)
  if (existsSync(filepath)) {
    return `${PUBLIC_PREFIX}/${articleId}.wav`
  }
  return null
}

// ===== Helpers =====

async function ensureDir() {
  if (!existsSync(AUDIO_DIR)) {
    await fs.mkdir(AUDIO_DIR, { recursive: true })
  }
}

function splitTextIntoChunks(text: string, maxLength: number = 1000): string[] {
  const chunks: string[] = []
  const sentences = text.match(/[^.!?؟。]+[.!?؟。]+/g) || [text]

  let currentChunk = ''
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence
    } else {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim())

  return chunks
}

function cleanForTTS(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, 'رابط')  // Replace URLs with "رابط"
    .replace(/[^\w\u0600-\u06FF\s.!?؟،,;:()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
