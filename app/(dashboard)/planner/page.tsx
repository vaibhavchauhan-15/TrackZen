'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Calendar, Clock, Target } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PlannerPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        setPlans(data.plans || [])
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-lg bg-bg-surface animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Study Planner</h1>
          <p className="mt-2 text-text-secondary">
            Manage your study plans and track progress
          </p>
        </div>
        <Link href="/planner/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Plan
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <Target className="h-16 w-16 text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No plans yet
            </h3>
            <p className="text-text-secondary mb-6">
              Create your first study plan to get started
            </p>
            <Link href="/planner/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: any, index: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/planner/${plan.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{plan.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                        </CardDescription>
                      </div>
                      <Badge>{plan.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
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
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{plan.endDate || 'Open-ended'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{plan.totalEstimatedHours}h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
