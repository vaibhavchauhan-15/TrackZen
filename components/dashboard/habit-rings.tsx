'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GlowMotionDiv } from '@/components/ui/glow-motion'
import { HabitSummary } from './types'

interface HabitRingsProps {
  habits: HabitSummary[]
}

export function HabitRings({ habits }: HabitRingsProps) {
  const completedCount = habits.filter((h) => h.completed).length
  const overallCompletion = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0

  // SVG circle properties
  const radius = 52
  const circumference = 2 * Math.PI * radius

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-bg-surface border-bg-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Today's Habits</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Complete your daily routines</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Animated Ring */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-bg-elevated"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * (1 - overallCompletion / 100) }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-2xl sm:text-3xl font-bold text-text-primary"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                >
                  {overallCompletion}%
                </motion.span>
                <span className="text-xs text-text-muted">Complete</span>
              </div>

              {/* Pulsing glow when complete */}
              {overallCompletion === 100 && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-accent-green"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </div>

          {/* Habit list */}
          <div className="space-y-2">
            {habits.slice(0, 5).map((habit, index) => (
              <GlowMotionDiv
                key={habit.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                className="flex items-center justify-between rounded-lg bg-bg-elevated/50 p-2.5 group hover:bg-bg-elevated transition-colors"
              >
                <span className={`text-sm ${habit.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {habit.title}
                </span>
                <motion.div whileTap={{ scale: 0.8 }}>
                  {habit.completed ? (
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
                </motion.div>
              </GlowMotionDiv>
            ))}
          </div>

          <Link href="/habits">
            <Button className="mt-4 w-full group" variant="outline">
              View All Habits
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
