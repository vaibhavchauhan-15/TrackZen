'use client'

import { useState, useEffect } from 'react'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AnalyticsRow } from '@/components/dashboard/analytics-row'
import { PlannerOverview } from '@/components/dashboard/planner-overview'
import { HabitOverview } from '@/components/dashboard/habit-overview'

// ── Skeleton ──────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-5 animate-pulse">
      {/* Header + streak card skeleton */}
      <div className="h-44 sm:h-48 rounded-2xl bg-bg-surface" />

      {/* Analytics row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 h-[72px] sm:h-20 rounded-xl bg-bg-surface" />
        <div className="h-[72px] sm:h-20 rounded-xl bg-bg-surface" />
        <div className="h-[72px] sm:h-20 rounded-xl bg-bg-surface" />
      </div>

      {/* Main grid skeleton */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 sm:h-72 rounded-xl bg-bg-surface" />
        <div className="h-64 sm:h-72 rounded-xl bg-bg-surface" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, loading } = useDashboard()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render skeleton until hydration is complete.
  // This prevents a mismatch when SWR has cached data on the client
  // but the server rendered the skeleton (loading=true, data=null).
  if (!mounted || loading || !data) {
    return <DashboardSkeleton />
  }

  const { streak, analytics, plannerOverview, habitOverview } = data

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 🌅 Greeting Header with streak info */}
      <DashboardHeader streak={streak} />

      {/* 📊 Analytics Row */}
      <AnalyticsRow analytics={analytics} />

      {/* 📅 Planner + 🎯 Habit Overview */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-3">
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
