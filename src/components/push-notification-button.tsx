'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      setPermission(Notification.permission)
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        return reg.pushManager.getSubscription()
      }).then(sub => {
        if (sub) setSubscribed(true)
      }).catch(() => {})
    }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission !== 'granted') {
        toast.error('لم يتم السماح بالإشعارات')
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      // In production, get VAPID public key from server
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        toast.info('إشعارات Web Push تحتاج إعداد VAPID keys')
        setLoading(false)
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      setSubscribed(true)
      toast.success('تم تفعيل الإشعارات!')
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setSubscribed(false)
      toast.success('تم إيقاف الإشعارات')
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  if (!supported) return null

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading || (permission === 'denied')}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        subscribed
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } disabled:opacity-50`}
      title={permission === 'denied' ? 'الإشعارات محظورة' : subscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span>{subscribed ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}</span>
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
