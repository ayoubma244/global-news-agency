/**
 * Auth helpers — simple JWT-style session using cookies.
 * No external NextAuth needed for this admin panel.
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import crypto from 'crypto'

const SESSION_COOKIE = 'news_admin_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production-please'

// Simple hash (NOT for production - use bcrypt in real apps)
export function hashPassword(password: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(password)
    .digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export interface SessionPayload {
  userId: string
  username: string
  role: string
  exp: number
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  const full: SessionPayload = { ...payload, exp }
  const data = Buffer.from(JSON.stringify(full)).toString('base64')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex')
    if (sig !== expected) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64').toString())
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
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
