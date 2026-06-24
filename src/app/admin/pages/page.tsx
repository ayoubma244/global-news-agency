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
import { FilePlus, Plus, Edit2, Trash2, Eye, AlertCircle, Globe } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Page {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  template: string
  isPublished: boolean
  showInMenu: boolean
  order: number
  createdAt: string
}

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Page | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/pages')
    const data = await res.json()
    if (data.ok) setPages(data.pages)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/pages/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم حذف الصفحة')
      setDeleteTarget(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FilePlus className="h-6 w-6" /> الصفحات
          </h1>
          <p className="text-slate-600 mt-1">إدارة صفحات الموقع (من نحن، اتصل بنا، خصوصية...)</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> صفحة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FilePlus className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد صفحات</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pages.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{p.titleAr}</span>
                      {p.showInMenu && <Badge variant="secondary" className="text-xs">في القائمة</Badge>}
                      <Badge variant="outline" className="text-xs">{p.template}</Badge>
                    </div>
                    <p className="text-xs text-slate-500" dir="ltr">/{p.slug}</p>
                  </div>
                  <Badge className={p.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                    {p.isPublished ? 'منشورة' : 'مسودة'}
                  </Badge>
                  <div className="flex gap-1">
                    <Link href={`/${p.slug}`} target="_blank">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setEditOpen(true) }} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PageEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        page={editing}
        onSaved={() => { setEditOpen(false); load() }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>هل تريد حذف الصفحة &quot;{deleteTarget?.titleAr}&quot;؟</DialogDescription>
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

function PageEditor({
  open, onOpenChange, page, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  page: Page | null
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (page) {
      // Load full page
      fetch(`/api/pages/${page.id}`).then(r => r.json()).then(d => {
        if (d.ok) {
          const p = d.page
          setForm({
            slug: p.slug, titleAr: p.titleAr, titleEn: p.titleEn || '',
            contentAr: p.contentAr, contentEn: p.contentEn || '',
            template: p.template, isPublished: p.isPublished, showInMenu: p.showInMenu,
            order: p.order, seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '',
          })
        }
      })
    } else {
      setForm({
        slug: '', titleAr: '', titleEn: '', contentAr: '', contentEn: '',
        template: 'default', isPublished: true, showInMenu: false, order: 0,
        seoTitle: '', seoDescription: '',
      })
    }
    setError('')
  }, [page, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug || !form.titleAr || !form.contentAr) {
      setError('الـ slug والعنوان والمحتوى مطلوبون')
      return
    }
    setSaving(true)
    try {
      const url = page ? `/api/pages/${page.id}` : '/api/pages'
      const method = page ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!data.ok) { setError(data.error); setSaving(false); return }
      toast.success(page ? 'تم تحديث الصفحة' : 'تم إنشاء الصفحة')
      onSaved()
    } catch (e: any) {
      setError(e.message); setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? 'تعديل الصفحة' : 'صفحة جديدة'}</DialogTitle>
          <DialogDescription>{page ? page.titleAr : 'أنشئ صفحة جديدة للموقع'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الـ Slug (URL) *</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required dir="ltr" placeholder="about" />
            </div>
            <div className="space-y-2">
              <Label>القالب</Label>
              <Select value={form.template} onValueChange={v => setForm({ ...form, template: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">افتراضي</SelectItem>
                  <SelectItem value="about">من نحن</SelectItem>
                  <SelectItem value="contact">اتصل بنا</SelectItem>
                  <SelectItem value="privacy">خصوصية</SelectItem>
                  <SelectItem value="terms">شروط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>العنوان (عربي) *</Label>
              <Input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>العنوان (إنجليزي)</Label>
              <Input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المحتوى (عربي) *</Label>
            <Textarea value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value })} rows={8} required />
          </div>

          <div className="space-y-2">
            <Label>المحتوى (إنجليزي)</Label>
            <Textarea value={form.contentEn} onChange={e => setForm({ ...form, contentEn: e.target.value })} rows={6} dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Input value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} dir="ltr" />
            </div>
          </div>

          <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={v => setForm({ ...form, isPublished: v })} id="pub" />
              <Label htmlFor="pub">منشورة</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.showInMenu} onCheckedChange={v => setForm({ ...form, showInMenu: v })} id="menu" />
              <Label htmlFor="menu">إظهار في القائمة</Label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Label>الترتيب:</Label>
              <Input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="w-20" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : page ? 'حفظ' : 'إنشاء'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
