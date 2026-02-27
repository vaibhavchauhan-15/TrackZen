'use client'

import { motion } from 'framer-motion'
import { FrequencyTab } from './types'

const tabs: { value: FrequencyTab; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

interface FrequencyTabsProps {
  activeTab: FrequencyTab
  onTabChange: (tab: FrequencyTab) => void
}

export function FrequencyTabs({ activeTab, onTabChange }: FrequencyTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-surface rounded-xl p-1 w-fit border border-bg-elevated">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className="relative px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors"
        >
          {activeTab === tab.value && (
            <motion.div
              layoutId="habit-tab-indicator"
              className="absolute inset-0 bg-accent-purple rounded-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 ${
              activeTab === tab.value ? 'text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
