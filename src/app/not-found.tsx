import Link from 'next/link'
import { Newspaper, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-2xl mb-6">
          <Newspaper className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-7xl font-bold text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">الصفحة غير موجودة</h2>
        <p className="text-slate-500 mb-6">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. تحقق من الرابط أو ابحث عن المحتوى الذي تريده.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
          <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <Search className="h-4 w-4" />
            بحث
          </Link>
        </div>
      </div>
    </div>
  )
}
