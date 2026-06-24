/**
 * Site settings helpers — cached in memory for fast reads.
 */

import { db } from '@/lib/db'

type SettingMap = Record<string, string>

const cache = new Map<string, { data: SettingMap; ts: number }>()
const CACHE_TTL = 30_000 // 30s

export async function getAllSettings(): Promise<SettingMap> {
  const cached = cache.get('all')
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const rows = await db.setting.findMany()
  const map: SettingMap = {}
  for (const r of rows) map[r.key] = r.value
  cache.set('all', { data: map, ts: Date.now() })
  return map
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const all = await getAllSettings()
  return all[key] ?? fallback
}

export async function setSetting(key: string, value: string, opts?: {
  type?: string
  group?: string
  label?: string
  description?: string
}) {
  await db.setting.upsert({
    where: { key },
    update: { value, ...(opts?.type ? { type: opts.type } : {}), ...(opts?.group ? { group: opts.group } : {}) },
    create: {
      key,
      value,
      type: opts?.type ?? 'text',
      group: opts?.group ?? 'general',
      label: opts?.label,
      description: opts?.description,
    },
  })
  cache.delete('all')
}

export async function isInstalled(): Promise<boolean> {
  const lock = await db.installLock.findFirst()
  return !!lock?.isInstalled
}

export async function getDefaultSettings(): Promise<{ key: string; value: string; type: string; group: string; label: string }[]> {
  return [
    // General
    { key: 'site_name', value: 'Global News Agency', type: 'text', group: 'general', label: 'Site Name' },
    { key: 'site_name_en', value: 'Global News Agency', type: 'text', group: 'general', label: 'Site Name (EN)' },
    { key: 'site_tagline', value: 'Real-time world news coverage', type: 'text', group: 'general', label: 'Tagline' },
    { key: 'site_description', value: 'Automated global news platform covering the world in 4 languages, 24/7.', type: 'textarea', group: 'general', label: 'Site Description' },
    { key: 'site_url', value: '', type: 'text', group: 'general', label: 'Site URL' },
    { key: 'site_logo', value: '', type: 'text', group: 'general', label: 'Site Logo (URL)' },
    { key: 'site_language', value: 'en', type: 'text', group: 'general', label: 'Default Language' },
    { key: 'timezone', value: 'UTC', type: 'text', group: 'general', label: 'Timezone' },
    { key: 'contact_email', value: '', type: 'text', group: 'general', label: 'Contact Email' },
    // SEO
    { key: 'seo_title', value: 'Global News Agency | Breaking News, World Updates', type: 'text', group: 'seo', label: 'SEO Title' },
    { key: 'seo_description', value: 'Latest world news in politics, economy, sports, technology, and more — 24/7 coverage in 4 languages.', type: 'textarea', group: 'seo', label: 'SEO Description' },
    { key: 'seo_keywords', value: 'news, breaking news, world news, politics, economy, sports, technology', type: 'text', group: 'seo', label: 'SEO Keywords' },
    { key: 'google_analytics', value: '', type: 'text', group: 'seo', label: 'Google Analytics ID' },
    { key: 'google_site_verification', value: '', type: 'text', group: 'seo', label: 'Google Site Verification' },
    // Social
    { key: 'social_twitter', value: '', type: 'text', group: 'social', label: 'Twitter/X' },
    { key: 'social_facebook', value: '', type: 'text', group: 'social', label: 'Facebook' },
    { key: 'social_instagram', value: '', type: 'text', group: 'social', label: 'Instagram' },
    { key: 'social_youtube', value: '', type: 'text', group: 'social', label: 'YouTube' },
    { key: 'social_telegram', value: '', type: 'text', group: 'social', label: 'Telegram' },
    { key: 'social_whatsapp', value: '', type: 'text', group: 'social', label: 'WhatsApp' },
    // Automation
    { key: 'auto_publish', value: 'false', type: 'boolean', group: 'automation', label: 'النشر التلقائي' },
    { key: 'auto_fetch_interval', value: '60', type: 'number', group: 'automation', label: 'فترة الجلب (دقائق)' },
    { key: 'ai_provider', value: 'openai', type: 'text', group: 'automation', label: 'مزود AI' },
    { key: 'fact_check_enabled', value: 'true', type: 'boolean', group: 'automation', label: 'تفعيل التحقق من الحقائق' },
    { key: 'default_article_language', value: 'ar', type: 'text', group: 'automation', label: 'لغة المقالات الافتراضية' },
    // Theme
    { key: 'theme_primary_color', value: '#1B2A4A', type: 'text', group: 'theme', label: 'اللون الأساسي' },
    { key: 'theme_accent_color', value: '#D4820A', type: 'text', group: 'theme', label: 'لون التمييز' },
    { key: 'posts_per_page', value: '12', type: 'number', group: 'theme', label: 'مقالات لكل صفحة' },
    { key: 'show_breaking_bar', value: 'true', type: 'boolean', group: 'theme', label: 'شريط الأخبار العاجلة' },
  ]
}
