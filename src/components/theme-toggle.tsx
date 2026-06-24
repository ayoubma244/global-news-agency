'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme-provider'
import { useState, useRef, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="تغيير المظهر"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => { setTheme('light'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${theme === 'light' ? 'bg-slate-50 dark:bg-slate-700 font-semibold' : ''}`}
          >
            <Sun className="h-4 w-4" /> فاتح
          </button>
          <button
            onClick={() => { setTheme('dark'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${theme === 'dark' ? 'bg-slate-50 dark:bg-slate-700 font-semibold' : ''}`}
          >
            <Moon className="h-4 w-4" /> داكن
          </button>
          <button
            onClick={() => { setTheme('system'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${theme === 'system' ? 'bg-slate-50 dark:bg-slate-700 font-semibold' : ''}`}
          >
            <Monitor className="h-4 w-4" /> تلقائي
          </button>
        </div>
      )}
    </div>
  )
}
