'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Target, Clock, Flag, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useMemo, useState, useCallback, useEffect, useRef, forwardRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  todayLogs: HabitLog[]
  weeklyLogs: HabitLog[]
  onToggle: (habitId: string) => Promise<void>
  onEdit: (habit: Habit) => void
  onDelete: (habitId: string) => Promise<void>
}

const HabitCard = forwardRef<HTMLDivElement, HabitCardProps>(function HabitCard({ habit, todayLogs, weeklyLogs, onToggle, onEdit, onDelete }, ref) {
  const today = new Date().toISOString().split('T')[0]
  // Local optimistic state — flips instantly on click, independent of SWR propagation
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const { isCompleted, last7Days, dotsLogs } = useMemo(() => {
    const todayLog = todayLogs.find((l) => l.habitId === habit.id)
    const dotsLogs = weeklyLogs.filter((l) => l.habitId === habit.id)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    return { dotsLogs, isCompleted: todayLog?.status === 'done', last7Days: last7 }
  }, [todayLogs, weeklyLogs, habit.id, today])

  // Use optimistic state while the API is in-flight, otherwise use SWR-derived value
  const displayChecked = optimisticChecked !== null ? optimisticChecked : isCompleted

  // Once SWR cache matches our optimistic value, hand control back to SWR
  useEffect(() => {
    if (optimisticChecked !== null && optimisticChecked === isCompleted) {
      setOptimisticChecked(null)
    }
  }, [isCompleted, optimisticChecked])

  // Auto-dismiss delete confirm after 4 seconds of no action
  useEffect(() => {
    if (deleteConfirm) {
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(false), 4000)
    }
    return () => clearTimeout(deleteTimerRef.current)
  }, [deleteConfirm])

  const handleToggle = useCallback(async () => {
    const next = !displayChecked
    setOptimisticChecked(next) // instant visual flip
    try {
      await onToggle(habit.id)
    } catch {
      setOptimisticChecked(null) // rollback on error only
    }
    // Do NOT clear optimisticChecked on success — SWR cache is updated in the
    // background. Keep local state until the next render confirms the SWR value
    // matches, then clear it to hand control back to SWR.
  }, [displayChecked, habit.id, onToggle])

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true)
    try {
      await onDelete(habit.id)
    } catch {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }, [habit.id, onDelete])

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        y: isDeleting ? -8 : 0,
        x: isDeleting ? 20 : 0,
        scale: isDeleting ? 0.97 : 1,
      }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card
        className={`bg-bg-surface border-bg-elevated hover:shadow-lg transition-all overflow-hidden ${
          deleteConfirm ? 'border-accent-red/40 shadow-accent-red/10 shadow-md' : ''
        }`}
      >
        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          {/* Checkbox */}
          <AnimatedCheckbox
            checked={displayChecked}
            onChange={handleToggle}
            variant="green"
            className="flex-shrink-0"
          />

          {/* Icon */}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <span className="text-base sm:text-lg">{habit.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3
                className={`font-semibold text-sm truncate ${
                  displayChecked ? 'line-through text-text-muted' : 'text-text-primary'
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
                animate={{ width: displayChecked ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
              const log = dotsLogs.find((l) => l.date === date)
              const dotColor =
                log?.status === 'done'
                  ? 'bg-accent-green'
                  : log?.status === 'missed'
                    ? 'bg-accent-red/50'
                    : 'bg-bg-elevated'
              return <div key={date} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            })}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0 outline-none"
              >
                <MoreHorizontal size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary"
                onClick={() => onEdit(habit)}
              >
                <Pencil size={13} />
                <span className="text-sm">Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-accent-red focus:text-accent-red focus:bg-accent-red/10"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 size={13} />
                <span className="text-sm">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>

        {/* Inline delete confirmation bar */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-3 sm:px-4 pb-3 flex items-center gap-2 border-t border-accent-red/20 bg-accent-red/5 pt-2.5">
                <AlertTriangle size={13} className="text-accent-red flex-shrink-0" />
                <span className="text-xs text-accent-red flex-1">Delete this habit?</span>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded-md text-xs text-text-muted bg-bg-elevated hover:bg-bg-elevated/80 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-accent-red hover:bg-accent-red/90 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

interface HabitListProps {
  habits: Habit[]
  todayLogs: HabitLog[]
  weeklyLogs: HabitLog[]
  onToggle: (habitId: string) => Promise<void>
  onEdit: (habit: Habit) => void
  onDelete: (habitId: string) => Promise<void>
}

export function HabitList({ habits, todayLogs, weeklyLogs, onToggle, onEdit, onDelete }: HabitListProps) {
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} todayLogs={todayLogs} weeklyLogs={weeklyLogs} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
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
