'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bot, Play, Activity, CheckCircle2, XCircle, Clock, Zap, TrendingUp, Loader2, AlertCircle, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

interface Status {
  aiConfigured: boolean
  totalRuns24h: number
  successCount: number
  errorCount: number
  successRate: number
  lastRunAt: string | null
}

interface LogEntry {
  id: string
  stage: string
  status: string
  message: string | null
  details: string | null
  durationMs: number | null
  createdAt: string
}

interface Category {
  id: string
  nameAr: string
  icon: string
  slug: string
}

const stageLabels: Record<string, string> = {
  trend_discovery: '1. اكتشاف الترند',
  source_aggregation: '2. تجميع المصادر',
  ai_rewriter: '3. إعادة الصياغة AI',
  fact_check: '4. فحص الحقائق',
  seo: '5. تحسين SEO',
  publish: '6. النشر',
  distribute: '7. التوزيع',
}

const stageColors: Record<string, string> = {
  trend_discovery: 'bg-blue-100 text-blue-700',
  source_aggregation: 'bg-cyan-100 text-cyan-700',
  ai_rewriter: 'bg-purple-100 text-purple-700',
  fact_check: 'bg-amber-100 text-amber-700',
  seo: 'bg-green-100 text-green-700',
  publish: 'bg-pink-100 text-pink-700',
  distribute: 'bg-slate-100 text-slate-700',
}

export default function AdminAutomation() {
  const [status, setStatus] = useState<Status | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Form
  const [trendsLimit, setTrendsLimit] = useState(3)
  const [autoPublish, setAutoPublish] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [manualTopic, setManualTopic] = useState('')

  const load = async () => {
    setLoading(true)
    const [statusRes, logsRes, catsRes] = await Promise.all([
      fetch('/api/automation/status'),
      fetch('/api/automation/logs?limit=50'),
      fetch('/api/categories'),
    ])
    const [s, l, c] = await Promise.all([statusRes.json(), logsRes.json(), catsRes.json()])
    if (s.ok) setStatus(s.status)
    if (l.ok) setLogs(l.logs)
    if (c.ok) setCategories(c.categories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendsLimit,
          autoPublish,
          categoryId: categoryId || undefined,
          manualTopic: manualTopic || undefined,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(data.message || 'اكتمل الأتمتة')
        setResult(data)
      } else {
        toast.error(data.error || 'فشل الأتمتة')
      }
      load() // Refresh logs
    } catch (e: any) {
      toast.error(e.message)
    }
    setRunning(false)
  }

  if (loading) return <div className="text-center py-12 text-slate-500">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="h-6 w-6" />
          خط الأتمتة
        </h1>
        <p className="text-slate-600 mt-1">تشغيل ومراقبة خط أنابيب الأخبار الآلي (7 مراحل)</p>
      </div>

      {/* AI Configuration Warning */}
      {!status?.aiConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>تنبيه:</strong> لم يتم إعداد ZAI_API_KEY في متغيرات البيئة. سيعمل الأتمتة في الوضع المبسط (Google News RSS فقط) بدون إعادة صياغة AI. أضف <code className="bg-slate-100 px-1 rounded">ZAI_API_KEY</code> في ملف .env لتفعيل الـ AI الكامل.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">آخر 24 ساعة</p>
                <p className="text-2xl font-bold text-slate-900">{status?.totalRuns24h || 0}</p>
                <p className="text-xs text-slate-500">عملية</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">ناجحة</p>
                <p className="text-2xl font-bold text-green-600">{status?.successCount || 0}</p>
                <p className="text-xs text-slate-500">عملية</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">فاشلة</p>
                <p className="text-2xl font-bold text-red-600">{status?.errorCount || 0}</p>
                <p className="text-xs text-slate-500">عملية</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">معدل النجاح</p>
                <p className="text-2xl font-bold text-slate-900">{status?.successRate || 0}%</p>
                <p className="text-xs text-slate-500">من الإجمالي</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            مراحل خط الأتمتة (7 مراحل)
          </CardTitle>
          <CardDescription>من اكتشاف الترند إلى النشر والتوزيع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(stageLabels).map(([key, label], i) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${stageColors[key]}`}>
                  {label}
                </div>
                {i < 6 && <span className="text-slate-300">←</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            تشغيل خط الأتمتة
          </CardTitle>
          <CardDescription>اختر الإعدادات ثم اضغط تشغيل</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عدد الترندات المكتشفة</Label>
              <Input
                type="number"
                value={trendsLimit}
                onChange={e => setTrendsLimit(parseInt(e.target.value) || 3)}
                min={1}
                max={20}
              />
              <p className="text-xs text-slate-500">كم ترند سيتم اكتشافه ومعالجته</p>
            </div>
            <div className="space-y-2">
              <Label>الكاتيجوري (اختياري)</Label>
              <Select value={categoryId || 'auto'} onValueChange={v => setCategoryId(v === 'auto' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="تلقائي (حسب الترند)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">تلقائي (حسب الترند)</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>موضوع يدوي (اختياري - يتخطى اكتشاف الترند)</Label>
            <Input
              value={manualTopic}
              onChange={e => setManualTopic(e.target.value)}
              placeholder="مثال: انتخابات الرئاسة الأمريكية 2026"
            />
            <p className="text-xs text-slate-500">إذا أدخلت موضوعاً، سيتم استخدامه بدلاً من اكتشاف الترند تلقائياً</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Switch
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
              id="autopub"
            />
            <Label htmlFor="autopub" className="cursor-pointer flex-1">
              نشر تلقائي (بدون مراجعة)
            </Label>
            <span className="text-xs text-slate-500">
              {autoPublish ? 'سيتم النشر مباشرة' : 'سيتم الحفظ كمسودة'}
            </span>
          </div>

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">{result.message}</p>
                  {result.errors?.length > 0 && (
                    <p className="text-xs text-amber-700">
                      {result.errors.length} خطأ: {result.errors.slice(0, 2).join('; ')}
                      {result.errors.length > 2 && ` ... +${result.errors.length - 2}`}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleRun}
            disabled={running}
            size="lg"
            className="w-full gap-2"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تشغيل الأتمتة... (قد يستغرق 1-3 دقائق)
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                تشغيل الآن
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            آخر العمليات ({logs.length})
          </CardTitle>
          <CardDescription>سجل آخر 50 عملية من خط الأتمتة</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد عمليات بعد</p>
              <p className="text-xs mt-1">شغل الأتمتة لرؤية السجل هنا</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : log.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${stageColors[log.stage] || 'bg-slate-100 text-slate-700'}`}>
                        {stageLabels[log.stage] || log.stage}
                      </Badge>
                      <span className={`text-xs font-medium ${
                        log.status === 'success' ? 'text-green-600' :
                        log.status === 'error' ? 'text-red-600' :
                        'text-amber-600'
                      }`}>
                        {log.status === 'success' ? 'نجاح' : log.status === 'error' ? 'خطأ' : 'معلق'}
                      </span>
                      {log.durationMs && (
                        <span className="text-xs text-slate-400">{log.durationMs}ms</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    {log.message && (
                      <p className="text-sm text-slate-700 mt-1 break-words">{log.message}</p>
                    )}
                    {log.details && log.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1 font-mono break-all">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
