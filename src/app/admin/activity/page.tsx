'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, User, FileText, Settings, FolderTree, Key, LogOut, LogIn, Trash2, Edit2, Plus } from 'lucide-react'

interface LogEntry {
  id: string
  adminId: string | null
  adminName: string | null
  action: string
  entity: string
  entityId: string | null
  entityName: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Edit2,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  publish: FileText,
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-slate-100 text-slate-700',
  publish: 'bg-amber-100 text-amber-700',
}

const entityIcons: Record<string, any> = {
  article: FileText,
  category: FolderTree,
  page: FileText,
  setting: Settings,
  api_key: Key,
  job: Activity,
  admin: User,
}

export default function AdminActivity() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/activity?limit=100')
    const data = await res.json()
    if (data.ok) setLogs(data.logs)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter ? logs.filter(l => l.entity === filter || l.action === filter) : logs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          سجل النشاط (Audit Log)
        </h1>
        <p className="text-slate-600 mt-1">تتبع كل إجراء في لوحة التحكم</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
        >
          الكل ({logs.length})
        </button>
        {['create', 'update', 'delete', 'login', 'logout'].map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === a ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
          >
            {a === 'create' ? 'إنشاء' : a === 'update' ? 'تعديل' : a === 'delete' ? 'حذف' : a === 'login' ? 'دخول' : 'خروج'}
            ({logs.filter(l => l.action === a).length})
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد سجلات</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(log => {
                const ActionIcon = actionIcons[log.action] || Activity
                const EntityIcon = entityIcons[log.entity] || FileText
                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-slate-900">{log.adminName || 'نظام'}</span>
                        <Badge className={`text-xs ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                          {log.action === 'create' ? 'أنشأ' : log.action === 'update' ? 'عدّل' : log.action === 'delete' ? 'حذف' : log.action === 'login' ? 'دخل' : log.action === 'logout' ? 'خرج' : log.action}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <EntityIcon className="h-3 w-3" /> {log.entity}
                        </span>
                        {log.entityName && (
                          <span className="text-xs text-slate-700 font-medium">«{log.entityName}»</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span>{new Date(log.createdAt).toLocaleString('ar-EG')}</span>
                        {log.ipAddress && log.ipAddress !== 'unknown' && (
                          <span className="font-mono" dir="ltr">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
