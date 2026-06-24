/**
 * POST /api/install
 * One-time site installation: creates admin user, default settings, default pages,
 * and seeds the 20 categories from our taxonomy.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth'
import { getDefaultSettings } from '@/lib/settings'
import { installSchema, validate } from '@/lib/validation'

const SEED_CATEGORIES = [
  { slug: 'world-news', nameAr: 'أخبار عالمية', nameEn: 'World News', icon: '🌍', priority: 'High' },
  { slug: 'politics', nameAr: 'سياسة', nameEn: 'Politics', icon: '🏛️', priority: 'High' },
  { slug: 'economy', nameAr: 'اقتصاد وأعمال', nameEn: 'Economy & Business', icon: '💼', priority: 'High' },
  { slug: 'technology', nameAr: 'تكنولوجيا', nameEn: 'Technology', icon: '💻', priority: 'High' },
  { slug: 'sports', nameAr: 'رياضة', nameEn: 'Sports', icon: '🏀', priority: 'High' },
  { slug: 'entertainment', nameAr: 'ترفيه وثقافة', nameEn: 'Entertainment & Culture', icon: '🎭', priority: 'Medium' },
  { slug: 'health', nameAr: 'صحة', nameEn: 'Health', icon: '🏥', priority: 'High' },
  { slug: 'environment', nameAr: 'بيئة ومناخ', nameEn: 'Environment & Climate', icon: '🌱', priority: 'Medium' },
  { slug: 'education', nameAr: 'تعليم وعلم', nameEn: 'Education & Science', icon: '🎓', priority: 'Medium' },
  { slug: 'society-law', nameAr: 'مجتمع وقانون', nameEn: 'Society & Law', icon: '⚖️', priority: 'Medium' },
  { slug: 'travel', nameAr: 'سفر وسياحة', nameEn: 'Travel & Tourism', icon: '✈️', priority: 'Medium' },
  { slug: 'religion', nameAr: 'دين ومجتمع ديني', nameEn: 'Religion', icon: '🕌', priority: 'Medium' },
  { slug: 'weather', nameAr: 'طقس ومناخ يومي', nameEn: 'Daily Weather', icon: '🌤️', priority: 'High' },
  { slug: 'food', nameAr: 'طبخ وغذاء', nameEn: 'Food & Cooking', icon: '🍳', priority: 'Medium' },
  { slug: 'fashion', nameAr: 'أزياء وموضة', nameEn: 'Fashion', icon: '👗', priority: 'Medium' },
  { slug: 'cars', nameAr: 'سيارات ومركبات', nameEn: 'Cars & Vehicles', icon: '🚗', priority: 'Medium' },
  { slug: 'real-estate', nameAr: 'عقارات وإسكان', nameEn: 'Real Estate', icon: '🏠', priority: 'Medium' },
  { slug: 'jobs', nameAr: 'عمل ووظائف', nameEn: 'Jobs & Careers', icon: '💼', priority: 'Medium' },
  { slug: 'crypto', nameAr: 'كريبتو و Web3', nameEn: 'Crypto & Web3', icon: '₿', priority: 'High' },
  { slug: 'family', nameAr: 'حياة عائلية وأطفال', nameEn: 'Family & Kids', icon: '👨‍👩‍👧', priority: 'Medium' },
]

const SEED_PAGES = [
  { slug: 'about', titleAr: 'من نحن', titleEn: 'About Us', contentAr: 'Global News Agency - automated news platform covering the world in 4 languages, 24/7.', contentEn: 'Global News Agency - automated news platform covering the world in 4 languages, 24/7.', template: 'about', showInMenu: true, order: 1 },
  { slug: 'contact', titleAr: 'اتصل بنا', titleEn: 'Contact', contentAr: 'To contact us, please use email or our social media platforms.', contentEn: 'To contact us, please use email or our social media platforms.', template: 'contact', showInMenu: true, order: 2 },
  { slug: 'privacy', titleAr: 'سياسة الخصوصية', titleEn: 'Privacy Policy', contentAr: 'Our privacy policy.', contentEn: 'Our privacy policy.', template: 'privacy', showInMenu: false, order: 3 },
  { slug: 'terms', titleAr: 'الشروط والأحكام', titleEn: 'Terms of Service', contentAr: 'Terms of service for using our website.', contentEn: 'Terms of service for using our website.', template: 'terms', showInMenu: false, order: 4 },
]

export async function POST(req: NextRequest) {
  try {
    const existing = await db.installLock.findFirst()
    if (existing?.isInstalled) {
      return NextResponse.json({ ok: false, error: 'الموقع مثبت مسبقاً.' }, { status: 400 })
    }
    const body = await req.json()
    const validation = validate(installSchema, body)
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }
    const { adminUsername, adminEmail, adminPassword, siteName } = validation.data

    const admin = await db.adminUser.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: 'super_admin',
        isActive: true,
      },
    })

    const defaults = await getDefaultSettings()
    if (siteName) defaults.find(d => d.key === 'site_name')!.value = siteName
    await db.setting.createMany({
      data: defaults.map(d => ({ key: d.key, value: d.value, type: d.type, group: d.group, label: d.label })),
    })

    for (let i = 0; i < SEED_CATEGORIES.length; i++) {
      const c = SEED_CATEGORIES[i]
      await db.category.create({
        data: {
          slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn, nameFr: c.nameEn, nameEs: c.nameEn,
          icon: c.icon, parentId: null, level: 1, order: i, isActive: true, priority: c.priority,
        },
      })
    }

    for (const p of SEED_PAGES) {
      await db.page.create({ data: p })
    }

    await db.installLock.create({
      data: { isInstalled: true, installedAt: new Date(), version: '1.0.0', adminUserId: admin.id },
    })

    const token = createSessionToken({ userId: admin.id, username: admin.username, role: admin.role })
    await setSessionCookie(token)

    return NextResponse.json({
      ok: true,
      message: 'تم تثبيت الموقع بنجاح!',
      admin: { id: admin.id, username: admin.username, email: admin.email },
    })
  } catch (e: any) {
    console.error('Install error:', e)
    return NextResponse.json({ ok: false, error: e.message || 'خطأ في التثبيت' }, { status: 500 })
  }
}

export async function GET() {
  const lock = await db.installLock.findFirst()
  return NextResponse.json({
    installed: !!lock?.isInstalled,
    version: lock?.version || '1.0.0',
    installedAt: lock?.installedAt,
  })
}
