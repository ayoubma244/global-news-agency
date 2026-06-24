'use client'

import { useState, useEffect } from 'react'

interface Props {
  articleId: string
  readingTime: number  // minutes
}

export default function ReadingProgress({ articleId, readingTime }: Props) {
  const [progress, setProgress] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    let startTime = Date.now()
    let raf: number

    const update = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0
      setProgress(pct)

      // Time spent (seconds)
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000))

      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)

    // Send heartbeat every 30s
    const heartbeat = setInterval(() => {
      const currentProgress = progress
      const currentTime = Math.floor((Date.now() - startTime) / 1000)
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          readProgress: currentProgress,
          readingTime: currentTime,
        }),
      }).catch(() => null)
    }, 30000)

    // Send final on unmount
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(heartbeat)
      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          readProgress: progress,
          readingTime: finalTime,
        }),
      }).catch(() => null)
    }
  }, [articleId])

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating reading info */}
      <div className="fixed bottom-4 right-4 z-40 bg-white shadow-lg rounded-full px-4 py-2 text-xs text-slate-600 border border-slate-200 flex items-center gap-3" dir="rtl">
        <span className="flex items-center gap-1">
          <span className="text-indigo-600 font-bold">{Math.round(progress)}%</span>
          <span>قراءة</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1">
          <span className="font-bold">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
          <span>دقيقة</span>
        </span>
        <span className="text-slate-300">|</span>
        <span>{readingTime} دقيقة للقراءة</span>
      </div>
    </>
  )
}
