'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface WelcomeSectionProps {
  userName: string
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
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
          <Sparkles className="w-5 h-5 text-accent-purple" />
        </motion.div>
        <span className="text-xs sm:text-sm font-medium text-accent-purple uppercase tracking-wider">
          {getGreeting()}
        </span>
      </motion.div>
      
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-text-primary"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome back, {userName}! 
        <motion.span
          className="inline-block ml-2"
          animate={{ rotate: [0, 20, 0] }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }}
        >
          👋
        </motion.span>
      </motion.h1>
      
      <motion.p
        className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Here's your productivity overview for today
      </motion.p>
    </motion.div>
  )
}
