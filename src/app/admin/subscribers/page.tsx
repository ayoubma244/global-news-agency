'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Subscriber {
  id: string
  email: string
  name: string | null
  isVerified: boolean
  isActive: boolean
  language: string
  subscribedAt: string
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/subscribers?limit=200')
    const data = await res.json()
    if (data.ok) {
      setSubscribers(data.subscribers)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const verified = subscribers.filter(s => s.isVerified).length
  const active = subscribers.filter(s => s.isActive).length

  const sendNewsletter = async () => {
    if (!confirm('سيتم إرسال النشرة لكل المشتركين المؤكدين. متابعة؟')) return
    setSending(true)
    try {
      const res = await fetch('/api/newsletter/send', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`تم إرسال النشرة إلى ${data.sent} مشترك (${data.failed} فشل)`)
      } else {
        toast.error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            المشتركون في النشرة
          </h1>
          <p className="text-slate-600 mt-1">إدارة قائمة المشتركين في النشرة البريدية</p>
        </div>
        <Button onClick={sendNewsletter} disabled={sending || total === 0} className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'جاري الإرسال...' : 'إرسال النشرة'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-5 w-5 text-indigo-500" />
              <span className="text-xs text-slate-500">إجمالي</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-xs text-slate-500">نشط</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-slate-500">مؤكد</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{verified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <XCircle className="h-5 w-5 text-slate-400" />
              <span className="text-xs text-slate-500">غير مؤكد</span>
            </div>
            <p className="text-2xl font-bold text-slate-600">{total - verified}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة المشتركين ({subscribers.length})</CardTitle>
          <CardDescription>آخر 200 مشترك</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا يوجد مشتركون بعد</p>
              <p className="text-xs mt-1">أضف نموذج اشتراك في الموقع لتبدأ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subscribers.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    s.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {s.email[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate" dir="ltr">{s.email}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {s.name && <span>{s.name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.subscribedAt).toLocaleDateString('ar-EG')}
                      </span>
                      <Badge variant="outline" className="text-xs">{s.language}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {s.isVerified ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle2 className="h-3 w-3 ml-1" /> مؤكد
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">غير مؤكد</Badge>
                    )}
                    {s.isActive ? (
                      <Badge className="bg-indigo-100 text-indigo-700 text-xs">نشط</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 text-xs">متوقف</Badge>
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
