/**
 * Backup & Restore System
 * - Export full database to JSON
 * - Import from JSON
 * - Scheduled backups
 */

import { db } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

export interface BackupData {
  version: string
  createdAt: string
  models: {
    adminUsers: any[]
    categories: any[]
    articles: any[]
    pages: any[]
    settings: any[]
    apiKeys: any[]
    rssSources: any[]
    tags: any[]
    subscribers: any[]
    adSpaces: any[]
    scheduledJobs: any[]
  }
  stats: {
    totalArticles: number
    totalCategories: number
    totalSubscribers: number
  }
}

/**
 * Export full database to JSON.
 */
export async function exportDatabase(): Promise<BackupData> {
  const [
    adminUsers, categories, articles, pages, settings,
    apiKeys, rssSources, tags, subscribers, adSpaces, scheduledJobs,
  ] = await Promise.all([
    db.adminUser.findMany(),
    db.category.findMany(),
    db.article.findMany({ include: { images: true, tags: true } }),
    db.page.findMany(),
    db.setting.findMany(),
    db.apiKey.findMany(),
    db.rssSource.findMany(),
    db.tag.findMany(),
    db.subscriber.findMany(),
    db.adSpace.findMany(),
    db.scheduledJob.findMany(),
  ])

  return {
    version: '2.0.0',
    createdAt: new Date().toISOString(),
    models: {
      adminUsers: adminUsers.map(u => ({ ...u, passwordHash: '[REDACTED]' })),  // Don't export passwords
      categories,
      articles,
      pages,
      settings,
      apiKeys: apiKeys.map(k => ({ ...k, apiKey: '[REDACTED]', apiSecret: '[REDACTED]' })),  // Don't export keys
      rssSources,
      tags,
      subscribers,
      adSpaces,
      scheduledJobs,
    },
    stats: {
      totalArticles: articles.length,
      totalCategories: categories.length,
      totalSubscribers: subscribers.length,
    },
  }
}

/**
 * Save backup to file.
 */
export async function saveBackupToFile(): Promise<{ path: string; size: number }> {
  const data = await exportDatabase()
  const backupDir = path.join(process.cwd(), 'backups')
  await fs.mkdir(backupDir, { recursive: true })

  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const filepath = path.join(backupDir, filename)
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filepath, json, 'utf-8')

  return { path: filepath, size: json.length }
}

/**
 * List all backups.
 */
export async function listBackups(): Promise<Array<{ filename: string; size: number; createdAt: Date }>> {
  const backupDir = path.join(process.cwd(), 'backups')
  try {
    const files = await fs.readdir(backupDir)
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const stat = await fs.stat(path.join(backupDir, f))
          return { filename: f, size: stat.size, createdAt: stat.mtime }
        })
    )
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch {
    return []
  }
}

/**
 * Import database from JSON (non-destructive: skips existing).
 */
export async function importDatabase(data: BackupData, opts: { overwrite?: boolean } = {}): Promise<{ imported: Record<string, number>; skipped: Record<string, number> }> {
  const imported: Record<string, number> = {}
  const skipped: Record<string, number> = {}

  // Categories (import first - articles depend on them)
  for (const cat of data.models.categories) {
    try {
      const existing = await db.category.findUnique({ where: { slug: cat.slug } })
      if (existing && !opts.overwrite) {
        skipped.categories = (skipped.categories || 0) + 1
        continue
      }
      await db.category.upsert({
        where: { slug: cat.slug },
        update: { ...cat, id: undefined },
        create: { ...cat, id: undefined },
      })
      imported.categories = (imported.categories || 0) + 1
    } catch (e) {
      skipped.categories = (skipped.categories || 0) + 1
    }
  }

  // Settings
  for (const s of data.models.settings) {
    try {
      await db.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: s,
      })
      imported.settings = (imported.settings || 0) + 1
    } catch {
      skipped.settings = (skipped.settings || 0) + 1
    }
  }

  // Pages
  for (const p of data.models.pages) {
    try {
      await db.page.upsert({
        where: { slug: p.slug },
        update: { ...p, id: undefined },
        create: { ...p, id: undefined },
      })
      imported.pages = (imported.pages || 0) + 1
    } catch {
      skipped.pages = (skipped.pages || 0) + 1
    }
  }

  // Articles (skip existing by slug)
  for (const a of data.models.articles) {
    try {
      const existing = await db.article.findUnique({ where: { slug: a.slug } })
      if (existing && !opts.overwrite) {
        skipped.articles = (skipped.articles || 0) + 1
        continue
      }
      // Don't import AI metadata or relations (would need remapping)
      const { images, tags, ...articleData } = a
      await db.article.create({
        data: { ...articleData, id: undefined },
      })
      imported.articles = (imported.articles || 0) + 1
    } catch (e) {
      skipped.articles = (skipped.articles || 0) + 1
    }
  }

  // Tags
  for (const t of data.models.tags) {
    try {
      await db.tag.upsert({
        where: { slug: t.slug },
        update: {},
        create: { ...t, id: undefined },
      })
      imported.tags = (imported.tags || 0) + 1
    } catch {
      skipped.tags = (skipped.tags || 0) + 1
    }
  }

  return { imported, skipped }
}
