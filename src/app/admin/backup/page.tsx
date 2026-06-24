'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, FileJson, Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Backup {
  filename: string
  size: number
  createdAt: string
}

export default function AdminBackup() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/backup/list')
    const data = await res.json()
    if (data.ok) setBackups(data.backups)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createBackup = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/backup/export', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`تم إنشاء نسخة احتياطية (${data.sizeKB} KB)`)
        load()
      } else {
        toast.error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setCreating(false)
  }

  const downloadBackup = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/backup/export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('تم تحميل النسخة الاحتياطية')
    } catch (e: any) {
      toast.error(e.message)
    }
    setDownloading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-6 w-6" />
          النسخ الاحتياطي
        </h1>
        <p className="text-slate-600 mt-1">تصدير واستيراد قاعدة البيانات</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              تصدير
            </CardTitle>
            <CardDescription>إنشاء وتحميل نسخة احتياطية كاملة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={createBackup} disabled={creating} className="w-full gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {creating ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
            </Button>
            <Button onClick={downloadBackup} disabled={downloading} variant="outline" className="w-full gap-2">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? 'جاري التحميل...' : 'تحميل JSON'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              استيراد
            </CardTitle>
            <CardDescription>استعادة من ملف JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  try {
                    const data = JSON.parse(text)
                    // In production: call import API
                    toast.info('استيراد البيانات قيد التطوير - استخدم CLI')
                    console.log('Import data:', data.stats)
                  } catch (e) {
                    toast.error('ملف غير صالح')
                  }
                }}
                className="hidden"
              />
              <span className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <Upload className="h-4 w-4 inline ml-2" />
                اختر ملف JSON
              </span>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Backups list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">النسخ المحفوظة ({backups.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileJson className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد نسخ محفوظة</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {backups.map(b => (
                <div key={b.filename} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <FileJson className="h-5 w-5 text-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate" dir="ltr">{b.filename}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleString('ar-EG')} • {Math.round(b.size / 1024)} KB
                    </p>
                  </div>
                  <Badge variant="outline">JSON</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <AlertCircle className="h-4 w-4 inline ml-2" />
        <strong>معلومة:</strong> النسخ الاحتياطي يشمل: المقالات، الكاتيجوريز، الصفحات، الإعدادات، الوسوم، المشتركين.
        لا يشمل: كلمات المرور، API Keys (للأمان).
      </div>
    </div>
  )
}
