'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Edit2,
  Trash2,
  Plus,
  RotateCcw,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Topic {
  id: string
  title: string
  estimatedHours: number
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  scheduledDate: string | null
  subtopics?: Topic[]
}

interface TimelineCalendarProps {
  startDate: string
  endDate: string | null
  topics: Topic[]
  planId: string
  dailyHours: number | null
  onTopicsUpdate: () => void
}

interface DayData {
  date: Date
  dateStr: string
  topics: Topic[]
  isToday: boolean
  isPast: boolean
  isWeekend: boolean
}

export function TimelineCalendar({
  startDate,
  endDate,
  topics,
  planId,
  dailyHours,
  onTopicsUpdate,
}: TimelineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate))
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [draggedTopic, setDraggedTopic] = useState<Topic | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [editDate, setEditDate] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedMobileDate, setSelectedMobileDate] = useState<string | null>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'week' | 'month'>('week')
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useState<NodeJS.Timeout | null>(null)[0]
  const hasDistributedRef = useRef(false)
  const topicsHashRef = useRef('')

  // Distribute topics only once on initial load if there are unscheduled topics
  useEffect(() => {
    const unscheduledTopics = getAllTopics().filter(
      (t) => !t.scheduledDate && t.status !== 'completed'
    )
    
    // Create a hash of unscheduled topic IDs to detect changes
    const topicsHash = unscheduledTopics.map(t => t.id).sort().join(',')
    
    // Only distribute if:
    // 1. We haven't distributed yet, OR
    // 2. The set of unscheduled topics has changed
    if (unscheduledTopics.length > 0 && topicsHash !== topicsHashRef.current) {
      topicsHashRef.current = topicsHash
      if (!hasDistributedRef.current) {
        hasDistributedRef.current = true
        distributeTopics()
      }
    }
  }, [topics])

  const distributeTopics = async () => {
    const unscheduledTopics = getAllTopics().filter((t) => !t.scheduledDate && t.status !== 'completed')
    
    if (unscheduledTopics.length === 0) return

    setIsDistributing(true)
    
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
    
    // Sort by priority: high -> medium -> low
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const sortedTopics = [...unscheduledTopics].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    )

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const hoursPerDay = dailyHours || 6 // Default to 6 hours if not specified
    
    let currentDate = new Date(start)
    let currentDayHours = 0

    // Prepare bulk update data
    const schedules: { topicId: string; scheduledDate: string }[] = []

    // Distribute topics based on estimated hours
    for (const topic of sortedTopics) {
      // Skip weekends for distribution
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1)
        currentDayHours = 0
      }

      const topicHours = topic.estimatedHours || 1
      
      // If this topic would exceed daily hours, move to next day
      if (currentDayHours + topicHours > hoursPerDay && currentDayHours > 0) {
        currentDate.setDate(currentDate.getDate() + 1)
        currentDayHours = 0
        
        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      const scheduledDate = currentDate.toISOString().split('T')[0]
      schedules.push({ topicId: topic.id, scheduledDate })
      currentDayHours += topicHours
    }

    // Bulk update all schedules
    try {
      setIsSaving(true)
      // TODO: Replace with your data mutation logic (e.g., server actions)
      console.log('Bulk schedule topics:', schedules)
      onTopicsUpdate()
    } catch (error) {
      console.error('Failed to distribute topics:', error)
    } finally {
      setIsSaving(false)
      setIsDistributing(false)
    }
  }

  const handleRedistributeAll = async () => {
    if (!confirm('This will reschedule all incomplete topics. Continue?')) return
    
    setIsDistributing(true)
    hasDistributedRef.current = false // Reset the flag
    
    // First, clear all scheduled dates
    const allTopics = getAllTopics().filter((t) => t.status !== 'completed')
    const clearSchedules = allTopics.map((t) => ({ topicId: t.id, scheduledDate: null }))
    
    try {
      // TODO: Replace with your data mutation logic (e.g., server actions)
      console.log('Clear schedules:', clearSchedules)
      
      // Then redistribute
      await distributeTopics()
    } catch (error) {
      console.error('Failed to redistribute:', error)
      setIsDistributing(false)
    }
  }

  const getAllTopics = (): Topic[] => {
    const allTopics: Topic[] = []
    const collectTopics = (topicList: Topic[]) => {
      topicList.forEach((topic) => {
        allTopics.push(topic)
        if (topic.subtopics && topic.subtopics.length > 0) {
          collectTopics(topic.subtopics)
        }
      })
    }
    collectTopics(topics)
    return allTopics
  }

  const calendarDays = useMemo(() => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days: DayData[] = []
    const current = new Date(start)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const allTopics = getAllTopics()
      const dayTopics = allTopics.filter((t) => t.scheduledDate === dateStr)

      days.push({
        date: new Date(current),
        dateStr,
        topics: dayTopics,
        isToday: dateStr === today.toISOString().split('T')[0],
        isPast: current < today,
        isWeekend: current.getDay() === 0 || current.getDay() === 6,
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDate, endDate, topics])

  const filteredDays = useMemo(() => {
    return calendarDays.filter((day) => {
      const dayMonth = day.date.getMonth()
      const dayYear = day.date.getFullYear()
      return dayMonth === currentMonth.getMonth() && dayYear === currentMonth.getFullYear()
    })
  }, [calendarDays, currentMonth])

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/50'
      case 'in_progress':
        return 'bg-blue-500/10 border-blue-500/50'
      default:
        return 'bg-bg-surface border-border'
    }
  }

  const updateTopicDate = async (topicId: string, newDate: string) => {
    try {
      // TODO: Replace with your data mutation logic (e.g., server actions)
      console.log('Update topic date:', topicId, newDate)
      onTopicsUpdate()
    } catch (error) {
      console.error('Failed to update topic date:', error)
    }
  }

  const updateTopicStatus = async (topicId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      // TODO: Replace with your data mutation logic (e.g., server actions)
      console.log('Update topic status:', topicId, status)
      // Call onTopicsUpdate to refresh the plan data
      onTopicsUpdate()
    } catch (error) {
      console.error('Failed to update topic status:', error)
    }
  }

  const handleToggleComplete = async (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation()
    const newStatus = topic.status === 'completed' ? 'not_started' : 'completed'
    await updateTopicStatus(topic.id, newStatus)
  }

  const handleDragStart = (topic: Topic) => {
    setDraggedTopic(topic)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setHoveredDate(null)
    setDraggedTopic(null)
  }

  const handleDayHover = (dateStr: string | null) => {
    if (draggedTopic) {
      setHoveredDate(dateStr)
    }
  }

  const handleDrop = async (dateStr: string) => {
    if (!draggedTopic) return

    setHoveredDate(null)
    setIsDragging(false)
    setIsSaving(true)
    
    await updateTopicDate(draggedTopic.id, dateStr)
    setDraggedTopic(null)
    setIsSaving(false)
  }

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic)
    setEditDate(topic.scheduledDate || '')
  }

  const handleSaveEdit = async () => {
    if (!editingTopic) return

    await updateTopicDate(editingTopic.id, editDate)
    setEditingTopic(null)
    setEditDate('')
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const allTopics = getAllTopics()
    const scheduled = allTopics.filter((t) => t.scheduledDate).length
    const completed = allTopics.filter((t) => t.status === 'completed').length
    const highPriority = allTopics.filter(
      (t) => t.priority === 'high' && t.status !== 'completed'
    ).length

    return { scheduled, completed, total: allTopics.length, highPriority }
  }, [topics])

  return (
    <>
      <Card className="overflow-hidden bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        {/* Mobile-optimized Header */}
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">Study Timeline </span>Calendar
              </CardTitle>
              <p className="text-xs text-text-secondary mt-1 hidden sm:block">
                Topics distributed by priority across your study period
              </p>
            </div>
            
            {/* Control Buttons - Mobile Optimized */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedistributeAll}
                disabled={isDistributing}
                className="h-8 text-xs px-2 sm:px-3 active:scale-95 transition-transform"
              >
                {isDistributing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Redistributing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3 sm:mr-1.5" />
                    <span className="hidden sm:inline">Redistribute All</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0 active:scale-95 transition-transform"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-2 sm:px-3 text-xs sm:text-sm font-medium min-w-[80px] sm:min-w-[120px] justify-center">
                {currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0 active:scale-95 transition-transform"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 active:scale-95 transition-transform"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Statistics - Mobile Optimized Grid */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mt-3 sm:mt-4">
                  <div className="bg-bg-surface rounded-lg p-2 sm:p-3 border border-border">
                    <div className="text-[10px] sm:text-xs text-text-secondary">Total Topics</div>
                    <div className="text-lg sm:text-2xl font-bold text-text-primary">
                      {stats.total}
                    </div>
                  </div>
                  <div className="bg-bg-surface rounded-lg p-2 sm:p-3 border border-border">
                    <div className="text-[10px] sm:text-xs text-text-secondary">Scheduled</div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-400">
                      {stats.scheduled}
                    </div>
                  </div>
                  <div className="bg-bg-surface rounded-lg p-2 sm:p-3 border border-border">
                    <div className="text-[10px] sm:text-xs text-text-secondary">Completed</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-400">
                      {stats.completed}
                    </div>
                  </div>
                  <div className="bg-bg-surface rounded-lg p-2 sm:p-3 border border-border">
                    <div className="text-[10px] sm:text-xs text-text-secondary">High Priority</div>
                    <div className="text-lg sm:text-2xl font-bold text-red-400">
                      {stats.highPriority}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CardContent className="pt-0 sm:pt-4">
                {/* Mobile Week View - Horizontal Scrollable */}
                <div className="sm:hidden">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div
                        key={`${day}-${i}`}
                        className="text-center text-[10px] font-medium text-text-muted py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Mobile Calendar Grid - Compact */}
                  <div className="grid grid-cols-7 gap-0.5 mb-3">
                    {/* Empty cells for alignment */}
                    {Array.from({
                      length: new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        1
                      ).getDay(),
                    }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Calendar days - Mobile optimized */}
                    {filteredDays.map((day) => {
                      const hasTopics = day.topics.length > 0
                      const isSelected = selectedMobileDate === day.dateStr
                      
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => setSelectedMobileDate(isSelected ? null : day.dateStr)}
                          className={cn(
                            'aspect-square rounded-md flex flex-col items-center justify-center relative transition-all duration-150 active:scale-95',
                            day.isToday
                              ? 'bg-purple-500 text-white font-bold shadow-md'
                              : isSelected
                              ? 'bg-purple-500/30 border-2 border-purple-500'
                              : hasTopics
                              ? 'bg-bg-surface border border-border'
                              : 'border border-transparent',
                            day.isWeekend && !day.isToday && !isSelected && 'opacity-50',
                            day.isPast && !day.isToday && 'opacity-60'
                          )}
                        >
                          <span className={cn(
                            'text-xs font-medium',
                            day.isToday ? 'text-white' : 'text-text-primary'
                          )}>
                            {day.date.getDate()}
                          </span>
                          {/* Topic indicators */}
                          {hasTopics && (
                            <div className="flex gap-0.5 mt-0.5">
                              {day.topics.slice(0, 3).map((t, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'w-1 h-1 rounded-full',
                                    t.priority === 'high' ? 'bg-red-500' :
                                    t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500',
                                    t.status === 'completed' && 'opacity-40'
                                  )}
                                />
                              ))}
                              {day.topics.length > 3 && (
                                <span className="text-[8px] text-text-muted">+{day.topics.length - 3}</span>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected Day Topics - Mobile */}
                  <AnimatePresence mode="wait">
                    {selectedMobileDate && (() => {
                      const selectedDay = filteredDays.find(d => d.dateStr === selectedMobileDate)
                      if (!selectedDay) return null
                      
                      return (
                        <motion.div
                          key={selectedMobileDate}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-bg-surface rounded-xl border border-border p-3 mb-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">
                              {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </div>
                            {selectedDay.topics.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {selectedDay.topics.reduce((acc, t) => acc + (t.estimatedHours || 0), 0).toFixed(1)}h total
                              </Badge>
                            )}
                          </div>
                          
                          {selectedDay.topics.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                              {selectedDay.topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className={cn(
                                    'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
                                    getPriorityColor(topic.priority),
                                    topic.status === 'completed' && 'opacity-60 line-through'
                                  )}
                                >
                                  <button
                                    onClick={(e) => handleToggleComplete(e, topic)}
                                    className="flex-shrink-0 p-0.5 active:scale-90 transition-transform"
                                  >
                                    {topic.status === 'completed' ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-text-muted" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{topic.title}</div>
                                    {topic.estimatedHours > 0 && (
                                      <div className="text-[10px] text-text-muted">{topic.estimatedHours}h</div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                    onClick={() => handleEditTopic(topic)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-xs text-text-muted">
                              No topics scheduled
                            </div>
                          )}
                        </motion.div>
                      )
                    })()}
                  </AnimatePresence>

                  {/* Mobile Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span className="text-text-muted">Today</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-text-muted">High</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-text-muted">Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-text-muted">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500/40" />
                      <span className="text-text-muted">Done</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Calendar View */}
                <div className="hidden sm:block">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-text-secondary py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for alignment */}
            {Array.from({
              length: new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                1
              ).getDay(),
            }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {filteredDays.map((day, index) => (
              <motion.div
                key={day.dateStr}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.0005, duration: 0.05 }}
                className={cn(
                  'aspect-square rounded-lg border-2 p-2 transition-all duration-75 will-change-transform',
                  day.isToday
                    ? 'border-purple-500 bg-purple-500/10'
                    : hoveredDate === day.dateStr
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-border bg-bg-surface',
                  day.isWeekend && 'bg-bg-base opacity-60',
                  'hover:border-purple-400 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                )}
                onMouseEnter={() => handleDayHover(day.dateStr)}
                onMouseLeave={() => handleDayHover(null)}
                onMouseUp={() => draggedTopic && handleDrop(day.dateStr)}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      day.isToday
                        ? 'text-purple-400'
                        : day.isPast
                        ? 'text-text-muted'
                        : 'text-text-primary'
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                  {day.topics.length > 0 && (
                    <div className="text-[10px] text-text-secondary">
                      {day.topics.reduce((acc, t) => acc + (t.estimatedHours || 0), 0).toFixed(1)}h
                    </div>
                  )}
                </div>

                {/* Topics */}
                <div className="space-y-1 overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-purple-500/20 smooth-scroll">
                  <AnimatePresence mode="sync">
                    {day.topics.map((topic) => (
                      <motion.div
                        key={topic.id}
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        dragTransition={{ power: 0, timeConstant: 0 }}
                        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                        onDragStart={() => handleDragStart(topic)}
                        onDragEnd={handleDragEnd}
                        whileDrag={{ scale: 1.08, opacity: 0.7, zIndex: 1000, cursor: 'grabbing' }}
                        whileHover={{ scale: 1.03 }}
                        initial={isDragging ? false : { opacity: 0, scale: 0.95 }}
                        animate={isDragging ? {} : { opacity: 1, scale: 1 }}
                        exit={isDragging ? {} : { opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.05 }}
                        className={cn(
                          'text-xs px-2 py-1 rounded border cursor-grab active:cursor-grabbing group touch-none select-none',
                          'will-change-transform',
                          getPriorityColor(topic.priority),
                          getStatusColor(topic.status),
                          topic.status === 'completed' && 'opacity-75 line-through'
                        )}
                      >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleComplete(e, topic)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={topic.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {topic.status === 'completed' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                              ) : (
                                <Circle className="h-3 w-3 text-text-muted" />
                              )}
                            </button>
                            <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            <span className="truncate flex-1" title={topic.title}>
                              {topic.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTopic(topic)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {topic.estimatedHours > 0 && (
                            <div className="text-[10px] opacity-60 mt-0.5">
                              {topic.estimatedHours}h
                            </div>
                          )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add topic indicator */}
                {day.topics.length === 0 && !day.isPast && (
                  <div className="text-center text-text-muted text-xs opacity-0 hover:opacity-100 transition-opacity">
                    Drop here
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-purple-500 bg-purple-500/10" />
              <span className="text-text-secondary">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
              <span className="text-text-secondary">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30" />
              <span className="text-text-secondary">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
              <span className="text-text-secondary">Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/10 border border-green-500/50" />
              <span className="text-text-secondary">Completed</span>
            </div>
          </div>
                </div> {/* End of Desktop View */}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic Schedule</DialogTitle>
            <DialogDescription>
              Reschedule {editingTopic?.title} to a different date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Topic</Label>
              <div className="mt-2 p-3 bg-bg-surface rounded-lg border border-border">
                <div className="font-medium">{editingTopic?.title}</div>
                <div className="text-sm text-text-secondary mt-1">
                  {editingTopic?.estimatedHours}h · Priority:{' '}
                  <Badge className={cn('text-xs', editingTopic && getPriorityColor(editingTopic.priority))}>
                    {editingTopic?.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-date">New Scheduled Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                min={startDate}
                max={endDate || undefined}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTopic(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editDate}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
