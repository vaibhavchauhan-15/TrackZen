'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Calendar, TrendingUp, LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Animated count up component
const CountUp = ({ target, suffix = '', duration = 1000 }: { target: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }
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

  return <>{count}{suffix}</>
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  suffix?: string
  trend?: string
  color: string
  bgColor: string
  delay?: number
}

function StatCard({ icon: Icon, label, value, suffix = '', trend, color, bgColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="bg-bg-surface border-bg-elevated overflow-hidden group cursor-default">
        <CardContent className="p-4 sm:p-5 relative">
          {/* Subtle hover glow */}
          <motion.div
            className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            style={{ filter: 'blur(40px)' }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <motion.div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${bgColor} flex items-center justify-center`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
              </motion.div>
              {trend && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  <Badge variant="secondary" className="bg-accent-green/10 text-accent-green text-xs">
                    {trend}
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-muted mb-1 line-clamp-1">{label}</p>
            <p className="text-xl sm:text-2xl font-bold text-text-primary">
              {typeof value === 'number' ? (
                <CountUp target={value} suffix={suffix} />
              ) : (
                value
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface DashboardStatsProps {
  weeklyHours: number
  habitsCompleted: number
  totalHabits: number
  nextExamDays: number | null
  streak: number
}

export function DashboardStats({ weeklyHours, habitsCompleted, totalHabits, nextExamDays, streak }: DashboardStatsProps) {
  const cards = [
    {
      icon: Clock,
      label: 'Study Hours This Week',
      value: weeklyHours,
      suffix: 'h',
      trend: '+12%',
      color: 'text-accent-purple',
      bgColor: 'bg-accent-purple/10',
    },
    {
      icon: CheckCircle2,
      label: 'Habits Completed Today',
      value: `${habitsCompleted}/${totalHabits}`,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
    },
    {
      icon: Calendar,
      label: 'Days Till Next Exam',
      value: nextExamDays !== null ? nextExamDays : 'None',
      color: 'text-accent-orange',
      bgColor: 'bg-accent-orange/10',
    },
    {
      icon: TrendingUp,
      label: 'Current Streak',
      value: streak,
      suffix: ' days',
      color: 'text-streak-gold',
      bgColor: 'bg-streak-gold/10',
    },
  ]

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.label}
          {...card}
          value={typeof card.value === 'string' ? card.value : card.value}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}
