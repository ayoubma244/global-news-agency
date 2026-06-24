'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  articleId: string
}

export default function BookmarkButton({ articleId }: Props) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch(`/api/articles/${articleId}/bookmark`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setBookmarked(d.isBookmarked)
        setLoading(false)
      })
  }, [articleId])

  const toggle = async () => {
    setActing(true)
    const res = await fetch(`/api/articles/${articleId}/bookmark`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setBookmarked(data.action === 'added')
      toast.success(data.action === 'added' ? 'تم الحفظ في المفضلة' : 'تم الحذف من المفضلة')
    }
    setActing(false)
  }

  if (loading) return null

  return (
    <button
      onClick={toggle}
      disabled={acting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        bookmarked
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      title={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
    >
      {acting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : bookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      <span>{bookmarked ? 'محفوظ' : 'حفظ'}</span>
    </button>
  )
}
