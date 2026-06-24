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
import { Megaphone, Plus, Edit2, Trash2, AlertCircle, Eye, MousePointerClick } from 'lucide-react'
import { toast } from 'sonner'

interface Ad {
  id: string
  name: string
  position: string
  type: string
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  isActive: boolean
  impressions: number
  clicks: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

const positions = [
  { value: 'header', label: 'أعلى الصفحة (Header)' },
  { value: 'sidebar', label: 'الشريط الجانبي (Sidebar)' },
  { value: 'in-article', label: 'داخل المقال (In-Article)' },
  { value: 'between-articles', label: 'بين المقالات' },
  { value: 'footer', label: 'أسفل الصفحة (Footer)' },
]

const types = [
  { value: 'banner', label: 'بانر' },
  { value: 'native', label: 'إعلان أصلي' },
  { value: 'sponsored', label: 'محتوى مدعوم' },
  { value: 'adsense', label: 'Google AdSense' },
]

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/ads?admin=1')
    const data = await res.json()
    if (data.ok) setAds(data.ads)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (ad: Ad | null) => {
    setEditing(ad)
    if (ad) {
      setForm({
        name: ad.name, position: ad.position, type: ad.type,
        content: ad.content || '', imageUrl: ad.imageUrl || '', linkUrl: ad.linkUrl || '',
        isActive: ad.isActive, startDate: ad.startDate?.slice(0, 10) || '', endDate: ad.endDate?.slice(0, 10) || '',
      })
    } else {
      setForm({
        name: '', position: 'header', type: 'banner',
        content: '', imageUrl: '', linkUrl: '',
        isActive: true, startDate: '', endDate: '',
      })
    }
    setEditOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editing ? `/api/ads/${editing.id}` : '/api/ads'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.ok) {
      toast.success(editing ? 'تم التحديث' : 'تم الإنشاء')
      setEditOpen(false)
      load()
    } else {
      toast.error(data.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await fetch(`/api/ads/${deleteTarget.id}`, { method: 'DELETE' })
    toast.success('تم الحذف')
    setDeleteTarget(null)
    load()
  }

  const toggleActive = async (ad: Ad) => {
    await fetch(`/api/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ad.isActive }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6" /> إدارة الإعلانات
          </h1>
          <p className="text-slate-600 mt-1">إدارة مساحات الإعلان في الموقع</p>
        </div>
        <Button onClick={() => openEdit(null)} className="gap-2">
          <Plus className="h-4 w-4" /> إعلان جديد
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد إعلانات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ads.map(ad => (
                <div key={ad.id} className="p-4 hover:bg-slate-50 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ad.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">{ad.name}</h3>
                      <Badge variant="outline" className="text-xs">{positions.find(p => p.value === ad.position)?.label || ad.position}</Badge>
                      <Badge variant="outline" className="text-xs">{types.find(t => t.value === ad.type)?.label || ad.type}</Badge>
                      {ad.isActive ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">نشط</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 text-xs">متوقف</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {ad.impressions.toLocaleString()} ظهور</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {ad.clicks.toLocaleString()} نقرة</span>
                      {ad.impressions > 0 && (
                        <span>CTR: {((ad.clicks / ad.impressions) * 100).toFixed(2)}%</span>
                      )}
                    </div>
                    {ad.imageUrl && (
                      <img src={ad.imageUrl} alt={ad.name} className="mt-2 max-h-20 rounded border border-slate-200" />
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(ad)} className={`h-8 w-8 p-0 ${ad.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                      <Megaphone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(ad)} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(ad)} className="h-8 w-8 p-0 text-red-600">
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل إعلان' : 'إعلان جديد'}</DialogTitle>
            <DialogDescription>{editing ? editing.name : 'أنشئ مساحة إعلانية جديدة'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="بانر الصفحة الرئيسية" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {positions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة الإعلان (URL)</Label>
              <Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} dir="ltr" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>رابط الإعلان (عند الضغط)</Label>
              <Input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} dir="ltr" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>كود HTML/JS مخصص (للـ AdSense)</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} dir="ltr" placeholder="<ins class='adsbygoogle'...>" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} id="ad-active" />
              <Label htmlFor="ad-active">الإعلان نشط</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
              <Button type="submit">{editing ? 'حفظ' : 'إنشاء'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>هل تريد حذف إعلان «{deleteTarget?.name}»؟</DialogDescription>
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
