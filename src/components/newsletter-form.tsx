'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('بريد إلكتروني غير صالح')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await res.json()
      if (data.ok) {
        setSuccess(true)
        setEmail('')
        setName('')
      } else {
        setError(data.error || 'فشل الاشتراك')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center max-w-md mx-auto" dir="rtl">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">تم الاشتراك بنجاح!</h3>
        <p className="text-slate-300 text-sm mb-4">تحقق من بريدك الإلكتروني لتأكيد الاشتراك</p>
        <Button variant="outline" onClick={() => setSuccess(false)} className="border-slate-600 text-slate-200 hover:bg-slate-800">
          اشتراك بريد آخر
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center" dir="rtl">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-xl mb-4">
        <Mail className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">اشترك في النشرة البريدية</h3>
      <p className="text-slate-300 text-sm mb-6">احصل على آخر الأخبار مباشرة في بريدك يومياً</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <Input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="بريدك الإلكتروني"
          required
          className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
        />
        <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          اشتراك
        </Button>
      </form>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <p className="text-xs text-slate-500 mt-3">
        🔒 خصوصيتك مهمة لنا. لن نشارك بريدك مع أي طرف ثالث.
      </p>
    </div>
  )
}
