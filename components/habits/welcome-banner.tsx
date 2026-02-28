'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedAddButton } from '@/components/ui/animated-add-button'

const greetingTime = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface WelcomeBannerProps {
  remainingToday: number
  onAddHabit?: () => void
}

export function WelcomeBanner({ remainingToday, onAddHabit }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-accent-purple/20 bg-gradient-to-br from-accent-purple/10 via-bg-surface to-bg-surface">
        <div className="absolute -top-8 -right-8 w-24 h-2 bg-accent-purple/5 rounded-full blur-2xl" />
        <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="sm:w-3.5 sm:h-3.5 text-accent-purple" />
                <span className="text-[9px] sm:text-[10px] font-medium text-accent-purple uppercase tracking-wider">
                  Daily Focus
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary leading-tight">
                {greetingTime()}! 👋
              </h2>
              <p className="text-[10px] sm:text-xs text-text-secondary leading-snug">
                {remainingToday > 0
                  ? `You have ${remainingToday} habit${remainingToday > 1 ? 's' : ''} remaining today. Keep going!`
                  : 'All habits completed for today! Amazing work! 🎉'}
              </p>
            </div>
            
            {onAddHabit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="hidden sm:block"
              >
                <AnimatedAddButton onClick={onAddHabit} text="New Habit" size="sm" />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
