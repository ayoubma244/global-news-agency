'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CheckCircle2, AlertCircle, Newspaper } from 'lucide-react'

export default function InstallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    siteName: 'وكالة الأنباء العالمية',
    adminUsername: 'admin',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  })

  useEffect(() => {
    fetch('/api/install')
      .then(r => r.json())
      .then(d => {
        setAlreadyInstalled(!!d.installed)
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (form.adminPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (!form.adminEmail.includes('@')) {
      setError('بريد إلكتروني غير صالح')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: form.siteName,
          adminUsername: form.adminUsername,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'فشل التثبيت')
        setLoading(false)
        return
      }
      // Redirect to admin dashboard
      setTimeout(() => router.push('/admin'), 1500)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (alreadyInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-2xl">الموقع مثبت مسبقاً</CardTitle>
            <CardDescription>تم تثبيت الموقع بالفعل. لا يمكنك إعادة التثبيت.</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button onClick={() => router.push('/')} className="flex-1">الصفحة الرئيسية</Button>
            <Button onClick={() => router.push('/login')} variant="outline" className="flex-1">دخول الأدمن</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <Newspaper className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">تثبيت الموقع</h1>
          <p className="text-slate-600 mt-2">مرحباً! لنقم بإعداد موقعك الإخباري في خطوات بسيطة</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              معلومات الأدمن
            </CardTitle>
            <CardDescription>
              سيتم إنشاء حساب الأدمن الرئيسي (super_admin) بهذه البيانات. احفظها جيداً.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="siteName">اسم الموقع</Label>
                <Input
                  id="siteName"
                  value={form.siteName}
                  onChange={e => setForm({ ...form, siteName: e.target.value })}
                  placeholder="وكالة الأنباء العالمية"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">اسم المستخدم</Label>
                  <Input
                    id="adminUsername"
                    value={form.adminUsername}
                    onChange={e => setForm({ ...form, adminUsername: e.target.value })}
                    placeholder="admin"
                    required
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">البريد الإلكتروني</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={form.adminEmail}
                    onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">كلمة المرور</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={form.adminPassword}
                    onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPasswordConfirm">تأكيد كلمة المرور</Label>
                  <Input
                    id="adminPasswordConfirm"
                    type="password"
                    value={form.adminPasswordConfirm}
                    onChange={e => setForm({ ...form, adminPasswordConfirm: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">سيتم تثبيت:</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>20 كاتيجوري رئيسي (مع إمكانية الإضافة لاحقاً)</li>
                  <li>4 صفحات افتراضية (من نحن، اتصل بنا، خصوصية، شروط)</li>
                  <li>30+ إعداد للموقع (SEO، سوشيال، أتمتة، ثيم)</li>
                  <li>حساب أدمن super_admin بصلاحيات كاملة</li>
                </ul>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري التثبيت...
                  </>
                ) : (
                  'تثبيت الموقع الآن'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Global News Agency - Automated News Platform v1.0.0
        </p>
      </div>
    </div>
  )
}
