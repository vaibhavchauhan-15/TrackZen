'use client'

import { motion } from 'framer-motion'
import { Sparkles, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-accent-purple/20 bg-gradient-to-br from-accent-purple/15 via-bg-surface to-bg-surface">
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-2xl" />
        
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <motion.div
                className="flex items-center gap-2 mb-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent-purple" />
                </motion.div>
                <span className="text-[10px] sm:text-xs font-medium text-accent-purple uppercase tracking-wider">
                  Study Planner
                </span>
              </motion.div>
              
              <motion.h1
                className="text-xl sm:text-2xl font-bold text-text-primary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Manage Your Study Plans
              </motion.h1>
              
              <motion.p
                className="mt-1 text-xs sm:text-sm text-text-secondary"
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
              className="hidden sm:flex"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-xl bg-accent-purple/10 flex items-center justify-center"
              >
                <BookOpen className="w-8 h-8 text-accent-purple" />
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
