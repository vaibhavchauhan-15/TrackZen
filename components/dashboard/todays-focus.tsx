'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlowMotionDiv } from '@/components/ui/glow-motion'
import { AnimatedAddButton } from '@/components/ui/animated-add-button'
import { Task } from './types'

interface TodaysFocusProps {
  tasks: Task[]
}

const priorityConfig: Record<string, { color: string; bg: string }> = {
  highest: { color: 'text-accent-red', bg: 'bg-accent-red/10' },
  high: { color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
  medium: { color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  low: { color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
}

export function TodaysFocus({ tasks }: TodaysFocusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-bg-surface border-bg-elevated overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Today's Focus</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top priority topics for today</CardDescription>
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
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Target className="mx-auto h-12 w-12 text-text-muted" />
              </motion.div>
              <p className="mt-4 text-sm text-text-secondary">No tasks scheduled for today</p>
              <div className="mt-4 flex justify-center">
                <AnimatedAddButton href="/planner/new" text="Create Plan" size="sm" />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {tasks.slice(0, 5).map((task, index) => (
                  <GlowMotionDiv
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 rounded-lg border border-bg-elevated p-3 hover:bg-bg-elevated/50 transition-colors cursor-pointer group"
                  >
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <CheckCircle2 className="h-5 w-5 text-accent-green" />
                        </motion.div>
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted group-hover:text-accent-purple transition-colors" />
                      )}
                    </motion.button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {task.estimatedHours}h estimated
                        {task.planTitle && ` • ${task.planTitle}`}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${priorityConfig[task.priority]?.color || 'text-text-muted'} ${priorityConfig[task.priority]?.bg || ''}`}
                    >
                      {task.priority}
                    </Badge>
                  </GlowMotionDiv>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
