'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardAnalytics } from '@/components/providers/dashboard-provider'

interface AnalyticsRowProps {
  analytics: DashboardAnalytics
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  index: number
  iconColor: string
  iconBg: string
}

function StatCard({ icon, label, value, sub, index, iconColor, iconBg }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
      className="flex-1"
    >
      <Card className="h-full">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${iconBg} flex-shrink-0`}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted truncate">{label}</p>
              <p className="text-2xl font-bold text-text-primary mt-0.5 leading-none">{value}</p>
              {sub && <p className="text-[11px] text-text-secondary mt-1">{sub}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AnalyticsRow({ analytics }: AnalyticsRowProps) {
  const { weeklyStudyHours, habitsCompletedToday, remainingExamDays } = analytics

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <StatCard
        index={0}
        icon={<Clock className="h-4 w-4" aria-hidden />}
        iconColor="text-accent-cyan"
        iconBg="bg-cyan-500/10"
        label="Study Hours This Week"
        value={`${weeklyStudyHours}h`}
        sub="Based on logged progress"
      />
      <StatCard
        index={1}
        icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
        iconColor="text-accent-green"
        iconBg="bg-green-500/10"
        label="Habits Completed Today"
        value={String(habitsCompletedToday)}
        sub={habitsCompletedToday === 1 ? '1 habit done' : `${habitsCompletedToday} habits done`}
      />
      <StatCard
        index={2}
        icon={<Timer className="h-4 w-4" aria-hidden />}
        iconColor="text-accent-orange"
        iconBg="bg-orange-500/10"
        label="Days Until Exam"
        value={
          remainingExamDays !== null
            ? remainingExamDays <= 0
              ? 'Today!'
              : String(remainingExamDays)
            : '—'
        }
        sub={
          remainingExamDays !== null
            ? remainingExamDays > 0
              ? 'Nearest active exam'
              : 'Exam is today!'
            : 'No active exam plans'
        }
      />
    </div>
  )
}
