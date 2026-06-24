'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Rss, Plus, Edit2, Trash2, Power, AlertCircle, TestTube2, Loader2, CheckCircle2, XCircle, Globe, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface RssSource {
  id: string
  name: string
  url: string
  siteName: string | null
  siteUrl: string | null
  language: string
  isActive: boolean
  lastFetchedAt: string | null
  lastFetchStatus: string | null
  lastError: string | null
  articlesCount: number
  fetchInterval: number
  autoPublish: boolean
  aiTone: string
  aiLength: string
  includeImages: boolean
  watermarkImages: boolean
  category: { id: string; nameAr: string; icon: string } | null
  categoryId: string | null
}

interface Category {
  id: string
  nameAr: string
  icon: string
}

const toneLabels: Record<string, string> = {
  professional: 'احترافي (وكالات)',
  casual: 'ودّي عفوي',
  analytical: 'تحليلي معمّق',
  breaking: 'أخبار عاجلة',
  story: 'قصّ صحفي',
}

const toneDescriptions: Record<string, string> = {
  professional: 'أسلوب رويترز وفرانس برس - رسمي ومباشر',
  casual: 'كأنك تخبر صديق - تعبيرات يومية وروح دعابة',
  analytical: 'تحليل الأسباب والتبعات + سياق أوسع',
  breaking: 'جمل قصيرة مكثفة + شعور بالإلحاح',
  story: 'يبدأ بقصة إنسانية ثم يشرح السياق',
}

const lengthLabels: Record<string, string> = {
  short: 'قصير (~250 كلمة)',
  medium: 'متوسط (~500 كلمة)',
  long: 'طويل (~800 كلمة)',
}

export default function AdminRssSources() {
  const [sources, setSources] = useState<RssSource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<RssSource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RssSource | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    const [s, c] = await Promise.all([
      fetch('/api/rss-sources').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    if (s.ok) setSources(s.sources)
    if (c.ok) setCategories(c.categories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (src: RssSource) => {
    const res = await fetch(`/api/rss-sources/${src.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !src.isActive }),
    })
    if (res.ok) {
      toast.success(src.isActive ? 'تم تعطيل المصدر' : 'تم تفعيل المصدر')
      load()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/rss-sources/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم حذف المصدر')
      setDeleteTarget(null)
      load()
    }
  }

  const handleTest = async (src: RssSource) => {
    setTesting(src.id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/rss-sources/${src.id}/test`)
      const data = await res.json()
      setTestResult({ id: src.id, ...data })
      if (data.ok) toast.success(`نجح! ${data.feed.itemsCount} عنصر في الفيد`)
      else toast.error(data.error)
    } catch (e: any) {
      toast.error(e.message)
    }
    setTesting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Rss className="h-6 w-6" />
            مصادر RSS
          </h1>
          <p className="text-slate-600 mt-1">إدارة مصادر RSS لجلب الأخبار + إعادة صياغة AI تلقائياً</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> إضافة مصدر
        </Button>
      </div>

      {/* Info banner */}
      <Alert className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <Zap className="h-4 w-4 text-indigo-600" />
        <AlertDescription className="text-indigo-900">
          <strong>كيف يعمل النظام:</strong> عند إضافة مصدر RSS، يقوم الموقع بـ:
          <span className="block mt-1">1️⃣ جلب آخر الأخبار من الرابط</span>
          <span className="block">2️⃣ إعادة صياغة كل مقال بالـ AI بأسلوب إنساني (5 أنماط) لتجنب كوبي رايت</span>
          <span className="block">3️⃣ تحميل الصور + إضافة اسم موقعك كعلامة مائية</span>
          <span className="block">4️⃣ حفظ المقال (مسودة أو منشور حسب الإعداد)</span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Rss className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد مصادر RSS بعد</p>
              <p className="text-xs mt-1">أضف مصدر RSS لبدء جلب الأخبار تلقائياً</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sources.map(src => (
                <div key={src.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${src.isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Rss className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900">{src.name}</h3>
                        {src.category && (
                          <Badge variant="secondary" className="text-xs">{src.category.icon} {src.category.nameAr}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{src.language.toUpperCase()}</Badge>
                        <Badge variant="outline" className="text-xs">{toneLabels[src.aiTone]}</Badge>
                        <Badge variant="outline" className="text-xs">{lengthLabels[src.aiLength].split(' ')[0]}</Badge>
                        {src.autoPublish && <Badge className="bg-green-100 text-green-700 text-xs">نشر تلقائي</Badge>}
                        {src.isActive ? (
                          <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 ml-1" /> نشط</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 text-xs"><XCircle className="h-3 w-3 ml-1" /> متوقف</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1" dir="ltr">{src.url}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>📰 {src.articlesCount} مقال</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> كل {src.fetchInterval} دقيقة</span>
                        {src.lastFetchedAt && (
                          <>
                            <span>•</span>
                            <span>آخر جلب: {new Date(src.lastFetchedAt).toLocaleString('ar-EG')}</span>
                          </>
                        )}
                        {src.lastFetchStatus === 'error' && (
                          <>
                            <span>•</span>
                            <span className="text-red-500">⚠️ خطأ: {src.lastError?.slice(0, 50)}</span>
                          </>
                        )}
                      </div>

                      {/* Test result */}
                      {testResult?.id === src.id && testResult.ok && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                          <p className="font-semibold text-green-800 mb-1">✓ نجح الفحص!</p>
                          <p>العنوان: {testResult.feed.title}</p>
                          <p>عدد العناصر: {testResult.feed.itemsCount}</p>
                          <p>الزمن: {testResult.durationMs}ms</p>
                          {testResult.sampleItems?.[0] && (
                            <p className="mt-1 text-green-700">عينة: «{testResult.sampleItems[0].title.slice(0, 60)}...»</p>
                          )}
                        </div>
                      )}
                      {testResult?.id === src.id && !testResult.ok && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          ✗ فشل الفحص: {testResult.error}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTest(src)}
                        disabled={testing === src.id}
                        className="h-8 w-8 p-0"
                        title="فحص"
                      >
                        {testing === src.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(src)}
                        className={`h-8 w-8 p-0 ${src.isActive ? 'text-green-600' : 'text-slate-400'}`}
                        title={src.isActive ? 'تعطيل' : 'تفعيل'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditing(src); setEditOpen(true) }}
                        className="h-8 w-8 p-0"
                        title="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(src)}
                        className="h-8 w-8 p-0 text-red-600"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RssSourceEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        source={editing}
        categories={categories}
        onSaved={() => { setEditOpen(false); load() }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>هل تريد حذف مصدر «{deleteTarget?.name}»؟ لن يتم حذف المقالات المنشورة.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Editor =====
function RssSourceEditor({
  open, onOpenChange, source, categories, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  source: RssSource | null
  categories: Category[]
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (source) {
      setForm({
        name: source.name, url: source.url, siteName: source.siteName || '', siteUrl: source.siteUrl || '',
        categoryId: source.categoryId || '', language: source.language, isActive: source.isActive,
        fetchInterval: source.fetchInterval, autoPublish: source.autoPublish,
        aiTone: source.aiTone, aiLength: source.aiLength,
        includeImages: source.includeImages, watermarkImages: source.watermarkImages,
      })
    } else {
      setForm({
        name: '', url: '', siteName: '', siteUrl: '', categoryId: '', language: 'ar',
        isActive: true, fetchInterval: 60, autoPublish: false,
        aiTone: 'professional', aiLength: 'medium', includeImages: true, watermarkImages: true,
      })
    }
    setError('')
  }, [source, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.url) {
      setError('الاسم والـ URL مطلوبان')
      return
    }
    setSaving(true)
    try {
      const url = source ? `/api/rss-sources/${source.id}` : '/api/rss-sources'
      const method = source ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'فشل الحفظ')
        setSaving(false)
        return
      }
      if (data.warning) toast.warning(data.warning)
      toast.success(source ? 'تم تحديث المصدر' : 'تم إضافة المصدر')
      onSaved()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{source ? 'تعديل مصدر RSS' : 'مصدر RSS جديد'}</DialogTitle>
          <DialogDescription>
            {source ? source.name : 'أضف رابط RSS لجلب الأخبار تلقائياً وإعادة صياغتها بالـ AI'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="space-y-2">
            <Label>اسم المصدر *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="CNN - أخبار عالمية" />
          </div>

          <div className="space-y-2">
            <Label>رابط RSS *</Label>
            <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required dir="ltr" placeholder="https://example.com/rss" />
            <p className="text-xs text-slate-500">
              رابط RSS صحيح (RSS 2.0 / Atom). مثال: <code>http://rss.cnn.com/rss/edition_world.rss</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>اسم الموقع الأصلي (اختياري)</Label>
              <Input value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} placeholder="CNN" />
            </div>
            <div className="space-y-2">
              <Label>رابط الموقع (اختياري)</Label>
              <Input value={form.siteUrl} onChange={e => setForm({ ...form, siteUrl: e.target.value })} dir="ltr" placeholder="https://cnn.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الكاتيجوري</Label>
              <Select value={form.categoryId || 'none'} onValueChange={v => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون —</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.nameAr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اللغة</Label>
              <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">عربي</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Settings */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg space-y-3 border border-purple-200">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Zap className="h-4 w-4" /> إعدادات AI لإعادة الصياغة
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>أسلوب الكتابة (Tone)</Label>
                <Select value={form.aiTone} onValueChange={v => setForm({ ...form, aiTone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(toneLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-700">{toneDescriptions[form.aiTone]}</p>
              </div>
              <div className="space-y-2">
                <Label>الطول</Label>
                <Select value={form.aiLength} onValueChange={v => setForm({ ...form, aiLength: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(lengthLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Settings */}
          <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg space-y-3 border border-cyan-200">
            <h4 className="font-semibold text-cyan-900 flex items-center gap-2">
              <Globe className="h-4 w-4" /> إعدادات الصور
            </h4>
            <div className="flex items-center gap-2">
              <Switch checked={form.includeImages} onCheckedChange={v => setForm({ ...form, includeImages: v })} id="inc-img" />
              <Label htmlFor="inc-img">جلب الصور من المقال الأصلي</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.watermarkImages} onCheckedChange={v => setForm({ ...form, watermarkImages: v })} id="wm-img" />
              <Label htmlFor="wm-img">إضافة علامة مائية (اسم موقعك) على كل صورة</Label>
            </div>
          </div>

          {/* Schedule + Publishing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>فترة الجلب (دقائق)</Label>
              <Input type="number" min={5} max={1440} value={form.fetchInterval} onChange={e => setForm({ ...form, fetchInterval: parseInt(e.target.value) || 60 })} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.autoPublish} onCheckedChange={v => setForm({ ...form, autoPublish: v })} id="auto-pub" />
                <Label htmlFor="auto-pub">نشر تلقائي (بدون مراجعة)</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} id="active" />
            <Label htmlFor="active">المصدر نشط (سيتم جلب الأخبار منه)</Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : source ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
