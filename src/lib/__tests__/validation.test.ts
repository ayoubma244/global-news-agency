/**
 * Tests for validation schemas
 */
import { describe, it, expect } from 'vitest'
import { validate, installSchema, loginSchema, commentSchema, articleSchema, rssSourceSchema, subscribeSchema } from '@/lib/validation'

describe('Install schema', () => {
  it('should accept valid install data', () => {
    const result = validate(installSchema, {
      adminUsername: 'admin',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject short username', () => {
    const result = validate(installSchema, {
      adminUsername: 'ab',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = validate(installSchema, {
      adminUsername: 'admin',
      adminEmail: 'not-an-email',
      adminPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = validate(installSchema, {
      adminUsername: 'admin',
      adminEmail: 'admin@test.com',
      adminPassword: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-alphanumeric username', () => {
    const result = validate(installSchema, {
      adminUsername: 'admin@#$',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

describe('Login schema', () => {
  it('should accept valid login', () => {
    const result = validate(loginSchema, { username: 'admin', password: 'pass' })
    expect(result.success).toBe(true)
  })

  it('should reject empty fields', () => {
    const result = validate(loginSchema, { username: '', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('Comment schema', () => {
  it('should accept valid comment', () => {
    const result = validate(commentSchema, {
      authorName: 'أحمد',
      content: 'تعليق رائع',
    })
    expect(result.success).toBe(true)
  })

  it('should reject too short content', () => {
    const result = validate(commentSchema, {
      authorName: 'أحمد',
      content: 'أب',
    })
    expect(result.success).toBe(false)
  })

  it('should reject too long name', () => {
    const result = validate(commentSchema, {
      authorName: 'a'.repeat(60),
      content: 'تعليق',
    })
    expect(result.success).toBe(false)
  })

  it('should accept valid email if provided', () => {
    const result = validate(commentSchema, {
      authorName: 'أحمد',
      authorEmail: 'ahmed@test.com',
      content: 'تعليق رائع',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = validate(commentSchema, {
      authorName: 'أحمد',
      authorEmail: 'not-email',
      content: 'تعليق رائع',
    })
    expect(result.success).toBe(false)
  })
})

describe('Article schema', () => {
  it('should accept valid article', () => {
    const result = validate(articleSchema, {
      titleAr: 'عنوان المقال',
      bodyAr: 'محتوى المقال هنا',
      categoryId: 'cat-123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty title', () => {
    const result = validate(articleSchema, {
      titleAr: '',
      bodyAr: 'محتوى',
      categoryId: 'cat-123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid status', () => {
    const result = validate(articleSchema, {
      titleAr: 'عنوان',
      bodyAr: 'محتوى',
      categoryId: 'cat-123',
      status: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})

describe('RSS Source schema', () => {
  it('should accept valid RSS source', () => {
    const result = validate(rssSourceSchema, {
      name: 'CNN World',
      url: 'http://rss.cnn.com/rss/edition_world.rss',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid URL', () => {
    const result = validate(rssSourceSchema, {
      name: 'CNN',
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid AI tone', () => {
    const result = validate(rssSourceSchema, {
      name: 'CNN',
      url: 'http://rss.cnn.com',
      aiTone: 'invalid-tone',
    })
    expect(result.success).toBe(false)
  })
})

describe('Subscribe schema', () => {
  it('should accept valid email', () => {
    const result = validate(subscribeSchema, { email: 'user@test.com' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = validate(subscribeSchema, { email: 'not-email' })
    expect(result.success).toBe(false)
  })
})
