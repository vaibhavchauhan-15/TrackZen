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
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center gap-2.5 sm:items-start sm:gap-3">
            <div className={`rounded-lg p-1.5 sm:p-2 ${iconBg} flex-shrink-0`}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-text-muted leading-tight truncate">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 leading-none">{value}</p>
              {sub && <p className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 sm:mt-1 truncate">{sub}</p>}
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
    // Mobile: study hours full-width top row, habits + exam side-by-side below
    // sm+: all three equal columns
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
      {/* Study Hours — spans full width on mobile */}
      <div className="col-span-2 sm:col-span-1">
        <StatCard
          index={0}
          icon={<Clock className="h-4 w-4" aria-hidden />}
          iconColor="text-accent-cyan"
          iconBg="bg-cyan-500/10"
          label="Study Hours This Week"
          value={`${weeklyStudyHours}h`}
          sub="Based on logged progress"
        />
      </div>
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
