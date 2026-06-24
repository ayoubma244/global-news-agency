'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Newspaper, Code2, ChevronLeft } from 'lucide-react'

const endpoints = [
  { method: 'GET', path: '/api/health', desc: 'فحص صحة النظام', auth: false },
  { method: 'GET', path: '/api/status', desc: 'حالة الموقع والإحصائيات', auth: false },
  { method: 'GET', path: '/api/articles', desc: 'قائمة المقالات', auth: false },
  { method: 'POST', path: '/api/articles', desc: 'إنشاء مقال', auth: true },
  { method: 'GET', path: '/api/articles/[id]', desc: 'تفاصيل مقال', auth: false },
  { method: 'PUT', path: '/api/articles/[id]', desc: 'تحديث مقال', auth: true },
  { method: 'DELETE', path: '/api/articles/[id]', desc: 'حذف مقال', auth: true },
  { method: 'GET', path: '/api/articles/[id]/comments', desc: 'تعليقات المقال', auth: false },
  { method: 'POST', path: '/api/articles/[id]/comments', desc: 'إضافة تعليق', auth: false },
  { method: 'GET', path: '/api/articles/[id]/reactions', desc: 'ردود الأفعال', auth: false },
  { method: 'POST', path: '/api/articles/[id]/reactions', desc: 'إضافة/إزالة تفاعل', auth: false },
  { method: 'POST', path: '/api/articles/[id]/bookmark', desc: 'حفظ/إزالة من المفضلة', auth: false },
  { method: 'GET', path: '/api/articles/[id]/related', desc: 'مقالات ذات صلة', auth: false },
  { method: 'POST', path: '/api/articles/[id]/summary', desc: 'توليد ملخص AI', auth: true },
  { method: 'GET', path: '/api/articles/[id]/summary', desc: 'الحصول على الملخص', auth: false },
  { method: 'GET', path: '/api/categories', desc: 'قائمة التصنيفات', auth: false },
  { method: 'POST', path: '/api/categories', desc: 'إنشاء تصنيف', auth: true },
  { method: 'GET', path: '/api/search', desc: 'بحث في المقالات', auth: false },
  { method: 'GET', path: '/api/recommendations', desc: 'توصيات مخصصة', auth: false },
  { method: 'GET', path: '/api/tags', desc: 'قائمة الوسوم', auth: false },
  { method: 'GET', path: '/api/rss-sources', desc: 'قائمة مصادر RSS', auth: false },
  { method: 'POST', path: '/api/rss-sources', desc: 'إضافة مصدر RSS', auth: true },
  { method: 'GET', path: '/api/rss-sources/[id]/test', desc: 'فحص مصدر RSS', auth: true },
  { method: 'POST', path: '/api/automation/run', desc: 'تشغيل خط الأتمتة', auth: true },
  { method: 'GET', path: '/api/automation/logs', desc: 'سجل الأتمتة', auth: true },
  { method: 'GET', path: '/api/automation/status', desc: 'حالة الأتمتة', auth: true },
  { method: 'GET', path: '/api/cron/automation', desc: 'Cron job للأتمتة', auth: 'cron' },
  { method: 'GET', path: '/api/analytics', desc: 'التحليلات', auth: true },
  { method: 'GET', path: '/api/visitors', desc: 'الزوار النشطون', auth: false },
  { method: 'POST', path: '/api/visitors', desc: 'تحديث نشاط الزائر', auth: false },
  { method: 'GET', path: '/api/bookmarks', desc: 'قائمة المحفوظات', auth: false },
  { method: 'GET/POST', path: '/api/history', desc: 'سجل القراءة', auth: false },
  { method: 'GET/POST', path: '/api/subscribers', desc: 'المشتركون', auth: false },
  { method: 'GET', path: '/api/subscribers/verify', desc: 'تأكيد البريد', auth: false },
  { method: 'POST', path: '/api/newsletter/send', desc: 'إرسال النشرة', auth: true },
  { method: 'GET/POST', path: '/api/ads', desc: 'الإعلانات', auth: false },
  { method: 'GET/POST', path: '/api/pages', desc: 'الصفحات', auth: false },
  { method: 'GET/POST', path: '/api/settings', desc: 'الإعدادات', auth: true },
  { method: 'GET/POST', path: '/api/api-keys', desc: 'API Keys', auth: true },
  { method: 'GET/POST', path: '/api/jobs', desc: 'المهام المجدولة', auth: true },
  { method: 'GET', path: '/api/activity', desc: 'سجل النشاط', auth: true },
  { method: 'POST', path: '/api/social-post', desc: 'نشر على السوشيال', auth: true },
  { method: 'GET/POST', path: '/api/backup/export', desc: 'تصدير نسخة احتياطية', auth: true },
  { method: 'GET', path: '/api/backup/list', desc: 'قائمة النسخ الاحتياطية', auth: true },
  { method: 'GET', path: '/api/seo-audit/[id]', desc: 'تدقيق SEO', auth: true },
  { method: 'POST', path: '/api/push/subscribe', desc: 'اشتراك الإشعارات', auth: false },
  { method: 'POST', path: '/api/push/send', desc: 'إرسال إشعار', auth: true },
  { method: 'GET', path: '/api/auth/login', desc: 'تسجيل الدخول', auth: false },
  { method: 'POST', path: '/api/auth/login', desc: 'تسجيل الدخول', auth: false },
  { method: 'POST', path: '/api/auth/logout', desc: 'تسجيل الخروج', auth: true },
  { method: 'GET', path: '/api/auth/me', desc: 'البيانات الحالية', auth: true },
  { method: 'GET/POST', path: '/api/install', desc: 'تثبيت الموقع', auth: false },
  { method: 'GET', path: '/sitemap.xml', desc: 'Sitemap', auth: false },
  { method: 'GET', path: '/robots.txt', desc: 'Robots', auth: false },
  { method: 'GET', path: '/rss', desc: 'RSS Feed', auth: false },
  { method: 'GET', path: '/feed/[slug]', desc: 'RSS Feed per category', auth: false },
]

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  'GET/POST': 'bg-purple-100 text-purple-700',
}

export default function ApiDocsPage() {
  const [filter, setFilter] = useState('')
  const [authFilter, setAuthFilter] = useState('all')

  const filtered = endpoints.filter(e => {
    const matchesText = !filter || e.path.includes(filter.toLowerCase()) || e.desc.includes(filter)
    const matchesAuth = authFilter === 'all' ||
      (authFilter === 'public' && !e.auth) ||
      (authFilter === 'auth' && e.auth === true) ||
      (authFilter === 'cron' && e.auth === 'cron')
    return matchesText && matchesAuth
  })

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-slate-900">API Documentation</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> الرئيسية
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="h-8 w-8" />
            API Documentation
          </h1>
          <p className="text-slate-600 mt-2">{filtered.length} endpoints توثيق كامل لكل APIs</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            placeholder="بحث..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg flex-1 min-w-[200px]"
          />
          <select
            value={authFilter}
            onChange={e => setAuthFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg"
          >
            <option value="all">الكل</option>
            <option value="public">عام</option>
            <option value="auth">يتطلب auth</option>
            <option value="cron">Cron</option>
          </select>
        </div>

        {/* Endpoints */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((e, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${methodColors[e.method] || 'bg-slate-100'}`}>
                  {e.method}
                </span>
                <code className="text-sm text-slate-900 font-mono flex-1" dir="ltr">{e.path}</code>
                <span className="text-sm text-slate-600">{e.desc}</span>
                {e.auth === true && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Auth</span>}
                {e.auth === 'cron' && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Cron</span>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
