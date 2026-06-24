export default function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500">جاري التحميل...</p>
      </div>
    </div>
  )
}
