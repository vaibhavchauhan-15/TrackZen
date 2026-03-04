'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Target, CheckCircle2, Circle, Minus, ArrowRight, Sparkles, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DashboardHabit, DashboardRecentHabit } from '@/components/providers/dashboard-provider'

interface HabitOverviewProps {
  todaysHabits: DashboardHabit[]
  recentHabits: DashboardRecentHabit[]
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  done:    <CheckCircle2 className="h-4 w-4 text-accent-green" aria-label="Done" />,
  missed:  <Minus        className="h-4 w-4 text-accent-red"   aria-label="Missed" />,
  skipped: <Minus        className="h-4 w-4 text-text-muted"   aria-label="Skipped" />,
}

function StatusIcon({ status }: { status: string | null }) {
  if (!status) return <Circle className="h-4 w-4 text-text-muted/50" aria-label="Not logged" />
  return (STATUS_ICON[status] ?? <Circle className="h-4 w-4 text-text-muted/50" />) as React.ReactElement
}

export function HabitOverview({ todaysHabits, recentHabits }: HabitOverviewProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent-cyan" aria-hidden />
            <h2 className="text-sm font-semibold text-text-primary">Habit Overview</h2>
          </div>
          <button
            onClick={() => router.push('/habits')}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-cyan transition-colors duration-200 group"
            aria-label="View all habits"
          >
            View All
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </button>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 flex-1 space-y-4 sm:space-y-5">
          {/* Today's Habits */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Today
              </h3>
            </div>
            {todaysHabits.length === 0 ? (
              <p className="text-xs text-text-muted pl-1">No habits scheduled today.</p>
            ) : (
              <ul className="space-y-1.5" role="list">
                {todaysHabits.map((habit, i) => (
                  <motion.li
                    key={habit.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: 0.18 + i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2"
                  >
                    {/* Color dot */}
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                      aria-hidden
                    />
                    <p className="flex-1 text-xs font-medium text-text-primary truncate">
                      {habit.title}
                    </p>
                    <StatusIcon status={habit.todayStatus} />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-border/60" aria-hidden />

          {/* Recently Added */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Recently Added
              </h3>
            </div>
            {recentHabits.length === 0 ? (
              <p className="text-xs text-text-muted pl-1">No habits yet.</p>
            ) : (
              <ul className="space-y-1.5" role="list">
                {recentHabits.map((habit, i) => (
                  <motion.li
                    key={habit.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: 0.22 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2"
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                      aria-hidden
                    />
                    <p className="flex-1 text-xs font-medium text-text-primary truncate">
                      {habit.title}
                    </p>
                    <Clock className="h-3.5 w-3.5 text-text-muted/40 flex-shrink-0" aria-hidden />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </motion.div>
  )
}
