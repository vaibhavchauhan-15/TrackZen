'use client'

import { useDashboard } from '@/components/providers/dashboard-provider'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AnalyticsRow } from '@/components/dashboard/analytics-row'
import { PlannerOverview } from '@/components/dashboard/planner-overview'
import { HabitOverview } from '@/components/dashboard/habit-overview'

// ── Skeleton ──────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-6 animate-pulse">
      {/* Header + streak card skeleton */}
      <div className="h-48 rounded-2xl bg-bg-surface" />

      {/* Analytics row skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-20 rounded-xl bg-bg-surface" />
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-72 rounded-xl bg-bg-surface" />
        <div className="h-72 rounded-xl bg-bg-surface" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const { streak, analytics, plannerOverview, habitOverview } = data

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* 🌅 Greeting Header with streak info */}
      <DashboardHeader streak={streak} />

      {/* 📊 Analytics Row */}
      <AnalyticsRow analytics={analytics} />

      {/* 📅 Planner + 🎯 Habit Overview */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Planner Overview — 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <PlannerOverview
            todaysTopics={plannerOverview.todaysTopics}
            recentPlans={plannerOverview.recentPlans}
          />
        </div>

        {/* Habit Overview — 1/3 width on desktop */}
        <div>
          <HabitOverview
            todaysHabits={habitOverview.todaysHabits}
            recentHabits={habitOverview.recentHabits}
          />
        </div>
      </div>
    </div>
  )
}
