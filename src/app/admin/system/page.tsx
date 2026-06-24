'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Database, Zap, Mail, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Server, Cpu, HardDrive } from 'lucide-react'
import { toast } from 'sonner'

interface HealthData {
  ok: boolean
  overall: 'ok' | 'warning' | 'error'
  timestamp: string
  uptime: number
  memory: { rss: number; heapUsed: number; heapTotal: number; external: number }
  checks: Record<string, { status: 'ok' | 'warning' | 'error' | 'info'; message: string; details?: any }>
}

const statusColors = {
  ok: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

const statusIcons = {
  ok: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  info: Activity,
}

const checkIcons: Record<string, any> = {
  database: Database,
  redis: HardDrive,
  ai: Zap,
  email: Mail,
  indexNow: Search,
  realtime: Server,
  pipelines: Activity,
  content: Database,
  rssSources: Server,
  subscribers: Mail,
}

export default function AdminSystem() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/system/health')
      const data = await res.json()
      if (data.ok) setHealth(data)
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const pingSitemap = async () => {
    try {
      const res = await fetch('/api/sitemap/ping')
      const data = await res.json()
      if (data.ok) toast.success(data.message)
      else toast.error(data.message)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading || !health) {
    return <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
  }

  const uptimeHours = Math.floor(health.uptime / 3600)
  const uptimeMin = Math.floor((health.uptime % 3600) / 60)
  const memMB = Math.round(health.memory.rss / 1024 / 1024)
  const heapUsed = Math.round(health.memory.heapUsed / 1024 / 1024)
  const heapTotal = Math.round(health.memory.heapTotal / 1024 / 1024)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            صحة النظام
          </h1>
          <p className="text-slate-600 mt-1">مراقبة شاملة لكل خدمات الموقع</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={pingSitemap} variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" /> إعلام Google/Bing
          </Button>
          <Button onClick={load} disabled={refreshing} size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> تحديث
          </Button>
        </div>
      </div>

      {/* Overall status */}
      <Card className={health.overall === 'ok' ? 'border-green-200 bg-green-50' : health.overall === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {health.overall === 'ok' && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            {health.overall === 'warning' && <AlertCircle className="h-8 w-8 text-amber-600" />}
            {health.overall === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
            <div>
              <h2 className="text-xl font-bold">
                {health.overall === 'ok' ? 'النظام يعمل بشكل ممتاز' : health.overall === 'warning' ? 'توجد تحذيرات' : 'توجد أخطاء!'}
              </h2>
              <p className="text-sm text-slate-600">آخر فحص: {new Date(health.timestamp).toLocaleString('ar-EG')}</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <Cpu className="h-5 w-5 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">الذاكرة</p>
              <p className="font-bold">{memMB} MB</p>
            </div>
            <div className="text-center">
              <Activity className="h-5 w-5 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">التشغيل</p>
              <p className="font-bold">{uptimeHours}س {uptimeMin}د</p>
            </div>
            <div className="text-center">
              <HardDrive className="h-5 w-5 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">Heap</p>
              <p className="font-bold">{heapUsed}/{heapTotal} MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(health.checks).map(([key, check]) => {
          const Icon = checkIcons[key] || Activity
          const StatusIcon = statusIcons[check.status]
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${statusColors[check.status]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-slate-900 capitalize">{key}</span>
                  </div>
                  <StatusIcon className={`h-5 w-5 ${
                    check.status === 'ok' ? 'text-green-500' :
                    check.status === 'warning' ? 'text-amber-500' :
                    check.status === 'error' ? 'text-red-500' : 'text-blue-500'
                  }`} />
                </div>
                <p className="text-sm text-slate-600">{check.message}</p>
                {check.details && (
                  <div className="mt-2 text-xs text-slate-400">
                    {Object.entries(check.details).map(([k, v]) => (
                      <span key={k} className="ml-3">{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
