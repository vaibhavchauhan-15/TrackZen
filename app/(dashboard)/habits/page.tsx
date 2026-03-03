'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSWRConfig } from 'swr'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHabits, useToggleHabit, useCreateHabit, API_KEYS } from '@/lib/hooks/use-swr-api'
import HabitsLoading from './loading'

// Import new habit components
import { Habit, HabitLog, FrequencyTab, HabitStats } from '@/components/habits/types'
import { StatsCards } from '@/components/habits/stats-cards'
import { WelcomeBanner } from '@/components/habits/welcome-banner'
import { FrequencyTabs } from '@/components/habits/frequency-tabs'
import { HabitList } from '@/components/habits/habit-list'
import { WeeklyOverview } from '@/components/habits/weekly-overview'
import { HabitModal, AddHabitFAB } from '@/components/habits/add-habit-modal'

export default function HabitsPage() {
  const { data, isLoading: loading } = useHabits()
  const { trigger: triggerToggle } = useToggleHabit()
  const { trigger: createHabit } = useCreateHabit()
  // Bound mutate — shares the custom SWR cache provider, so optimistic updates are instant
  const { mutate } = useSWRConfig()
  // Single modal state — habit=null → create mode, habit≠null → edit mode
  const [modal, setModal] = useState<{ open: boolean; habit: Habit | null }>({ open: false, habit: null })
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

  // Flatten weekly logs for WeeklyOverview
  const weeklyLogs: HabitLog[] = useMemo(() => {
    const weeklyLogsMap = data?.weeklyLogs || {}
    return Object.entries(weeklyLogsMap).flatMap(([habitId, logArr]: [string, any]) =>
      (logArr as any[]).map((log: any) => ({
        id: log.id || `${habitId}-${log.date}`,
        habitId,
        userId: log.userId,
        date: log.date,
        status: log.status,
        note: log.note,
      }))
    )
  }, [data?.weeklyLogs])

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
    await triggerToggle({ habitId })
  }, [triggerToggle])

  // Opens modal in edit mode
  const handleEditHabit = useCallback((habit: Habit) => {
    setModal({ open: true, habit })
  }, [])

  /**
   * Unified save handler for both create and edit.
   * When habitId is provided → edit (with optimistic update for instant UI).
   * When habitId is absent  → create.
   */
  const handleSaveHabit = useCallback(async (formData: any, habitId?: string) => {
    if (habitId) {
      // ── EDIT: optimistically patch the SWR cache so the card updates immediately ──
      mutate(
        API_KEYS.habits,
        (current: any) => ({
          ...current,
          habits: current?.habits?.map((h: any) =>
            h.id === habitId ? { ...h, ...formData } : h
          ) ?? [],
        }),
        { revalidate: false },
      )
      // Fire API in the background — don't await, modal closes instantly
      fetch(`/api/habits/${habitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then(async (res) => {
        if (!res.ok) {
          mutate(API_KEYS.habits) // server rejected — rollback optimistic update
        } else {
          mutate(API_KEYS.habits)     // keep cache fresh (streaks etc.)
          mutate(API_KEYS.dashboard)
        }
      }).catch(() => {
        mutate(API_KEYS.habits) // network error — rollback
      })
      // Return immediately — modal closes without waiting for the server
    } else {
      // ── CREATE ──
      await createHabit(formData)
    }
  }, [mutate, createHabit])

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    // Optimistically remove from cache
    await mutate(
      API_KEYS.habits,
      (current: any) => ({
        ...current,
        habits: current?.habits?.filter((h: any) => h.id !== habitId) ?? [],
      }),
      { revalidate: false }
    )
    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete habit')
      mutate(API_KEYS.habits)
      mutate(API_KEYS.dashboard)
    } catch {
      // Rollback by revalidating on error
      mutate(API_KEYS.habits)
    }
  }, [mutate])

  if (loading) return <HabitsLoading />

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Welcome Banner */}
      <WelcomeBanner remainingToday={stats.remainingToday} onAddHabit={() => setModal({ open: true, habit: null })} />
      
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
              onClick={() => setModal({ open: true, habit: null })}
              className="hidden sm:flex text-accent-purple hover:text-accent-purple/80 hover:bg-accent-purple/10 w-fit"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Habit
            </Button>
          </div>
          <HabitList habits={filteredHabits} todayLogs={logs} weeklyLogs={weeklyLogs} onToggle={handleToggleHabit} onEdit={handleEditHabit} onDelete={handleDeleteHabit} />
        </div>

        {/* Sidebar - Weekly Overview */}
        <div>
          <WeeklyOverview habits={habits} logs={weeklyLogs} />
        </div>
      </div>

      {/* FAB and unified modal */}
      <AddHabitFAB onClick={() => setModal({ open: true, habit: null })} />
      <HabitModal
        isOpen={modal.open}
        habit={modal.habit}
        onClose={() => setModal({ open: false, habit: null })}
        onSave={handleSaveHabit}
      />
    </div>
  )
}
