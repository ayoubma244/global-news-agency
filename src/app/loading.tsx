export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="h-16 bg-white border-b border-slate-200" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="aspect-video bg-slate-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
