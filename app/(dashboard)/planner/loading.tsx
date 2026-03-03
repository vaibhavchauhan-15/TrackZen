import { CardSkeleton } from '@/components/ui/loading-spinner'

export default function PlannerLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header banner skeleton */}
      <div className="h-20 rounded-xl bg-bg-surface animate-pulse" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>

      {/* Plans grid skeleton */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={6} />
      </div>
    </div>
  )
}
