import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Newspaper, Clock, Eye, TrendingUp, AlertCircle, Search, Rss } from 'lucide-react'
import { getAllSettings, isInstalled } from '@/lib/settings'
import NewsletterForm from '@/components/newsletter-form'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Check if installed
  const installed = await isInstalled()
  if (!installed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir="rtl">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 text-white mb-6">
            <Newspaper className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">مرحباً بك!</h1>
          <p className="text-slate-600 mb-6">لم يتم تثبيت الموقع بعد. اضغط على الزر أدناه لبدء التثبيت.</p>
          <Link href="/install" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
            <AlertCircle className="h-5 w-5" />
            تثبيت الموقع الآن
          </Link>
        </div>
      </div>
    )
  }

  const settings = await getAllSettings()
  const siteName = settings.site_name || 'وكالة الأنباء العالمية'
  const siteTagline = settings.site_tagline || 'أخبار العالم في الوقت الفعلي'

  // Fetch data
  const [breaking, featured, latest, categories, pages] = await Promise.all([
    prisma.article.findFirst({
      where: { isBreaking: true, status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    prisma.article.findMany({
      where: { isFeatured: true, status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: true },
    }),
    prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { level: 1, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.page.findMany({
      where: { isPublished: true, showInMenu: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 text-xs text-slate-500 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-3">
              {settings.social_twitter && <a href={settings.social_twitter} className="hover:text-slate-900">Twitter</a>}
              {settings.social_facebook && <a href={settings.social_facebook} className="hover:text-slate-900">Facebook</a>}
              {settings.social_telegram && <a href={settings.social_telegram} className="hover:text-slate-900">Telegram</a>}
              <Link href="/login" className="hover:text-slate-900">دخول الأدمن</Link>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                <Newspaper className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{siteName}</h1>
                <p className="text-xs text-slate-500">{siteTagline}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">بحث...</span>
              </Link>
              <a
                href="/rss"
                className="flex items-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors"
                title="RSS Feed"
              >
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">RSS</span>
              </a>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <TrendingUp className="h-4 w-4" />
                <span>آخر تحديث: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-2 -mb-px">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-900 border-b-2 border-slate-900">الرئيسية</Link>
            {categories.map(c => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                {c.icon} {c.nameAr}
              </Link>
            ))}
            {pages.map(p => (
              <Link
                key={p.id}
                href={`/${p.slug}`}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                {p.titleAr}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Breaking news bar */}
      {breaking && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="bg-white text-red-600 px-2 py-0.5 rounded text-xs font-bold animate-pulse">عاجل</span>
            <Link href={`/article/${breaking.slug}`} className="text-sm font-medium hover:underline flex-1 truncate">
              {breaking.titleAr}
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Featured section */}
        {featured.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-900 rounded"></span>
              الأخبار المميزة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 3).map((a, i) => (
                <Link
                  key={a.id}
                  href={`/article/${a.slug}`}
                  className={`group ${i === 0 ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' : ''}`}
                >
                  <article className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow h-full">
                    {a.featuredImg ? (
                      <div className={`overflow-hidden ${i === 0 ? 'aspect-[16/9]' : 'aspect-video'}`}>
                        <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className={`bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ${i === 0 ? 'aspect-[16/9]' : 'aspect-video'}`}>
                        <span className="text-4xl">{a.category?.icon}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-500">{a.category?.icon} {a.category?.nameAr}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{timeAgo(a.createdAt)}</span>
                      </div>
                      <h3 className={`font-bold text-slate-900 group-hover:text-slate-700 ${i === 0 ? 'text-xl' : 'text-base'}`}>
                        {a.titleAr}
                      </h3>
                      {a.leadAr && i === 0 && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.leadAr}</p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest news grid */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-slate-900 rounded"></span>
            أحدث الأخبار
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map(a => (
              <Link key={a.id} href={`/article/${a.slug}`} className="group">
                <article className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow h-full">
                  {a.featuredImg ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-3xl">{a.category?.icon}</span>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5 text-xs">
                      <span className="text-slate-500">{a.category?.icon} {a.category?.nameAr}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">{timeAgo(a.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 text-sm line-clamp-2">
                      {a.titleAr}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {latest.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Newspaper className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد أخبار منشورة بعد</p>
            </div>
          )}
        </section>

        {/* Categories overview */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-slate-900 rounded"></span>
            الأقسام
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-900 hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-2">{c.icon}</div>
                <h3 className="font-semibold text-slate-900 text-sm">{c.nameAr}</h3>
                {c.children.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">{c.children.length} قسم فرعي</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-12">
        {/* Newsletter section */}
        <div className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <NewsletterForm />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="h-5 w-5" />
                <span className="font-bold text-white">{siteName}</span>
              </div>
              <p className="text-sm">{settings.site_description || siteTagline}</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">روابط سريعة</h3>
              <ul className="space-y-1 text-sm">
                <li><Link href="/" className="hover:text-white">الرئيسية</Link></li>
                <li><Link href="/search" className="hover:text-white">بحث</Link></li>
                {pages.map(p => (
                  <li key={p.id}><Link href={`/${p.slug}`} className="hover:text-white">{p.titleAr}</Link></li>
                ))}
                <li><a href="/rss" className="hover:text-white">RSS Feed</a></li>
                <li><a href="/sitemap.xml" className="hover:text-white">Sitemap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">تابعنا</h3>
              <ul className="space-y-1 text-sm">
                {settings.social_twitter && <li><a href={settings.social_twitter} className="hover:text-white">Twitter / X</a></li>}
                {settings.social_facebook && <li><a href={settings.social_facebook} className="hover:text-white">Facebook</a></li>}
                {settings.social_telegram && <li><a href={settings.social_telegram} className="hover:text-white">Telegram</a></li>}
                {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-white">{settings.contact_email}</a></li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 pt-6 text-center text-xs">
            © 2026 {siteName}. جميع الحقوق محفوظة. Powered by Automated News Platform v2.0.0
          </div>
        </div>
      </footer>
    </div>
  )
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'الآن'
  if (sec < 3600) return `قبل ${Math.floor(sec / 60)} دقيقة`
  if (sec < 86400) return `قبل ${Math.floor(sec / 3600)} ساعة`
  return `قبل ${Math.floor(sec / 86400)} يوم`
}
