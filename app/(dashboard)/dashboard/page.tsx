'use client'

import { lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'
import {
  Flame,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-lg bg-bg-surface animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton count={4} />
        </div>
      </div>
    )
  }

  const { summary, user } = data
  const userName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-text-primary">
          Welcome back, {userName}! 👋
        </h1>
        <p className="mt-2 text-text-secondary">
          Here's your productivity overview for today
        </p>
      </div>

      {/* Streak Banner */}
      <StreakBanner streak={summary.streak} />

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Study Hours This Week"
          value={`${summary.weeklyHours}h`}
          trend="+12%"
          color="accent-purple"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Habits Completed Today"
          value={`${summary.habitsCompleted}/${summary.todayHabits.length}`}
          color="accent-green"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Days Till Next Exam"
          value={summary.nextExamDays !== null ? `${summary.nextExamDays}` : 'None'}
          color="accent-orange"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Longest Streak"
          value={`${summary.streak} days`}
          color="streak-gold"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Focus */}
        <div className="lg:col-span-2 space-y-6">
          <TodaysFocus tasks={summary.todayTasks} />
          <ActivePlans plans={summary.activePlans} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <HabitRings habits={summary.todayHabits} />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

function StreakBanner({ streak }: { streak: number }) {
  const getStreakColor = (days: number) => {
    if (days === 0) return 'from-gray-500 to-gray-600'
    if (days <= 2) return 'from-red-500 to-red-600'
    if (days <= 6) return 'from-orange-500 to-orange-600'
    if (days <= 13) return 'from-yellow-500 to-yellow-600'
    if (days <= 29) return 'from-purple-500 to-purple-600'
    return 'from-cyan-500 to-cyan-600'
  }

  const getStreakTitle = (days: number) => {
    if (days === 0) return 'No Streak'
    if (days <= 2) return 'Getting Started'
    if (days <= 6) return 'On a Roll'
    if (days <= 13) return 'One Week Strong'
    if (days <= 29) return 'Two Weeks Warrior'
    return 'Unstoppable'
  }

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden rounded-xl bg-gradient-to-r ${getStreakColor(
        streak
      )} p-6 text-white`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{getStreakTitle(streak)}</p>
          <h2 className="mt-1 text-4xl font-bold">{streak} Day Streak</h2>
        </div>
        <div className="animate-pulse">
          <Flame className="h-16 w-16" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  color: string
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1 duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg bg-${color}/10 p-3 text-${color}`}>{icon}</div>
          {trend && (
            <Badge variant="secondary" className="text-accent-green">
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TodaysFocus({ tasks }: { tasks: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Top priority topics for today</CardDescription>
          </div>
          <Link href="/planner">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="py-8 text-center">
            <Target className="mx-auto h-12 w-12 text-text-muted" />
            <p className="mt-4 text-sm text-text-secondary">No tasks scheduled for today</p>
            <Link href="/planner/new">
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-in fade-in slide-in-from-left-2 duration-300 flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-bg-elevated transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button className="flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-accent-green" />
                  ) : (
                    <Circle className="h-5 w-5 text-text-muted" />
                  )}
                </button>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{task.title}</p>
                  <p className="text-sm text-text-secondary">{task.estimatedHours}h estimated</p>
                </div>
                <Badge variant="secondary">{task.priority}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivePlans({ plans }: { plans: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Plans</CardTitle>
            <CardDescription>Your ongoing study plans</CardDescription>
          </div>
          <Link href="/planner">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-text-muted" />
            <p className="mt-4 text-sm text-text-secondary">No active plans</p>
            <Link href="/planner/new">
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Link key={plan.id} href={`/planner/${plan.id}`}>
                <div className="rounded-lg border border-border p-4 hover:bg-bg-elevated transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-text-primary">{plan.title}</h4>
                      <p className="text-sm text-text-secondary mt-1">{plan.type}</p>
                    </div>
                    <Badge>{plan.completion}%</Badge>
                  </div>
                  <Progress value={plan.completion} className="h-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HabitRings({ habits }: { habits: any[] }) {
  const overallCompletion =
    habits.length > 0
      ? Math.round((habits.filter((h) => h.completed).length / habits.length) * 100)
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Habits</CardTitle>
        <CardDescription>Complete your daily routines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-bg-elevated"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallCompletion / 100)}`}
                className="text-accent-purple transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-text-primary">{overallCompletion}%</span>
              <span className="text-xs text-text-secondary">Complete</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {habits.slice(0, 5).map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between rounded-lg bg-bg-elevated p-2"
            >
              <span className="text-sm text-text-primary">{habit.title}</span>
              {habit.completed ? (
                <CheckCircle2 className="h-5 w-5 text-accent-green" />
              ) : (
                <Circle className="h-5 w-5 text-text-muted" />
              )}
            </div>
          ))}
        </div>
        <Link href="/habits">
          <Button className="mt-4 w-full" variant="outline">
            View All Habits
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/planner/new">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Button>
        </Link>
        <Link href="/habits">
          <Button className="w-full justify-start" variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Log Habits
          </Button>
        </Link>
        <Link href="/analytics">
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
