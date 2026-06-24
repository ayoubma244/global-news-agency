'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderTree, FileText, FilePlus, Key, Newspaper, TrendingUp, Eye, Clock, Activity } from 'lucide-react'

interface Stats {
  categories: number
  articles: number
  pages: number
  apiKeys?: number
}

interface RecentArticle {
  id: string
  titleAr: string
  status: string
  views: number
  createdAt: string
  category?: { nameAr: string; icon: string }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/articles?limit=5').then(r => r.json()),
    ]).then(([s, a]) => {
      if (s.ok) setStats(s.stats)
      if (a.ok) setRecent(a.articles)
      setLoading(false)
    })
  }, [])

  const cards = [
    { label: 'الكاتيجوريز', value: stats?.categories ?? 0, icon: FolderTree, href: '/admin/categories', color: 'bg-blue-500' },
    { label: 'المقالات', value: stats?.articles ?? 0, icon: FileText, href: '/admin/articles', color: 'bg-green-500' },
    { label: 'الصفحات', value: stats?.pages ?? 0, icon: FilePlus, href: '/admin/pages', color: 'bg-purple-500' },
    { label: 'API Keys', value: stats?.apiKeys ?? 0, icon: Key, href: '/admin/api-keys', color: 'bg-orange-500' },
  ]

  if (loading) {
    return <div className="animate-pulse">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-slate-600 mt-1">نظرة عامة على موقعك الإخباري</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent articles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              أحدث المقالات
            </CardTitle>
            <CardDescription>آخر 5 مقالات تمت إضافتها</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>لا توجد مقالات بعد</p>
                <Link href="/admin/articles" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  أضف أول مقال ←
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{a.titleAr}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {a.category && (
                          <span className="flex items-center gap-1">
                            {a.category.icon} {a.category.nameAr}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {a.views}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.status === 'published' ? 'bg-green-100 text-green-700' :
                      a.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {a.status === 'published' ? 'منشور' : a.status === 'draft' ? 'مسودة' : a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              إجراءات سريعة
            </CardTitle>
            <CardDescription>اختصارات للوصول السريع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/articles" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">إضافة مقال</p>
                  <p className="text-xs text-slate-500">إنشاء مقال جديد</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/categories" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FolderTree className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">إدارة التصنيفات</p>
                  <p className="text-xs text-slate-500">إضافة/تعديل/تفعيل</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/api-keys" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Key className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">إضافة API Key</p>
                  <p className="text-xs text-slate-500">لمصادر الأخبار</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/settings" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">إعدادات الموقع</p>
                  <p className="text-xs text-slate-500">SEO، السوشيال، الأتمتة</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
