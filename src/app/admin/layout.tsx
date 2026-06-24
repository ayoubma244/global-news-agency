'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Newspaper, LayoutDashboard, FolderTree, FileText, Settings, Key, LogOut, Menu, X, ExternalLink, FilePlus, Bot, BarChart3, Activity, Clock, Users, Rss, Megaphone, MessageSquare, Database, Calendar, Share2 } from 'lucide-react'

interface Admin {
  id: string
  username: string
  email: string
  role: string
}

const navItems = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'التحليلات', icon: BarChart3 },
  { href: '/admin/categories', label: 'الكاتيجوريز', icon: FolderTree },
  { href: '/admin/rss-sources', label: 'مصادر RSS', icon: Rss },
  { href: '/admin/articles', label: 'المقالات', icon: FileText },
  { href: '/admin/calendar', label: 'التقويم', icon: Calendar },
  { href: '/admin/comments', label: 'التعليقات', icon: MessageSquare },
  { href: '/admin/pages', label: 'الصفحات', icon: FilePlus },
  { href: '/admin/ads', label: 'الإعلانات', icon: Megaphone },
  { href: '/admin/automation', label: 'الأتمتة', icon: Bot },
  { href: '/admin/jobs', label: 'المهام المجدولة', icon: Clock },
  { href: '/admin/api-keys', label: 'API Keys', icon: Key },
  { href: '/admin/subscribers', label: 'المشتروكون', icon: Users },
  { href: '/admin/backup', label: 'النسخ الاحتياطي', icon: Database },
  { href: '/admin/activity', label: 'سجل النشاط', icon: Activity },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.ok) {
          router.push('/login')
        } else {
          setAdmin(d.admin)
          setLoading(false)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="animate-pulse">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Newspaper className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 hidden sm:inline">لوحة التحكم</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">عرض الموقع</span>
              </Button>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <div className="w-7 h-7 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {admin?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">{admin?.username}</div>
                <div className="text-slate-500">{admin?.role === 'super_admin' ? 'مدير عام' : admin?.role}</div>
              </div>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className={`bg-white border-l border-slate-200 w-64 fixed md:sticky top-16 right-0 bottom-0 z-20 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              <div className="font-semibold text-slate-700">Global News v1.0.0</div>
              <div>© 2026 All rights reserved</div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
