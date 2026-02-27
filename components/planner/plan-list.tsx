'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlanCard } from './plan-card'
import { PlanSummary } from './types'

interface PlanListProps {
  plans: PlanSummary[]
}

export function PlanList({ plans }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-bg-surface border-bg-elevated py-12 sm:py-16">
          <CardContent className="flex flex-col items-center text-center px-4">
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
            >
              <Target className="h-14 w-14 sm:h-16 sm:w-16 text-text-muted mb-4" />
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl font-semibold text-text-primary mb-2"
            >
              No plans yet
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base text-text-secondary mb-6 max-w-sm"
            >
              Create your first study plan to start organizing your learning journey
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/planner/new">
                <Button className="w-full sm:w-auto bg-accent-purple hover:bg-accent-purple/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {plans.map((plan, index) => (
          <PlanCard key={plan.id} plan={plan} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}
