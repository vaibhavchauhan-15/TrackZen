import { CardSkeleton } from '@/components/ui/loading-spinner'

export default function PlannerLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-48 rounded-lg bg-bg-surface animate-pulse" />
        <div className="h-10 w-32 rounded-lg bg-bg-surface animate-pulse" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
      
      {/* Calendar / Timeline skeleton */}
      <div className="h-64 rounded-xl bg-bg-surface animate-pulse" />
      
      {/* Plans list skeleton */}
      <div className="space-y-4">
        <CardSkeleton count={3} />
      </div>
    </div>
  )
}
