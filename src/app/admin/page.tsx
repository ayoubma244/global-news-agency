'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderTree, FileText, FilePlus, Key, Newspaper, TrendingUp, Eye, Clock, Activity, Bot } from 'lucide-react'

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
    { label: 'Categories', value: stats?.categories ?? 0, icon: FolderTree, href: '/admin/categories', color: 'bg-blue-500' },
    { label: 'Articles', value: stats?.articles ?? 0, icon: FileText, href: '/admin/articles', color: 'bg-green-500' },
    { label: 'Pages', value: stats?.pages ?? 0, icon: FilePlus, href: '/admin/pages', color: 'bg-purple-500' },
    { label: 'Automation', value: 'Run', icon: Bot, href: '/admin/automation', color: 'bg-indigo-500' },
  ]

  if (loading) return <div className="animate-pulse">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your news platform</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Articles
            </CardTitle>
            <CardDescription>Latest 5 articles</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No articles yet</p>
                <Link href="/admin/articles" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Add your first article →
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
                          <span className="flex items-center gap-1">{a.category.icon} {a.category.nameAr}</span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.status === 'published' ? 'bg-green-100 text-green-700' :
                      a.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                      a.status === 'needs_review' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {a.status === 'published' ? 'Published' : a.status === 'draft' ? 'Draft' : a.status === 'needs_review' ? 'Review' : a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/articles" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Add Article</p>
                  <p className="text-xs text-slate-500">Create a new article</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/categories" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FolderTree className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Manage Categories</p>
                  <p className="text-xs text-slate-500">Add/edit/toggle</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/automation" className="block p-3 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-lg transition-colors border border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">🚀 Run Automation</p>
                  <p className="text-xs text-slate-500">Fetch + AI + publish</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/settings" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Site Settings</p>
                  <p className="text-xs text-slate-500">SEO, Social, Automation</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
