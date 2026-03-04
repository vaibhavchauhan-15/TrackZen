'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Target,
  Flame,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { useSession } from 'next-auth/react'

// ── Types ─────────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  icon: typeof LayoutDashboard
  label: string
}

// ── Constants ─────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/planner', icon: Calendar, label: 'Planner' },
  { href: '/habits', icon: Target, label: 'Habits' },
]

// ── Streak colour helper ───────────────────────────────────────────────────

const getStreakTheme = (s: number) =>
  s === 0 ? { color: '#6b7280', glow: 'rgba(107,114,128,0.20)' } :
    s <= 2 ? { color: '#f87171', glow: 'rgba(248,113,113,0.25)' } :
      s <= 6 ? { color: '#fb923c', glow: 'rgba(251,146,60,0.25)' } :
        s <= 13 ? { color: '#facc15', glow: 'rgba(250,204,21,0.25)' } :
          s <= 29 ? { color: '#c084fc', glow: 'rgba(192,132,252,0.25)' } :
            { color: '#22d3ee', glow: 'rgba(34,211,238,0.25)' }

// ── Animation variants ────────────────────────────────────────────────────

const labelVariants = {
  hidden: { opacity: 0, x: -8, width: 0 },
  visible: { opacity: 1, x: 0, width: 'auto' },
}

const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 72 },
}

// ── NavItemRow ────────────────────────────────────────────────────────────

function NavItemRow({
  item,
  isExpanded,
  isActive,
}: {
  item: NavItem
  isExpanded: boolean
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
        'transition-colors duration-150 select-none',
        isActive ? 'text-white'
          : 'text-text-muted hover:text-text-secondary',
        !isExpanded && 'justify-center',
      )}
    >
      {/* Active pill background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-accent-purple/15"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}

      {/* Hover highlight */}
      <div className="absolute inset-0 rounded-xl opacity-0 bg-white/[0.04] group-hover:opacity-100 transition-opacity duration-150" />

      {/* Active left accent bar */}
      {isActive && (
        <motion.div
          layoutId="sidebar-accent-bar"
          className="absolute left-0 inset-y-0 my-auto w-[3px] h-5 rounded-r-full bg-accent-purple"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}

      {/* Icon */}
      <motion.div
        className="relative z-10 flex-shrink-0"
        animate={isActive ? { scale: 1.08 } : { scale: 1 }}
        whileHover={{ scale: 1.14 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] transition-all duration-200',
            isActive
              ? 'text-accent-purple drop-shadow-[0_0_8px_rgba(124,58,237,0.55)]'
              : 'text-text-muted group-hover:text-text-secondary',
          )}
        />
      </motion.div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            key="label"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative z-10 text-[13px] font-medium leading-none overflow-hidden whitespace-nowrap',
              isActive
                ? 'text-text-primary'
                : 'text-text-secondary group-hover:text-text-primary transition-colors duration-150',
            )}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

// ── Main Sidebar ───────────────────────────────────────────────────────────

export function Sidebar() {
  const { isExpanded, toggle } = useSidebar()
  const pathname = usePathname()
  const { data } = useDashboard()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const streak = data?.streak?.current ?? 0
  const streakTheme = useMemo(
    () => getStreakTheme(mounted ? streak : 0),
    [streak, mounted],
  )
  const user = session?.user

  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }, [user?.name])

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col bg-[#08090e] border-r border-white/[0.05] overflow-hidden"
      style={{ willChange: 'width' }}
    >
      {/* Ambient purple glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-purple/[0.05] to-transparent" />

      {/* ── Header ── */}
      <div
        className={cn(
          'relative flex items-center h-[60px] border-b border-white/[0.05] flex-shrink-0 px-3',
          isExpanded ? 'justify-between' : 'justify-center',
        )}
      >
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <Image
                src="/TrackZen_sign.png"
                alt="TrackZen Logo"
                width={32}
                height={32}
                className="flex-shrink-0 object-contain"
                priority
              />
              <span className="text-[15px] font-semibold tracking-tight text-text-primary whitespace-nowrap">
                TrackZen
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.90 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07] text-text-muted hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="flex items-center justify-center"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.span>
        </motion.button>
      </div>

      {/* ── Navigation ── */}
      <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide p-2 pt-3">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.p
              key="menu-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted/50"
            >
              Menu
            </motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            isExpanded={isExpanded}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="flex flex-col gap-1 border-t border-white/[0.05] p-2 flex-shrink-0">

        {/* Streak */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2',
            !isExpanded && 'justify-center',
          )}
        >
          <motion.div
            whileHover={{ scale: 1.12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: streakTheme.glow }}
          >
            <Flame className="h-4 w-4" style={{ color: streakTheme.color }} />
          </motion.div>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key="streak-info"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="text-[11px] font-medium text-text-muted whitespace-nowrap leading-none">
                  Daily Streak
                </p>
                <p
                  className="mt-0.5 text-[14px] font-bold whitespace-nowrap leading-none"
                  style={{ color: streakTheme.color }}
                  suppressHydrationWarning
                >
                  {streak} {streak === 1 ? 'day' : 'days'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile */}
        <Link
          href="/dashboard"
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2',
            'hover:bg-white/[0.04] transition-colors duration-150',
            !isExpanded && 'justify-center',
          )}
        >
          <motion.div
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative flex-shrink-0 h-7 w-7 rounded-full overflow-hidden ring-1 ring-white/10"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Profile'}
                width={28}
                height={28}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent-purple/20 text-[10px] font-bold text-accent-purple">
                {initials}
              </div>
            )}
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-[#08090e] bg-accent-green" />
          </motion.div>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key="user-info"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-[12px] font-medium text-text-primary leading-none whitespace-nowrap">
                  {user?.name ?? 'User'}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-text-muted leading-none whitespace-nowrap">
                  {user?.email ?? ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  )
}