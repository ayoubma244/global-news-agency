'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, Eye, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  id: string
  slug: string
  titleAr: string
  leadAr: string | null
  featuredImg: string | null
  publishedAt: string
  views: number
  category: { nameAr: string; icon: string; slug: string }
}

export default function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/bookmarks')
    const data = await res.json()
    if (data.ok) setBookmarks(data.bookmarks)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const remove = async (articleId: string) => {
    await fetch(`/api/articles/${articleId}/bookmark`, { method: 'POST' })
    setBookmarks(bookmarks.filter(b => b.id !== articleId))
    toast.success('تم الحذف من المفضلة')
  }

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
        <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p className="text-slate-500">لا توجد مقالات محفوظة</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">تصفح الأخبار ←</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookmarks.map(a => (
        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 flex gap-3">
          {a.featuredImg ? (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{a.category?.icon}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/article/${a.slug}`} className="hover:text-blue-600">
              <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{a.titleAr}</h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{a.category?.icon} {a.category?.nameAr}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
              <span>•</span>
              <span>{new Date(a.publishedAt).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>
          <button
            onClick={() => remove(a.id)}
            className="text-slate-400 hover:text-red-600 p-2 flex-shrink-0"
            title="إزالة من المفضلة"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
