/**
 * Zod validation schemas for all API inputs.
 * Prevents invalid/malicious data from entering the database.
 */

import { z } from 'zod'

// ===== Auth =====
export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
})

export const installSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  adminUsername: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),
  adminEmail: z.string().email().max(200),
  adminPassword: z.string().min(6).max(200),
})

// ===== Categories =====
export const categorySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric, hyphens'),
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  nameFr: z.string().max(200).optional(),
  nameEs: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  priority: z.enum(['Breaking', 'High', 'Medium', 'Low']).optional(),
  frequency: z.string().max(50).optional(),
  seoKeywords: z.string().max(2000).optional(),
  tags: z.string().max(1000).optional(),
  dataSources: z.string().max(1000).optional(),
  templateId: z.string().max(100).optional(),
})

// ===== Articles =====
export const articleSchema = z.object({
  titleAr: z.string().min(1).max(500),
  titleEn: z.string().max(500).optional(),
  leadAr: z.string().max(2000).optional(),
  leadEn: z.string().max(2000).optional(),
  bodyAr: z.string().min(1).max(50000),
  bodyEn: z.string().max(50000).optional(),
  excerpt: z.string().max(500).optional(),
  featuredImg: z.string().url().max(2000).optional().or(z.literal('')),
  categoryId: z.string().min(1),
  sourceUrl: z.string().url().max(2000).optional().or(z.literal('')),
  sourceName: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).optional(),
  isBreaking: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().max(2000).optional(),
})

// ===== RSS Sources =====
export const rssSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  siteName: z.string().max(200).optional(),
  siteUrl: z.string().url().max(2000).optional().or(z.literal('')),
  categoryId: z.string().optional().nullable(),
  language: z.enum(['ar', 'en', 'fr', 'es']).optional(),
  isActive: z.boolean().optional(),
  fetchInterval: z.number().int().min(5).max(1440).optional(),
  tags: z.string().max(500).optional(),
  autoPublish: z.boolean().optional(),
  aiTone: z.enum(['professional', 'casual', 'analytical', 'breaking', 'story']).optional(),
  aiLength: z.enum(['short', 'medium', 'long']).optional(),
  includeImages: z.boolean().optional(),
  watermarkImages: z.boolean().optional(),
})

// ===== Comments =====
export const commentSchema = z.object({
  authorName: z.string().min(1).max(50),
  authorEmail: z.string().email().max(200).optional().or(z.literal('')),
  content: z.string().min(3).max(2000),
  parentId: z.string().optional().nullable(),
})

// ===== Newsletter subscribers =====
export const subscribeSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(100).optional(),
  language: z.enum(['ar', 'en', 'fr', 'es']).optional(),
})

// ===== Pages =====
export const pageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  titleAr: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional(),
  contentAr: z.string().min(1).max(50000),
  contentEn: z.string().max(50000).optional(),
  template: z.enum(['default', 'about', 'contact', 'privacy', 'terms']).optional(),
  isPublished: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
})

// ===== API Keys =====
export const apiKeySchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(2000),
  apiSecret: z.string().max(2000).optional(),
  endpoint: z.string().url().max(2000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  dailyLimit: z.number().int().min(0).max(10000000).optional(),
  notes: z.string().max(1000).optional(),
})

// ===== Ad Spaces =====
export const adSpaceSchema = z.object({
  name: z.string().min(1).max(200),
  position: z.enum(['header', 'sidebar', 'in-article', 'between-articles', 'footer']),
  type: z.enum(['banner', 'native', 'sponsored', 'adsense']).optional(),
  content: z.string().max(10000).optional(),
  imageUrl: z.string().url().max(2000).optional().or(z.literal('')),
  linkUrl: z.string().url().max(2000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// ===== Settings =====
export const settingsSchema = z.record(z.string(), z.string().max(10000))

// ===== Helper to validate and return error =====
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
  }
}

// ===== Sanitize HTML (basic XSS prevention) =====
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
}
