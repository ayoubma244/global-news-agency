'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Clock, BookOpen, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  articleId: string
  articleBody: string
}

interface Summary {
  summaryAr: string
  summaryEn?: string
  keyPoints: string[]
  readingTime: number
  readabilityScore: number
  clickbaitScore: number
  sentiment: string
  model: string
}

export default function AiSummaryCard({ articleId, articleBody }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/articles/${articleId}/summary`)
    if (res.ok) {
      const data = await res.json()
      if (data.ok) {
        setSummary(data.summary)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [articleId])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/summary`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setSummary(data.summary)
      }
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 flex items-center gap-3" dir="rtl">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-sm text-indigo-700">جاري تحميل الملخص الذكي...</span>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 text-center" dir="rtl">
        <Sparkles className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-600 mb-3">لا يوجد ملخص ذكي لهذا المقال بعد</p>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          توليد الملخص بالـ AI
        </button>
      </div>
    )
  }

  const sentimentLabels: Record<string, { label: string; color: string }> = {
    positive: { label: 'إيجابي', color: 'bg-green-100 text-green-700' },
    negative: { label: 'سلبي', color: 'bg-red-100 text-red-700' },
    neutral: { label: 'محايد', color: 'bg-slate-100 text-slate-700' },
  }
  const sentimentInfo = sentimentLabels[summary.sentiment] || sentimentLabels.neutral

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          ملخص ذكي (TL;DR)
        </h3>
        <span className="text-xs px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-full font-medium">
          {summary.model === 'fallback' ? 'أساسي' : 'AI'}
        </span>
      </div>

      {/* Summary */}
      <p className="text-slate-800 leading-relaxed mb-4 text-sm">{summary.summaryAr}</p>

      {/* Key Points */}
      {summary.keyPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> النقاط الرئيسية
          </h4>
          <ul className="space-y-1.5">
            {(expanded ? summary.keyPoints : summary.keyPoints.slice(0, 3)).map((point, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {summary.keyPoints.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-600 hover:underline mt-2"
            >
              {expanded ? 'عرض أقل' : `عرض ${summary.keyPoints.length - 3} نقاط أخرى`}
            </button>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-indigo-200">
        <div className="text-center">
          <Clock className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
          <p className="text-xs text-slate-500">وقت القراءة</p>
          <p className="text-sm font-bold text-slate-900">{summary.readingTime} د</p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <p className="text-xs text-slate-500">سهولة القراءة</p>
          <p className="text-sm font-bold text-green-700">{Math.round(summary.readabilityScore)}%</p>
        </div>
        <div className="text-center">
          <AlertTriangle className="h-4 w-4 mx-auto text-amber-600 mb-1" />
          <p className="text-xs text-slate-500">clickbait</p>
          <p className="text-sm font-bold text-amber-700">{Math.round(summary.clickbaitScore)}%</p>
        </div>
        <div className="text-center">
          <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sentimentInfo.color}`}>
            {sentimentInfo.label}
          </div>
          <p className="text-xs text-slate-500 mt-1">المزاج</p>
        </div>
      </div>
    </div>
  )
}
