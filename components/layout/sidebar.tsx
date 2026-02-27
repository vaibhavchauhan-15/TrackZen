'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Target,
  Flame,
  LogOut,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { useState, useCallback, useMemo } from 'react'

/* ── Navigation config ─────────────────────────────── */
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Planner',   href: '/planner',   icon: Calendar },
  { name: 'Habits',    href: '/habits',    icon: Target },
] as const

/* ── Streak color helper ───────────────────────────── */
const getStreakTheme = (s: number) =>
  s === 0  ? { color: '#6b7280', glow: 'rgba(107,114,128,0.25)' } :
  s <= 2   ? { color: '#f87171', glow: 'rgba(248,113,113,0.30)' } :
  s <= 6   ? { color: '#fb923c', glow: 'rgba(251,146,60,0.30)' }  :
  s <= 13  ? { color: '#facc15', glow: 'rgba(250,204,21,0.30)' }  :
  s <= 29  ? { color: '#c084fc', glow: 'rgba(192,132,252,0.30)' } :
             { color: '#22d3ee', glow: 'rgba(34,211,238,0.30)' }

/* ── Constants ─────────────────────────────────────── */
const NAV_ITEM_H    = 48   // px
const NAV_GAP       = 8    // px  (gap-2 = 0.5rem = 8px)
const INDICATOR_TOP = (i: number) => i * (NAV_ITEM_H + NAV_GAP)

/* ═══════════════════════════════════════════════════════
   Sidebar Props
   ═══════════════════════════════════════════════════════ */
interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data } = useDashboard()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const user    = data?.user
  const streak  = data?.streak ?? 0
  const loading = !data

  const streakTheme = useMemo(() => getStreakTheme(streak), [streak])
  const activeIndex = useMemo(
    () => navigation.findIndex(item => pathname.startsWith(item.href)),
    [pathname],
  )

  /* ── Profile initials (fallback only) ── */
  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }, [user?.name])

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ═══════════════════════════════════════
          SIDEBAR SHELL (72 px)
      ═══════════════════════════════════════ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'w-[72px] bg-[#0a0c10]/95 backdrop-blur-xl',
          'border-r border-white/[0.06]',
          'transition-transform duration-300 ease-material',
          'will-change-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500 opacity-60" />

        {/* ── LOGO ── */}
        <div className="flex h-16 shrink-0 items-center justify-center">
          <div className="sidebar-logo relative h-9 w-9 flex items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/TrackZen_sign.png"
              alt="TrackZen"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* ── PROFILE AVATAR ── */}
        <div className="flex items-center justify-center pt-5 pb-2 group/user">
          <div className="relative">
            {/* animated gradient ring */}
            <div className="sidebar-avatar-ring absolute -inset-[3px] rounded-full bg-gradient-to-tr from-violet-500 via-cyan-400 to-violet-500 opacity-0 group-hover/user:opacity-100 transition-opacity duration-300" />
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover/user:ring-transparent transition-all duration-300 cursor-pointer bg-[#14161d]">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500 text-[13px] font-bold text-white select-none">
                  {initials}
                </div>
              )}
            </div>
            {/* online dot */}
            <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full bg-emerald-400 ring-2 ring-[#0a0c10]" />
          </div>

          {/* tooltip */}
          <div className="sidebar-tooltip absolute left-full ml-5 px-4 py-2.5 bg-[#12141b] border border-white/[0.08] rounded-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 whitespace-nowrap shadow-2xl shadow-black/40 z-[60]">
            <p className="text-[13px] font-semibold text-white leading-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-white/40 mt-0.5 leading-tight">
              {user?.email || ''}
            </p>
          </div>
        </div>

        {/* ── STREAK PILL ── */}
        <div className="flex items-center justify-center py-2 group/streak">
          <div
            className="sidebar-icon-btn flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] cursor-pointer transition-all duration-300 hover:scale-105"
            style={{ background: `${streakTheme.glow}` }}
          >
            <Flame
              size={19}
              className="sidebar-flame transition-transform duration-300 group-hover/streak:scale-110"
              style={{ color: streakTheme.color }}
            />
          </div>

          {/* tooltip */}
          <div className="sidebar-tooltip absolute left-full ml-5 px-4 py-2.5 bg-[#12141b] border border-white/[0.08] rounded-2xl opacity-0 invisible group-hover/streak:opacity-100 group-hover/streak:visible transition-all duration-200 whitespace-nowrap shadow-2xl shadow-black/40 z-[60]">
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest leading-none mb-1">
              Streak
            </p>
            <p className="text-base font-black leading-none" style={{ color: streakTheme.color }}>
              {loading ? '–' : `${streak} day${streak !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="mx-4 mt-1 mb-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* ── NAVIGATION ── */}
        <nav className="relative mt-3 flex flex-col gap-2 px-3 flex-1">
          {/* Animated pill indicator */}
          <div
            className="absolute left-3 right-3 h-[48px] rounded-2xl transition-all duration-350 ease-material will-change-[transform,opacity]"
            style={{
              top: `${INDICATOR_TOP(hoveredIndex ?? activeIndex)}px`,
              opacity: activeIndex >= 0 || hoveredIndex !== null ? 1 : 0,
              transform: hoveredIndex !== null ? 'scale(1.04)' : 'scale(1)',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(6,182,212,0.75))',
              boxShadow: hoveredIndex !== null
                ? '0 4px 24px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset'
                : '0 2px 16px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}
          />

          {navigation.map((item, index) => {
            const isActive  = pathname.startsWith(item.href)
            const Icon      = item.icon
            const isHovered = hoveredIndex === index
            const isLit     = isActive || isHovered

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => {
                  setHoveredIndex(index)
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  'sidebar-nav-item relative flex items-center justify-center',
                  'h-[48px] rounded-2xl z-10',
                  'transition-all duration-200 group/link',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isLit ? 2.2 : 1.8}
                  className={cn(
                    'sidebar-nav-icon transition-all duration-300',
                    isLit
                      ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]'
                      : 'text-white/35 group-hover/link:text-white/60',
                  )}
                />

                {/* tooltip */}
                <span className={cn(
                  'sidebar-tooltip absolute left-full ml-5',
                  'px-3.5 py-2 bg-[#12141b] border border-white/[0.08] rounded-2xl',
                  'text-[13px] font-medium text-white whitespace-nowrap',
                  'opacity-0 invisible group-hover/link:opacity-100 group-hover/link:visible',
                  'transition-all duration-200 shadow-2xl shadow-black/40 z-[60]',
                  'pointer-events-none',
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* ── SIGN OUT ── */}
        <div className="px-3 pb-5 mt-auto">
          <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'sidebar-nav-item relative flex items-center justify-center',
              'h-[48px] w-full rounded-2xl',
              'text-white/35 transition-all duration-300 group/logout',
              'hover:bg-red-500/[0.08] hover:text-red-400',
            )}
          >
            <LogOut
              size={19}
              strokeWidth={1.8}
              className="sidebar-nav-icon transition-all duration-300 group-hover/logout:text-red-400 group-hover/logout:-translate-x-0.5"
            />

            {/* tooltip */}
            <span className="sidebar-tooltip absolute left-full ml-5 px-3.5 py-2 bg-[#12141b] border border-white/[0.08] rounded-2xl text-[13px] font-medium text-white whitespace-nowrap opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-200 shadow-2xl shadow-black/40 z-[60] pointer-events-none">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}