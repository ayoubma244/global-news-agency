/**
 * Auth helpers — production-grade authentication.
 * - bcrypt for password hashing
 * - JWT-style session tokens with HMAC
 * - Rate limiting (basic, in-memory)
 */

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_COOKIE = 'news_admin_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production-please-use-random-string-at-least-32-chars'

// ===== Password hashing (bcrypt - industry standard) =====
const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Support legacy HMAC hashes (for backward compat)
    if (hash.length === 64 && !hash.startsWith('$2')) {
      const legacyHash = crypto.createHmac('sha256', SESSION_SECRET).update(password).digest('hex')
      if (legacyHash === hash) return true
      return false
    }
    return bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

// ===== Session tokens (JWT-style) =====
export interface SessionPayload {
  userId: string
  username: string
  role: string
  exp: number
  iat: number
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp' | 'iat'>): string {
  const iat = Date.now()
  const exp = iat + 1000 * 60 * 60 * 24 * 7 // 7 days
  const full: SessionPayload = { ...payload, exp, iat }
  const data = Buffer.from(JSON.stringify(full)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex')
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function getCurrentAdmin() {
  const session = await getSession()
  if (!session) return null
  const admin = await db.adminUser.findUnique({
    where: { id: session.userId },
  })
  if (!admin || !admin.isActive) return null
  return admin
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

// ===== Rate limiting (in-memory, basic) =====
// For production with multiple instances, use Redis-backed rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number = 100, windowMs: number = 60_000): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitMap.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60 * 1000)

// Import db lazily to avoid circular dependency
import { db } from '@/lib/db'
