'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakBannerProps {
  streak: number
}

const getStreakConfig = (days: number) => {
  if (days === 0) return { gradient: 'from-gray-500 to-gray-600', title: 'Start Your Journey' }
  if (days <= 2) return { gradient: 'from-red-500 to-red-600', title: 'Getting Started' }
  if (days <= 6) return { gradient: 'from-orange-500 to-orange-600', title: 'On a Roll' }
  if (days <= 13) return { gradient: 'from-yellow-500 to-amber-600', title: 'One Week Strong' }
  if (days <= 29) return { gradient: 'from-purple-500 to-purple-600', title: 'Two Weeks Warrior' }
  return { gradient: 'from-cyan-500 to-cyan-600', title: 'Unstoppable' }
}

export function StreakBanner({ streak }: StreakBannerProps) {
  const config = getStreakConfig(streak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${config.gradient} p-4 sm:p-6`}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <p className="text-xs sm:text-sm font-medium text-white/90">{config.title}</p>
          <motion.h2
            className="mt-1 text-2xl sm:text-4xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {streak} Day Streak
          </motion.h2>
        </motion.div>

        {/* Animated flame */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Flame className="h-12 w-12 sm:h-16 sm:w-16 text-white drop-shadow-lg" />
          </motion.div>
          
          {/* Glow effect behind flame */}
          <motion.div
            className="absolute inset-0 blur-xl bg-white/30 rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Particle effects */}
      {streak > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%',
                y: '100%',
                opacity: 0 
              }}
              animate={{
                y: '-20%',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
