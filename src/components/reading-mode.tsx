'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Type, Minus, Plus, AlignJustify } from 'lucide-react'

export default function ReadingModeToggle() {
  const [readingMode, setReadingMode] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)

  useEffect(() => {
    const saved = localStorage.getItem('readingMode')
    if (saved === 'true') setReadingMode(true)
    const savedSize = localStorage.getItem('fontSize')
    if (savedSize) setFontSize(parseInt(savedSize))
    const savedLine = localStorage.getItem('lineHeight')
    if (savedLine) setLineHeight(parseFloat(savedLine))
  }, [])

  const toggleReadingMode = () => {
    const newVal = !readingMode
    setReadingMode(newVal)
    localStorage.setItem('readingMode', String(newVal))
    applyStyles(newVal, fontSize, lineHeight)
  }

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(14, Math.min(28, fontSize + delta))
    setFontSize(newSize)
    localStorage.setItem('fontSize', String(newSize))
    applyStyles(readingMode, newSize, lineHeight)
  }

  const changeLineHeight = () => {
    const newLine = lineHeight === 1.8 ? 2.2 : lineHeight === 2.2 ? 1.5 : 1.8
    setLineHeight(newLine)
    localStorage.setItem('lineHeight', String(newLine))
    applyStyles(readingMode, fontSize, newLine)
  }

  const applyStyles = (mode: boolean, size: number, line: number) => {
    const article = document.querySelector('article') as HTMLElement
    if (!article) return

    if (mode) {
      article.style.maxWidth = '700px'
      article.style.margin = '0 auto'
      article.style.fontSize = `${size}px`
      article.style.lineHeight = String(line)
      article.style.color = '#1a1a1a'
      document.body.classList.add('reading-mode')
    } else {
      article.style.maxWidth = ''
      article.style.margin = ''
      article.style.fontSize = ''
      article.style.lineHeight = ''
      article.style.color = ''
      document.body.classList.remove('reading-mode')
    }

    // Apply to all paragraphs
    const paragraphs = article.querySelectorAll('p')
    paragraphs.forEach((p) => {
      (p as HTMLElement).style.fontSize = `${size}px`
      ;(p as HTMLElement).style.lineHeight = String(line)
    })
  }

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
      <button
        onClick={toggleReadingMode}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
          readingMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`}
        title="Toggle reading mode"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Read</span>
      </button>

      {readingMode && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={() => changeFontSize(-2)}
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
            title="Smaller text"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-slate-500 w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => changeFontSize(2)}
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
            title="Larger text"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={changeLineHeight}
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
            title="Toggle line spacing"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
