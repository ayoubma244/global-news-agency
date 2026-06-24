import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Newspaper, Bookmark, ChevronLeft } from 'lucide-react'
import { getAllSettings } from '@/lib/settings'
import BookmarksClient from '@/components/bookmarks-client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function BookmarksPage() {
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
            <ChevronLeft className="h-4 w-4" /> الرئيسية
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Bookmark className="h-6 w-6" />
          المفضلة (محفوظات)
        </h1>
        <BookmarksClient />
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 {siteName}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  )
}
