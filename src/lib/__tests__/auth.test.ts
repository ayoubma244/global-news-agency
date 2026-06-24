/**
 * Tests for auth utilities
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, rateLimit } from '@/lib/auth'

describe('Password hashing', () => {
  it('should hash a password with bcrypt', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('should verify correct password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword('wrongPassword', hash)
    expect(isValid).toBe(false)
  })

  it('should generate different hashes for same password (salt)', async () => {
    const password = 'testPassword123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
  })
})

describe('Session tokens', () => {
  const testPayload = {
    userId: 'test-user-123',
    username: 'admin',
    role: 'super_admin',
  }

  it('should create and verify a valid token', () => {
    const token = createSessionToken(testPayload)
    const payload = verifySessionToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe(testPayload.userId)
    expect(payload?.username).toBe(testPayload.username)
    expect(payload?.role).toBe(testPayload.role)
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it('should reject invalid token', () => {
    const payload = verifySessionToken('invalid.token')
    expect(payload).toBeNull()
  })

  it('should reject tampered token', () => {
    const token = createSessionToken(testPayload)
    const [data] = token.split('.')
    const tampered = `${data}.tamperedSignature`
    const payload = verifySessionToken(tampered)
    expect(payload).toBeNull()
  })
})

describe('Rate limiting', () => {
  it('should allow requests under limit', () => {
    const key = `test-allow-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, 10, 60_000)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests over limit', () => {
    const key = `test-block-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 10; i++) {
      rateLimit(key, 10, 60_000)
    }
    const result = rateLimit(key, 10, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should track remaining correctly', () => {
    const key = `test-remaining-${Date.now()}-${Math.random()}`
    rateLimit(key, 5, 60_000)
    const result = rateLimit(key, 5, 60_000)
    expect(result.remaining).toBe(3)
  })
})
