'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon, Eye, Newspaper, ArrowLeft } from 'lucide-react'

interface Article {
  id: string
  slug: string
  titleAr: string
  leadAr: string | null
  excerpt: string | null
  featuredImg: string | null
  views: number
  createdAt: string
  category: { nameAr: string; icon: string }
}

export default function SearchPage() {
  const params = useSearchParams()
  const initialQ = params.get('q') || ''
  const [q, setQ] = useState(initialQ)
  const [results, setResults] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setTotal(0)
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`)
      const data = await res.json()
      if (data.ok) {
        setResults(data.articles)
        setTotal(data.total)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (initialQ) search(initialQ)
  }, [initialQ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(q)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-slate-900">وكالة الأنباء العالمية</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <SearchIcon className="h-6 w-6" />
          البحث في الأخبار
        </h1>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ابحث في الأخبار..."
              className="pr-12 h-14 text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" className="mt-3 w-full sm:w-auto" size="lg" disabled={loading}>
            {loading ? 'جاري البحث...' : 'بحث'}
          </Button>
        </form>

        {searched && (
          <div className="mb-4 text-sm text-slate-600">
            {loading ? 'جاري البحث...' : `${total} نتيجة لـ «${q}»`}
          </div>
        )}

        <div className="space-y-3">
          {results.map(a => (
            <Link key={a.id} href={`/article/${a.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="p-4 flex gap-4">
                  {a.featuredImg ? (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <img src={a.featuredImg} alt={a.titleAr} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">{a.category?.icon}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-1">{a.category?.icon} {a.category?.nameAr}</div>
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{a.titleAr}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{a.leadAr || a.excerpt}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>لا توجد نتائج لـ «{q}»</p>
            <p className="text-xs mt-1">جرب كلمات أخرى أو ابحث بدون تشكيل</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs">
          © 2026 وكالة الأنباء العالمية. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  )
}
