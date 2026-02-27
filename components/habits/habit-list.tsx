'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Check, Target, Clock, Flag } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Habit, HabitLog } from './types'

const priorityColors: Record<number, string> = {
  1: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  2: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  3: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
}

const priorityLabels: Record<number, string> = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
}

interface HabitCardProps {
  habit: Habit
  logs: HabitLog[]
  onToggle: (habitId: string) => void
}

function HabitCard({ habit, logs, onToggle }: HabitCardProps) {
  const [checked, setChecked] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const { isCompleted, last7Days, habitLogs } = useMemo(() => {
    const habitLogs = logs.filter((l) => l.habitId === habit.id)
    const todayLog = habitLogs.find((l) => l.date === today)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    return { habitLogs, isCompleted: todayLog?.status === 'done', last7Days: last7 }
  }, [logs, habit.id, today])

  const handleToggle = () => {
    setChecked(true)
    setTimeout(() => setChecked(false), 400)
    onToggle(habit.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <Card className="bg-bg-surface border-bg-elevated hover:shadow-lg transition-all">
        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              isCompleted
                ? 'bg-accent-green border-accent-green'
                : 'border-text-muted/30 hover:border-accent-purple'
            } ${checked ? 'scale-95' : ''}`}
          >
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check size={14} className="sm:w-4 sm:h-4 text-white" />
              </motion.div>
            )}
          </button>

          {/* Icon */}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <Target size={18} className="sm:w-5 sm:h-5" style={{ color: habit.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3
                className={`font-semibold text-sm truncate ${
                  isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                }`}
              >
                {habit.title}
              </h3>
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs px-1.5 py-0 ${priorityColors[habit.priority] || priorityColors[3]}`}
              >
                <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                {priorityLabels[habit.priority] || 'Low'}
              </Badge>
            </div>
            {habit.description && (
              <p className="text-xs text-text-muted truncate mb-1">{habit.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              <Badge variant="secondary" className="text-[10px] bg-bg-elevated">
                {habit.category}
              </Badge>
              {habit.timeSlot && (
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-3 h-3" />
                  {habit.timeSlot}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1 bg-bg-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isCompleted ? '100%' : '0%' }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="h-full rounded-full"
                style={{ backgroundColor: habit.color }}
              />
            </div>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-bold text-text-primary">{habit.currentStreak || 0}</span>
            </div>
            <span className="text-[10px] text-text-muted">streak</span>
          </div>

          {/* Last 7 days dots */}
          <div className="hidden sm:flex gap-1 flex-shrink-0">
            {last7Days.map((date) => {
              const log = habitLogs.find((l) => l.date === date)
              const dotColor =
                log?.status === 'done'
                  ? 'bg-accent-green'
                  : log?.status === 'missed'
                    ? 'bg-accent-red/50'
                    : 'bg-bg-elevated'
              return <div key={date} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            })}
          </div>

          {/* Menu button */}
          <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0">
            <MoreHorizontal size={14} className="sm:w-4 sm:h-4" />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface HabitListProps {
  habits: Habit[]
  logs: HabitLog[]
  onToggle: (habitId: string) => void
}

export function HabitList({ habits, logs, onToggle }: HabitListProps) {
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} logs={logs} onToggle={onToggle} />
        ))}
      </AnimatePresence>
      {habits.length === 0 && (
        <Card className="bg-bg-surface border-bg-elevated">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-lg font-medium text-text-secondary">No habits found</p>
            <p className="text-sm text-text-muted mt-1">Add a habit to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
