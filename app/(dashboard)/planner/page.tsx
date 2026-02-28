'use client'

import { useMemo } from 'react'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'

// Import optimized planner components
import {
  PlannerHeader,
  PlannerStats,
  PlanList,
  AddPlanFAB,
  PlanSummary,
} from '@/components/planner'

export default function PlannerPage() {
  const { data, loading } = useDashboard()

  // Memoize transformed data
  const { plans, stats } = useMemo(() => {
    if (!data?.plans) {
      return { 
        plans: [], 
        stats: { totalPlans: 0, activePlans: 0, completedPlans: 0, totalHours: 0 } 
      }
    }

    // Transform plans
    const plans: PlanSummary[] = data.plans.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type || 'custom',
      status: p.status || 'active',
      startDate: p.startDate,
      endDate: p.endDate,
      completedTopics: p.completedTopics || 0,
      totalTopics: p.totalTopics || 0,
      totalEstimatedHours: p.totalEstimatedHours || 0,
      color: p.color,
    }))

    // Calculate stats
    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter((p) => p.status === 'active').length,
      completedPlans: plans.filter((p) => p.status === 'completed').length,
      totalHours: plans.reduce((sum, p) => sum + (p.totalEstimatedHours || 0), 0),
    }

    return { plans, stats }
  }, [data?.plans])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-xl bg-bg-surface animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-bg-surface animate-pulse" />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header with gradient banner */}
      <PlannerHeader totalPlans={stats.totalPlans} activePlans={stats.activePlans} />

      {/* Stats overview */}
      {stats.totalPlans > 0 && (
        <PlannerStats
          totalPlans={stats.totalPlans}
          activePlans={stats.activePlans}
          completedPlans={stats.completedPlans}
          totalHours={stats.totalHours}
        />
      )}

      {/* Plan list */}
      <PlanList plans={plans} />

      {/* FAB for mobile */}
      <AddPlanFAB />
    </div>
  )
}
