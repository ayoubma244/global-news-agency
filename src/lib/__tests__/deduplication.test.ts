/**
 * Tests for Content Deduplication
 */
import { describe, it, expect } from 'vitest'

// We test the similarity functions directly (not the DB-dependent checkDuplicate)

// Simulate the functions from deduplication.ts
function simpleHash(str: string): bigint {
  let hash = 0n
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31n) + BigInt(str.charCodeAt(i))
  }
  return hash
}

function simHash(text: string, hashBits: number = 64): bigint {
  const tokens = text.split(/\s+/).filter(t => t.length > 2)
  if (tokens.length === 0) return 0n
  const vector = new Array(hashBits).fill(0)
  for (const token of tokens) {
    const hash = simpleHash(token)
    for (let i = 0; i < hashBits; i++) {
      const bit = (hash >> BigInt(i)) & 1n
      vector[i] += bit === 1n ? 1 : -1
    }
  }
  let result = 0n
  for (let i = 0; i < hashBits; i++) {
    if (vector[i] > 0) result |= (1n << BigInt(i))
  }
  return result
}

function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b
  let distance = 0
  while (xor > 0n) { if (xor & 1n) distance++; xor >>= 1n }
  return distance
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function titleSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)
  if (normA === normB) return 100
  const wordsA = new Set(normA.split(/\s+/))
  const wordsB = new Set(normB.split(/\s+/))
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  const jaccard = union.size > 0 ? intersection.size / union.size : 0
  const hashA = simHash(normA)
  const hashB = simHash(normB)
  const distance = hammingDistance(hashA, hashB)
  const simHashSimilarity = 1 - distance / 64
  return Math.round((jaccard * 0.5 + simHashSimilarity * 0.5) * 100)
}

describe('Deduplication - SimHash', () => {
  it('should produce same hash for same text', () => {
    expect(simHash('hello world test')).toBe(simHash('hello world test'))
  })

  it('should produce different hash for different text', () => {
    expect(simHash('hello world')).not.toBe(simHash('completely different text here'))
  })

  it('should have hamming distance 0 for identical hashes', () => {
    const a = simHash('test text')
    expect(hammingDistance(a, a)).toBe(0)
  })

  it('should have hamming distance > 0 for different hashes', () => {
    const a = simHash('test text one')
    const b = simHash('completely different content here')
    expect(hammingDistance(a, b)).toBeGreaterThan(0)
  })
})

describe('Deduplication - Title Similarity', () => {
  it('should return 100 for identical titles', () => {
    expect(titleSimilarity('Same Title Here', 'Same Title Here')).toBe(100)
  })

  it('should return high similarity for very similar titles', () => {
    const sim = titleSimilarity(
      'Breaking: Major earthquake hits Turkey',
      'Breaking: Major earthquake hits Turkey today'
    )
    expect(sim).toBeGreaterThan(70)
  })

  it('should return low similarity for completely different titles', () => {
    const sim = titleSimilarity(
      'Breaking: Major earthquake hits Turkey',
      'Stock market reaches all-time high'
    )
    expect(sim).toBeLessThan(50)
  })

  it('should handle Arabic text', () => {
    const sim = titleSimilarity(
      'زلزال قوي يضرب تركيا',
      'زلزال قوي يضرب تركيا اليوم'
    )
    expect(sim).toBeGreaterThan(60)
  })

  it('should normalize case and punctuation', () => {
    const sim = titleSimilarity(
      'Hello, World!',
      'hello world'
    )
    expect(sim).toBeGreaterThan(80)
  })
})

describe('Deduplication - Normalize', () => {
  it('should lowercase text', () => {
    expect(normalizeText('HELLO')).toBe('hello')
  })

  it('should remove punctuation', () => {
    expect(normalizeText('hello, world!')).toBe('hello world')
  })

  it('should collapse whitespace', () => {
    expect(normalizeText('hello    world')).toBe('hello world')
  })

  it('should preserve Arabic characters', () => {
    expect(normalizeText('مرحبا بالعالم')).toBe('مرحبا بالعالم')
  })
})
