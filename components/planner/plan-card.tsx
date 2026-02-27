'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlanSummary } from './types'

interface PlanCardProps {
  plan: PlanSummary
  index: number
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  completed: { label: 'Completed', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  paused: { label: 'Paused', color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
}

const typeEmoji: Record<string, string> = {
  exam: '📝',
  work: '💼',
  course: '📚',
  custom: '🎯',
}

export function PlanCard({ plan, index }: PlanCardProps) {
  const completion = plan.totalTopics > 0 
    ? Math.round((plan.completedTopics / plan.totalTopics) * 100) 
    : 0
  const status = statusConfig[plan.status] || statusConfig.active

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/planner/${plan.id}`}>
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-bg-surface border-bg-elevated overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
            {/* Top color accent bar */}
            <div 
              className="h-1 w-full"
              style={{ backgroundColor: plan.color || '#7C3AED' }}
            />
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <motion.span 
                    className="text-xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {typeEmoji[plan.type] || '📋'}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-1 text-sm sm:text-base group-hover:text-accent-purple transition-colors">
                      {plan.title}
                    </CardTitle>
                    <CardDescription className="text-xs capitalize mt-0.5">
                      {plan.type} Plan
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`text-xs shrink-0 ${status.color} ${status.bg} border-none`}>
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Progress</span>
                  <motion.span
                    className="font-semibold text-text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    {completion}%
                  </motion.span>
                </div>
                <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: plan.color || '#7C3AED' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.08, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1">
                  {plan.completedTopics} of {plan.totalTopics} topics completed
                </p>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{plan.endDate || 'Open-ended'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{plan.totalEstimatedHours || 0}h</span>
                  </div>
                </div>
                
                <motion.div
                  className="text-text-muted group-hover:text-accent-purple transition-colors"
                  whileHover={{ x: 3 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  )
}
