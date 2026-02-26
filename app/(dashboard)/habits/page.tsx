'use client'

import { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { useLogHabit } from '@/lib/hooks/use-swr-api'
import { Target, Plus, CheckCircle2, Circle, TrendingUp, Clock, Flag } from 'lucide-react'
import Link from 'next/link'

// Lazy load the HabitDialog for better initial page load
const HabitDialog = lazy(() => import('@/components/habits/habit-dialog').then(mod => ({ default: mod.HabitDialog })))

export default function HabitsPage() {
  const { data, loading, refetch } = useDashboard()
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Use SWR mutation for logging habits with optimistic updates
  const { trigger: logHabit, isMutating } = useLogHabit()

  const habits = data?.habits || []
  const todayLogs = data?.todayLogs || {}

  const toggleHabit = async (habitId: string) => {
    const currentStatus = todayLogs[habitId]?.status
    const newStatus = currentStatus === 'done' ? 'missed' : 'done'
    
    try {
      // Optimistic update will be handled by SWR
      await logHabit({
        habitId,
        status: newStatus,
        date: new Date().toISOString().split('T')[0],
      })
    } catch (error) {
      console.error('Failed to toggle habit:', error)
      // SWR will automatically rollback on error
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Habit Tracker</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
            Build consistent routines and track your daily habits
          </p>
        </div>
        <Button size="default" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          New Habit
        </Button>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Today's Progress</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {completedToday} of {totalToday} habits completed
              </CardDescription>
            </div>
            <Link href="/habits/progress">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">
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
        <Card className="py-12 sm:py-16">
          <CardContent className="flex flex-col items-center text-center px-4">
            <Target className="h-12 w-12 sm:h-16 sm:w-16 text-text-muted mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">No habits yet</h3>
            <p className="text-sm sm:text-base text-text-secondary mb-6">
              Create your first habit to start building consistency
            </p>
            <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-text-primary text-sm sm:text-base">{habit.title}</h3>
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
                          <p className="text-xs sm:text-sm text-text-muted mb-2 line-clamp-2">{habit.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary flex-wrap">
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
                        className="flex-shrink-0 ml-2 sm:ml-4"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-accent-green" />
                        ) : (
                          <Circle className="h-7 w-7 sm:h-8 sm:w-8 text-text-muted hover:text-accent-green transition-colors" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{habit.frequency}</Badge>
                      <Badge variant="outline" className="text-xs">
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
