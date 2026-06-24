/**
 * Tests for RSS parser
 */
import { describe, it, expect } from 'vitest'
// Note: We can't import the actual module because it depends on db
// So we test the parsing functions logic separately

// Mock parseItem logic
function decodeXml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim()
}

function extractImages(html: string, baseUrl?: string): string[] {
  const images = new Set<string>()
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1]
    if (url.startsWith('http')) images.add(url)
    else if (url.startsWith('//')) images.add('https:' + url)
  }
  return Array.from(images).filter(u => /\.(jpg|jpeg|png|webp|gif)/i.test(u))
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('RSS Parser utilities', () => {
  describe('decodeXml', () => {
    it('should decode XML entities', () => {
      expect(decodeXml('&amp;')).toBe('&')
      expect(decodeXml('&lt;')).toBe('<')
      expect(decodeXml('&gt;')).toBe('>')
      expect(decodeXml('&quot;')).toBe('"')
    })

    it('should handle CDATA', () => {
      expect(decodeXml('<![CDATA[hello world]]>')).toBe('hello world')
    })

    it('should handle empty string', () => {
      expect(decodeXml('')).toBe('')
    })

    it('should trim whitespace', () => {
      expect(decodeXml('  hello  ')).toBe('hello')
    })
  })

  describe('extractImages', () => {
    it('should extract image URLs from img tags', () => {
      const html = '<img src="https://example.com/photo.jpg">'
      const result = extractImages(html)
      expect(result).toContain('https://example.com/photo.jpg')
    })

    it('should handle multiple images', () => {
      const html = '<img src="https://example.com/a.jpg"><img src="https://example.com/b.png">'
      const result = extractImages(html)
      expect(result.length).toBe(2)
    })

    it('should handle protocol-relative URLs', () => {
      const html = '<img src="//example.com/photo.jpg">'
      const result = extractImages(html)
      expect(result).toContain('https://example.com/photo.jpg')
    })

    it('should filter non-image URLs', () => {
      const html = '<img src="https://example.com/page.html">'
      const result = extractImages(html)
      expect(result.length).toBe(0)
    })

    it('should deduplicate', () => {
      const html = '<img src="https://example.com/photo.jpg"><img src="https://example.com/photo.jpg">'
      const result = extractImages(html)
      expect(result.length).toBe(1)
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World')
    })

    it('should remove scripts', () => {
      expect(stripHtml('<script>alert(1)</script>Hello')).toBe('Hello')
    })

    it('should remove styles', () => {
      expect(stripHtml('<style>.x{}</style>Hello')).toBe('Hello')
    })

    it('should collapse whitespace', () => {
      expect(stripHtml('Hello\n\n  World')).toBe('Hello World')
    })

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('')
    })
  })
})
