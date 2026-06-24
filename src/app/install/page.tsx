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
    siteName: 'Global News Agency',
    adminUsername: 'admin',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  })

  useEffect(() => {
    fetch('/api/install').then(r => r.json()).then(d => {
      setAlreadyInstalled(!!d.installed)
      setChecking(false)
    }).catch(() => setChecking(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError('Passwords do not match')
      return
    }
    if (form.adminPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!form.adminEmail.includes('@')) {
      setError('Invalid email address')
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
        setError(data.error || 'Installation failed')
        setLoading(false)
        return
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-2xl">Already Installed</CardTitle>
            <CardDescription>This site has already been set up. You cannot reinstall.</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button onClick={() => router.push('/')} className="flex-1">Go to Site</Button>
            <Button onClick={() => router.push('/login')} variant="outline" className="flex-1">Admin Login</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-4">
            <Newspaper className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Site Installation</h1>
          <p className="text-slate-600 mt-2">Welcome! Let's set up your news platform in a few simple steps.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Account
            </CardTitle>
            <CardDescription>
              This will create the main admin account (super_admin). Save these credentials carefully.
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
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input id="adminUsername" value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} required minLength={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input id="adminEmail" type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@example.com" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input id="adminPassword" type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPasswordConfirm">Confirm Password</Label>
                  <Input id="adminPasswordConfirm" type="password" value={form.adminPasswordConfirm} onChange={e => setForm({ ...form, adminPasswordConfirm: e.target.value })} required minLength={6} />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">This will install:</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>20 main categories (with ability to add more)</li>
                  <li>4 default pages (About, Contact, Privacy, Terms)</li>
                  <li>30+ site settings (SEO, Social, Automation, Theme)</li>
                  <li>Super admin account with full permissions</li>
                </ul>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Installing...</>
                ) : (
                  'Install Now'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Global News Agency - Automated News Platform v2.0.0
        </p>
      </div>
    </div>
  )
}
