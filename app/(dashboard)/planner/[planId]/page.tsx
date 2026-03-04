'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  ChevronDown,
  ChevronRight,
  Trash2,
  MoreVertical,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineCalendar } from '@/components/planner/timeline-calendar'
import { ToastContainer, Toast as ToastType } from '@/components/ui/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
import { API_KEYS, revalidateDashboard, revalidatePlans } from '@/lib/hooks/use-swr-api'

interface Topic {
  id: string
  title: string
  estimatedHours: number
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  scheduledDate: string | null
  subtopics?: Topic[]
}

interface Plan {
  id: string
  title: string
  type: string
  startDate: string
  endDate: string | null
  dailyHours: number | null
  totalEstimatedHours: number
  status: 'active' | 'completed' | 'paused'
  color: string
  topics: Topic[]
  totalTopics: number
  completedTopics: number
  inProgressTopics: number
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  const [mounted, setMounted] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  // Use SWR for plan data fetching with caching
  const { data: pageData, error: pageError, isLoading: pageLoading, mutate: mutatePlan } = useSWR(
    planId ? API_KEYS.plan(planId) : null,
    async (url: string) => {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Plan not found')
        }
        throw new Error('Failed to fetch plan')
      }

      return res.json()
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // 60s auto-refresh
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  const plan = (pageData?.plan as Plan) || null
  const loading = pageLoading

  // Toast helper function
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString()
    const newToast: ToastType = { id, message, type }
    setToasts((prev) => [...prev, newToast])

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Auto-select first incomplete topic with subtopics
  useEffect(() => {
    if (plan && plan.topics.length > 0 && !selectedTopicId) {
      const firstIncomplete = plan.topics.find(
        (topic: any) =>
          topic.status !== 'completed' &&
          topic.subtopics &&
          topic.subtopics.length > 0
      )
      if (firstIncomplete) {
        setSelectedTopicId(firstIncomplete.id)
      } else if (plan.topics[0].subtopics && plan.topics[0].subtopics.length > 0) {
        setSelectedTopicId(plan.topics[0].id)
      }
    }
  }, [plan, selectedTopicId])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle errors
  if (pageError?.message === 'Failed to fetch' || pageData?.error === 'Plan not found') {
    router.push('/planner')
    return null
  }

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const updateTopicStatus = async (topicId: string, currentStatus: string, topicTitle?: string) => {
    if (!plan || !pageData) return

    // Toggle between not_started and completed only
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed'

    // Optimistic update - update local state immediately
    const updateTopicInList = (topics: Topic[]): Topic[] => {
      return topics.map(topic => {
        if (topic.id === topicId) {
          return { ...topic, status: newStatus as 'not_started' | 'in_progress' | 'completed' }
        }
        if (topic.subtopics) {
          return { ...topic, subtopics: updateTopicInList(topic.subtopics) }
        }
        return topic
      })
    }

    // Calculate new counts
    const isCompleting = newStatus === 'completed'
    const wasCompleted = currentStatus === 'completed'
    const countDelta = isCompleting ? 1 : (wasCompleted ? -1 : 0)

    // Optimistic update using SWR mutate
    mutatePlan((prev: any) => ({
      ...prev,
      plan: {
        ...prev.plan,
        topics: updateTopicInList(prev.plan.topics),
        completedTopics: prev.plan.completedTopics + countDelta,
      }
    }), false)

    // Show toast immediately
    const toastMessage = newStatus === 'completed'
      ? `🎉 Completed ${topicTitle || 'topic'}!`
      : `Reset ${topicTitle || 'topic'}`
    showToast(toastMessage, 'success')

    // Sync with API in background (no await, fire-and-forget)
    fetch(`/api/topics/${topicId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(() => {
      // Revalidate dashboard on success
      revalidateDashboard()
    }).catch(error => {
      console.error('Failed to sync topic status:', error)
      // Revert on error
      mutatePlan()
      showToast('Failed to save - reverting', 'error')
    })
  }

  const updatePlanStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        throw new Error('Failed to update plan')
      }

      await mutatePlan()
      // Revalidate related caches
      revalidatePlans()
      revalidateDashboard()
      showToast(`Plan ${status === 'completed' ? 'marked as completed' : status === 'paused' ? 'paused' : 'updated'}`, 'success')
    } catch (error) {
      console.error('Failed to update plan:', error)
      showToast('Failed to update plan', 'error')
    }
  }

  const deletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        throw new Error('Failed to delete plan')
      }

      // Revalidate plans cache after deletion
      revalidatePlans()
      revalidateDashboard()
      router.push('/planner')
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
      default:
        return 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30'
    }
  }

  if (!mounted || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-lg bg-bg-surface" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-32 rounded-lg bg-bg-surface" />
          <div className="h-32 rounded-lg bg-bg-surface" />
          <div className="h-32 rounded-lg bg-bg-surface" />
        </div>
        <div className="h-96 rounded-lg bg-bg-surface" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Target className="h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Plan not found</h2>
        <p className="text-text-secondary mb-6">The plan you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/planner')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Planner
        </Button>
      </div>
    )
  }

  const progressPercentage = plan.totalTopics > 0
    ? Math.round((plan.completedTopics / plan.totalTopics) * 100)
    : 0

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-0">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Compact Header with Stats - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-2 sm:space-y-3"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/planner')}
              className="h-9 w-9 flex-shrink-0 active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-text-primary truncate">
                {plan.title}
              </h1>
              <Badge className={`${getStatusBadgeColor(plan.status)} flex-shrink-0 text-xs`}>
                {plan.status}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 active:scale-95 transition-transform">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {plan.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => updatePlanStatus('paused')}>
                    Pause Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePlanStatus('completed')}>
                    Mark as Completed
                  </DropdownMenuItem>
                </>
              )}
              {plan.status === 'paused' && (
                <DropdownMenuItem onClick={() => updatePlanStatus('active')}>
                  Resume Plan
                </DropdownMenuItem>
              )}
              {plan.status === 'completed' && (
                <DropdownMenuItem onClick={() => updatePlanStatus('active')}>
                  Reopen Plan
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={deletePlan} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Compact Stats and Plan Type - Mobile Optimized */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 px-0 sm:px-4 lg:px-12">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Plan</span>
          </div>

          {/* Compact Stats Row - Horizontal scroll on mobile */}
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide -mx-1 px-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-text-muted">Progress</span>
                <span className="text-sm sm:text-lg font-bold text-text-primary">{progressPercentage}%</span>
              </div>
            </motion.div>

            <div className="h-6 sm:h-8 w-px bg-border flex-shrink-0" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-text-muted">Timeline</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary whitespace-nowrap">
                  {plan.endDate ? new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}
                </span>
              </div>
            </motion.div>

            <div className="h-6 sm:h-8 w-px bg-border flex-shrink-0" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-text-muted">Est. Hours</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary">{plan.totalEstimatedHours}h</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="px-0 sm:px-4 lg:px-12">
          <div className="flex items-center gap-2 sm:gap-3">
            <Progress value={progressPercentage} className="h-1.5 flex-1" />
            <span className="text-[10px] sm:text-xs text-text-muted whitespace-nowrap">
              {plan.completedTopics} / {plan.totalTopics} topics
            </span>
          </div>
        </div>
      </motion.div>

      {/* Study Tracker Tabs - Mobile Optimized with smooth transitions */}
      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-bg-surface/60 backdrop-blur-md p-1 gap-0.5 sm:gap-1 rounded-xl sticky top-0 z-10">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-[11px] sm:text-sm py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 active:scale-95"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-[11px] sm:text-sm py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 active:scale-95"
          >
            Calendar
          </TabsTrigger>
          <TabsTrigger
            value="topics"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-[11px] sm:text-sm py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 active:scale-95"
          >
            Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          {(() => {
            // Compute stats from plan.topics (subtopics only)
            const allSubtopics = plan.topics.flatMap((t: any) => t.subtopics || [])
            const completed = allSubtopics.filter((s: any) => s.status === 'completed').length
            const inProgress = allSubtopics.filter((s: any) => s.status === 'in_progress').length
            const remaining = allSubtopics.length - completed
            const progress = allSubtopics.length > 0 ? Math.round((completed / allSubtopics.length) * 100) : 0

            // Timeline
            const today = new Date()
            const startDate = new Date(plan.startDate)
            const endDate = plan.endDate ? new Date(plan.endDate) : null
            const daysPassed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000))
            const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000)) : null

            // Priority breakdown from subtopics
            const highCount = allSubtopics.filter((s: any) => s.priority === 'high' || s.priority === 'highest').length
            const medCount = allSubtopics.filter((s: any) => s.priority === 'medium').length
            const lowCount = allSubtopics.filter((s: any) => s.priority === 'low').length
            const highDone = allSubtopics.filter((s: any) => (s.priority === 'high' || s.priority === 'highest') && s.status === 'completed').length
            const medDone = allSubtopics.filter((s: any) => s.priority === 'medium' && s.status === 'completed').length
            const lowDone = allSubtopics.filter((s: any) => s.priority === 'low' && s.status === 'completed').length

            // Next topics to work on (first 5 incomplete subtopics)
            const nextSubtopics = allSubtopics.filter((s: any) => s.status !== 'completed').slice(0, 5)

            return (
              <div className="space-y-3 sm:space-y-4">
                {/* Top Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
                >
                  {[
                    { label: 'Completed', value: completed, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                    { label: 'In Progress', value: inProgress, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Remaining', value: remaining, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                    { label: 'Total Topics', value: allSubtopics.length, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className={`rounded-xl border p-3 sm:p-4 ${stat.bg}`}
                    >
                      <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] sm:text-xs text-text-muted mt-0.5">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Overall Progress Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-primary">Overall Progress</span>
                        <span className="text-lg font-bold text-purple-400">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3 rounded-full" />
                      <div className="flex justify-between text-[10px] sm:text-xs text-text-muted mt-2">
                        <span>{completed} of {allSubtopics.length} subtopics done</span>
                        {remaining > 0 && <span>{remaining} left to complete</span>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Timeline + Estimated Hours */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 grid grid-cols-2 gap-2">
                      <div className="bg-bg-surface/50 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-text-muted mb-1">Start Date</div>
                        <div className="text-sm font-semibold">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <div className="bg-bg-surface/50 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-text-muted mb-1">End Date</div>
                        <div className="text-sm font-semibold">{endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}</div>
                      </div>
                      <div className="bg-bg-surface/50 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-text-muted mb-1">Days Passed</div>
                        <div className="text-sm font-bold text-text-primary">{daysPassed}</div>
                      </div>
                      <div className="bg-bg-surface/50 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-text-muted mb-1">Days Left</div>
                        <div className={`text-sm font-bold ${daysLeft !== null && daysLeft < 7 ? 'text-red-400' : daysLeft !== null && daysLeft < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {daysLeft !== null ? daysLeft : '—'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Study Load
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                      <div className="flex justify-between items-center bg-bg-surface/50 rounded-lg p-2.5">
                        <span className="text-[10px] sm:text-xs text-text-muted">Total Est. Hours</span>
                        <span className="text-sm font-bold text-orange-400">{plan.totalEstimatedHours}h</span>
                      </div>
                      {plan.dailyHours && (
                        <div className="flex justify-between items-center bg-bg-surface/50 rounded-lg p-2.5">
                          <span className="text-[10px] sm:text-xs text-text-muted">Daily Target</span>
                          <span className="text-sm font-bold text-purple-400">{plan.dailyHours}h/day</span>
                        </div>
                      )}
                      {daysLeft !== null && remaining > 0 && (
                        <div className="flex justify-between items-center bg-bg-surface/50 rounded-lg p-2.5">
                          <span className="text-[10px] sm:text-xs text-text-muted">Topics/Day Needed</span>
                          <span className="text-sm font-bold text-blue-400">{(remaining / Math.max(1, daysLeft)).toFixed(1)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Priority Breakdown */}
                {allSubtopics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2 p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Target className="h-4 w-4 text-purple-500" />
                          Priority Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 space-y-2.5">
                        {[
                          { label: 'High', total: highCount, done: highDone, color: 'bg-red-500', bgLight: 'bg-red-500/10', textColor: 'text-red-400' },
                          { label: 'Medium', total: medCount, done: medDone, color: 'bg-yellow-500', bgLight: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
                          { label: 'Low', total: lowCount, done: lowDone, color: 'bg-green-500', bgLight: 'bg-green-500/10', textColor: 'text-green-400' },
                        ].filter(p => p.total > 0).map((p, i) => (
                          <motion.div
                            key={p.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.05, duration: 0.2 }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${p.color}`} />
                                <span className="text-xs sm:text-sm font-medium">{p.label} Priority</span>
                              </div>
                              <span className={`text-xs font-semibold ${p.textColor}`}>{p.done}/{p.total}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p.total > 0 ? Math.round((p.done / p.total) * 100) : 0}%` }}
                                transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                                className={`h-full rounded-full ${p.color}`}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Next Up */}
                {nextSubtopics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.2 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2 p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          Up Next
                          <Badge className="ml-auto text-[10px] bg-purple-500/20 text-purple-400 border-0">
                            {remaining} pending
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5">
                        {nextSubtopics.map((subtopic: any, i: number) => (
                          <motion.div
                            key={subtopic.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.15 }}
                            className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-bg-surface/50 border border-border"
                          >
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${subtopic.priority === 'high' || subtopic.priority === 'highest' ? 'bg-red-400' :
                                subtopic.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                              }`} />
                            <span className="flex-1 text-xs sm:text-sm text-text-primary truncate">{subtopic.title}</span>
                            {subtopic.estimatedHours > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-muted flex-shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {subtopic.estimatedHours}h
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )
          })()}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          {/* Timeline Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <TimelineCalendar
              startDate={plan.startDate}
              endDate={plan.endDate}
              topics={plan.topics}
              planId={planId}
              dailyHours={plan.dailyHours}
              onTopicsUpdate={() => {
                mutatePlan()
              }}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          {/* Topics List - Mobile-first layout with inline subtopics expansion */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {plan.topics.length === 0 ? (
              <Card className="overflow-hidden">
                <CardContent className="py-10 text-center text-text-secondary">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No topics found for this plan</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Mobile View - Single column with inline subtopics */}
                <div className="sm:hidden space-y-2">
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2 p-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        Topics ({plan.completedTopics}/{plan.totalTopics})
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Click a topic to view subtopics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1.5">
                      {plan.topics.map((topic: any, index: number) => {
                        const hasSubtopics = topic.subtopics && topic.subtopics.length > 0
                        const isExpanded = expandedTopics.has(topic.id)
                        const completedSubtopics = hasSubtopics
                          ? topic.subtopics.filter((st: any) => st.status === 'completed').length
                          : 0

                        return (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            {/* Main Topic Card */}
                            <div
                              className={`
                                p-2.5 rounded-lg transition-all duration-150 active:scale-[0.98]
                                ${isExpanded
                                  ? 'bg-purple-500/20 border border-purple-500'
                                  : 'border border-border hover:border-purple-500/50'
                                }
                              `}
                              onClick={() => hasSubtopics && toggleTopic(topic.id)}
                            >
                              <div className="flex items-start gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <AnimatedCheckbox
                                    checked={topic.status === 'completed'}
                                    onChange={() => {
                                      updateTopicStatus(topic.id, topic.status, topic.title)
                                    }}
                                    variant="green"
                                    className="mt-0.5 flex-shrink-0"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-xs font-medium ${topic.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                    {topic.title}
                                  </h4>

                                  <div className="flex items-center gap-2 mt-1">
                                    {topic.estimatedHours > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-text-secondary">
                                        <Clock className="h-2.5 w-2.5" />
                                        {topic.estimatedHours}h
                                      </span>
                                    )}
                                    {hasSubtopics && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                        {completedSubtopics}/{topic.subtopics.length}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {hasSubtopics && (
                                  <ChevronDown
                                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 text-text-muted ${isExpanded ? 'rotate-180 text-purple-400' : ''
                                      }`}
                                  />
                                )}
                              </div>

                              {/* Progress Bar */}
                              {hasSubtopics && (
                                <div className="mt-2">
                                  <Progress
                                    value={(completedSubtopics / topic.subtopics.length) * 100}
                                    className="h-1"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Inline Subtopics Expansion - Mobile */}
                            <AnimatePresence initial={false}>
                              {isExpanded && hasSubtopics && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-purple-500/30 pl-3 py-1">
                                    {topic.subtopics.map((subtopic: any, subIndex: number) => (
                                      <motion.div
                                        key={subtopic.id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: subIndex * 0.03, duration: 0.15 }}
                                        className={`
                                          p-2 rounded-md transition-all duration-150 active:scale-[0.98]
                                          ${subtopic.status === 'completed'
                                            ? 'bg-green-500/10 border border-green-500/20'
                                            : 'bg-bg-surface/50 border border-border'
                                          }
                                        `}
                                      >
                                        <div className="flex items-start gap-2">
                                          <AnimatedCheckbox
                                            checked={subtopic.status === 'completed'}
                                            onChange={() => {
                                              updateTopicStatus(subtopic.id, subtopic.status, subtopic.title)
                                            }}
                                            variant="green"
                                            className="mt-0.5 flex-shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <h5 className={`text-[11px] font-medium ${subtopic.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                              {subtopic.title}
                                            </h5>
                                            {subtopic.estimatedHours > 0 && (
                                              <p className="text-[9px] text-text-secondary flex items-center gap-0.5 mt-0.5">
                                                <Clock className="h-2.5 w-2.5" />
                                                {subtopic.estimatedHours}h
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Desktop View - Two column layout */}
                <div className="hidden sm:grid sm:grid-cols-1 lg:grid-cols-5 gap-4 min-h-[400px] lg:h-[calc(100vh-280px)] lg:min-h-[500px]">
                  {/* Left Column - Topics List */}
                  <Card className="lg:col-span-2 overflow-hidden flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" />
                        Topics ({plan.completedTopics}/{plan.totalTopics})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Click a topic to view subtopics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                      {plan.topics.map((topic: any, index: number) => {
                        const hasSubtopics = topic.subtopics && topic.subtopics.length > 0
                        const isSelected = selectedTopicId === topic.id
                        const completedSubtopics = hasSubtopics
                          ? topic.subtopics.filter((st: any) => st.status === 'completed').length
                          : 0

                        return (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.15 }}
                          >
                            <div
                              className={`
                                relative p-3 rounded-lg cursor-pointer transition-all duration-150
                                ${isSelected
                                  ? 'bg-purple-500/20 border-2 border-purple-500 shadow-md'
                                  : 'border border-border hover:border-purple-500/50 hover:bg-bg-surface/70'
                                }
                              `}
                              onClick={() => hasSubtopics && setSelectedTopicId(topic.id)}
                            >
                              <div className="flex items-start gap-2">
                                <AnimatedCheckbox
                                  checked={topic.status === 'completed'}
                                  onChange={() => {
                                    updateTopicStatus(topic.id, topic.status, topic.title)
                                  }}
                                  variant="green"
                                  className="mt-0.5 flex-shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-purple-300' : 'text-text-primary'}`}>
                                    {topic.title}
                                  </h4>

                                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                                    {topic.estimatedHours > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {topic.estimatedHours}h
                                      </span>
                                    )}
                                    {hasSubtopics && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                                        {completedSubtopics}/{topic.subtopics.length}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {hasSubtopics && (
                                  <ChevronRight
                                    className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${isSelected ? 'rotate-90 text-purple-400' : 'text-text-muted'}`}
                                  />
                                )}
                              </div>

                              {hasSubtopics && (
                                <div className="mt-2">
                                  <Progress
                                    value={(completedSubtopics / topic.subtopics.length) * 100}
                                    className="h-1"
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </CardContent>
                  </Card>

                  {/* Right Column - Subtopics */}
                  <Card className="lg:col-span-3 overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
                    <AnimatePresence mode="wait" initial={false}>
                      {selectedTopicId ? (() => {
                        const selectedTopic = plan.topics.find((t: any) => t.id === selectedTopicId)

                        if (!selectedTopic || !selectedTopic.subtopics || selectedTopic.subtopics.length === 0) {
                          return (
                            <motion.div
                              key="no-subtopics"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="flex-1 flex items-center justify-center p-8"
                            >
                              <div className="text-center text-text-secondary">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No subtopics for this topic</p>
                              </div>
                            </motion.div>
                          )
                        }

                        return (
                          <motion.div
                            key={selectedTopic.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col h-full"
                          >
                            <CardHeader className="pb-3 flex-shrink-0 border-b border-border">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="h-5 w-5 flex-shrink-0 text-purple-500" />
                                    <span className="truncate">{selectedTopic.title}</span>
                                  </CardTitle>
                                  <CardDescription className="text-xs mt-1 flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {selectedTopic.estimatedHours}h total
                                    </span>
                                    <span>
                                      {selectedTopic.subtopics.filter((st: any) => st.status === 'completed').length}/{selectedTopic.subtopics.length} completed
                                    </span>
                                  </CardDescription>
                                </div>
                                <Badge className={selectedTopic.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-purple-500/20 text-purple-500'}>
                                  {selectedTopic.status === 'completed' ? 'completed' : 'pending'}
                                </Badge>
                              </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                              {selectedTopic.subtopics.map((subtopic: any, subIndex: number) => (
                                <motion.div
                                  key={subtopic.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: subIndex * 0.03, duration: 0.15 }}
                                  className={`
                                    p-3 rounded-lg border transition-all duration-150
                                    ${subtopic.status === 'completed'
                                      ? 'bg-green-500/10 border-green-500/30'
                                      : 'border-border hover:border-purple-500/50 hover:bg-bg-surface/70'
                                    }
                                  `}
                                >
                                  <div className="flex items-start gap-3">
                                    <AnimatedCheckbox
                                      checked={subtopic.status === 'completed'}
                                      onChange={() => {
                                        updateTopicStatus(subtopic.id, subtopic.status, subtopic.title)
                                      }}
                                      variant="green"
                                      className="mt-0.5 flex-shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                      <h5 className={`text-sm font-medium ${subtopic.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                        {subtopic.title}
                                      </h5>
                                      {subtopic.estimatedHours > 0 && (
                                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          {subtopic.estimatedHours}h
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </CardContent>
                          </motion.div>
                        )
                      })() : (
                        <motion.div
                          key="select-topic"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 flex items-center justify-center p-8"
                        >
                          <div className="text-center text-text-secondary">
                            <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">Select a Topic</p>
                            <p className="text-sm">Click on a topic to view its subtopics</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
