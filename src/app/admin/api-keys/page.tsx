'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Key, Plus, Edit2, Trash2, Power, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  provider: string
  apiKey: string
  apiSecret: string | null
  endpoint: string | null
  isActive: boolean
  dailyLimit: number | null
  usedToday: number
  lastUsedAt: string | null
  notes: string | null
  createdAt: string
}

const PROVIDERS = [
  { value: 'newsapi', label: 'NewsAPI' },
  { value: 'google_trends', label: 'Google Trends' },
  { value: 'twitter', label: 'Twitter/X API' },
  { value: 'reddit', label: 'Reddit API' },
  { value: 'openweather', label: 'OpenWeather' },
  { value: 'coingecko', label: 'CoinGecko' },
  { value: 'alpha_vantage', label: 'Alpha Vantage' },
  { value: 'youtube', label: 'YouTube API' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'z_ai', label: 'Z.ai (GLM)' },
  { value: 'google_translate', label: 'Google Translate' },
  { value: 'deepl', label: 'DeepL' },
  { value: 'reuters', label: 'Reuters API' },
  { value: 'ap_news', label: 'AP News' },
  { value: 'rss', label: 'RSS Feed' },
  { value: 'other', label: 'أخرى' },
]

const providerColors: Record<string, string> = {
  newsapi: 'bg-green-100 text-green-700',
  google_trends: 'bg-blue-100 text-blue-700',
  twitter: 'bg-slate-100 text-slate-700',
  openweather: 'bg-cyan-100 text-cyan-700',
  coingecko: 'bg-amber-100 text-amber-700',
  openai: 'bg-purple-100 text-purple-700',
  anthropic: 'bg-orange-100 text-orange-700',
  z_ai: 'bg-red-100 text-red-700',
}

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/api-keys')
    const data = await res.json()
    if (data.ok) setKeys(data.apiKeys)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (k: ApiKey) => {
    const res = await fetch(`/api/api-keys/${k.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !k.isActive }),
    })
    if (res.ok) {
      toast.success(k.isActive ? 'تم تعطيل المفتاح' : 'تم تفعيل المفتاح')
      load()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/api-keys/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم حذف المفتاح')
      setDeleteTarget(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Key className="h-6 w-6" /> مفاتيح API
          </h1>
          <p className="text-slate-600 mt-1">إدارة مفاتيح API لمصادر الأخبار والـ AI والأتمتة</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> مفتاح جديد
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Key className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد مفاتيح API بعد</p>
              <p className="text-xs mt-2">أضف مفاتيح NewsAPI و OpenWeather و Google Trends لبدء الأتمتة</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-slate-900">{k.name}</span>
                      <Badge className={`text-xs ${providerColors[k.provider] || 'bg-slate-100 text-slate-700'}`}>
                        {PROVIDERS.find(p => p.value === k.provider)?.label || k.provider}
                      </Badge>
                      {k.isActive ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle2 className="h-3 w-3 ml-1" /> نشط
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <XCircle className="h-3 w-3 ml-1" /> معطل
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1" dir="ltr">
                      <code className="bg-slate-100 px-2 py-0.5 rounded">{k.apiKey}</code>
                      {k.endpoint && <span>→ {k.endpoint}</span>}
                      {k.dailyLimit && (
                        <span>الحد اليومي: {k.dailyLimit.toLocaleString()} | استخدم: {k.usedToday}</span>
                      )}
                    </div>
                    {k.notes && <p className="text-xs text-slate-500 mt-1">{k.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(k)} className={`h-8 w-8 p-0 ${k.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(k); setEditOpen(true) }} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(k)} className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <ApiKeyEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        apiKey={editing}
        onSaved={() => { setEditOpen(false); load() }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>هل تريد حذف مفتاح &quot;{deleteTarget?.name}&quot; نهائياً؟</DialogDescription>
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

function ApiKeyEditor({
  open, onOpenChange, apiKey, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  apiKey: ApiKey | null
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (apiKey) {
      setForm({
        name: apiKey.name, provider: apiKey.provider,
        apiKey: '', apiSecret: '', endpoint: apiKey.endpoint || '',
        isActive: apiKey.isActive, dailyLimit: apiKey.dailyLimit || '',
        notes: apiKey.notes || '',
      })
    } else {
      setForm({
        name: '', provider: 'newsapi', apiKey: '', apiSecret: '',
        endpoint: '', isActive: true, dailyLimit: '', notes: '',
      })
    }
    setError('')
  }, [apiKey, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.provider || (!apiKey && !form.apiKey)) {
      setError('الاسم والمزود والمفتاح مطلوبون')
      return
    }
    setSaving(true)
    try {
      const url = apiKey ? `/api/api-keys/${apiKey.id}` : '/api/api-keys'
      const method = apiKey ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!data.ok) { setError(data.error); setSaving(false); return }
      toast.success(apiKey ? 'تم تحديث المفتاح' : 'تم إضافة المفتاح')
      onSaved()
    } catch (e: any) {
      setError(e.message); setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{apiKey ? 'تعديل المفتاح' : 'مفتاح API جديد'}</DialogTitle>
          <DialogDescription>
            {apiKey ? 'اترك حقول API Key فارغة لعدم التغيير' : 'أدخل بيانات المفتاح الجديد'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="NewsAPI - Free tier" />
            </div>
            <div className="space-y-2">
              <Label>المزود *</Label>
              <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API Key {apiKey ? '(اتركه فارغ لعدم التغيير)' : '*'}</Label>
            <Input
              type="password"
              value={form.apiKey}
              onChange={e => setForm({ ...form, apiKey: e.target.value })}
              placeholder="••••••••••••••••"
              dir="ltr"
              required={!apiKey}
            />
          </div>

          <div className="space-y-2">
            <Label>API Secret (اختياري)</Label>
            <Input
              type="password"
              value={form.apiSecret}
              onChange={e => setForm({ ...form, apiSecret: e.target.value })}
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input value={form.endpoint} onChange={e => setForm({ ...form, endpoint: e.target.value })} dir="ltr" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>الحد اليومي (طلبات)</Label>
              <Input type="number" value={form.dailyLimit} onChange={e => setForm({ ...form, dailyLimit: e.target.value })} placeholder="1000" dir="ltr" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} id="active" />
            <Label htmlFor="active">المفتاح نشط</Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : apiKey ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
