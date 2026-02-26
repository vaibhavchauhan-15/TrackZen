'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { mutate } from 'swr'
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
  CheckCircle2,
  Circle,
  PlayCircle,
  Trash2,
  MoreVertical,
  BookOpen,
  TrendingUp,
  AlertCircle,
  BarChart3,
  FileText,
  RotateCcw,
  BookMarked,
  Plus,
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
import { 
  usePlannerPage,
  useUpdateTopicStatus, 
  useUpdatePlan, 
  useDeletePlan 
} from '@/lib/hooks/use-swr-api'

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

interface AnalyticsData {
  timeline: {
    totalDaysAvailable: number | null
    daysPassed: number
    bufferDays: number | null
    isOnTrack: boolean | null
    progressPercentage: number
    expectedProgress: number | null
  }
  topics: {
    total: number
    completed: number
    inProgress: number
    remaining: number
    dailyTarget: number | null
    byPriority: {
      high: { total: number; completed: number; percentage: string }
      medium: { total: number; completed: number; percentage: string }
      low: { total: number; completed: number; percentage: string }
    }
    overdue: number
  }
  studyHours: {
    last30Days: {
      planned: number
      actual: number
      average: number
      adherence: number | null
    }
  }
  mockTests: {
    total: number
    completed: number
    averageScore: number | null
    scheduled: number
  }
  revision: {
    total: number
    pending: number
    completed: number
    overdueRevisions: number
  }
  mistakes: {
    total: number
    unresolved: number
    byCategory: Record<string, number>
  }
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [updatingTopics, setUpdatingTopics] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  // OPTIMIZATION: Use unified hook - fetches plan + analytics in ONE call
  const { data: pageData, error: pageError, isLoading: pageLoading } = usePlannerPage(planId)
  
  // Use SWR mutations for updates with optimistic updates
  const { trigger: deletePlanMutation } = useDeletePlan(planId)
  const { trigger: updatePlanMutation } = useUpdatePlan(planId)

  const plan = ((pageData as any)?.plan as Plan) || null
  const analytics = ((pageData as any)?.analytics as AnalyticsData) || null
  const loading = pageLoading
  const analyticsLoading = pageLoading
  const analyticsError = pageError

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

  // Handle errors
  if (pageError?.message === 'Failed to fetch' || (pageData as any)?.error === 'Plan not found') {
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

  const updateTopicStatus = async (topicId: string, status: string, topicTitle?: string) => {
    if (!plan) return
    
    setUpdatingTopics((prev) => new Set(prev).add(topicId))
    
    try {
      // Use new optimized API endpoint
      const res = await fetch(`/api/plans/${planId}/topics/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, status }),
      })

      if (res.ok) {
        const data = await res.json()
        
        // Optimistic update: only revalidate the unified planner page data
        const { mutate } = await import('swr')
        
        // Update unified cache with new stats without full refetch
        await mutate(
          `/api/planner/${planId}/initial`,
          async (currentData: any) => {
            if (!currentData?.plan) return currentData
            
            return {
              ...currentData,
              plan: {
                ...currentData.plan,
                completedTopics: data.stats.completedTopics,
                inProgressTopics: data.stats.inProgressTopics,
                totalTopics: data.stats.totalTopics,
                topics: currentData.plan.topics.map((t: any) => 
                  t.id === topicId 
                    ? { ...t, status: data.topic.status }
                    : t.subtopics
                    ? {
                        ...t,
                        subtopics: t.subtopics.map((st: any) =>
                          st.id === topicId ? { ...st, status: data.topic.status } : st
                        ),
                      }
                    : t
                ),
              },
            }
          },
          { revalidate: false }
        )
        
        // Show success toast
        const statusMessages = {
          'not_started': 'Topic reset to not started',
          'in_progress': `Started working on ${topicTitle || 'topic'}`,
          'completed': `🎉 Completed ${topicTitle || 'topic'}!`
        }
        showToast(statusMessages[status as keyof typeof statusMessages] || 'Topic updated', 'success')
      } else {
        showToast('Failed to update topic status', 'error')
      }
    } catch (error) {
      console.error('Failed to update topic:', error)
      showToast('An error occurred while updating', 'error')
    } finally {
      setUpdatingTopics((prev) => {
        const newSet = new Set(prev)
        newSet.delete(topicId)
        return newSet
      })
    }
  }

  const updatePlanStatus = async (status: string) => {
    try {
      await updatePlanMutation({ status })
    } catch (error) {
      console.error('Failed to update plan:', error)
    }
  }

  const deletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      await deletePlanMutation()
      router.push('/planner')
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-text-muted" />
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

  if (loading) {
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
    <div className="space-y-4">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Compact Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/planner')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">
                {plan.title}
              </h1>
              <Badge className={getStatusBadgeColor(plan.status)}>
                {plan.status}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
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

        {/* Compact Stats and Plan Type */}
        <div className="flex items-center justify-between px-12">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <BookOpen className="h-4 w-4" />
            <span>{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Plan</span>
          </div>
          
          {/* Compact Stats Row */}
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-xs text-text-muted">Progress</span>
                <span className="text-lg font-bold text-text-primary">{progressPercentage}%</span>
              </div>
            </motion.div>

            <div className="h-8 w-px bg-border" />

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs text-text-muted">Timeline</span>
                <span className="text-sm font-semibold text-text-primary">
                  {plan.endDate ? new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open-ended'}
                </span>
              </div>
            </motion.div>

            <div className="h-8 w-px bg-border" />

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-xs text-text-muted">Est. Hours</span>
                <span className="text-sm font-semibold text-text-primary">{plan.totalEstimatedHours}h</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="px-12">
          <div className="flex items-center gap-3">
            <Progress value={progressPercentage} className="h-1.5 flex-1" />
            <span className="text-xs text-text-muted whitespace-nowrap">
              {plan.completedTopics} / {plan.totalTopics} topics
            </span>
          </div>
        </div>
      </motion.div>

      {/* Study Tracker Tabs - Now Higher Up */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-bg-surface/50 backdrop-blur-sm p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Timeline Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Study Analytics
          </TabsTrigger>
          <TabsTrigger value="topics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Enhanced Timeline Section */}
          {analyticsLoading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-text-secondary">Loading analytics data...</p>
                </div>
              </CardContent>
            </Card>
          ) : analytics ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    Timeline & Progress
                    {analytics.timeline.isOnTrack !== null && (
                      <Badge variant={analytics.timeline.isOnTrack ? 'default' : 'destructive'}>
                        {analytics.timeline.isOnTrack ? 'On Track' : 'Behind Schedule'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Days Remaining</div>
                      <div className="text-xl font-bold">
                        {analytics.timeline.totalDaysAvailable || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Days Passed</div>
                      <div className="text-xl font-bold">{analytics.timeline.daysPassed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Buffer Days</div>
                      <div className="text-xl font-bold text-green-500">
                        {analytics.timeline.bufferDays || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Daily Target</div>
                      <div className="text-xl font-bold text-purple-500">
                        {analytics.topics.dailyTarget?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-semibold">{analytics.timeline.progressPercentage}%</span>
                    </div>
                    <Progress value={analytics.timeline.progressPercentage} className="h-2.5" />
                    {analytics.timeline.expectedProgress && (
                      <div className="text-xs text-text-secondary">
                        Expected: {analytics.timeline.expectedProgress.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Track your daily progress and manage study activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button variant="outline" className="h-16 flex-col gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Log Study Hours</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Mock Test</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1.5">
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs">Revisions</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1.5">
                    <BookMarked className="h-4 w-4" />
                    <span className="text-xs">Mistakes</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Weekly Review</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          {/* Timeline Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TimelineCalendar
              startDate={plan.startDate}
              endDate={plan.endDate}
              topics={plan.topics}
              planId={planId}
              dailyHours={plan.dailyHours}
              onTopicsUpdate={() => {
                // Revalidate unified planner page data
                mutate(`/api/planner/${planId}/initial`)
              }}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          {analyticsLoading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-text-secondary">Loading analytics data...</p>
                </div>
              </CardContent>
            </Card>
          ) : analyticsError ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-text-primary font-semibold">Failed to load analytics</p>
                  <p className="text-text-secondary text-sm">Please try refreshing the page</p>
                </div>
              </CardContent>
            </Card>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Top Row - Priority Strategy Takes Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-purple-500" />
                      Priority Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* High Priority */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive" className="text-xs">🔴 High</Badge>
                          <span className="text-lg font-bold">{analytics.topics.byPriority.high.percentage}%</span>
                        </div>
                        <Progress value={parseFloat(analytics.topics.byPriority.high.percentage)} className="h-1.5 mb-2" />
                        <div className="text-xs text-text-secondary">
                          {analytics.topics.byPriority.high.completed} / {analytics.topics.byPriority.high.total} completed
                        </div>
                        <div className="text-xs text-text-muted mt-1">First 50% time</div>
                      </motion.div>

                      {/* Medium Priority */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="default" className="text-xs">🟡 Medium</Badge>
                          <span className="text-lg font-bold">{analytics.topics.byPriority.medium.percentage}%</span>
                        </div>
                        <Progress value={parseFloat(analytics.topics.byPriority.medium.percentage)} className="h-1.5 mb-2" />
                        <div className="text-xs text-text-secondary">
                          {analytics.topics.byPriority.medium.completed} / {analytics.topics.byPriority.medium.total} completed
                        </div>
                        <div className="text-xs text-text-muted mt-1">Middle phase</div>
                      </motion.div>

                      {/* Low Priority */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">🟢 Low</Badge>
                          <span className="text-lg font-bold">{analytics.topics.byPriority.low.percentage}%</span>
                        </div>
                        <Progress value={parseFloat(analytics.topics.byPriority.low.percentage)} className="h-1.5 mb-2" />
                        <div className="text-xs text-text-secondary">
                          {analytics.topics.byPriority.low.completed} / {analytics.topics.byPriority.low.total} completed
                        </div>
                        <div className="text-xs text-text-muted mt-1">Final phase</div>
                      </motion.div>
                    </div>
                    
                    {analytics.topics.overdue > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg"
                      >
                        <p className="text-xs font-semibold text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {analytics.topics.overdue} overdue topics - Cover them in the next 2 days!
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Second Row - Study Hours, Mock Tests, Topics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Study Hours */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Study Hours (30d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-bg-surface rounded text-center">
                          <div className="text-xs text-text-muted">Planned</div>
                          <div className="text-lg font-bold">{analytics.studyHours.last30Days.planned.toFixed(1)}h</div>
                        </div>
                        <div className="p-2 bg-bg-surface rounded text-center">
                          <div className="text-xs text-text-muted">Actual</div>
                          <div className="text-lg font-bold text-blue-500">{analytics.studyHours.last30Days.actual.toFixed(1)}h</div>
                        </div>
                      </div>
                      <div className="p-2 bg-bg-surface rounded">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-muted">Avg/Day</span>
                          <span className="font-semibold">{analytics.studyHours.last30Days.average.toFixed(1)}h</span>
                        </div>
                      </div>
                      {analytics.studyHours.last30Days.adherence && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Adherence</span>
                            <span className="font-bold text-green-600">{analytics.studyHours.last30Days.adherence.toFixed(1)}%</span>
                          </div>
                          <Progress value={analytics.studyHours.last30Days.adherence} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Mock Tests */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-purple-500" />
                        Mock Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-bg-surface rounded text-center">
                          <div className="text-xs text-text-muted">Total</div>
                          <div className="text-lg font-bold">{analytics.mockTests.total}</div>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Done</div>
                          <div className="text-lg font-bold text-green-600">{analytics.mockTests.completed}</div>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Next</div>
                          <div className="text-lg font-bold text-blue-600">{analytics.mockTests.scheduled}</div>
                        </div>
                      </div>
                      {analytics.mockTests.averageScore !== null && (
                        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 text-center">
                          <div className="text-xs text-text-muted mb-1">Average Score</div>
                          <div className="text-2xl font-bold text-green-600">{analytics.mockTests.averageScore}%</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Topics Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <Card className="h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        Topics Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-bg-surface/50 rounded text-center">
                          <div className="text-xs text-text-muted">Total</div>
                          <div className="text-lg font-bold">{analytics.topics.total}</div>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Done</div>
                          <div className="text-lg font-bold text-green-600">{analytics.topics.completed}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-blue-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Active</div>
                          <div className="text-lg font-bold text-blue-600">{analytics.topics.inProgress}</div>
                        </div>
                        <div className="p-2 bg-orange-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Left</div>
                          <div className="text-lg font-bold text-orange-600">{analytics.topics.remaining}</div>
                        </div>
                      </div>
                      {analytics.topics.dailyTarget !== null && (
                        <div className="p-2 bg-purple-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Daily Target</div>
                          <div className="text-base font-bold text-purple-600">{analytics.topics.dailyTarget.toFixed(1)} topics/day</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Third Row - Revision & Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Revision System */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <RotateCcw className="h-4 w-4 text-blue-500" />
                        3-Stage Revision System
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-bg-surface rounded text-center">
                          <div className="text-xs text-text-muted">Total</div>
                          <div className="text-lg font-bold">{analytics.revision.total}</div>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Pending</div>
                          <div className="text-lg font-bold text-blue-600">{analytics.revision.pending}</div>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Done</div>
                          <div className="text-lg font-bold text-green-600">{analytics.revision.completed}</div>
                        </div>
                      </div>
                      {analytics.revision.overdueRevisions > 0 && (
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          <p className="text-xs font-semibold text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {analytics.revision.overdueRevisions} overdue revisions
                          </p>
                        </div>
                      )}
                      <div className="p-2 bg-purple-500/5 rounded-lg">
                        <div className="text-xs font-semibold mb-1.5">Revision Formula:</div>
                        <div className="space-y-0.5 text-xs text-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">1️⃣</span>
                            <span>Within 24 hours</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">2️⃣</span>
                            <span>After 7 days</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">3️⃣</span>
                            <span>After 30 days</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Mistake Notebook */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookMarked className="h-4 w-4 text-orange-500" />
                        Mistake Notebook
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-bg-surface rounded text-center">
                          <div className="text-xs text-text-muted">Total</div>
                          <div className="text-lg font-bold">{analytics.mistakes.total}</div>
                        </div>
                        <div className="p-2 bg-orange-500/10 rounded text-center">
                          <div className="text-xs text-text-muted">Unresolved</div>
                          <div className="text-lg font-bold text-orange-600">{analytics.mistakes.unresolved}</div>
                        </div>
                      </div>
                      {Object.keys(analytics.mistakes.byCategory).length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-text-secondary">By Category</div>
                          <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                            {Object.entries(analytics.mistakes.byCategory).map(([category, count]) => (
                              <motion.div 
                                key={category}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex justify-between items-center text-xs p-2 bg-bg-surface rounded"
                              >
                                <span className="truncate">{category}</span>
                                <Badge variant="outline" className="text-xs ml-2">{String(count)}</Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-text-muted">
                          No mistakes recorded yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Bottom Row - Success Blueprint */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      🔥 Success Blueprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {[
                        'Finish High priority early',
                        'Track hours daily',
                        'Revise weekly',
                        'Analyse mocks deeply',
                        'Maintain buffer days',
                        'Never skip consistency'
                      ].map((tip, index) => (
                        <motion.div
                          key={tip}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.05, duration: 0.2 }}
                          className="flex items-center gap-1.5 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                          <span className="text-xs leading-tight">{tip}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-text-secondary">
                No analytics data available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="topics" className="space-y-4 mt-4">
          {/* Topics List - Two Column Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {plan.topics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-text-secondary">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No topics found for this plan</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
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
                  <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
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
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                        >
                          <div
                            className={`
                              relative p-3 rounded-lg cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? 'bg-purple-500/20 border-2 border-purple-500 shadow-md' 
                                : 'border border-border hover:border-purple-500/50 hover:bg-bg-surface/70'
                              }
                            `}
                            onClick={() => hasSubtopics && setSelectedTopicId(topic.id)}
                          >
                            {/* Status Indicator */}
                            <div className="flex items-start gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const nextStatus =
                                    topic.status === 'not_started'
                                      ? 'in_progress'
                                      : topic.status === 'in_progress'
                                      ? 'completed'
                                      : 'not_started'
                                  updateTopicStatus(topic.id, nextStatus, topic.title)
                                }}
                                disabled={updatingTopics.has(topic.id)}
                                className="transition-transform hover:scale-110 disabled:opacity-50 mt-0.5 flex-shrink-0"
                              >
                                {updatingTopics.has(topic.id) ? (
                                  <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  getStatusIcon(topic.status)
                                )}
                              </button>

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
                                  className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                                    isSelected ? 'rotate-90 text-purple-400' : 'text-text-muted'
                                  }`} 
                                />
                              )}
                            </div>

                            {/* Progress Bar for topics with subtopics */}
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
                <Card className="lg:col-span-3 overflow-hidden flex flex-col">
                  <AnimatePresence mode="wait">
                    {selectedTopicId ? (() => {
                      const selectedTopic = plan.topics.find((t: any) => t.id === selectedTopicId)
                      
                      if (!selectedTopic || !selectedTopic.subtopics || selectedTopic.subtopics.length === 0) {
                        return (
                          <motion.div
                            key="no-subtopics"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
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
                          transition={{ duration: 0.3 }}
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
                              <Badge className={getStatusBadgeColor(selectedTopic.status)}>
                                {selectedTopic.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedTopic.subtopics.map((subtopic: any, subIndex: number) => (
                              <motion.div
                                key={subtopic.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: subIndex * 0.04, duration: 0.2 }}
                                className={`
                                  p-3 rounded-lg border transition-all duration-200
                                  ${subtopic.status === 'completed' 
                                    ? 'bg-green-500/10 border-green-500/30' 
                                    : subtopic.status === 'in_progress'
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'border-border hover:border-purple-500/50 hover:bg-bg-surface/70'
                                  }
                                `}
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => {
                                      const nextStatus =
                                        subtopic.status === 'not_started'
                                          ? 'in_progress'
                                          : subtopic.status === 'in_progress'
                                          ? 'completed'
                                          : 'not_started'
                                      updateTopicStatus(subtopic.id, nextStatus, subtopic.title)
                                    }}
                                    disabled={updatingTopics.has(subtopic.id)}
                                    className="transition-transform hover:scale-110 disabled:opacity-50 mt-0.5 flex-shrink-0"
                                  >
                                    {updatingTopics.has(subtopic.id) ? (
                                      <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      getStatusIcon(subtopic.status)
                                    )}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <h5 className={`text-sm font-medium ${
                                      subtopic.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'
                                    }`}>
                                      {subtopic.title}
                                    </h5>
                                    {subtopic.estimatedHours > 0 && (
                                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {subtopic.estimatedHours}h
                                      </p>
                                    )}
                                  </div>

                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {subtopic.status.replace('_', ' ')}
                                  </Badge>
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
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex items-center justify-center p-8"
                      >
                        <div className="text-center text-text-secondary">
                          <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="text-lg font-medium mb-2">Select a Topic</p>
                          <p className="text-sm">Click on a topic from the left to view its subtopics</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
