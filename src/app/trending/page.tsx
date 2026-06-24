import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Newspaper, TrendingUp, Flame, Clock, ChevronLeft, Hash } from 'lucide-react'
import { getAllSettings } from '@/lib/settings'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function TrendingPage() {
  const settings = await getAllSettings()
  const siteName = settings.site_name || 'وكالة الأنباء العالمية'

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [trending24h, popular7d, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published', publishedAt: { gte: last24h } },
      orderBy: { views: 'desc' },
      take: 10,
      include: { category: { select: { nameAr: true, icon: true, slug: true } } },
    }),
    prisma.article.findMany({
      where: { status: 'published', publishedAt: { gte: last7d } },
      orderBy: { views: 'desc' },
      take: 10,
      include: { category: { select: { nameAr: true, icon: true, slug: true } } },
    }),
    prisma.category.findMany({
      where: { level: 1, isActive: true },
      select: {
        id: true, nameAr: true, icon: true, slug: true,
        _count: { select: { articles: { where: { status: 'published', publishedAt: { gte: last7d } } } } },
      },
    }),
  ])

  const trendingCategories = categories
    .filter(c => c._count.articles > 0)
    .sort((a, b) => b._count.articles - a._count.articles)
    .slice(0, 8)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-slate-900">{siteName}</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> الرئيسية
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          الأكثر رواجاً
        </h1>
        <p className="text-slate-600 mb-8">آخر الأخبار الرائجة والأكثر قراءة</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trending 24h */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              رائج اليوم (24 ساعة)
            </h2>
            {trending24h.length === 0 ? (
              <p className="text-slate-500 text-sm">لا توجد أخبار رائجة اليوم</p>
            ) : (
              <div className="space-y-3">
                {trending24h.map((a, i) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className="block bg-white rounded-xl p-3 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl font-bold ${i < 3 ? 'text-red-500' : 'text-slate-400'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {a.isBreaking && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded mb-1 inline-block">عاجل</span>}
                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{a.titleAr}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{a.category?.icon} {a.category?.nameAr}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {a.views} مشاهدة</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Popular 7d */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              الأكثر قراءة هذا الأسبوع
            </h2>
            {popular7d.length === 0 ? (
              <p className="text-slate-500 text-sm">لا توجد أخبار هذا الأسبوع</p>
            ) : (
              <div className="space-y-3">
                {popular7d.map((a, i) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className="block bg-white rounded-xl p-3 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl font-bold ${i < 3 ? 'text-blue-500' : 'text-slate-400'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{a.titleAr}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{a.category?.icon} {a.category?.nameAr}</span>
                          <span>•</span>
                          <span>{a.views} مشاهدة</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5 text-purple-500" />
              أقسام رائجة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trendingCategories.map(c => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <h3 className="font-semibold text-slate-900 text-sm">{c.nameAr}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c._count.articles} مقال هذا الأسبوع</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 {siteName}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  )
}
