/**
 * Tests for FAQ Generator
 */
import { describe, it, expect } from 'vitest'
import { generateFAQSchema, generateSpeakableSchema } from '@/lib/faq-generator'

describe('FAQ Schema Generator', () => {
  it('should generate valid FAQPage schema', () => {
    const faqs = [
      { question: 'ما هو الخبر؟', answer: 'الخبر هو...' },
      { question: 'متى حدث؟', answer: 'حدث في...' },
    ]
    const schema = generateFAQSchema(faqs)
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity[0]['@type']).toBe('Question')
    expect(schema.mainEntity[0].name).toBe('ما هو الخبر؟')
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('الخبر هو...')
  })

  it('should handle empty FAQs', () => {
    const schema = generateFAQSchema([])
    expect(schema.mainEntity).toHaveLength(0)
  })

  it('should handle many FAQs', () => {
    const faqs = Array.from({ length: 10 }, (_, i) => ({
      question: `سؤال ${i}`,
      answer: `جواب ${i}`,
    }))
    const schema = generateFAQSchema(faqs)
    expect(schema.mainEntity).toHaveLength(10)
  })
})

describe('Speakable Schema Generator', () => {
  it('should generate valid SpeakableSpecification', () => {
    const schema = generateSpeakableSchema('عنوان', 'مقدمة', 'https://example.com/article')
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('SpeakableSpecification')
    expect(schema.cssSelector).toContain('.speakable-title')
    expect(schema.cssSelector).toContain('.speakable-lead')
  })
})

/**
 * Tests for Internal Linking
 */
import { findInternalLinks } from '@/lib/internal-linking'

describe('Internal Linking', () => {
  it('findInternalLinks should be a function', () => {
    expect(typeof findInternalLinks).toBe('function')
  })
})

/**
 * Tests for Audio Articles
 */
import { generateArticleAudio, getArticleAudioUrl } from '@/lib/audio-articles'

describe('Audio Articles', () => {
  it('generateArticleAudio should be a function', () => {
    expect(typeof generateArticleAudio).toBe('function')
  })

  it('getArticleAudioUrl should be a function', () => {
    expect(typeof getArticleAudioUrl).toBe('function')
  })

  it('should return null for non-existent audio', () => {
    const url = getArticleAudioUrl('non-existent-id-12345')
    expect(url).toBeNull()
  })
})

/**
 * Tests for Cross-Reference
 */
import { crossReferenceArticle } from '@/lib/cross-reference'

describe('Cross-Reference', () => {
  it('crossReferenceArticle should be a function', () => {
    expect(typeof crossReferenceArticle).toBe('function')
  })
})
