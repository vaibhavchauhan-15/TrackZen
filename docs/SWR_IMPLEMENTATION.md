# SWR Implementation Guide

This application uses **SWR** (stale-while-revalidate) for efficient data fetching, caching, and state management.

## ✨ Features Implemented

### 1. **Global SWR Configuration** (`lib/swr-config.ts`)
- Automatic request deduplication (2s default window)
- Persistent client-side caching
- `keepPreviousData: true` - Shows cached data instantly while fetching updates
- Smart revalidation strategies per API type
- Automatic error retry with exponential backoff

### 2. **Custom API Hooks** (`lib/hooks/use-swr-api.ts`)
All API endpoints now have dedicated hooks with optimized caching:

#### Dashboard & Core Data
- `useDashboardData()` - Auto-refresh every 30s
- `useSession()` - Long cache (10min), perfect for auth state
- `useStreaks()` - Daily refresh pattern

#### Plans & Topics
- `usePlans()` - All plans with 60s refresh
- `usePlan(planId)` - Single plan with 60s refresh
- `useCreatePlan()` - Mutation hook with auto cache invalidation
- `useUpdatePlan(planId)` - Update with optimistic updates
- `useDeletePlan(planId)` - Delete with cache cleanup
- `useUpdateTopicStatus(planId, topicId)` - Topic updates with optimistic UI
- `useBulkScheduleTopics(planId)` - Batch operations

#### Habits
- `useHabits()` - Auto-refresh every 30s
- `useLogHabit()` - Optimistic updates for instant feedback
- `useCreateHabit()`, `useUpdateHabit()`, `useDeleteHabit()` - Full CRUD

#### Analytics
- `useStudyTrackerAnalytics(planId)` - 2min refresh (can be stale)
- `useAnalyticsSummary()` - 2min refresh

#### Study Logs & Other Features
- `useStudyLogs(planId?)` - Filtered or all logs
- `useCreateStudyLog()` - With multi-endpoint revalidation
- `useMistakes()`, `useMockTests()`, `useRevisions()`, `useWeeklyReviews()`
- `useGeneratePlan()` - AI generation with cache updates

### 3. **Optimistic Updates**
Mutations include optimistic updates for instant UI feedback:
- Habit logging shows instant state change
- Topic status updates show immediately
- Failed requests automatically rollback
- Error states handled gracefully

### 4. **Cache Invalidation Strategy**
Smart cache updates on mutations:
```typescript
// Example: Creating a habit invalidates related caches
useCreateHabit()
  → Revalidates: /api/habits
  → Revalidates: /api/dashboard/initial
  → Result: Dashboard and habits list update automatically
```

### 5. **Provider Setup**
```tsx
// app/layout.tsx
<SessionProvider>
  <SWRProvider>  {/* Global SWR config */}
    <DashboardProvider>  {/* Uses SWR internally */}
      {children}
    </DashboardProvider>
  </SWRProvider>
</SessionProvider>
```

## 🚀 Usage Examples

### Fetching Data
```tsx
import { usePlans } from '@/lib/hooks/use-swr-api'

function PlansList() {
  const { data, error, isLoading } = usePlans()
  
  if (isLoading) return <Spinner />
  if (error) return <Error />
  
  return <div>{data.plans.map(...)}</div>
}
```

### Creating Data with Auto-Revalidation
```tsx
import { useCreatePlan } from '@/lib/hooks/use-swr-api'

function NewPlanForm() {
  const { trigger: createPlan, isMutating } = useCreatePlan()
  
  const handleSubmit = async (formData) => {
    try {
      await createPlan(formData)
      // Automatically revalidates plans list and dashboard!
      router.push('/planner')
    } catch (error) {
      console.error(error)
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Optimistic Updates
```tsx
import { useLogHabit } from '@/lib/hooks/use-swr-api'

function HabitButton({ habitId }) {
  const { trigger: logHabit, isMutating } = useLogHabit()
  
  const handleToggle = async () => {
    // UI updates instantly, then syncs with server
    await logHabit({ habitId, status: 'done' })
  }
  
  return (
    <button onClick={handleToggle} disabled={isMutating}>
      {isMutating ? 'Saving...' : 'Complete Habit'}
    </button>
  )
}
```

## ⚙️ Configuration Details

### API-Specific Settings
```typescript
// Dashboard - Frequent updates
dashboard: {
  dedupingInterval: 5000,
  refreshInterval: 30000,
}

// Plans - Medium refresh
plans: {
  dedupingInterval: 30000,
  refreshInterval: 60000,
}

// Analytics - Can be stale longer
analytics: {
  dedupingInterval: 60000,
  refreshInterval: 120000,
}

// Session - Very stable
session: {
  dedupingInterval: 300000,  // 5 min
  refreshInterval: 600000,   // 10 min
}
```

## 🎯 Performance Benefits

### Before SWR
- ❌ Manual fetch in useEffect
- ❌ Manual deduplication logic
- ❌ Custom caching with refs and timestamps
- ❌ Manual loading/error states
- ❌ Duplicate network requests
- ❌ Stale data on navigation

### After SWR
- ✅ Automatic request deduplication
- ✅ Built-in caching with smart revalidation
- ✅ Instant UI updates with cached data
- ✅ Global state across components
- ✅ Zero duplicate requests
- ✅ Fresh data on focus/reconnect

## 🔧 Utilities

### Manual Revalidation
```typescript
import { revalidateDashboard, revalidateAnalytics } from '@/lib/hooks/use-swr-api'

// Force refresh all dashboard data
revalidateDashboard()

// Force refresh all analytics
revalidateAnalytics()
```

### Clear All Cache (Use sparingly!)
```typescript
import { clearAllCache } from '@/lib/hooks/use-swr-api'

// Nuclear option - clears everything
clearAllCache()
```

## 📝 Migration Checklist

- [x] Global SWR provider setup
- [x] Custom hooks for all API endpoints
- [x] Dashboard provider converted to SWR
- [x] Habits page with optimistic updates
- [x] Study tracker with SWR
- [x] Planner pages with SWR
- [x] Plan detail with optimistic mutations
- [x] New plan creation with SWR mutations
- [x] Session caching configured
- [x] Error handling & retries
- [x] Loading states
- [x] Cache invalidation on mutations

## 🎨 Best Practices

1. **Use hooks at component level** - Never call hooks conditionally or in loops
2. **Let SWR handle loading states** - Use `isLoading` instead of manual state
3. **Trust the cache** - SWR shows cached data instantly while revalidating
4. **Mutations invalidate related caches** - Updates propagate automatically
5. **Configure per-API refresh rates** - Balance freshness vs performance

## 🐛 Troubleshooting

### Data not updating?
- Check if mutation hooks include proper cache invalidation
- Verify dedupingInterval isn't too long
- Ensure SWRConfig is properly wrapping your app

### Too many requests?
- Increase dedupingInterval for that endpoint
- Disable revalidateOnFocus if not needed
- Check for duplicate hooks in component tree

### Stale data showing?
- Decrease refreshInterval for that endpoint
- Call manual revalidation after critical mutations
- Check keepPreviousData setting

## 📚 Resources

- [SWR Documentation](https://swr.vercel.app/)
- [SWR Mutation Docs](https://swr.vercel.app/docs/mutation)
- [Optimistic UI Guide](https://swr.vercel.app/docs/mutation#optimistic-updates)
