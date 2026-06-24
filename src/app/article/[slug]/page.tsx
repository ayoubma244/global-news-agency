import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Newspaper, Eye, Clock, ChevronLeft, Share2, Tag } from 'lucide-react'
import { getAllSettings } from '@/lib/settings'
import type { Metadata } from 'next'
import ReactionsBar from '@/components/reactions-bar'
import CommentsSection from '@/components/comments-section'
import BookmarkButton from '@/components/bookmark-button'
import ReadingProgress from '@/components/reading-progress'
import AiSummaryCard from '@/components/ai-summary-card'
import ShareButtons from '@/components/share-buttons'
import ThemeToggle from '@/components/theme-toggle'
import SourceTransparencyPanel from '@/components/source-transparency'
import ReadingModeToggle from '@/components/reading-mode'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!article) return { title: 'Article not found' }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${base}/article/${article.slug}`

  // Dynamic OG image
  const ogImageUrl = `${base}/api/og?title=${encodeURIComponent(article.titleAr)}&category=${encodeURIComponent(article.category?.nameEn || article.category?.nameAr || 'News')}&icon=${encodeURIComponent(article.category?.icon || '📰')}&site=${encodeURIComponent('Global News Agency')}`

  return {
    title: article.seoTitle || article.titleAr,
    description: article.seoDescription || article.excerpt || article.leadAr || '',
    keywords: article.seoKeywords?.split(',').map(k => k.trim()),
    authors: article.author ? [{ name: article.author }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: article.titleAr,
      description: article.leadAr || article.excerpt || '',
      publishedTime: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: article.author ? [article.author] : undefined,
      images: [
        ...(article.featuredImg ? [{ url: article.featuredImg }] : []),
        { url: ogImageUrl, width: 1200, height: 630, alt: article.titleAr },
      ],
      tags: article.seoKeywords?.split(',').map(k => k.trim()),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.titleAr,
      description: article.leadAr || article.excerpt || '',
      images: [ogImageUrl, ...(article.featuredImg ? [article.featuredImg] : [])],
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await prisma.article.findUnique({
    where: { slug, status: 'published' },
    include: { category: true },
  })

  if (!article) notFound()

  // Increment views + log view event
  await Promise.all([
    prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    }),
    prisma.articleView.create({
      data: {
        articleId: article.id,
      },
    }).catch(() => null), // ignore errors
  ])

  // Related articles
  const related = await prisma.article.findMany({
    where: {
      categoryId: article.categoryId,
      status: 'published',
      NOT: { id: article.id },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })

  const settings = await getAllSettings()
  const siteName = settings.site_name || 'وكالة الأنباء العالمية'
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titleAr,
    description: article.leadAr || article.excerpt,
    image: article.featuredImg ? [article.featuredImg] : undefined,
    datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.author || siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${base}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${base}/article/${article.slug}`,
    },
    articleSection: article.category?.nameAr,
    keywords: article.seoKeywords,
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Reading Progress + Time tracker */}
      <ReadingProgress articleId={article.id} readingTime={Math.max(1, Math.round(article.bodyAr.split(/\s+/).length / 200))} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-slate-900">{siteName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={article.category ? `/category/${article.category.slug}` : '/'} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
              <ChevronLeft className="h-4 w-4" />
              {article.category?.icon} {article.category?.nameAr}
            </Link>
            <ThemeToggle />
            <ReadingModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <ChevronLeft className="h-3 w-3" />
          {article.category && (
            <>
              <Link href={`/category/${article.category.slug}`} className="hover:text-slate-900">
                {article.category.nameAr}
              </Link>
              <ChevronLeft className="h-3 w-3" />
            </>
          )}
          <span className="text-slate-700 truncate">{article.titleAr}</span>
        </nav>

        {/* Article header */}
        <article>
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && (
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">عاجل</span>
            )}
            <span className="text-sm text-slate-500">{article.category?.icon} {article.category?.nameAr}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {article.titleAr}
          </h1>

          {article.leadAr && (
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">{article.leadAr}</p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {article.author && (
                <span>بقلم: <strong className="text-slate-700">{article.author}</strong></span>
              )}
              {article.sourceName && (
                <span>المصدر: {article.sourceName}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {article.views}
              </span>
            </div>
            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
              <Share2 className="h-4 w-4" /> مشاركة
            </button>
          </div>

          {/* Featured image */}
          {article.featuredImg && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={article.featuredImg} alt={article.titleAr} className="w-full" />
            </div>
          )}

          {/* Body */}
          <div className="prose prose-lg max-w-none">
            {article.bodyAr.split('\n').map((p, i) => (
              <p key={i} className="text-slate-800 leading-relaxed mb-4 text-lg">{p}</p>
            ))}
          </div>

          {/* Tags */}
          {article.seoKeywords && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-slate-400" />
                {article.seoKeywords.split(',').map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source Transparency Panel */}
          <SourceTransparencyPanel
            sourceUrl={article.sourceUrl}
            sourceName={article.sourceName}
            publishedAt={article.publishedAt?.toISOString() || article.createdAt.toISOString()}
            updatedAt={article.updatedAt.toISOString()}
            factCheckScore={article.humanScore}
            verificationStatus={article.factCheckNotes ? 'verified' : null}
          />

          {/* AI Summary */}
          <div className="mt-8">
            <AiSummaryCard articleId={article.id} articleBody={article.bodyAr} />
          </div>

          {/* Action buttons row */}
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <BookmarkButton articleId={article.id} />
          </div>

          {/* Share buttons */}
          <div className="mt-4">
            <ShareButtons articleId={article.id} title={article.titleAr} />
          </div>

          {/* Reactions */}
          <div className="mt-4">
            <ReactionsBar articleId={article.id} />
          </div>

          {/* Comments */}
          <div className="mt-6">
            <CommentsSection articleId={article.id} />
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-900 rounded"></span>
              أخبار ذات صلة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(a => (
                <Link key={a.id} href={`/article/${a.slug}`} className="group">
                  <article className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow flex">
                    {a.featuredImg ? (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 flex-shrink-0 bg-slate-100 flex items-center justify-center">
                        <span className="text-2xl">{a.category?.icon}</span>
                      </div>
                    )}
                    <div className="p-3 flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 text-sm line-clamp-2">{a.titleAr}</h3>
                      <span className="text-xs text-slate-500 mt-1 block">{new Date(a.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 {siteName}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  )
}
