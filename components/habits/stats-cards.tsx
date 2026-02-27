'use client'

import { motion } from 'framer-motion'
import { Flame, CheckCircle, TrendingUp, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { HabitStats } from './types'

const CountUp = ({ target, duration = 1200 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  
  return <>{count}</>
}

interface StatsCardsProps {
  stats: HabitStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Current Streak',
      value: stats.bestStreak,
      suffix: ' days',
      icon: Flame,
      iconColor: 'text-streak-gold',
      bgColor: 'bg-streak-gold/10',
    },
    {
      label: "Today's Progress",
      value: stats.completionRate,
      suffix: '%',
      icon: CheckCircle,
      iconColor: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
    },
    {
      label: 'Total Completed',
      value: stats.totalCompleted,
      suffix: '',
      icon: TrendingUp,
      iconColor: 'text-accent-purple',
      bgColor: 'bg-accent-purple/10',
    },
    {
      label: 'Active Habits',
      value: stats.activeCount,
      suffix: '',
      icon: Target,
      iconColor: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
        >
          <Card className="bg-bg-surface border-bg-elevated hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon size={16} className={`sm:w-[18px] sm:h-[18px] ${card.iconColor}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                  <CountUp target={card.value} />
                </span>
                {card.suffix && (
                  <span className="text-xs sm:text-sm text-text-secondary">{card.suffix}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
