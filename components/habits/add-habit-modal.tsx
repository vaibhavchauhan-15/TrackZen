'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const emojiOptions = ['🎯', '🧘', '📖', '💪', '💧', '✍️', '🏃', '🧠', '💤', '🥗', '🎵', '📱', '🌅', '🧹', '🚀']
const colorOptions = ['#7C3AED', '#10B981', '#EF4444', '#F59E0B', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#3B82F6']
const categoryOptions = ['Health', 'Fitness', 'Learning', 'Productivity', 'Wellness', 'Finance', 'Social', 'Custom']

interface AddHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (habit: any) => Promise<void>
}

export function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#7C3AED')
  const [category, setCategory] = useState('Health')
  const [timeSlot, setTimeSlot] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || null,
        icon,
        frequency,
        priority,
        color,
        category,
        timeSlot: timeSlot || null,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setFrequency('daily')
      setPriority(2)
      setIcon('🎯')
      setColor('#7C3AED')
      setCategory('Health')
      setTimeSlot('')
      onClose()
    } catch (error) {
      console.error('Failed to add habit:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-surface border-l border-bg-elevated z-50 overflow-y-auto"
          >
            <div className="p-5 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">New Habit</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
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
                      <button
                        key={e}
                        onClick={() => setIcon(e)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                          icon === e
                            ? 'bg-accent-purple/20 ring-2 ring-accent-purple'
                            : 'bg-bg-elevated hover:bg-bg-elevated/80'
                        }`}
                      >
                        {e}
                      </button>
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
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === c ? 'ring-2 ring-offset-2 ring-offset-bg-surface ring-text-primary scale-110' : 'hover:scale-110'
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
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          category === cat
                            ? 'bg-accent-purple text-white'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {cat}
                      </button>
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
                      <button
                        key={f}
                        onClick={() => setFrequency(f)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          frequency === f
                            ? 'bg-accent-purple text-white'
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {f}
                      </button>
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
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          priority === p.value
                            ? `${p.color} text-white`
                            : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slot */}
                <div>
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Time Slot (Optional)
                  </Label>
                  <Input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="bg-bg-elevated border-bg-elevated text-text-primary focus:ring-accent-purple/50"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || loading}
                  className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold mt-4"
                >
                  {loading ? 'Creating...' : 'Create Habit'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function AddHabitFAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-lg z-40 hover:bg-accent-purple/90 transition-colors"
      style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' }}
    >
      <Plus size={22} className="sm:w-6 sm:h-6" />
    </motion.button>
  )
}
