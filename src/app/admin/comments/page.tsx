'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Check, X, AlertTriangle, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  authorName: string
  authorEmail: string | null
  content: string
  status: string
  aiModerationScore: number | null
  aiToxicityScore: number | null
  createdAt: string
  article: { id: string; titleAr: string; slug: string }
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/comments?status=${filter}`)
    const data = await res.json()
    if (data.ok) setComments(data.comments)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(status === 'approved' ? 'تمت الموافقة' : status === 'rejected' ? 'تم الرفض' : 'تم الحذف')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> إدارة التعليقات
        </h1>
        <p className="text-slate-600 mt-1">مراجعة والموافقة على تعليقات القراء</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'pending', label: 'قيد المراجعة', icon: Clock },
          { value: 'approved', label: 'موافق عليها', icon: Check },
          { value: 'rejected', label: 'مرفوضة', icon: X },
          { value: 'all', label: 'الكل', icon: MessageSquare },
        ].map(f => {
          const Icon = f.icon
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3 w-3" /> {f.label}
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد تعليقات</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {comments.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {c.authorName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{c.authorName}</span>
                        {c.authorEmail && <span className="text-xs text-slate-500" dir="ltr">{c.authorEmail}</span>}
                        <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString('ar-EG')}</span>
                        {c.aiToxicityScore != null && (
                          <Badge className={`text-xs ${c.aiToxicityScore > 50 ? 'bg-red-100 text-red-700' : c.aiToxicityScore > 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            <Shield className="h-3 w-3 ml-1" /> toxicity: {Math.round(c.aiToxicityScore)}%
                          </Badge>
                        )}
                        {c.status === 'pending' && <Badge className="bg-amber-100 text-amber-700 text-xs">قيد المراجعة</Badge>}
                        {c.status === 'approved' && <Badge className="bg-green-100 text-green-700 text-xs">موافق</Badge>}
                        {c.status === 'rejected' && <Badge className="bg-red-100 text-red-700 text-xs">مرفوض</Badge>}
                      </div>
                      <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{c.content}</p>
                      <p className="text-xs text-slate-500 mb-2">
                        على مقال: <span className="text-blue-600">{c.article?.titleAr?.slice(0, 60) || 'محذوف'}</span>
                      </p>
                      {c.status !== 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, 'approved')} className="text-green-600 mr-2 h-7 gap-1">
                          <Check className="h-3 w-3" /> موافقة
                        </Button>
                      )}
                      {c.status !== 'rejected' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, 'rejected')} className="text-red-600 h-7 gap-1">
                          <X className="h-3 w-3" /> رفض
                        </Button>
                      )}
                    </div>
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
