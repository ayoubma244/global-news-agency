/**
 * Redis Service — caching + distributed rate limiting.
 * Falls back to in-memory if Redis not configured.
 */

import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

let redisClient: Redis | null = null
const memoryCache = new Map<string, { value: string; expiresAt: number }>()

function getRedis(): Redis | null {
  if (!REDIS_URL) return null
  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy: times => Math.min(times * 100, 2000),
      })
      redisClient.on('error', (err) => {
        console.error('Redis error:', err.message)
      })
    } catch (e) {
      console.error('Failed to connect to Redis:', e)
      return null
    }
  }
  return redisClient
}

export function isRedisConfigured(): boolean {
  return !!REDIS_URL
}

// ===== Cache operations =====
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try Redis
  const redis = getRedis()
  if (redis) {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (e) {
      console.error('Redis get failed:', e)
    }
  }
  // Fallback: memory
  const entry = memoryCache.get(key)
  if (entry && entry.expiresAt > Date.now()) {
    return JSON.parse(entry.value)
  }
  if (entry) memoryCache.delete(key)
  return null
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const stringValue = JSON.stringify(value)
  // Try Redis
  const redis = getRedis()
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, stringValue)
      return
    } catch (e) {
      console.error('Redis set failed:', e)
    }
  }
  // Fallback: memory
  memoryCache.set(key, { value: stringValue, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    try { await redis.del(key) } catch {}
  }
  memoryCache.delete(key)
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    } catch {}
  }
}

// ===== Distributed rate limiting (Redis-backed) =====
export async function rateLimitRedis(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedis()
  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  const resetAt = now + windowMs

  if (redis) {
    try {
      const multi = redis.multi()
      multi.incr(redisKey)
      multi.expireat(redisKey, Math.ceil(resetAt / 1000))
      const results = await multi.exec()
      const count = results?.[0]?.[1] as number
      if (count > maxRequests) {
        return { allowed: false, remaining: 0, resetAt }
      }
      return { allowed: true, remaining: maxRequests - count, resetAt }
    } catch (e) {
      console.error('Redis rate limit failed:', e)
      // Fall through to memory
    }
  }

  // Fallback: in-memory rate limiter (from auth.ts)
  const { rateLimit } = await import('@/lib/auth')
  return rateLimit(key, maxRequests, windowMs)
}

// ===== Cache helpers for common patterns =====
export const cacheKeys = {
  article: (slug: string) => `article:${slug}`,
  articleList: (params: string) => `articles:list:${params}`,
  category: (slug: string) => `category:${slug}`,
  categoryTree: () => 'categories:tree',
  settings: () => 'settings:all',
  analytics: (range: string) => `analytics:${range}`,
  searchResults: (q: string, limit: number) => `search:${q}:${limit}`,
  topArticles: () => 'articles:top',
}
