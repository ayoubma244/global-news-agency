'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Edit2, Trash2, Eye, Search, AlertCircle, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  status: string
  isBreaking: boolean
  isFeatured: boolean
  views: number
  createdAt: string
  publishedAt: string | null
  category: { id: string; nameAr: string; icon: string }
  aiToneUsed?: string | null
  aiModel?: string | null
  plagiarismScore?: number | null
  humanScore?: number | null
  rssSource?: { name: string } | null
}

interface Category {
  id: string
  nameAr: string
  icon: string
  children?: Category[]
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    params.set('limit', '100')
    const res = await fetch(`/api/articles?${params}`)
    const data = await res.json()
    if (data.ok) setArticles(data.articles)
    setLoading(false)
  }

  const loadCategories = async () => {
    const res = await fetch('/api/categories?all=1')
    const data = await res.json()
    if (data.ok) setCategories(data.categories)
  }

  useEffect(() => {
    load()
    loadCategories()
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/articles/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم حذف المقال')
      setDeleteTarget(null)
      load()
    }
  }

  const toggleStatus = async (article: Article, newStatus: string) => {
    const res = await fetch(`/api/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast.success(newStatus === 'published' ? 'تم نشر المقال' : 'تم الحفظ كمسودة')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            المقالات
          </h1>
          <p className="text-slate-600 mt-1">إدارة جميع المقالات ({articles.length})</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          مقال جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المقالات..."
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
            <SelectItem value="archived">مؤرشف</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد مقالات</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {articles.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{a.category?.icon}</span>
                      <span className="text-xs text-slate-500">{a.category?.nameAr}</span>
                      {a.isBreaking && <Badge variant="destructive" className="text-xs">عاجل</Badge>}
                      {a.isFeatured && <Badge className="text-xs bg-yellow-100 text-yellow-700">مميز</Badge>}
                    </div>
                    <p className="font-medium text-slate-900 truncate">{a.titleAr}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                      <span>•</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <Badge className={
                    a.status === 'published' ? 'bg-green-100 text-green-700' :
                    a.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                    'bg-yellow-100 text-yellow-700'
                  }>
                    {a.status === 'published' ? 'منشور' : a.status === 'draft' ? 'مسودة' : a.status}
                  </Badge>
                  {a.aiModel && a.aiModel !== 'fallback' && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs gap-1" title={`AI: ${a.aiModel} | Tone: ${a.aiToneUsed}`}>
                      <Sparkles className="h-3 w-3" /> AI
                      {a.humanScore != null && (
                        <span className="ml-1 text-green-600">{Math.round(a.humanScore)}%</span>
                      )}
                    </Badge>
                  )}
                  {a.rssSource && (
                    <Badge variant="outline" className="text-xs gap-1" title={`مصدر: ${a.rssSource.name}`}>
                      <Zap className="h-3 w-3" /> {a.rssSource.name}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    {a.status === 'draft' && (
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(a, 'published')} className="text-green-600">
                        نشر
                      </Button>
                    )}
                    {a.status === 'published' && (
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(a, 'draft')}>
                        إلغاء النشر
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditing(a); setEditOpen(true) }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(a)}
                      className="h-8 w-8 p-0 text-red-600"
                    >
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
      <ArticleEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        article={editing}
        categories={categories}
        onSaved={() => { setEditOpen(false); load() }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل تريد حذف المقال &quot;{deleteTarget?.titleAr}&quot; نهائياً؟
            </DialogDescription>
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

// ===== Article Editor =====
function ArticleEditor({
  open, onOpenChange, article, categories, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  article: Article | null
  categories: Category[]
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (article) {
      // Load full article
      fetch(`/api/articles/${article.id}`).then(r => r.json()).then(d => {
        if (d.ok) {
          const a = d.article
          setForm({
            titleAr: a.titleAr, titleEn: a.titleEn || '', leadAr: a.leadAr || '', leadEn: a.leadEn || '',
            bodyAr: a.bodyAr, bodyEn: a.bodyEn || '', excerpt: a.excerpt || '',
            featuredImg: a.featuredImg || '', categoryId: a.categoryId,
            sourceUrl: a.sourceUrl || '', sourceName: a.sourceName || '',
            author: a.author || '', status: a.status, isBreaking: a.isBreaking, isFeatured: a.isFeatured,
            seoTitle: a.seoTitle || '', seoDescription: a.seoDescription || '', seoKeywords: a.seoKeywords || '',
          })
        }
      })
    } else {
      setForm({
        titleAr: '', titleEn: '', leadAr: '', leadEn: '', bodyAr: '', bodyEn: '',
        excerpt: '', featuredImg: '', categoryId: '', sourceUrl: '', sourceName: '',
        author: '', status: 'draft', isBreaking: false, isFeatured: false,
        seoTitle: '', seoDescription: '', seoKeywords: '',
      })
    }
    setError('')
  }, [article, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titleAr || !form.bodyAr || !form.categoryId) {
      setError('العنوان والمحتوى والكاتيجوري مطلوبون')
      return
    }
    setSaving(true)
    try {
      const url = article ? `/api/articles/${article.id}` : '/api/articles'
      const method = article ? 'PUT' : 'POST'
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
      toast.success(article ? 'تم تحديث المقال' : 'تم إنشاء المقال')
      onSaved()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  // Flatten categories with hierarchy display
  const flatCats: { id: string; label: string }[] = []
  for (const c of categories) {
    flatCats.push({ id: c.id, label: `${c.icon} ${c.nameAr}` })
    for (const sc of c.children || []) {
      flatCats.push({ id: sc.id, label: `  └ ${sc.icon} ${sc.nameAr}` })
      for (const ssc of sc.children || []) {
        flatCats.push({ id: ssc.id, label: `    └ ${ssc.icon} ${ssc.nameAr}` })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? 'تعديل المقال' : 'مقال جديد'}</DialogTitle>
          <DialogDescription>{article ? article.titleAr : 'أدخل بيانات المقال الجديد'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Lead (مقدمة عربي)</Label>
              <Textarea value={form.leadAr} onChange={e => setForm({ ...form, leadAr: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Lead (EN)</Label>
              <Textarea value={form.leadEn} onChange={e => setForm({ ...form, leadEn: e.target.value })} rows={2} dir="ltr" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المحتوى (عربي) *</Label>
            <Textarea value={form.bodyAr} onChange={e => setForm({ ...form, bodyAr: e.target.value })} rows={8} required />
          </div>

          <div className="space-y-2">
            <Label>المحتوى (إنجليزي)</Label>
            <Textarea value={form.bodyEn} onChange={e => setForm({ ...form, bodyEn: e.target.value })} rows={8} dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الكاتيجوري *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {flatCats.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>المصدر (URL)</Label>
              <Input value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>اسم المصدر</Label>
              <Input value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الكاتب</Label>
              <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الصورة الرئيسية (URL)</Label>
            <Input value={form.featuredImg} onChange={e => setForm({ ...form, featuredImg: e.target.value })} dir="ltr" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Input value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <Input value={form.seoKeywords} onChange={e => setForm({ ...form, seoKeywords: e.target.value })} dir="ltr" />
            </div>
          </div>

          <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch checked={form.isBreaking} onCheckedChange={v => setForm({ ...form, isBreaking: v })} id="breaking" />
              <Label htmlFor="breaking">خبر عاجل</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={v => setForm({ ...form, isFeatured: v })} id="featured" />
              <Label htmlFor="featured">مقال مميز</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : article ? 'حفظ التعديلات' : 'إنشاء المقال'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
