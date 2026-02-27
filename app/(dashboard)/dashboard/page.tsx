'use client'

import { useMemo } from 'react'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'

// Import optimized dashboard components
import {
  WelcomeSection,
  StreakBanner,
  DashboardStats,
  TodaysFocus,
  ActivePlans,
  HabitRings,
  QuickActions,
  Task,
  Plan,
  HabitSummary,
} from '@/components/dashboard'

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  // Memoize transformed data
  const { tasks, plans, habits, userName, stats } = useMemo(() => {
    if (!data) {
      return { tasks: [], plans: [], habits: [], userName: 'there', stats: null }
    }

    const { summary, user } = data

    // Transform tasks
    const tasks: Task[] = (summary.todayTasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      estimatedHours: t.estimatedHours || 0,
      completed: t.status === 'completed',
      priority: t.priority || 'medium',
      planTitle: t.planTitle,
    }))

    // Transform plans
    const plans: Plan[] = (summary.activePlans || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      completion: p.completion || Math.round((p.completedTopics / p.totalTopics) * 100) || 0,
      color: p.color,
      endDate: p.endDate,
    }))

    // Transform habits
    const habits: HabitSummary[] = (summary.todayHabits || []).map((h: any) => ({
      id: h.id,
      title: h.title,
      completed: h.completed,
      color: h.color,
    }))

    return {
      tasks,
      plans,
      habits,
      userName: user?.name?.split(' ')[0] || 'there',
      stats: {
        streak: summary.streak || 0,
        weeklyHours: summary.weeklyHours || 0,
        habitsCompleted: summary.habitsCompleted || 0,
        totalHabits: summary.todayHabits?.length || 0,
        nextExamDays: summary.nextExamDays,
      },
    }
  }, [data])

  if (loading || !data || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-lg bg-bg-surface animate-pulse" />
        <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-surface animate-pulse" />
          ))}
        </div>
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

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Section */}
      <WelcomeSection userName={userName} />

      {/* Streak Banner */}
      <StreakBanner streak={stats.streak} />

      {/* Quick Stats */}
      <DashboardStats
        weeklyHours={stats.weeklyHours}
        habitsCompleted={stats.habitsCompleted}
        totalHabits={stats.totalHabits}
        nextExamDays={stats.nextExamDays}
        streak={stats.streak}
      />

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Today's Focus & Active Plans */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <TodaysFocus tasks={tasks} />
          <ActivePlans plans={plans} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <HabitRings habits={habits} />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
