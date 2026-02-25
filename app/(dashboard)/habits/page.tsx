'use client'

import { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { Target, Plus, CheckCircle2, Circle, TrendingUp, Clock, Flag } from 'lucide-react'
import Link from 'next/link'

// Lazy load the HabitDialog for better initial page load
const HabitDialog = lazy(() => import('@/components/habits/habit-dialog').then(mod => ({ default: mod.HabitDialog })))

export default function HabitsPage() {
  const { data, loading, updateHabits, refetch } = useDashboard()
  const [dialogOpen, setDialogOpen] = useState(false)

  const habits = data?.habits || []
  const todayLogs = data?.todayLogs || {}

  const toggleHabit = async (habitId: string) => {
    try {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          status: todayLogs[habitId]?.status === 'done' ? 'missed' : 'done',
          date: new Date().toISOString().split('T')[0],
        }),
      })
      const result = await res.json()
      if (result.success) {
        // Update local state
        const updatedLogs = {
          ...todayLogs,
          [habitId]: result.log,
        }
        updateHabits(habits, updatedLogs)
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error)
    }
  }

  const completedToday = Object.values(todayLogs).filter((log) => log.status === 'done').length
  const totalToday = habits.filter((h: any) => h.isActive).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-lg bg-bg-surface animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton count={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Habit Tracker</h1>
          <p className="mt-2 text-text-secondary">
            Build consistent routines and track your daily habits
          </p>
        </div>
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          New Habit
        </Button>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>
                {completedToday} of {totalToday} habits completed
              </CardDescription>
            </div>
            <Link href="/habits/progress">
              <Button variant="ghost" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(completedToday / (totalToday || 1)) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Habits List */}
      {habits.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <Target className="h-16 w-16 text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No habits yet</h3>
            <p className="text-text-secondary mb-6">
              Create your first habit to start building consistency
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit: any, index: number) => {
            const log = todayLogs[habit.id]
            const isCompleted = log?.status === 'done'

            return (
              <div
                key={habit.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text-primary">{habit.title}</h3>
                          {habit.priority && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: habit.priority === 1 ? '#ef4444' : 
                                            habit.priority === 2 ? '#f97316' : '#64748b' 
                              }}
                            >
                              <Flag className="h-3 w-3 mr-1" />
                              P{habit.priority}
                            </Badge>
                          )}
                        </div>
                        {habit.description && (
                          <p className="text-sm text-text-muted mb-2">{habit.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <span>{habit.category}</span>
                          {habit.timeSlot && (
                            <>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{habit.timeSlot}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className="flex-shrink-0 ml-4"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-8 w-8 text-accent-green" />
                        ) : (
                          <Circle className="h-8 w-8 text-text-muted hover:text-accent-green transition-colors" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{habit.frequency}</Badge>
                      <Badge variant="outline">
                        {habit.currentStreak || 0} day streak
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Habit Creation Dialog */}
      <Suspense fallback={<div />}>
        {dialogOpen && (
          <HabitDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={refetch}
          />
        )}
      </Suspense>
    </div>
  )
}
