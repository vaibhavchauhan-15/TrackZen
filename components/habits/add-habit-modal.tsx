'use client'

/**
 * HabitModal — unified create + edit panel
 *
 * Create mode: pass no `habit` prop (or null). Shows "New Habit" header,
 *              "Create Habit" button, resets form on close.
 * Edit   mode: pass a `habit` object. Shows "Edit Habit" header,
 *              "Save Changes" button, pre-populates form from the habit.
 *
 * The `onSave` callback receives `(data, habitId?)`.
 * If `habitId` is present it's an update, otherwise it's a create.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FloatingAddButton } from '@/components/ui/floating-add-button'
import { ClockTimePicker } from '@/components/ui/clock-time-picker'
import { Habit } from './types'

const emojiOptions = ['🎯', '🧘', '📖', '💪', '💧', '✍️', '🏃', '🧠', '💤', '🥗', '🎵', '📱', '🌅', '🧹', '🚀']
const colorOptions = ['#7C3AED', '#10B981', '#EF4444', '#F59E0B', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#3B82F6']
const categoryOptions = ['Health', 'Fitness', 'Learning', 'Productivity', 'Wellness', 'Finance', 'Social', 'Custom']

const DEFAULTS = {
  title: '',
  description: '',
  frequency: 'daily' as const,
  priority: 2 as 1 | 2 | 3,
  icon: '🎯',
  color: '#7C3AED',
  category: 'Health',
  timeSlot: '',
}

// ─── Form data type ───────────────────────────────────────────────────────────

interface HabitFormData {
  title: string
  description: string
  icon: string
  frequency: 'daily' | 'weekly' | 'monthly'
  priority: 1 | 2 | 3
  color: string
  category: string
  timeSlot: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitModalProps {
  isOpen: boolean
  onClose: () => void
  /** Passing a habit switches to edit mode; omit / pass null for create mode */
  habit?: Habit | null
  onSave: (data: HabitFormData, habitId?: string) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitModal({ isOpen, onClose, habit, onSave }: HabitModalProps) {
  const isEdit = !!habit

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(DEFAULTS.title)
  const [description, setDescription] = useState(DEFAULTS.description)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(DEFAULTS.frequency)
  const [priority, setPriority] = useState<1 | 2 | 3>(DEFAULTS.priority)
  const [icon, setIcon] = useState(DEFAULTS.icon)
  const [color, setColor] = useState(DEFAULTS.color)
  const [category, setCategory] = useState(DEFAULTS.category)
  const [timeSlot, setTimeSlot] = useState(DEFAULTS.timeSlot)

  // Populate / reset form whenever the target habit changes
  useEffect(() => {
    if (habit) {
      setTitle(habit.title)
      setDescription(habit.description || '')
      setFrequency(habit.frequency)
      setPriority((habit.priority as 1 | 2 | 3) || 2)
      setIcon(habit.icon)
      setColor(habit.color)
      setCategory(habit.category)
      setTimeSlot(habit.timeSlot || '')
    } else {
      setTitle(DEFAULTS.title)
      setDescription(DEFAULTS.description)
      setFrequency(DEFAULTS.frequency)
      setPriority(DEFAULTS.priority)
      setIcon(DEFAULTS.icon)
      setColor(DEFAULTS.color)
      setCategory(DEFAULTS.category)
      setTimeSlot(DEFAULTS.timeSlot)
    }
  }, [habit])

  const handleClose = useCallback(() => {
    if (!isEdit) {
      // Reset create-mode form so it's clean next time
      setTitle(DEFAULTS.title)
      setDescription(DEFAULTS.description)
      setFrequency(DEFAULTS.frequency)
      setPriority(DEFAULTS.priority)
      setIcon(DEFAULTS.icon)
      setColor(DEFAULTS.color)
      setCategory(DEFAULTS.category)
      setTimeSlot(DEFAULTS.timeSlot)
    }
    onClose()
  }, [isEdit, onClose])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || '',
          icon,
          frequency,
          priority,
          color,
          category,
          timeSlot,
        },
        habit?.id,
      )
      handleClose()
    } catch (err) {
      console.error(isEdit ? 'Failed to update habit:' : 'Failed to create habit:', err)
    } finally {
      setLoading(false)
    }
  }, [title, description, icon, frequency, priority, color, category, timeSlot, habit?.id, isEdit, onSave, handleClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-surface border-l border-bg-elevated z-[60] overflow-y-auto"
          >
            <div className="p-5 sm:p-6 pb-24 sm:pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {isEdit ? 'Edit Habit' : 'New Habit'}
                  </h2>
                  {isEdit && (
                    <p className="text-xs text-text-muted mt-0.5">Update your habit details</p>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Habit Name *
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning Meditation"
                    maxLength={60}
                    autoFocus={isOpen}
                    className="bg-bg-elevated border-bg-elevated text-text-primary placeholder:text-text-muted focus:ring-accent-purple/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    maxLength={200}
                    rows={2}
                    className="bg-bg-elevated border-bg-elevated text-text-primary placeholder:text-text-muted focus:ring-accent-purple/50 resize-none"
                  />
                </div>

                {/* Icon */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Icon
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((e) => (
                      <motion.button
                        key={e}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setIcon(e)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                          icon === e
                            ? 'bg-accent-purple/20 ring-2 ring-accent-purple'
                            : 'bg-bg-elevated hover:bg-bg-elevated/80'
                        }`}
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Color Tag
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((c) => (
                      <motion.button
                        key={c}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === c
                            ? 'ring-2 ring-offset-2 ring-offset-bg-surface ring-text-primary scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Category
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {categoryOptions.map((cat) => (
                      <motion.button
                        key={cat}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          category === cat
                            ? 'bg-accent-purple text-white'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Frequency
                  </Label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                      <motion.button
                        key={f}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFrequency(f)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          frequency === f
                            ? 'bg-accent-purple text-white'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {f}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Priority
                  </Label>
                  <div className="flex gap-2">
                    {([
                      { value: 1, label: 'High', color: 'bg-accent-red' },
                      { value: 2, label: 'Medium', color: 'bg-accent-orange' },
                      { value: 3, label: 'Low', color: 'bg-accent-purple' },
                    ] as const).map((p) => (
                      <motion.button
                        key={p.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          priority === p.value
                            ? `${p.color} text-white`
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {p.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Slot */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Time Slot (Optional)
                  </Label>
                  <ClockTimePicker
                    value={timeSlot}
                    onChange={setTimeSlot}
                  />
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-3 mt-4 ${isEdit ? '' : ''}`}>
                  {isEdit && (
                    <Button
                      onClick={handleClose}
                      variant="ghost"
                      className="flex-1 py-3 bg-bg-elevated text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || loading}
                    className={`${isEdit ? 'flex-1' : 'w-full'} py-3 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold`}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {isEdit ? 'Saving…' : 'Creating…'}
                      </motion.span>
                    ) : isEdit ? (
                      <span className="flex items-center justify-center gap-2">
                        <Save size={14} />
                        Save Changes
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={14} />
                        Create Habit
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Keep legacy named exports so existing imports don't break
export { HabitModal as AddHabitModal }

export function AddHabitFAB({ onClick }: { onClick: () => void }) {
  return <FloatingAddButton onClick={onClick} title="Add New Habit" />
}
