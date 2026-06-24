import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Newspaper, ChevronLeft } from 'lucide-react'
import { getAllSettings } from '@/lib/settings'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// Reserved slugs that should not match this route
const RESERVED = ['admin', 'login', 'install', 'category', 'article', 'api']

export default async function PageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (RESERVED.includes(slug)) notFound()

  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true },
  })

  if (!page) notFound()

  const settings = await getAllSettings()
  const siteName = settings.site_name || 'وكالة الأنباء العالمية'

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
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <nav className="text-xs text-slate-500 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-slate-700">{page.titleAr}</span>
          </nav>

          <h1 className="text-3xl font-bold text-slate-900 mb-6">{page.titleAr}</h1>

          <div className="prose prose-lg max-w-none">
            {page.contentAr.split('\n').map((p, i) => (
              <p key={i} className="text-slate-800 leading-relaxed mb-4">{p}</p>
            ))}
          </div>

          {page.template === 'contact' && settings.contact_email && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                للتواصل: <a href={`mailto:${settings.contact_email}`} className="text-blue-600 hover:underline">{settings.contact_email}</a>
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 {siteName}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
