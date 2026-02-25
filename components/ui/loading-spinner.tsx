export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      className={`animate-spin rounded-full border-accent-purple border-t-transparent ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-text-secondary animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-lg bg-bg-surface animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </>
  )
}
