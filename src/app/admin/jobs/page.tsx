'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Plus, Play, CheckCircle2, XCircle, Calendar, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Job {
  id: string
  name: string
  type: string
  cron: string
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  lastStatus: string | null
  lastError: string | null
  runCount: number
  config: string | null
  createdAt: string
}

const jobTypes: Record<string, { label: string; description: string; color: string }> = {
  automation_run: { label: 'تشغيل الأتمتة', description: 'سحب الأخبار + AI + نشر', color: 'bg-indigo-100 text-indigo-700' },
  newsletter_send: { label: 'إرسال النشرة', description: 'إرسال نشرة بريدية للمشتركين', color: 'bg-purple-100 text-purple-700' },
  sitemap_ping: { label: 'تحديث Sitemap', description: 'إعلام Google بتحديث الـ sitemap', color: 'bg-cyan-100 text-cyan-700' },
  cleanup: { label: 'تنظيف', description: 'حذف السجلات القديمة', color: 'bg-slate-100 text-slate-700' },
}

const cronPresets = [
  { label: 'كل ساعة', value: '0 * * * *' },
  { label: 'كل 6 ساعات', value: '0 */6 * * *' },
  { label: 'كل 12 ساعة', value: '0 */12 * * *' },
  { label: 'يومياً منتصف الليل', value: '0 0 * * *' },
  { label: 'يومياً 6 صباحاً', value: '0 6 * * *' },
  { label: 'كل يوم اثنين', value: '0 0 * * 1' },
]

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'automation_run', cron: '0 * * * *', trendsLimit: 3, autoPublish: false })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/jobs')
    const data = await res.json()
    if (data.ok) setJobs(data.jobs)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (job: Job) => {
    // For now, just update via creating replacement or use a new PUT endpoint
    toast.info('استخدم زر التشغيل اليدوي')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        cron: form.cron,
        isActive: true,
        config: form.type === 'automation_run' ? { trendsLimit: form.trendsLimit, autoPublish: form.autoPublish } : null,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      toast.success('تم إنشاء المهمة')
      setAddOpen(false)
      setForm({ name: '', type: 'automation_run', cron: '0 * * * *', trendsLimit: 3, autoPublish: false })
      load()
    } else {
      toast.error(data.error)
    }
  }

  const runNow = async (job: Job) => {
    if (job.type === 'automation_run') {
      const config = job.config ? JSON.parse(job.config) : {}
      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendsLimit: config.trendsLimit || 3, autoPublish: config.autoPublish || false }),
      })
      const data = await res.json()
      if (data.ok) toast.success(data.message)
      else toast.error(data.error)
      load()
    } else {
      toast.info('التشغيل اليدوي لهذا النوع غير متاح بعد')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            المهام المجدولة
          </h1>
          <p className="text-slate-600 mt-1">جدولة الأتمتة والنشرة البريدية والمهام الدورية</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> مهمة جديدة
        </Button>
      </div>

      {/* Setup instructions */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">كيف تعمل الجدولة؟</p>
              <p className="mb-2">هذه المهام تحتاج إلى cron job خارجي يستدعي الـ API. أضف هذا الـ cron في خادمك:</p>
              <code className="block bg-amber-100 px-3 py-2 rounded text-xs mb-2" dir="ltr">
                0 * * * * curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/cron/automation
              </code>
              <p>أو استخدم Vercel Cron / GitHub Actions / cron-job.org</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد مهام مجدولة بعد</p>
              <p className="text-xs mt-1">أنشئ مهمة جديدة لتبدأ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map(job => {
                const typeInfo = jobTypes[job.type] || { label: job.type, description: '', color: 'bg-slate-100' }
                const config = job.config ? JSON.parse(job.config) : {}
                return (
                  <div key={job.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-900">{job.name}</h3>
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          {job.isActive ? (
                            <Badge className="bg-green-100 text-green-700">نشط</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600">متوقف</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{typeInfo.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="font-mono" dir="ltr">{job.cron}</span>
                          <span>•</span>
                          <span>تشغيلات: {job.runCount}</span>
                          {job.lastRunAt && (
                            <>
                              <span>•</span>
                              <span>آخر: {new Date(job.lastRunAt).toLocaleString('ar-EG')}</span>
                            </>
                          )}
                          {job.lastStatus && (
                            <>
                              <span>•</span>
                              <span className={`flex items-center gap-1 ${job.lastStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {job.lastStatus === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {job.lastStatus === 'success' ? 'ناجح' : 'فشل'}
                              </span>
                            </>
                          )}
                        </div>
                        {job.lastError && (
                          <p className="text-xs text-red-500 mt-1 break-words">{job.lastError}</p>
                        )}
                        {config.trendsLimit && (
                          <p className="text-xs text-slate-600 mt-1">
                            الإعدادات: {config.trendsLimit} ترند/تشغيل {config.autoPublish && '• نشر تلقائي'}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => runNow(job)} className="gap-1 flex-shrink-0">
                        <Play className="h-3 w-3" /> تشغيل الآن
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add job dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مهمة مجدولة جديدة</DialogTitle>
            <DialogDescription>أنشئ مهمة تعمل تلقائياً حسب الجدول</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المهمة *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="سحب الأخبار كل ساعة" />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {Object.entries(jobTypes).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} - {v.description}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>الجدولة (Cron)</Label>
              <div className="grid grid-cols-2 gap-2">
                {cronPresets.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, cron: p.value })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors text-right ${
                      form.cron === p.value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Input value={form.cron} onChange={e => setForm({ ...form, cron: e.target.value })} dir="ltr" className="mt-2 font-mono" />
            </div>
            {form.type === 'automation_run' && (
              <>
                <div className="space-y-2">
                  <Label>عدد الترندات لكل تشغيل</Label>
                  <Input type="number" min={1} max={20} value={form.trendsLimit} onChange={e => setForm({ ...form, trendsLimit: parseInt(e.target.value) || 3 })} />
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Switch checked={form.autoPublish} onCheckedChange={v => setForm({ ...form, autoPublish: v })} id="autopub" />
                  <Label htmlFor="autopub">نشر تلقائي (بدون مراجعة)</Label>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
              <Button type="submit">إنشاء المهمة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
