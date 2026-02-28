'use client'

import { motion } from 'framer-motion'
import { Sparkles, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedAddButton } from '@/components/ui/animated-add-button'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface PlannerHeaderProps {
  totalPlans: number
  activePlans: number
}

export function PlannerHeader({ totalPlans, activePlans }: PlannerHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-accent-purple/20 bg-gradient-to-br from-accent-purple/10 via-bg-surface to-bg-surface">
        <div className="absolute -top-4 -right-4 w-20 h-2 bg-accent-purple/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-2 bg-accent-cyan/5 rounded-full blur-xl" />
        
        <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-purple" />
                </motion.div>
                <span className="text-[9px] sm:text-[10px] font-medium text-accent-purple uppercase tracking-wider">
                  Study Planner
                </span>
              </motion.div>
              
              <motion.h1
                className="text-base sm:text-lg font-bold text-text-primary leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Manage Your Study Plans
              </motion.h1>
              
              <motion.p
                className="text-[10px] sm:text-xs text-text-secondary leading-snug"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {activePlans > 0
                  ? `You have ${activePlans} active plan${activePlans > 1 ? 's' : ''} out of ${totalPlans} total`
                  : 'Create your first study plan to get started'}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="flex items-center gap-3"
            >
              <AnimatedAddButton href="/planner/new" text="New Plan" size="sm" />
              
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
