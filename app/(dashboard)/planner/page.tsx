'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { Plus, Calendar, Clock, Target } from 'lucide-react'

export default function PlannerPage() {
  const { data, loading } = useDashboard()
  
  const plans = data?.plans || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-lg bg-bg-surface animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Study Planner</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
            Manage your study plans and track progress
          </p>
        </div>
        <Link href="/planner/new" prefetch={true}>
          <Button size="default" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            New Plan
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="py-12 sm:py-16">
          <CardContent className="flex flex-col items-center text-center px-4">
            <Target className="h-12 w-12 sm:h-16 sm:w-16 text-text-muted mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">
              No plans yet
            </h3>
            <p className="text-sm sm:text-base text-text-secondary mb-6">
              Create your first study plan to get started
            </p>
            <Link href="/planner/new" prefetch={true}>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: any, index: number) => (
            <div
              key={plan.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link href={`/planner/${plan.id}`} prefetch={true}>
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1 text-base sm:text-lg">{plan.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm">
                          {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                        </CardDescription>
                      </div>
                      <Badge className="text-xs shrink-0">{plan.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex justify-between text-xs sm:text-sm mb-2">
                          <span className="text-text-secondary">Progress</span>
                          <span className="font-semibold text-text-primary">
                            {Math.round((plan.completedTopics / plan.totalTopics) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={(plan.completedTopics / plan.totalTopics) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{plan.endDate || 'Open-ended'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{plan.totalEstimatedHours}h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
