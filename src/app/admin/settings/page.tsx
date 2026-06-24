'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SettingItem {
  value: string
  type: string
  group: string
  label: string
}

type Settings = Record<string, SettingItem>

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.ok) setSettings(data.settings)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    const updates: Record<string, string> = {}
    for (const [k, v] of Object.entries(settings)) {
      updates[k] = v.value
    }
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updates }),
    })
    const data = await res.json()
    if (data.ok) toast.success('تم حفظ الإعدادات')
    else toast.error('فشل الحفظ')
    setSaving(false)
  }

  const updateValue = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: { ...s[key], value } }))
  }

  const renderField = (key: string, item: SettingItem) => {
    if (item.type === 'boolean') {
      return (
        <div className="flex items-center gap-2 py-2">
          <Switch
            checked={item.value === 'true'}
            onCheckedChange={v => updateValue(key, v ? 'true' : 'false')}
            id={key}
          />
          <Label htmlFor={key}>{item.label}</Label>
        </div>
      )
    }
    if (item.type === 'textarea') {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={key}>{item.label}</Label>
          <Textarea
            id={key}
            value={item.value}
            onChange={e => updateValue(key, e.target.value)}
            rows={3}
          />
        </div>
      )
    }
    if (item.type === 'number') {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={key}>{item.label}</Label>
          <Input
            id={key}
            type="number"
            value={item.value}
            onChange={e => updateValue(key, e.target.value)}
          />
        </div>
      )
    }
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{item.label}</Label>
        <Input
          id={key}
          value={item.value}
          onChange={e => updateValue(key, e.target.value)}
          dir={key.includes('_en') || key.includes('url') || key.includes('email') || key.includes('seo_') ? 'ltr' : 'rtl'}
        />
      </div>
    )
  }

  // Group settings
  const groups: Record<string, [string, SettingItem][]> = {
    general: [], seo: [], social: [], automation: [], theme: [],
  }
  for (const [k, v] of Object.entries(settings)) {
    if (groups[v.group]) groups[v.group].push([k, v])
  }

  const groupLabels: Record<string, string> = {
    general: 'عام',
    seo: 'SEO',
    social: 'السوشيال ميديا',
    automation: 'الأتمتة',
    theme: 'الثيم',
  }

  if (loading) return <div className="text-center py-12 text-slate-500">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6" /> الإعدادات
          </h1>
          <p className="text-slate-600 mt-1">إدارة جميع إعدادات الموقع</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(groupLabels).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupLabels).map(([groupKey, groupLabel]) => (
          <TabsContent key={groupKey} value={groupKey}>
            <Card>
              <CardHeader>
                <CardTitle>{groupLabel}</CardTitle>
                <CardDescription>{groups[groupKey]?.length || 0} إعداد</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups[groupKey]?.map(([key, item]) => (
                  <div key={key}>{renderField(key, item)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
