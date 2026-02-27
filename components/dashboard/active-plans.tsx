'use client'

import { motion } from 'framer-motion'
import { Calendar, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GlowMotionDiv } from '@/components/ui/glow-motion'
import { Plan } from './types'

interface ActivePlansProps {
  plans: Plan[]
}

export function ActivePlans({ plans }: ActivePlansProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-bg-surface border-bg-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Active Plans</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your ongoing study plans</CardDescription>
            </div>
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="group">
                View All
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Calendar className="mx-auto h-12 w-12 text-text-muted" />
              </motion.div>
              <p className="mt-4 text-sm text-text-secondary">No active plans</p>
              <Link href="/planner/new">
                <Button className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
                >
                  <Link href={`/planner/${plan.id}`}>
                    <GlowMotionDiv
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      className="rounded-lg border border-bg-elevated p-4 hover:bg-bg-elevated/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-text-primary text-sm truncate group-hover:text-accent-purple transition-colors">
                            {plan.title}
                          </h4>
                          <p className="text-xs text-text-secondary mt-0.5 capitalize">{plan.type}</p>
                        </div>
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.08 }}
                        >
                          <Badge 
                            className="text-xs"
                            style={{ 
                              backgroundColor: plan.color ? `${plan.color}20` : 'var(--accent-purple)/10',
                              color: plan.color || 'var(--accent-purple)'
                            }}
                          >
                            {plan.completion}%
                          </Badge>
                        </motion.div>
                      </div>
                      <div className="relative">
                        <Progress value={0} className="h-1.5 bg-bg-elevated" />
                        <motion.div
                          className="absolute inset-0 h-1.5 rounded-full"
                          style={{ backgroundColor: plan.color || '#7C3AED' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${plan.completion}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                    </GlowMotionDiv>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
