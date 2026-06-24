export default function Loading() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="h-16 bg-white border-b border-slate-200" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-4 bg-slate-200 rounded w-32 mb-4 animate-pulse" />
        <div className="h-10 bg-slate-200 rounded w-3/4 mb-6 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-8 animate-pulse" />
        <div className="aspect-video bg-slate-200 rounded-xl mb-8 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
