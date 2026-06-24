'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Eye, FileText, Users, Bot, Activity, Award, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalArticles: number
    publishedArticles: number
    draftArticles: number
    totalViews: number
    recentViews: number
    todayViews: number
    subscribers: number
  }
  topArticles: Array<{
    id: string
    titleAr: string
    slug: string
    views: number
    createdAt: string
    category: { nameAr: string; icon: string }
  }>
  categoriesWithCounts: Array<{ id: string; nameAr: string; icon: string; count: number }>
  viewsTrend: Array<{ date: string; count: number }>
  automationTrend: Array<{ date: string; success: number; error: number }>
}

const COLORS = ['#1B2A4A', '#1B7D46', '#D4820A', '#C0392B', '#6C5B7B', '#2D4A3E', '#0D1B2A', '#B85C1E']

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/analytics?range=${range}`)
    const d = await res.json()
    if (d.ok) setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [range])

  if (loading) return <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
  if (!data) return <div className="text-center py-12 text-slate-500">لا توجد بيانات</div>

  const { summary } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            التحليلات والإحصائيات
          </h1>
          <p className="text-slate-600 mt-1">نظرة شاملة على أداء الموقع</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r === '24h' ? '24 ساعة' : r === '7d' ? '7 أيام' : r === '30d' ? '30 يوم' : '90 يوم'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-slate-500">إجمالي</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{summary.totalArticles}</p>
            <p className="text-xs text-slate-500">مقال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-xs text-slate-500">منشور</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.publishedArticles}</p>
            <p className="text-xs text-slate-500">مقال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-slate-500">مسودة</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{summary.draftArticles}</p>
            <p className="text-xs text-slate-500">مقال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Eye className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-slate-500">إجمالي</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{summary.totalViews.toLocaleString()}</p>
            <p className="text-xs text-slate-500">مشاهدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              <span className="text-xs text-slate-500">آخر فترة</span>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{summary.recentViews.toLocaleString()}</p>
            <p className="text-xs text-slate-500">مشاهدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Calendar className="h-5 w-5 text-pink-500" />
              <span className="text-xs text-slate-500">اليوم</span>
            </div>
            <p className="text-2xl font-bold text-pink-600">{summary.todayViews.toLocaleString()}</p>
            <p className="text-xs text-slate-500">مشاهدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-5 w-5 text-indigo-500" />
              <span className="text-xs text-slate-500">مشترك</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{summary.subscribers.toLocaleString()}</p>
            <p className="text-xs text-slate-500">نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              اتجاه المشاهدات (14 يوم)
            </CardTitle>
            <CardDescription>عدد المشاهدات يومياً</CardDescription>
          </CardHeader>
          <CardContent>
            {data.viewsTrend.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات كافية</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.viewsTrend}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', fontSize: 12 }}
                    labelFormatter={d => new Date(d as string).toLocaleDateString('ar-EG')}
                  />
                  <Area type="monotone" dataKey="count" stroke="#1B2A4A" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="مشاهدات" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Articles per category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              المقالات حسب الكاتيجوري
            </CardTitle>
            <CardDescription>توزيع المقالات المنشورة</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoriesWithCounts.filter(c => c.count > 0).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد مقالات بعد</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.categoriesWithCounts.filter(c => c.count > 0)}
                    dataKey="count"
                    nameKey="nameAr"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.nameAr}: ${e.count}`}
                    labelLine={false}
                  >
                    {data.categoriesWithCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Automation trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              نشاط الأتمتة (14 يوم)
            </CardTitle>
            <CardDescription>عمليات ناجحة مقابل فاشلة</CardDescription>
          </CardHeader>
          <CardContent>
            {data.automationTrend.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد عمليات أتمتة بعد</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.automationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', fontSize: 12 }}
                    labelFormatter={d => new Date(d as string).toLocaleDateString('ar-EG')}
                  />
                  <Bar dataKey="success" stackId="a" fill="#1B7D46" name="ناجح" />
                  <Bar dataKey="error" stackId="a" fill="#C0392B" name="فاشل" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              أكثر المقالات مشاهدة
            </CardTitle>
            <CardDescription>أفضل 10 مقالات</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topArticles.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد مقالات بعد</div>
            ) : (
              <div className="space-y-2">
                {data.topArticles.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 py-1.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900' :
                      i === 1 ? 'bg-slate-300 text-slate-700' :
                      i === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-slate-100 text-slate-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.titleAr}</p>
                      <p className="text-xs text-slate-500">{a.category?.icon} {a.category?.nameAr}</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      <Eye className="h-3 w-3 ml-1" /> {a.views.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
