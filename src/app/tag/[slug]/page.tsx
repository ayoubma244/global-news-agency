import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Newspaper, Eye, ChevronLeft, Tag as TagIcon } from 'lucide-react'
import { getAllSettings } from '@/lib/settings'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      articles: {
        include: {
          article: {
            include: { category: true },
          },
        },
        orderBy: { article: { createdAt: 'desc' } },
        take: 50,
      },
    },
  })

  if (!tag) notFound()

  const settings = await getAllSettings()
  const siteName = settings.site_name || 'وكالة الأنباء العالمية'
  const articles = tag.articles.map(at => at.article).filter(a => a.status === 'published')

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
            <ChevronLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <TagIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{tag.name}</h1>
              <p className="text-sm text-slate-500">{articles.length} مقال</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(a => (
            <Link key={a.id} href={`/article/${a.slug}`} className="group">
              <article className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow h-full">
                {a.featuredImg ? (
                  <div className="aspect-video overflow-hidden">
                    <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-3xl">{a.category?.icon}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-slate-500 mb-1">{a.category?.icon} {a.category?.nameAr}</div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 text-sm line-clamp-2">{a.titleAr}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <TagIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No articles with this tag</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 {siteName}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
