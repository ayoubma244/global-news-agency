'use client'

import { useState } from 'react'
import { Twitter, Facebook, Linkedin, Link2, Mail, Check, Share2, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  articleId: string
  title: string
  url?: string
}

export default function ShareButtons({ articleId, title, url }: Props) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const platforms = [
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'hover:bg-slate-900 hover:text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-blue-600 hover:text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-700 hover:text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:bg-green-500 hover:text-white',
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:bg-sky-500 hover:text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'hover:bg-amber-500 hover:text-white',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('تم نسخ الرابط')
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      toast.error('فشل النسخ')
    }
  }

  // Native share on mobile
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl })
      } catch (e) {
        // User cancelled
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          شارك الخبر
        </h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {platforms.map(p => {
          const Icon = p.icon
          return (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 transition-colors ${p.color}`}
              title={p.name}
            >
              <Icon className="h-4 w-4" />
            </a>
          )
        })}
        <button
          onClick={copyLink}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            copied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="نسخ الرابط"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={nativeShare}
            className="px-3 h-10 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 text-xs font-medium flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" /> مشاركة
          </button>
        )}
      </div>
    </div>
  )
}
