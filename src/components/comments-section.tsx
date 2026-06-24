'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Loader2, CornerDownRight } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: string
  replies?: Comment[]
}

interface Props {
  articleId: string
}

export default function CommentsSection({ articleId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ authorName: '', content: '' })
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyForm, setReplyForm] = useState({ authorName: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/articles/${articleId}/comments`)
    const data = await res.json()
    if (data.ok) {
      setComments(data.comments)
      setCount(data.count)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [articleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.authorName || !form.content) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(data.message)
        setForm({ authorName: '', content: '' })
        if (data.comment.status === 'approved') load()
      } else {
        toast.error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setSubmitting(false)
  }

  const handleReply = async (parentId: string) => {
    if (!replyForm.authorName || !replyForm.content) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...replyForm, parentId }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(data.message)
        setReplyForm({ authorName: '', content: '' })
        setReplyTo(null)
        if (data.comment.status === 'approved') load()
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200" dir="rtl">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        التعليقات ({count})
      </h3>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-6 pb-6 border-b border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            value={form.authorName}
            onChange={e => setForm({ ...form, authorName: e.target.value })}
            placeholder="الاسم"
            required
            maxLength={50}
          />
        </div>
        <Textarea
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          placeholder="اكتب تعليقك..."
          required
          rows={3}
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{form.content.length}/2000 حرف</p>
          <Button type="submit" disabled={submitting} size="sm" className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            نشر التعليق
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">كن أول من يعلق على هذا الخبر</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="space-y-2">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {c.authorName[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-slate-900">{c.authorName}</span>
                  <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString('ar-EG')}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1"
                >
                  <CornerDownRight className="h-3 w-3" /> رد
                </button>
              </div>

              {/* Reply form */}
              {replyTo === c.id && (
                <div className="mr-6 space-y-2 bg-blue-50 p-3 rounded-lg">
                  <Input
                    value={replyForm.authorName}
                    onChange={e => setReplyForm({ ...replyForm, authorName: e.target.value })}
                    placeholder="الاسم"
                    required
                    maxLength={50}
                  />
                  <Input
                    value={replyForm.content}
                    onChange={e => setReplyForm({ ...replyForm, content: e.target.value })}
                    placeholder="ردك..."
                    required
                    maxLength={1000}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(c.id)} disabled={submitting}>
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'رد'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>إلغاء</Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="mr-6 space-y-2">
                  {c.replies.map(r => (
                    <div key={r.id} className="bg-slate-50 rounded-lg p-3 border-r-2 border-slate-300">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {r.authorName[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-slate-900">{r.authorName}</span>
                        <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                      <p className="text-sm text-slate-700">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
