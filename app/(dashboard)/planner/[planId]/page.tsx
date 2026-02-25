'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

  const [plan, setPlan] = useState<Plan | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [updatingTopics, setUpdatingTopics] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPlan()
    fetchAnalytics()
  }, [planId])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/study-tracker?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/planner')
          return
        }
        throw new Error('Failed to fetch plan')
      }
      const data = await res.json()
      setPlan(data.plan)
      // Auto-expand all topics by default
      const topicIds = new Set<string>(data.plan.topics.map((t: Topic) => t.id))
      setExpandedTopics(topicIds)
    } catch (error) {
      console.error('Failed to fetch plan:', error)
    } finally {
      setLoading(false)
    }
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

  const updateTopicStatus = async (topicId: string, status: string) => {
    setUpdatingTopics((prev) => new Set(prev).add(topicId))
    try {
      const res = await fetch(`/api/plans/${planId}/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        // Refresh plan data
        await fetchPlan()
      }
    } catch (error) {
      console.error('Failed to update topic:', error)
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
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        await fetchPlan()
      }
    } catch (error) {
      console.error('Failed to update plan:', error)
    }
  }

  const deletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/planner')
      }
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/planner')}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.h1
                  className="text-3xl font-bold text-text-primary"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  {plan.title}
                </motion.h1>
                <Badge className={getStatusBadgeColor(plan.status)}>
                  {plan.status}
                </Badge>
              </div>
              <motion.p
                className="text-text-secondary flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <BookOpen className="h-4 w-4" />
                {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Plan
              </motion.p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary mb-2">
                {progressPercentage}%
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-text-secondary mt-2">
                {plan.completedTopics} of {plan.totalTopics} topics completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              <Calendar className="h-4 w-4 text-text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary mb-2">
                {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Open-ended'}
              </div>
              <p className="text-xs text-text-secondary">
                Started {new Date(plan.startDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Hours</CardTitle>
              <Clock className="h-4 w-4 text-text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary mb-2">
                {plan.totalEstimatedHours}h
              </div>
              <p className="text-xs text-text-secondary">
                {plan.dailyHours ? `${plan.dailyHours}h per day` : 'Flexible schedule'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Study Tracker Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Study Analytics</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Timeline Section */}
          {analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Timeline & Progress
                    {analytics.timeline.isOnTrack !== null && (
                      <Badge variant={analytics.timeline.isOnTrack ? 'default' : 'destructive'}>
                        {analytics.timeline.isOnTrack ? 'On Track' : 'Behind Schedule'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-text-secondary">Days Remaining</div>
                      <div className="text-2xl font-bold">
                        {analytics.timeline.totalDaysAvailable || 'N/A'} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary">Days Passed</div>
                      <div className="text-2xl font-bold">{analytics.timeline.daysPassed} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary">Buffer Days</div>
                      <div className="text-2xl font-bold text-green-500">
                        {analytics.timeline.bufferDays || 'N/A'} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary">Daily Target</div>
                      <div className="text-2xl font-bold text-purple-500">
                        {analytics.topics.dailyTarget?.toFixed(1) || 'N/A'} topics/day
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-semibold">{analytics.timeline.progressPercentage}%</span>
                    </div>
                    <Progress value={analytics.timeline.progressPercentage} className="h-3" />
                    {analytics.timeline.expectedProgress && (
                      <div className="text-sm text-text-secondary">
                        Expected: {analytics.timeline.expectedProgress.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Timeline Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
          >
            <TimelineCalendar
              startDate={plan.startDate}
              endDate={plan.endDate}
              topics={plan.topics}
              planId={planId}
              dailyHours={plan.dailyHours}
              onTopicsUpdate={fetchPlan}
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Track your daily progress and manage study activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Log Study Hours</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Mock Test</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <RotateCcw className="h-5 w-5" />
                    <span className="text-xs">Revisions</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BookMarked className="h-5 w-5" />
                    <span className="text-xs">Mistakes</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Weekly Review</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* Priority Strategy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Priority Strategy
                    </CardTitle>
                    <CardDescription>Track completion by priority level</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* High Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">🔴 High Priority</Badge>
                          <span className="text-sm text-text-secondary">
                            {analytics.topics.byPriority.high.completed} / {analytics.topics.byPriority.high.total}
                          </span>
                        </div>
                        <span className="font-semibold">{analytics.topics.byPriority.high.percentage}%</span>
                      </div>
                      <Progress value={parseFloat(analytics.topics.byPriority.high.percentage)} className="h-2" />
                      <p className="text-xs text-text-secondary">High weightage + Weak areas → First 50% time</p>
                    </div>

                    {/* Medium Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">🟡 Medium Priority</Badge>
                          <span className="text-sm text-text-secondary">
                            {analytics.topics.byPriority.medium.completed} / {analytics.topics.byPriority.medium.total}
                          </span>
                        </div>
                        <span className="font-semibold">{analytics.topics.byPriority.medium.percentage}%</span>
                      </div>
                      <Progress value={parseFloat(analytics.topics.byPriority.medium.percentage)} className="h-2" />
                      <p className="text-xs text-text-secondary">Important but manageable → Middle phase</p>
                    </div>

                    {/* Low Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">🟢 Low Priority</Badge>
                          <span className="text-sm text-text-secondary">
                            {analytics.topics.byPriority.low.completed} / {analytics.topics.byPriority.low.total}
                          </span>
                        </div>
                        <span className="font-semibold">{analytics.topics.byPriority.low.percentage}%</span>
                      </div>
                      <Progress value={parseFloat(analytics.topics.byPriority.low.percentage)} className="h-2" />
                      <p className="text-xs text-text-secondary">Less weightage → Final phase</p>
                    </div>

                    {analytics.topics.overdue > 0 && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {analytics.topics.overdue} overdue topics - Cover them in the next 2 days!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Study Hours & Mock Tests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Study Hours (Last 30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Planned Hours</span>
                        <span className="font-bold">{analytics.studyHours.last30Days.planned.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Actual Hours</span>
                        <span className="font-bold">{analytics.studyHours.last30Days.actual.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Average Daily</span>
                        <span className="font-bold">{analytics.studyHours.last30Days.average.toFixed(1)}h</span>
                      </div>
                      {analytics.studyHours.last30Days.adherence && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Adherence Rate</span>
                            <span className="font-bold">{analytics.studyHours.last30Days.adherence.toFixed(1)}%</span>
                          </div>
                          <Progress value={analytics.studyHours.last30Days.adherence} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Mock Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Total Tests</span>
                        <span className="font-bold">{analytics.mockTests.total}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Completed</span>
                        <span className="font-bold">{analytics.mockTests.completed}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Scheduled</span>
                        <span className="font-bold">{analytics.mockTests.scheduled}</span>
                      </div>
                      {analytics.mockTests.averageScore && (
                        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <div className="text-sm text-text-secondary">Average Score</div>
                          <div className="text-3xl font-bold text-green-600">
                            {analytics.mockTests.averageScore}%
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Revision & Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        3-Stage Revision System
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Total Revisions</span>
                        <span className="font-bold">{analytics.revision.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                        <span>Pending</span>
                        <span className="font-bold text-blue-600">{analytics.revision.pending}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <span>Completed</span>
                        <span className="font-bold text-green-600">{analytics.revision.completed}</span>
                      </div>
                      {analytics.revision.overdueRevisions > 0 && (
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                          <span className="text-sm font-semibold text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {analytics.revision.overdueRevisions} overdue revisions
                          </span>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-purple-500/5 rounded-lg text-sm">
                        <div className="font-semibold mb-1">Revision Formula:</div>
                        <div className="space-y-1 text-xs text-text-secondary">
                          <div>1️⃣ Within 24 hours</div>
                          <div>2️⃣ After 7 days</div>
                          <div>3️⃣ After 30 days</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5" />
                        Mistake Notebook
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-bg-surface rounded-lg">
                        <span>Total Mistakes</span>
                        <span className="font-bold">{analytics.mistakes.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                        <span>Unresolved</span>
                        <span className="font-bold text-orange-600">{analytics.mistakes.unresolved}</span>
                      </div>
                      {Object.keys(analytics.mistakes.byCategory).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold">By Category:</div>
                          {Object.entries(analytics.mistakes.byCategory).map(([category, count]) => (
                            <div key={category} className="flex justify-between text-sm p-2 bg-bg-surface rounded">
                              <span>{category}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Success Blueprint */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🔥 Success Blueprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Finish High priority early</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Track hours daily</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Revise weekly</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Analyse mocks deeply</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Maintain buffer days</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Never skip consistency</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-text-secondary">
                Loading analytics data...
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          {/* Topics List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Topics
            </CardTitle>
            <CardDescription>
              Track your progress through each topic and subtopic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.topics.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No topics found for this plan
              </div>
            ) : (
              plan.topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
                >
                  <div className="border border-border rounded-lg overflow-hidden">
                    {/* Parent Topic */}
                    <div
                      className={`p-4 flex items-center gap-3 hover:bg-bg-surface/50 transition-colors ${
                        topic.subtopics && topic.subtopics.length > 0 ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (topic.subtopics && topic.subtopics.length > 0) {
                          toggleTopic(topic.id)
                        }
                      }}
                    >
                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <motion.div
                          animate={{ rotate: expandedTopics.has(topic.id) ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4 text-text-muted" />
                        </motion.div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const nextStatus =
                            topic.status === 'not_started'
                              ? 'in_progress'
                              : topic.status === 'in_progress'
                              ? 'completed'
                              : 'not_started'
                          updateTopicStatus(topic.id, nextStatus)
                        }}
                        disabled={updatingTopics.has(topic.id)}
                        className="transition-transform hover:scale-110"
                      >
                        {getStatusIcon(topic.status)}
                      </button>

                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary">{topic.title}</h4>
                        {topic.estimatedHours > 0 && (
                          <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {topic.estimatedHours}h
                          </p>
                        )}
                      </div>

                      {!topic.subtopics || topic.subtopics.length === 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {topic.status.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {topic.subtopics.filter((st) => st.status === 'completed').length}/
                          {topic.subtopics.length} complete
                        </Badge>
                      )}
                    </div>

                    {/* Subtopics */}
                    <AnimatePresence>
                      {expandedTopics.has(topic.id) &&
                        topic.subtopics &&
                        topic.subtopics.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border bg-bg-surface/30"
                          >
                            {topic.subtopics.map((subtopic, subIndex) => (
                              <motion.div
                                key={subtopic.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                                className="p-4 pl-12 flex items-center gap-3 hover:bg-bg-surface/50 transition-colors border-b last:border-b-0 border-border"
                              >
                                <button
                                  onClick={() => {
                                    const nextStatus =
                                      subtopic.status === 'not_started'
                                        ? 'in_progress'
                                        : subtopic.status === 'in_progress'
                                        ? 'completed'
                                        : 'not_started'
                                    updateTopicStatus(subtopic.id, nextStatus)
                                  }}
                                  disabled={updatingTopics.has(subtopic.id)}
                                  className="transition-transform hover:scale-110"
                                >
                                  {getStatusIcon(subtopic.status)}
                                </button>

                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-text-primary">
                                    {subtopic.title}
                                  </h5>
                                  {subtopic.estimatedHours > 0 && (
                                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {subtopic.estimatedHours}h
                                    </p>
                                  )}
                                </div>

                                <Badge variant="outline" className="text-xs">
                                  {subtopic.status.replace('_', ' ')}
                                </Badge>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
