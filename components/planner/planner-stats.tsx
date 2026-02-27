'use client'

import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

// Animated count up
const CountUp = ({ target, duration = 800 }: { target: number; duration?: number }) => {
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

  return <>{count}</>
}

interface PlannerStatsProps {
  totalPlans: number
  activePlans: number
  completedPlans: number
  totalHours: number
}

export function PlannerStats({ totalPlans, activePlans, completedPlans, totalHours }: PlannerStatsProps) {
  const stats = [
    {
      label: 'Total Plans',
      value: totalPlans,
      icon: BookOpen,
      color: 'text-accent-purple',
      bgColor: 'bg-accent-purple/10',
    },
    {
      label: 'Active Plans',
      value: activePlans,
      icon: Target,
      color: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
    },
    {
      label: 'Completed',
      value: completedPlans,
      icon: CheckCircle2,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
    },
    {
      label: 'Total Hours',
      value: totalHours,
      suffix: 'h',
      icon: Clock,
      color: 'text-accent-orange',
      bgColor: 'bg-accent-orange/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <Card className="bg-bg-surface border-bg-elevated overflow-hidden group cursor-default">
            <CardContent className="p-3 sm:p-4 relative">
              {/* Hover glow */}
              <motion.div
                className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                style={{ filter: 'blur(30px)' }}
              />

              <div className="relative z-10 flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </motion.div>
                <div>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-text-primary">
                    <CountUp target={stat.value} />
                    {stat.suffix && <span className="text-sm text-text-secondary ml-0.5">{stat.suffix}</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
