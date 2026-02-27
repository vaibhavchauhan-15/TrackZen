import { CardSkeleton } from '@/components/ui/loading-spinner'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome section skeleton */}
      <div className="h-12 rounded-lg bg-bg-surface animate-pulse" />
      
      {/* Streak banner skeleton */}
      <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton count={2} />
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-xl bg-bg-surface animate-pulse" />
          <div className="h-40 rounded-xl bg-bg-surface animate-pulse" />
        </div>
      </div>
    </div>
  )
}
