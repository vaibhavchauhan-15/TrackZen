'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { useDashboard } from '@/components/providers/dashboard-provider'

// Import new habit components
import { Habit, HabitLog, FrequencyTab, HabitStats } from '@/components/habits/types'
import { StatsCards } from '@/components/habits/stats-cards'
import { WelcomeBanner } from '@/components/habits/welcome-banner'
import { FrequencyTabs } from '@/components/habits/frequency-tabs'
import { HabitList } from '@/components/habits/habit-list'
import { WeeklyOverview } from '@/components/habits/weekly-overview'
import { AddHabitModal, AddHabitFAB } from '@/components/habits/add-habit-modal'

export default function HabitsPage() {
  const { data, loading, refetch, toggleHabit } = useDashboard()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<FrequencyTab>('daily')

  // Transform data to match the habit types
  const habits: Habit[] = useMemo(() => {
    return (data?.habits || []).map((h: any) => ({
      id: h.id,
      userId: h.userId,
      title: h.title,
      description: h.description,
      icon: h.icon || '🎯',
      category: h.category || 'Custom',
      frequency: h.frequency || 'daily',
      priority: h.priority || 3,
      targetDays: h.targetDays,
      timeSlot: h.timeSlot,
      color: h.color || '#7C3AED',
      currentStreak: h.currentStreak || 0,
      longestStreak: h.longestStreak || 0,
      isActive: h.isActive !== false,
      createdAt: h.createdAt,
    }))
  }, [data?.habits])

  // Transform today's logs to match HabitLog type
  const logs: HabitLog[] = useMemo(() => {
    const todayLogs = data?.todayLogs || {}
    return Object.entries(todayLogs).map(([habitId, log]: [string, any]) => ({
      id: log.id || `${habitId}-log`,
      habitId,
      userId: log.userId,
      date: log.date || new Date().toISOString().split('T')[0],
      status: log.status,
      note: log.note,
    }))
  }, [data?.todayLogs])

  // Filter habits by active tab
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => h.isActive && h.frequency === activeTab)
  }, [habits, activeTab])

  // Calculate stats
  const stats: HabitStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const active = habits.filter((h) => h.isActive)
    const todayLogs = logs.filter((l) => l.date === today)
    const completedToday = todayLogs.filter((l) => l.status === 'done').length
    const completionRate = active.length > 0 ? Math.round((completedToday / active.length) * 100) : 0
    const bestStreak = Math.max(...active.map((h) => h.currentStreak || 0), 0)
    const totalCompleted = logs.filter((l) => l.status === 'done').length
    
    return {
      completionRate,
      bestStreak,
      totalCompleted,
      activeCount: active.length,
      remainingToday: active.length - completedToday,
    }
  }, [habits, logs])

  const handleToggleHabit = useCallback(async (habitId: string) => {
    try {
      await toggleHabit(habitId)
    } catch (error) {
      console.error('Failed to toggle habit:', error)
    }
  }, [toggleHabit])

  const handleAddHabit = useCallback(async (habitData: any) => {
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create habit')
      }

      await refetch()
    } catch (error) {
      console.error('Failed to add habit:', error)
      throw error
    }
  }, [refetch])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
          <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
          <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
          <div className="h-24 rounded-xl bg-bg-surface animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton count={3} />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-xl bg-bg-surface animate-pulse" />
            <div className="h-40 rounded-xl bg-bg-surface animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Welcome Banner */}
      <WelcomeBanner remainingToday={stats.remainingToday} />
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Habit List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <FrequencyTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setModalOpen(true)}
              className="text-accent-purple hover:text-accent-purple/80 hover:bg-accent-purple/10 w-fit"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Habit
            </Button>
          </div>
          <HabitList habits={filteredHabits} logs={logs} onToggle={handleToggleHabit} />
        </div>

        {/* Sidebar - Weekly Overview */}
        <div>
          <WeeklyOverview habits={habits} logs={logs} />
        </div>
      </div>

      {/* FAB and Modal */}
      <AddHabitFAB onClick={() => setModalOpen(true)} />
      <AddHabitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddHabit} />
    </div>
  )
}
