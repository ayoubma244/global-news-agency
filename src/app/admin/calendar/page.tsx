'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight, ChevronLeft, FileText, Clock, CheckCircle2 } from 'lucide-react'

interface Article {
  id: string
  slug: string
  titleAr: string
  status: string
  publishedAt: string | null
  createdAt: string
  isBreaking: boolean
  isFeatured: boolean
  category: { nameAr: string; icon: string }
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export default function AdminCalendar() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/articles?limit=200')
    const data = await res.json()
    if (data.ok) setArticles(data.articles)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const getArticlesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return articles.filter(a => {
      const articleDate = new Date(a.publishedAt || a.createdAt)
      const articleDateStr = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}-${String(articleDate.getDate()).padStart(2, '0')}`
      return articleDateStr === dateStr
    })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = () => setCurrentDate(new Date())

  // Stats for this month
  const monthArticles = articles.filter(a => {
    const d = new Date(a.publishedAt || a.createdAt)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const published = monthArticles.filter(a => a.status === 'published').length
  const drafts = monthArticles.filter(a => a.status === 'draft').length
  const breaking = monthArticles.filter(a => a.isBreaking).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            تقويم المقالات
          </h1>
          <p className="text-slate-600 mt-1">عرض جميع المقالات حسب التاريخ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prevMonth} className="gap-1">
            <ChevronRight className="h-4 w-4" /> السابق
          </Button>
          <Button size="sm" variant="outline" onClick={today}>اليوم</Button>
          <Button size="sm" variant="outline" onClick={nextMonth} className="gap-1">
            التالي <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500">إجمالي الشهر</p>
          <p className="text-2xl font-bold text-slate-900">{monthArticles.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500">منشور</p>
          <p className="text-2xl font-bold text-green-600">{published}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500">مسودة</p>
          <p className="text-2xl font-bold text-amber-600">{drafts}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-slate-500">عاجل</p>
          <p className="text-2xl font-bold text-red-600">{breaking}</p>
        </CardContent></Card>
      </div>

      {/* Calendar header */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">
            {MONTHS[month]} {year}
          </h2>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for starting offset */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayArticles = getArticlesForDay(day)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-1 overflow-hidden ${
                    isToday ? 'border-indigo-500 border-2 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayArticles.slice(0, 3).map(a => (
                      <Link
                        key={a.id}
                        href={`/article/${a.slug}`}
                        className="block text-[10px] truncate px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title={a.titleAr}
                      >
                        {a.category?.icon} {a.titleAr.slice(0, 20)}
                      </Link>
                    ))}
                    {dayArticles.length > 3 && (
                      <div className="text-[10px] text-slate-500 text-center">
                        +{dayArticles.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent articles list */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-3">مقالات هذا الشهر ({monthArticles.length})</h3>
          {loading ? (
            <div className="text-center py-4 text-slate-500">جاري التحميل...</div>
          ) : monthArticles.length === 0 ? (
            <div className="text-center py-4 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد مقالات في هذا الشهر</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {monthArticles.slice(0, 20).map(a => (
                <Link key={a.id} href={`/article/${a.slug}`} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                  <span className="text-lg">{a.category?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.titleAr}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(a.publishedAt || a.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  {a.status === 'published' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {a.status === 'draft' && <Clock className="h-4 w-4 text-amber-500" />}
                  {a.isBreaking && <Badge variant="destructive" className="text-xs">عاجل</Badge>}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
