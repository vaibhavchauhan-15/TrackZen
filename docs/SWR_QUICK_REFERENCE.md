# SWR Quick Reference

## 🎯 Common Hooks

### Reading Data
```tsx
// Dashboard
const { data, error, isLoading } = useDashboardData()

// Plans
const { data: plans } = usePlans()
const { data: plan } = usePlan(planId)

// Habits
const { data: habits } = useHabits()

// Analytics
const { data: analytics } = useStudyTrackerAnalytics(planId)
const { data: summary } = useAnalyticsSummary()

// Study Logs
const { data: logs } = useStudyLogs(planId)

// Others
const { data: streaks } = useStreaks()
const { data: mistakes } = useMistakes(planId)
const { data: mockTests } = useMockTests(planId)
const { data: revisions } = useRevisions(planId)
const { data: reviews } = useWeeklyReviews()
```

### Writing Data (Mutations)
```tsx
// Plans
const { trigger: createPlan, isMutating } = useCreatePlan()
const { trigger: updatePlan, isMutating } = useUpdatePlan(planId)
const { trigger: deletePlan, isMutating } = useDeletePlan(planId)

// Habits
const { trigger: createHabit, isMutating } = useCreateHabit()
const { trigger: updateHabit, isMutating } = useUpdateHabit(habitId)
const { trigger: deleteHabit, isMutating } = useDeleteHabit(habitId)
const { trigger: logHabit, isMutating } = useLogHabit()

// Study Logs
const { trigger: createLog, isMutating } = useCreateStudyLog()

// Topics
const { trigger: scheduleTopics, isMutating } = useBulkScheduleTopics(planId)

// AI
const { trigger: generatePlan, isMutating } = useGeneratePlan()

// Mistakes & Tests
const { trigger: createMistake } = useCreateMistake()
const { trigger: updateMistake } = useUpdateMistake(mistakeId)
const { trigger: createMockTest } = useCreateMockTest()
const { trigger: createRevision } = useCreateRevision()
const { trigger: createReview } = useCreateWeeklyReview()
```

## 📝 Usage Patterns

### Basic Data Fetching
```tsx
function MyComponent() {
  const { data, error, isLoading } = usePlans()
  
  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return <div>{data.plans.map(plan => ...)}</div>
}
```

### Mutation with Form
```tsx
function CreatePlanForm() {
  const { trigger: createPlan, isMutating } = useCreatePlan()
  const [formData, setFormData] = useState({})
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await createPlan(formData)
      router.push(`/planner/${result.plan.id}`)
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isMutating}>
        {isMutating ? 'Creating...' : 'Create Plan'}
      </button>
    </form>
  )
}
```

### Optimistic Updates (Instant UI)
```tsx
function HabitToggle({ habitId, currentStatus }) {
  const { trigger: logHabit, isMutating } = useLogHabit()
  
  const handleToggle = async () => {
    // UI updates instantly, syncs with server
    await logHabit({
      habitId,
      status: currentStatus === 'done' ? 'missed' : 'done',
      date: new Date().toISOString().split('T')[0]
    })
  }
  
  return (
    <button onClick={handleToggle} disabled={isMutating}>
      {currentStatus === 'done' ? '✅' : '⭕'}
    </button>
  )
}
```

### Conditional Fetching
```tsx
function PlanDetails({ planId }) {
  // Only fetches if planId is truthy
  const { data: plan } = usePlan(planId)
  const { data: analytics } = useStudyTrackerAnalytics(planId)
  
  if (!planId) return <SelectPlan />
  if (!plan) return <Loading />
  
  return <div>...</div>
}
```

## 🔄 Manual Revalidation

```tsx
import { revalidateDashboard, revalidateAnalytics } from '@/lib/hooks/use-swr-api'

// Refresh dashboard data
await revalidateDashboard()

// Refresh analytics
await revalidateAnalytics()

// Specific endpoint
import { mutate } from 'swr'
await mutate('/api/plans')
```

## ⚡ Performance Tips

1. **Use conditional fetching** - Pass `null` to disable fetching
2. **Avoid over-invalidation** - Only revalidate what's needed
3. **Trust the cache** - Let SWR handle revalidation automatically
4. **Use isMutating** - Show loading states during mutations
5. **Batch updates** - Multiple related mutations? Consider a bulk endpoint

## 🐛 Common Issues

### "Too many requests"
```tsx
// Increase dedupingInterval in config
const { data } = usePlans()  // Already configured with 30s dedupe
```

### "Data not updating after mutation"
```tsx
// Check if mutation hook includes cache invalidation
// useSWRMutation should have onSuccess with mutate() calls
```

### "Stale data showing"
```tsx
// Force revalidation
const { data, mutate } = usePlans()
await mutate()  // Force refresh
```

### "Can't use hook conditionally"
```tsx
// ❌ Wrong
if (condition) {
  const { data } = usePlans()
}

// ✅ Correct
const { data } = usePlans()
if (!condition || !data) return null
```

## 📊 Cache Timings

| Endpoint | Dedupe | Refresh | Use Case |
|----------|--------|---------|----------|
| Dashboard | 5s | 30s | Frequent updates |
| Plans | 30s | 60s | Medium refresh |
| Analytics | 60s | 120s | Can be stale |
| Session | 5min | 10min | Very stable |
| Habits | 5s | 30s | Frequent updates |

## 🎨 Loading States

```tsx
// While loading first time
if (isLoading && !data) return <Spinner />

// While revalidating (data exists)
if (isLoading && data) {
  return (
    <div>
      {data.map(...)}  {/* Show cached data */}
      {isLoading && <RefreshIndicator />}
    </div>
  )
}

// During mutation
if (isMutating) return <Saving />
```

## 🔗 Import Paths

```tsx
// All hooks
import { 
  useDashboardData,
  usePlans,
  usePlan,
  useCreatePlan,
  // ... 30+ hooks
} from '@/lib/hooks/use-swr-api'

// Config
import { swrConfig, apiConfigs } from '@/lib/swr-config'

// Manual revalidation
import { mutate } from 'swr'
```

## 📚 Resources

- **Implementation Guide:** `/docs/SWR_IMPLEMENTATION.md`
- **Migration Summary:** `/docs/SWR_MIGRATION_SUMMARY.md`
- **All Hooks:** `/lib/hooks/use-swr-api.ts`
- **Config:** `/lib/swr-config.ts`
- **Official Docs:** https://swr.vercel.app/
