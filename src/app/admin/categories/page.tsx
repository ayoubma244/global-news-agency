'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FolderTree, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Power, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  nameFr: string
  nameEs: string
  icon: string
  description: string | null
  parentId: string | null
  level: number
  order: number
  isActive: boolean
  priority: string
  frequency: string | null
  seoKeywords: string | null
  tags: string | null
  dataSources: string | null
  templateId: string | null
  children?: Category[]
  parent?: { id: string; nameAr: string } | null
}

const priorityColors: Record<string, string> = {
  Breaking: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/categories?all=1')
    const data = await res.json()
    if (data.ok) setCategories(data.categories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const toggleActive = async (cat: Category) => {
    const res = await fetch(`/api/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    })
    if (res.ok) {
      toast.success(cat.isActive ? 'تم تعطيل التصنيف' : 'تم تفعيل التصنيف')
      load()
    } else {
      toast.error('فشل التحديث')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم حذف التصنيف')
      setDeleteTarget(null)
      load()
    } else {
      toast.error('فشل الحذف')
    }
  }

  const openEdit = (cat: Category | null) => {
    setEditing(cat)
    setEditOpen(true)
  }

  // Recursive render
  const renderCategory = (cat: Category, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0
    const isExpanded = expanded.has(cat.id)
    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors"
          style={{ marginRight: `${depth * 24}px` }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-1 hover:bg-slate-200 rounded"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon + name */}
          <span className="text-lg">{cat.icon || '📁'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${cat.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                {cat.nameAr}
              </span>
              <span className="text-xs text-slate-400">({cat.nameEn})</span>
              <Badge className={`text-xs ${priorityColors[cat.priority] || priorityColors.Medium}`} variant="outline">
                {cat.priority}
              </Badge>
              {cat.level > 1 && (
                <Badge variant="secondary" className="text-xs">
                  L{cat.level}
                </Badge>
              )}
            </div>
            {cat.frequency && (
              <p className="text-xs text-slate-500 mt-0.5">تردد النشر: {cat.frequency}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleActive(cat)}
              className={`h-8 w-8 p-0 ${cat.isActive ? 'text-green-600' : 'text-slate-400'}`}
              title={cat.isActive ? 'تعطيل' : 'تفعيل'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openEdit(cat)}
              className="h-8 w-8 p-0"
              title="تعديل"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteTarget(cat)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && cat.children!.map(c => renderCategory(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            إدارة التصنيفات
          </h1>
          <p className="text-slate-600 mt-1">إدارة كاملة للكاتيجوريز والساب كاتيجوريز (3 مستويات)</p>
        </div>
        <Button onClick={() => openEdit(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة تصنيف
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">شجرة التصنيفات ({categories.length} رئيسي)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">جاري التحميل...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderTree className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد تصنيفات بعد</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {categories.map(c => renderCategory(c))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / Create Dialog */}
      <CategoryEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        category={editing}
        allCategories={categories}
        onSaved={() => {
          setEditOpen(false)
          load()
        }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف التصنيف <strong>{deleteTarget?.nameAr}</strong>؟
              <br />
              سيتم حذف جميع الساب كاتيجوريز والمقالات المرتبطة به نهائياً.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Category Editor Component =====
function CategoryEditor({
  open, onOpenChange, category, allCategories, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  category: Category | null
  allCategories: Category[]
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setForm({
        slug: category.slug,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        nameFr: category.nameFr,
        nameEs: category.nameEs,
        icon: category.icon || '',
        description: category.description || '',
        parentId: category.parentId || '',
        order: category.order,
        isActive: category.isActive,
        priority: category.priority,
        frequency: category.frequency || '',
        seoKeywords: category.seoKeywords || '',
        tags: category.tags || '',
        dataSources: category.dataSources || '',
        templateId: category.templateId || '',
      })
    } else {
      setForm({
        slug: '', nameAr: '', nameEn: '', nameFr: '', nameEs: '',
        icon: '📁', description: '', parentId: '', order: 0,
        isActive: true, priority: 'Medium', frequency: '',
        seoKeywords: '', tags: '', dataSources: '', templateId: '',
      })
    }
    setError('')
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'
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
      toast.success(category ? 'تم تحديث التصنيف' : 'تم إنشاء التصنيف')
      onSaved()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  // Get available parent categories (only main and sub, not sub-sub)
  const availableParents = allCategories.flatMap(c => [
    { id: c.id, label: `${c.icon} ${c.nameAr} (L1)`, level: c.level },
    ...(c.children || []).map(sc => ({ id: sc.id, label: `  └ ${sc.icon} ${sc.nameAr} (L2)`, level: sc.level })),
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</DialogTitle>
          <DialogDescription>
            {category ? `تعديل: ${category.nameAr}` : 'أدخل بيانات التصنيف الجديد'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Multilingual names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الاسم (فرنسي)</Label>
              <Input value={form.nameFr} onChange={e => setForm({ ...form, nameFr: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إسباني)</Label>
              <Input value={form.nameEs} onChange={e => setForm({ ...form, nameEs: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Slug (URL) *</Label>
              <Input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
                placeholder="e.g. world-news"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الأيقونة (إيموجي)</Label>
              <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🌍" maxLength={4} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>التصنيف الأب</Label>
              <Select
                value={form.parentId || 'none'}
                onValueChange={v => setForm({ ...form, parentId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="تصنيف رئيسي (بدون أب)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— تصنيف رئيسي (L1) —</SelectItem>
                  {availableParents.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breaking">عاجل (Breaking)</SelectItem>
                  <SelectItem value="High">عالية (High)</SelectItem>
                  <SelectItem value="Medium">متوسطة (Medium)</SelectItem>
                  <SelectItem value="Low">منخفضة (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>تردد النشر</Label>
              <Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder="8/day" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>SEO Keywords (مفصولة بفواصل)</Label>
            <Input value={form.seoKeywords} onChange={e => setForm({ ...form, seoKeywords: e.target.value })} dir="ltr" />
          </div>

          <div className="space-y-2">
            <Label>Tags (مفصولة بفواصل)</Label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} dir="ltr" />
          </div>

          <div className="space-y-2">
            <Label>Data Sources</Label>
            <Input value={form.dataSources} onChange={e => setForm({ ...form, dataSources: e.target.value })} placeholder="NewsAPI, Reuters, AP" dir="ltr" />
          </div>

          <div className="space-y-2">
            <Label>Template ID</Label>
            <Input value={form.templateId} onChange={e => setForm({ ...form, templateId: e.target.value })} placeholder="TPL-WORLD-01" dir="ltr" />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <Label htmlFor="isActive" className="cursor-pointer">التصنيف مفعّل</Label>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={v => setForm({ ...form, isActive: v })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : category ? 'حفظ التعديلات' : 'إنشاء التصنيف'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
