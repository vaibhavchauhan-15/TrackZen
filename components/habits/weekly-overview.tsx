'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Habit, HabitLog } from './types'

// Stable day-name lookup — avoids locale-dependent toLocaleDateString which
// can produce different strings on the Node.js server vs the browser (ICU
// version mismatch) and therefore trigger a React hydration error.
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface WeeklyOverviewProps {
  habits: Habit[]
  logs: HabitLog[]
}

export function WeeklyOverview({ habits, logs }: WeeklyOverviewProps) {
  // Defer today to client-side to prevent hydration mismatch when the
  // server UTC date differs from the browser's local date.
  const [today, setToday] = useState('')
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
  }, [])

  const { dayRates, weekAvg, topHabits } = useMemo(() => {
    const active = habits.filter((h) => h.isActive)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toISOString().split('T')[0],
        // Use stable lookup instead of toLocaleDateString to avoid ICU mismatch
        dayName: SHORT_DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
      }
    })

    const dayRates = days.map((day) => {
      const dayLogs = logs.filter((l) => l.date === day.date)
      const completed = dayLogs.filter((l) => l.status === 'done').length
      return {
        ...day,
        rate: active.length > 0 ? Math.round((completed / active.length) * 100) : 0,
      }
    })

    const weekAvg = Math.round(dayRates.reduce((a, b) => a + b.rate, 0) / 7)
    const topHabits = [...active].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)).slice(0, 3)

    return { dayRates, weekAvg, topHabits }
  }, [habits, logs])

  const isToday = (date: string) => today !== '' && date === today

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card className="bg-bg-surface border-bg-elevated">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Weekly Overview</h3>
              <span className="text-xs text-text-muted">{weekAvg}% avg</span>
            </div>
            <div className="flex items-end gap-1.5 sm:gap-2 h-20 sm:h-24">
              {dayRates.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-bg-elevated rounded-md overflow-hidden relative"
                    style={{ height: '64px' }}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${day.rate}%` }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className={`absolute bottom-0 w-full rounded-md ${isToday(day.date) ? 'bg-accent-purple' : 'bg-accent-purple/40'
                        }`}
                    />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] font-medium ${isToday(day.date) ? 'text-accent-purple' : 'text-text-muted'
                      }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      >
        <Card className="bg-bg-surface border-bg-elevated">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Top Streaks</h3>
            <div className="space-y-3">
              {topHabits.length > 0 ? (
                topHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <span className="text-sm">{habit.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{habit.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {(habit.currentStreak || 0) > 0 ? (
                          <TrendingUp size={12} className="text-accent-green" />
                        ) : (
                          <TrendingDown size={12} className="text-accent-red" />
                        )}
                        <span className="text-xs text-text-muted">
                          {habit.currentStreak || 0} day streak
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-text-primary flex-shrink-0">
                      🔥 {habit.currentStreak || 0}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-4">No habits yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
