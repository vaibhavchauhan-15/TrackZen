'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function StudyTrackerDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  useEffect(() => {
    if (planId) {
      fetchAnalytics()
    }
  }, [planId])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/study-tracker?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Study Tracker Dashboard</h1>
        <p className="text-muted-foreground">Complete exam preparation tracking system</p>
      </div>

      {/* Timeline Section */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🎯 Timeline & Progress
          {analytics.timeline.isOnTrack !== null && (
            <Badge variant={analytics.timeline.isOnTrack ? 'default' : 'destructive'}>
              {analytics.timeline.isOnTrack ? 'On Track' : 'Behind Schedule'}
            </Badge>
          )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Days Remaining</div>
            <div className="text-2xl font-bold">
              {analytics.timeline.totalDaysAvailable || 'N/A'} days
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Days Passed</div>
            <div className="text-2xl font-bold">{analytics.timeline.daysPassed} days</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Buffer Days</div>
            <div className="text-2xl font-bold text-green-500">
              {analytics.timeline.bufferDays || 'N/A'} days
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Daily Target</div>
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
            <div className="text-sm text-muted-foreground">
              Expected: {analytics.timeline.expectedProgress.toFixed(1)}%
            </div>
          )}
        </div>
      </Card>

      {/* Priority Strategy */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Priority Strategy</h2>
        
        <div className="space-y-4">
          {/* High Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">🔴 High Priority</Badge>
                <span className="text-sm text-muted-foreground">
                  {analytics.topics.byPriority.high.completed} / {analytics.topics.byPriority.high.total}
                </span>
              </div>
              <span className="font-semibold">{analytics.topics.byPriority.high.percentage}%</span>
            </div>
            <Progress value={parseFloat(analytics.topics.byPriority.high.percentage)} className="h-2" />
            <p className="text-xs text-muted-foreground">High weightage + Weak areas → First 50% time</p>
          </div>

          {/* Medium Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">🟡 Medium Priority</Badge>
                <span className="text-sm text-muted-foreground">
                  {analytics.topics.byPriority.medium.completed} / {analytics.topics.byPriority.medium.total}
                </span>
              </div>
              <span className="font-semibold">{analytics.topics.byPriority.medium.percentage}%</span>
            </div>
            <Progress value={parseFloat(analytics.topics.byPriority.medium.percentage)} className="h-2" />
            <p className="text-xs text-muted-foreground">Important but manageable → Middle phase</p>
          </div>

          {/* Low Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">🟢 Low Priority</Badge>
                <span className="text-sm text-muted-foreground">
                  {analytics.topics.byPriority.low.completed} / {analytics.topics.byPriority.low.total}
                </span>
              </div>
              <span className="font-semibold">{analytics.topics.byPriority.low.percentage}%</span>
            </div>
            <Progress value={parseFloat(analytics.topics.byPriority.low.percentage)} className="h-2" />
            <p className="text-xs text-muted-foreground">Less weightage → Final phase</p>
          </div>
        </div>

        {analytics.topics.overdue > 0 && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm font-semibold text-red-600">
              ⚠️ {analytics.topics.overdue} overdue topics - Cover them in the next 2 days!
            </p>
          </div>
        )}
      </Card>

      {/* Study Hours Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">⏱ Study Hours (Last 30 Days)</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Planned Hours</span>
              <span className="font-bold">{analytics.studyHours.last30Days.planned.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Actual Hours</span>
              <span className="font-bold">{analytics.studyHours.last30Days.actual.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Average Daily</span>
              <span className="font-bold">{analytics.studyHours.last30Days.average.toFixed(1)}h</span>
            </div>
            {analytics.studyHours.last30Days.adherence && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Adherence Rate</span>
                  <span className="font-bold">
                    {analytics.studyHours.last30Days.adherence.toFixed(1)}%
                  </span>
                </div>
                <Progress value={analytics.studyHours.last30Days.adherence} className="h-2" />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Mock Tests</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Total Tests</span>
              <span className="font-bold">{analytics.mockTests.total}</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Completed</span>
              <span className="font-bold">{analytics.mockTests.completed}</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary rounded-lg">
              <span>Scheduled</span>
              <span className="font-bold">{analytics.mockTests.scheduled}</span>
            </div>
            {analytics.mockTests.averageScore && (
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <div className="text-sm text-muted-foreground">Average Score</div>
                <div className="text-3xl font-bold text-green-600">
                  {analytics.mockTests.averageScore}%
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Revision & Mistakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔄 3-Stage Revision System</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
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
                <span className="text-sm font-semibold text-red-600">
                  ⚠️ {analytics.revision.overdueRevisions} overdue revisions
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-purple-500/5 rounded-lg text-sm">
            <div className="font-semibold mb-1">Revision Formula:</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>1️⃣ Within 24 hours</div>
              <div>2️⃣ After 7 days</div>
              <div>3️⃣ After 30 days</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📔 Mistake Notebook</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span>Total Mistakes</span>
              <span className="font-bold">{analytics.mistakes.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
              <span>Unresolved</span>
              <span className="font-bold text-orange-600">{analytics.mistakes.unresolved}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">By Category:</div>
            {Object.entries(analytics.mistakes.byCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between text-sm p-2 bg-secondary rounded">
                <span>{category}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <h2 className="text-xl font-semibold mb-4">🔥 Success Blueprint</h2>
        
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
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => window.location.href = `/study-logs?planId=${planId}`}>
          Log Today's Study
        </Button>
        <Button variant="outline" onClick={() => window.location.href = `/mock-tests?planId=${planId}`}>
          Take Mock Test
        </Button>
        <Button variant="outline" onClick={() => window.location.href = `/revisions?planId=${planId}`}>
          View Revisions
        </Button>
        <Button variant="outline" onClick={() => window.location.href = `/mistakes?planId=${planId}`}>
          Mistake Notebook
        </Button>
        <Button variant="outline" onClick={() => window.location.href = `/weekly-review?planId=${planId}`}>
          Weekly Review
        </Button>
      </div>
    </div>
  )
}
