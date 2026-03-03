'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BookOpen, Calendar, Goal, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DashboardTopic, DashboardPlan } from '@/components/providers/dashboard-provider'

interface PlannerOverviewProps {
  todaysTopics: DashboardTopic[]
  recentPlans: DashboardPlan[]
}

const PRIORITY_STYLES: Record<string, { dot: string; label: string }> = {
  high:   { dot: 'bg-accent-red',    label: 'High' },
  medium: { dot: 'bg-accent-orange', label: 'Med' },
  low:    { dot: 'bg-accent-green',  label: 'Low' },
}

function priorityStyle(priority: string) {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium
}

function formatEndDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PlannerOverview({ todaysTopics, recentPlans }: PlannerOverviewProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent-purple" aria-hidden />
            <h2 className="text-sm font-semibold text-text-primary">Planner Overview</h2>
          </div>
          <button
            onClick={() => router.push('/planner')}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-purple transition-colors duration-200 group"
            aria-label="View all plans"
          >
            View All
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </button>
        </CardHeader>

        <CardContent className="px-5 pb-5 flex-1 space-y-5">
          {/* Today's Topics */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Calendar className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Today's Topics
              </h3>
            </div>
            {todaysTopics.length === 0 ? (
              <p className="text-xs text-text-muted pl-1">No topics scheduled for today.</p>
            ) : (
              <ul className="space-y-2" role="list">
                {todaysTopics.map((topic, i) => (
                  <motion.li
                    key={topic.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 + i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-start gap-3 rounded-lg bg-bg-elevated px-3 py-2.5"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${priorityStyle(topic.priority).dot}`}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{topic.title}</p>
                      {topic.subtopicTitle && (
                        <p className="text-[11px] text-text-muted truncate">{topic.subtopicTitle}</p>
                      )}
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{topic.planTitle}</p>
                    </div>
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {topic.estimatedHours > 0 ? `${topic.estimatedHours}h` : '—'}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-border/60" aria-hidden />

          {/* Recent Plans */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Goal className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Recent Plans
              </h3>
            </div>
            {recentPlans.length === 0 ? (
              <p className="text-xs text-text-muted pl-1">No plans yet.</p>
            ) : (
              <ul className="space-y-2.5" role="list">
                {recentPlans.map((plan, i) => (
                  <motion.li
                    key={plan.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-lg bg-bg-elevated px-3 py-2.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: plan.color }}
                          aria-hidden
                        />
                        <p className="text-xs font-medium text-text-primary truncate">{plan.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            plan.status === 'active'
                              ? 'bg-green-500/10 text-accent-green'
                              : plan.status === 'paused'
                              ? 'bg-orange-500/10 text-accent-orange'
                              : 'bg-bg-surface text-text-muted'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: plan.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${plan.progress}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-text-muted">
                          {plan.progress}% complete
                        </span>
                        {plan.endDate && (
                          <span className="text-[10px] text-text-muted">
                            Due {formatEndDate(plan.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </motion.div>
  )
}
