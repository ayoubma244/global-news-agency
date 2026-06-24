'use client'

import { useState, useEffect } from 'react'
import { Heart, ThumbsUp, Smile, Frown, Angry, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  articleId: string
}

const reactionConfig = [
  { type: 'like', label: 'إعجاب', icon: ThumbsUp, color: 'text-blue-500' },
  { type: 'love', label: 'أحببته', icon: Heart, color: 'text-red-500' },
  { type: 'wow', label: 'مدهش', icon: Smile, color: 'text-yellow-500' },
  { type: 'sad', label: 'محزن', icon: Frown, color: 'text-slate-500' },
  { type: 'angry', label: 'مغضب', icon: Angry, color: 'text-orange-500' },
]

export default function ReactionsBar({ articleId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({
    like: 0, love: 0, wow: 0, sad: 0, angry: 0,
  })
  const [userReactions, setUserReactions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`/api/articles/${articleId}/reactions`)
    const data = await res.json()
    if (data.ok) {
      setCounts(data.counts)
      setUserReactions(data.userReactions)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [articleId])

  const toggle = async (type: string) => {
    setActing(type)
    const res = await fetch(`/api/articles/${articleId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const data = await res.json()
    if (data.ok) {
      if (data.action === 'added') {
        setUserReactions([...userReactions, type])
        setCounts({ ...counts, [type]: counts[type] + 1 })
      } else {
        setUserReactions(userReactions.filter(r => r !== type))
        setCounts({ ...counts, [type]: Math.max(0, counts[type] - 1) })
      }
    }
    setActing(null)
  }

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  }

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">تفاعل مع الخبر</h3>
        <span className="text-xs text-slate-500">{totalReactions} تفاعل</span>
      </div>
      <div className="flex items-center justify-around gap-2 flex-wrap">
        {reactionConfig.map(({ type, label, icon: Icon, color }) => {
          const isActive = userReactions.includes(type)
          const count = counts[type] || 0
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              disabled={acting === type}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all hover:scale-110 ${
                isActive ? `${color} bg-slate-100 ring-2 ring-current` : 'text-slate-400 hover:text-slate-600'
              }`}
              title={label}
            >
              {acting === type ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className={`h-6 w-6 ${isActive ? color : ''}`} />
              )}
              <span className="text-xs font-medium">{count}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
