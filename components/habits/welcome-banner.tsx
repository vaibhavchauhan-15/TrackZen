'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const greetingTime = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface WelcomeBannerProps {
  remainingToday: number
}

export function WelcomeBanner({ remainingToday }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-accent-purple/20 bg-gradient-to-br from-accent-purple/20 via-bg-surface to-bg-surface">
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent-purple/5 rounded-full blur-3xl" />
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-accent-purple" />
            <span className="text-[10px] sm:text-xs font-medium text-accent-purple uppercase tracking-wider">
              Daily Focus
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">
            {greetingTime()}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            {remainingToday > 0
              ? `You have ${remainingToday} habit${remainingToday > 1 ? 's' : ''} remaining today. Keep going!`
              : 'All habits completed for today! Amazing work! 🎉'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
