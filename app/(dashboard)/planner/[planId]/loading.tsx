export default function PlanDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Plan header skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-bg-surface animate-pulse" />
          <div className="h-4 w-32 rounded bg-bg-surface animate-pulse" />
        </div>
        <div className="h-10 w-24 rounded-lg bg-bg-surface animate-pulse" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="h-4 rounded-full bg-bg-surface animate-pulse" />
      
      {/* Stats skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
      
      {/* Topics list skeleton */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  )
}
