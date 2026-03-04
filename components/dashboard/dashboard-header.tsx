'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar } from 'lucide-react'
import type { DashboardStreak } from '@/components/providers/dashboard-provider'

// ── Helpers ───────────────────────────────────────────────────────────────

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning',   emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' }
  if (h < 21) return { text: 'Good evening',   emoji: '🌆' }
  return          { text: 'Good night',        emoji: '🌙' }
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getStreakTitle(days: number): string {
  if (days === 0) return 'Start Your Journey'
  if (days <= 2)  return 'Getting Started'
  if (days <= 6)  return 'On a Roll'
  if (days <= 13) return 'One Week Strong'
  if (days <= 29) return 'Two Weeks Warrior'
  return 'Unstoppable'
}

function getNextMilestone(streak: number): number {
  const milestones = [7, 14, 30, 60, 100, 365]
  return milestones.find(m => m > streak) ?? 365
}

function getLastActiveLabel(lastActiveDate: string | null): string {
  if (!lastActiveDate) return 'Never'
  const today = new Date()
  const last = new Date(lastActiveDate)
  const diffDays = Math.floor(
    (today.setHours(0,0,0,0) - last.setHours(0,0,0,0)) / 86_400_000
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

// ── Props ─────────────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  streak?: DashboardStreak
}

// ── Component ─────────────────────────────────────────────────────────────

export function DashboardHeader({ streak }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)

  const firstName = useMemo(() => {
    const name = session?.user?.name
    if (!name) return 'there'
    return name.trim().split(/\s+/)[0]
  }, [session?.user?.name])

  // Compute time-sensitive values only on the client to prevent hydration mismatch
  const [greeting, setGreeting] = useState('')
  const [emoji, setEmoji] = useState('')
  const [dateLabel, setDateLabel] = useState('')
  useEffect(() => {
    const { text, emoji: e } = getGreeting()
    setGreeting(text)
    setEmoji(e)
    setDateLabel(getDateLabel())
  }, [])

  const streakDays     = streak?.current ?? 0
  const longestStreak  = streak?.longest ?? 0
  const lastActive     = getLastActiveLabel(streak?.lastActiveDate ?? null)
  const streakTitle    = getStreakTitle(streakDays)
  const nextMilestone  = getNextMilestone(streakDays)
  const prevMilestone  = (() => {
    const milestones = [0, 7, 14, 30, 60, 100, 365]
    const idx = milestones.findIndex(m => m >= nextMilestone)
    return milestones[Math.max(0, idx - 1)]
  })()
  const progressPct    = nextMilestone === prevMilestone
    ? 100
    : Math.min(100, Math.round(((streakDays - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
  const daysLeft       = nextMilestone - streakDays

  // Ensure video plays as soon as it's in the DOM (handles autoplay policy)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {
      // Silently ignore — autoplay was blocked; muted+autoPlay should be allowed
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-bg-surface"
    >
      {/* Subtle gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(124,58,237,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 0% 50%, rgba(6,182,212,0.06) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* ── Top: greeting + gif ────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 px-4 py-4 sm:px-7 sm:py-6">
        {/* Left: greeting */}
        <div className="space-y-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
            className="text-xs text-text-muted"
          >
            {dateLabel || '\u00A0'}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.13, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg sm:text-3xl font-bold text-text-primary truncate"
          >
            {emoji && <>{emoji}&nbsp;</>}{greeting && <>{greeting},</>}{' '}{' '}
            <span className="text-accent-purple">{firstName}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="text-xs text-text-secondary"
          >
            Here&apos;s your overview for today.
          </motion.p>
        </div>

        {/* Right: looping video — bigger now */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 rounded-xl overflow-hidden"
          style={{
            width: 'clamp(80px, 20vw, 220px)',
            aspectRatio: '16/9',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          <video
            ref={videoRef}
            src="/gif/Dashboard.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>
      </div>

      {/* ── Bottom: streak info ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 sm:px-7 sm:py-5"
      >
        {/* Flame + count */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-bg-elevated border border-border">
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame className="w-6 h-6 text-orange-400" />
            </motion.div>
          </div>
          <div className="leading-none">
            <p className="text-xl sm:text-3xl font-bold text-text-primary">{streakDays}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">day streak</p>
          </div>
        </div>

        {/* Vertical divider (desktop only) */}
        <div className="hidden sm:block h-10 w-px bg-border/60 flex-shrink-0" />

        {/* Streak meta + progress */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-sm font-semibold text-text-primary">✨ {streakTitle}</p>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Best <span className="font-semibold text-text-primary ml-0.5">{longestStreak} days</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Last active <span className="font-semibold text-text-primary ml-0.5">{lastActive}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-purple to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <p className="text-[11px] text-text-muted">
              {daysLeft > 0
                ? `${daysLeft} more day${daysLeft !== 1 ? 's' : ''} to reach ${nextMilestone}-day streak`
                : `${nextMilestone}-day streak reached! 🎉`}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
