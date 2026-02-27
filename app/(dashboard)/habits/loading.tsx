import { CardSkeleton } from '@/components/ui/loading-spinner'

export default function HabitsLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome banner skeleton */}
      <div className="h-32 rounded-xl bg-bg-surface animate-pulse" />
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="h-12 rounded-lg bg-bg-surface animate-pulse w-48" />
      
      {/* Habits list skeleton */}
      <div className="space-y-4">
        <CardSkeleton count={5} />
      </div>
    </div>
  )
}
